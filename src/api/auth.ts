import { API_BASE } from '../lib/config'

interface AuthResponse {
  token?: string
  username?: string
  error?: string
}

async function post(path: string, username: string, password: string): Promise<AuthResponse> {
  const res = await fetch(`${API_BASE}${path}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ username, password }),
  })
  return res.json()
}

export const register = (username: string, password: string) => post('/register', username, password)

export const login = (username: string, password: string) => post('/login', username, password)
