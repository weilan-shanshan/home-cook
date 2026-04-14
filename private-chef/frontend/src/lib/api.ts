export const baseUrl = import.meta.env.VITE_API_BASE_URL || ''

export async function apiFetch(endpoint: string, options: RequestInit = {}) {
  const url = endpoint.startsWith('http') ? endpoint : `${baseUrl}${endpoint}`;
  const headers = new Headers(options.headers);
  if (options.body && typeof options.body === 'string' && !headers.has('Content-Type')) {
    headers.set('Content-Type', 'application/json');
  }
  return fetch(url, {
    ...options,
    headers,
    credentials: 'include',
  });
}

export interface LoginRequest {
  username: string
  password?: string
}

export interface RegisterRequest {
  username: string
  display_name: string
  mode: 'create' | 'join'
  password?: string
  invite_code?: string
}

export const client = {
  api: {
    auth: {
      me: {
        $get: () => fetch(`${baseUrl}/api/auth/me`, { credentials: 'include' }),
      },
      login: {
        $post: ({ json }: { json: LoginRequest }) => fetch(`${baseUrl}/api/auth/login`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(json),
          credentials: 'include',
        }),
      },
      register: {
        $post: ({ json }: { json: RegisterRequest }) => fetch(`${baseUrl}/api/auth/register`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(json),
          credentials: 'include',
        }),
      },
      logout: {
        $post: () => fetch(`${baseUrl}/api/auth/logout`, { method: 'POST', credentials: 'include' }),
      }
    },
    upload: {
      presign: {
        $get: ({ query }: { query: { filename: string; contentType: string } }) => {
          const params = new URLSearchParams()
          params.append('filename', query.filename)
          params.append('contentType', query.contentType)
          return fetch(`${baseUrl}/api/upload/presign?${params.toString()}`, { credentials: 'include' })
        }
      }
    }
  }
}
