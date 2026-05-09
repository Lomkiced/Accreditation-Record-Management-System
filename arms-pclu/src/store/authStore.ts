import { create } from "zustand"

export interface StoredUser {
  id: string
  authId: string
  name: string
  email: string
  role: "ADMIN" | "FACULTY"
  department: string
  designation: string
  phone: string | null
  isActive: boolean
}

interface AuthState {
  user: StoredUser | null
  isLoading: boolean
  isAuthenticated: boolean
  setUser: (user: StoredUser | null) => void
  setLoading: (loading: boolean) => void
  clearUser: () => void
}

export const useAuthStore = create<AuthState>()((set) => ({
  user: null,
  isLoading: true,
  isAuthenticated: false,

  setUser: (user) =>
    set({
      user,
      isAuthenticated: !!user,
      isLoading: false,
    }),

  setLoading: (isLoading) => set({ isLoading }),

  clearUser: () =>
    set({
      user: null,
      isAuthenticated: false,
      isLoading: false,
    }),
}))
