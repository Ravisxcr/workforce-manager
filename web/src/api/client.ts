const BASE_URL = import.meta.env.VITE_API_URL ?? 'http://localhost:8000'

function getToken(): string | null {
  return localStorage.getItem('access_token')
}

export function setToken(token: string): void {
  localStorage.setItem('access_token', token)
}

export function clearToken(): void {
  localStorage.removeItem('access_token')
}

export interface ApiResponse<T = unknown> {
  success: boolean
  message: string
  data: T
}

interface RequestOptions extends Omit<RequestInit, 'body'> {
  body?: unknown
  params?: Record<string, string | number | boolean | undefined | null>
}

async function request<T>(path: string, options: RequestOptions = {}): Promise<T> {
  const { body, params, headers, ...rest } = options

  const url = new URL(`${BASE_URL}${path}`)
  if (params) {
    Object.entries(params).forEach(([k, v]) => {
      if (v != null) url.searchParams.set(k, String(v))
    })
  }

  const token = getToken()
  const reqHeaders: HeadersInit = {
    'Content-Type': 'application/json',
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
    ...(headers as Record<string, string> | undefined),
  }

  const res = await fetch(url.toString(), {
    ...rest,
    headers: reqHeaders,
    ...(body !== undefined ? { body: JSON.stringify(body) } : {}),
  })


  if (!res.ok) {
    const err = await res.json().catch(() => ({
      success: false,
      message: res.statusText,
      data: null,
    }))
    throw err
  }

  if (res.status === 204) return undefined as T
  let json: ApiResponse<T>

  try {
    json = await res.json()
  } catch {
    json = {
      success: false,
      message: res.statusText,
      data: null as T,
    }
  }

  if (!json.success) throw json
  return json.data
}

export async function get<T>(path: string, params?: RequestOptions['params']): Promise<T> {
  return request<T>(path, { method: 'GET', params })
}

export async function post<T>(path: string, body?: unknown): Promise<T> {
  return request<T>(path, { method: 'POST', body })
}

export async function put<T>(path: string, body?: unknown): Promise<T> {
  return request<T>(path, { method: 'PUT', body })
}

export async function patch<T>(path: string, body?: unknown): Promise<T> {
  return request<T>(path, { method: 'PATCH', body })
}

export async function del<T = void>(path: string): Promise<T> {
  return request<T>(path, { method: 'DELETE' })
}

export async function postForm<T>(path: string, formData: FormData): Promise<T> {
  const token = getToken()
  const res = await fetch(`${BASE_URL}${path}`, {
    method: 'POST',
    headers: token ? { Authorization: `Bearer ${token}` } : {},
    body: formData,
  })
  if (!res.ok) {
    const err = await res.json().catch(() => ({
      success: false,
      message: res.statusText,
      data: null,
    }))
    throw err
  }
  return res.json() as Promise<T>
}


export async function getBlob(path: string): Promise<Blob> {
  const token = getToken()

  const res = await fetch(`${BASE_URL}${path}`, {
    method: 'GET',
    headers: token
      ? {
          Authorization: `Bearer ${token}`,
        }
      : {},
  })

  if (!res.ok) {
    throw new Error(res.statusText)
  }

  return res.blob()
}
