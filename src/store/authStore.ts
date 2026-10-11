import { create } from 'zustand'

interface AuthState {
  token: string | null
  username: string | null
  hydrated: boolean
  hydrate: () => void
  login: (token: string, username: string) => void
  logout: () => void
}

// localStorage 只在浏览器可用：首屏（含 SSR）先为空，客户端挂载后 hydrate
export const useAuthStore = create<AuthState>((set) => ({
  token: null,
  username: null,
  hydrated: false,

  hydrate: () => {
    set({
      token: localStorage.getItem('token'),
      username: localStorage.getItem('username'),
      hydrated: true,
    })
  },

  login: (token, username) => {
    localStorage.setItem('token', token)
    localStorage.setItem('username', username)
    set({ token, username })
  },

  logout: () => {
    localStorage.removeItem('token')
    localStorage.removeItem('username')
    set({ token: null, username: null })
  },
}))
