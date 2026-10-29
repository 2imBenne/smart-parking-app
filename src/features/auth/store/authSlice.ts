import { createSlice, type PayloadAction } from '@reduxjs/toolkit'
import { getAuthSession, type AuthSession } from '../../../shared/auth/session'

interface AuthState {
  session: AuthSession | null
}

const initialState: AuthState = {
  session: getAuthSession()
}

export const authSlice = createSlice({
  name: 'auth',
  initialState,
  reducers: {
    setSession: (state, action: PayloadAction<AuthSession | null>) => {
      state.session = action.payload
    }
  }
})

export const { setSession } = authSlice.actions
export default authSlice.reducer
