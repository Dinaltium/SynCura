// Single source of truth for the backend base URL.
// Set VITE_API_URL in .env to point at a remote backend; defaults to local dev.
export const API_URL = import.meta.env.VITE_API_URL || 'http://127.0.0.1:8000'

export async function apiGet(path) {
  const res = await fetch(`${API_URL}${path}`)
  if (!res.ok) throw new Error(`GET ${path} -> ${res.status}`)
  return res.json()
}

export async function apiPost(path, body) {
  const res = await fetch(`${API_URL}${path}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  })
  if (!res.ok) throw new Error(`POST ${path} -> ${res.status}`)
  return res.json()
}
