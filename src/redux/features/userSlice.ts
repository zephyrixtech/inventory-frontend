import { createSlice, PayloadAction } from '@reduxjs/toolkit';

// Removed CompanyData interface as it's no longer used

interface UserData {
  id: string;
  email: string;
  email_confirmed?: boolean;
  created_at?: string;
  last_sign_in?: string;
  first_name?: string | null;
  last_name?: string | null;
  role_id?: string | null;
  status?: string | null;
  is_active?: boolean;
  // company_data?: CompanyData | null;
  // Removed company_id since we're removing company context
  full_name?: string | null;
  role_name?: string | null;
}

interface UserState {
  userData: UserData | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  error: string | null;
}

const storedUserData = localStorage.getItem('userData');
const parsedUserData: UserData | null = storedUserData ? JSON.parse(storedUserData) : null;

const initialState: UserState = {
  userData: parsedUserData,
  isAuthenticated: !!parsedUserData,
  isLoading: false,
  error: null,
};

const userSlice = createSlice({
  name: 'user',
  initialState,
  reducers: {
    setUser: (state, action: PayloadAction<UserData>) => {
      state.userData = action.payload;
      state.isAuthenticated = true;
      state.isLoading = false;
      state.error = null;
    },
    setLoading: (state, action: PayloadAction<boolean>) => {
      state.isLoading = action.payload;
    },
    setError: (state, action: PayloadAction<string>) => {
      state.error = action.payload;
      state.isLoading = false;
    },
    clearUser: (state) => {
      state.userData = null;
      state.isAuthenticated = false;
      state.isLoading = false;
      state.error = null;
    },
  },
});

export const { setUser, setLoading, setError, clearUser } = userSlice.actions;

export const selectUser = (state: { user: UserState }): UserData | null => state.user.userData;
export const selectIsAuthenticated = (state: { user: UserState }): boolean => state.user.isAuthenticated;
export const selectIsLoading = (state: { user: UserState }): boolean => state.user.isLoading;
export const selectError = (state: { user: UserState }): string | null => state.user.error;

export default userSlice.reducer;