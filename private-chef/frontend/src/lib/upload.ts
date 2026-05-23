import imageCompression from 'browser-image-compression';
import { client } from './api';

export interface UploadOptions {
  onProgress?: (progress: number) => void;
  maxSizeMB?: number;
  maxWidthOrHeight?: number;
}

export interface UploadResult {
  url: string;
  thumbUrl: string;
  key: string;
}

async function getPresignedUrl(filename: string, contentType: string) {
  const response = await client.api.upload.presign.$get({
    query: { filename, contentType },
  });
  if (!response.ok) {
    throw new Error('Failed to get presigned URL');
  }
  return response.json();
}

function putFile(
  file: Blob,
  presignedUrl: string,
  contentType: string,
  onProgress?: (progress: number) => void,
): Promise<string> {
  return new Promise((resolve, reject) => {
    const xhr = new XMLHttpRequest();
    xhr.open('PUT', presignedUrl, true);
    xhr.setRequestHeader('Content-Type', contentType);
    if (onProgress) {
      xhr.upload.onprogress = (e) => {
        if (e.lengthComputable) {
          onProgress(Math.round((e.loaded / e.total) * 100));
        }
      };
    }
    xhr.onload = () => {
      if (xhr.status >= 200 && xhr.status < 300) {
        resolve(presignedUrl.split('?')[0]);
      } else {
        reject(new Error(`Upload failed with status ${xhr.status}`));
      }
    };
    xhr.onerror = () => reject(new Error('Network error during upload'));
    xhr.send(file);
  });
}

/**
 * Uploads an image to COS via presigned URL with progress reporting.
 * Always produces:
 *   - a compressed main image (≤ 2MB, ≤ 1920px) for "view large image"
 *   - a small thumbnail (≤ 300KB, ≤ 600px) for lists/cards
 */
export async function uploadImage(file: File, options?: UploadOptions): Promise<UploadResult> {
  const maxSizeMB = options?.maxSizeMB ?? 2;
  const maxWidthOrHeight = options?.maxWidthOrHeight ?? 1920;

  const [mainFile, thumbFile] = await Promise.all([
    imageCompression(file, {
      maxSizeMB,
      maxWidthOrHeight,
      useWebWorker: true,
    }),
    imageCompression(file, {
      maxSizeMB: 0.3,
      maxWidthOrHeight: 600,
      useWebWorker: true,
    }),
  ]);

  const contentType = file.type || 'image/jpeg';

  const dotIdx = file.name.lastIndexOf('.');
  const stem = dotIdx > 0 ? file.name.slice(0, dotIdx) : file.name;
  const ext = dotIdx > 0 ? file.name.slice(dotIdx) : '';
  const thumbName = `${stem}-thumb${ext}`;

  const [mainPresign, thumbPresign] = await Promise.all([
    getPresignedUrl(file.name, contentType),
    getPresignedUrl(thumbName, contentType),
  ]);

  // Run uploads in parallel; report progress from the main (larger) upload.
  const [mainFinalUrl, thumbFinalUrl] = await Promise.all([
    putFile(mainFile, mainPresign.url, contentType, options?.onProgress),
    putFile(thumbFile, thumbPresign.url, contentType),
  ]);

  return { url: mainFinalUrl, thumbUrl: thumbFinalUrl, key: mainPresign.key };
}
