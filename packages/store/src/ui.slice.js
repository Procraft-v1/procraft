import { createSlice } from '@reduxjs/toolkit';

const initialState = {
  sidebarCollapsed: false,
  themeMode: 'light',
  locale: 'uz',
};

const uiSlice = createSlice({
  name: 'ui',
  initialState,
  reducers: {
    toggleSidebarCollapsed(state) {
      state.sidebarCollapsed = !state.sidebarCollapsed;
    },
    setSidebarCollapsed(state, action) {
      state.sidebarCollapsed = Boolean(action.payload);
    },
    setThemeMode(state, action) {
      state.themeMode = action.payload ?? 'light';
    },
    setLocalePreference(state, action) {
      state.locale = action.payload ?? 'uz';
    },
  },
});

export const { toggleSidebarCollapsed, setSidebarCollapsed, setThemeMode, setLocalePreference } =
  uiSlice.actions;

export const selectSidebarCollapsed = (root) => root.ui.sidebarCollapsed;
export const selectThemeMode = (root) => root.ui.themeMode;
export const selectLocalePreference = (root) => root.ui.locale;

export default uiSlice.reducer;
