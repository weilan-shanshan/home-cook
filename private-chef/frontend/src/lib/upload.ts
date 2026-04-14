import imageCompression from 'browser-image-compression';
import { client } from './api';

export interface UploadOptions {
  onProgress?: (progress: number) => void;
  maxSizeMB?: number;
  maxWidthOrHeight?: number;
}

export interface UploadResult {
  url: string;
  key: string;
}

/**
 * Uploads an image to COS via presigned URL with progress reporting.
 */
export async function uploadImage(file: File, options?: UploadOptions): Promise<UploadResult> {
  // 1. Compress image
  const compressedFile = await imageCompression(file, {
    maxSizeMB: options?.maxSizeMB || 2,
    maxWidthOrHeight: options?.maxWidthOrHeight || 1920,
    useWebWorker: true,
  });

  // 2. Get presigned URL
  const response = await client.api.upload.presign.$get({
    query: {
      filename: file.name,
      contentType: file.type,
    },
  });

  if (!response.ok) {
    throw new Error('Failed to get presigned URL');
  }

  const { url: presignedUrl, key } = await response.json();

  // 3. Upload via XHR to report progress
  return new Promise((resolve, reject) => {
    const xhr = new XMLHttpRequest();
    xhr.open('PUT', presignedUrl, true);
    xhr.setRequestHeader('Content-Type', file.type);

    if (options?.onProgress) {
      xhr.upload.onprogress = (e) => {
        if (e.lengthComputable) {
          options.onProgress!(Math.round((e.loaded / e.total) * 100));
        }
      };
    }

    xhr.onload = () => {
      if (xhr.status >= 200 && xhr.status < 300) {
        // Strip query string parameters to get final URL
        const finalUrl = presignedUrl.split('?')[0];
        resolve({ url: finalUrl, key });
      } else {
        reject(new Error(`Upload failed with status ${xhr.status}`));
      }
    };

    xhr.onerror = () => reject(new Error('Network error during upload'));
    xhr.send(compressedFile);
  });
}
