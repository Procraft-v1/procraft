import { createSlice } from '@reduxjs/toolkit';

const initialState = {
  busy: false,
  pendingRedirect: null,
};

const authUiSlice = createSlice({
  name: 'authUi',
  initialState,
  reducers: {
    setAuthBusy(state, action) {
      state.busy = Boolean(action.payload);
    },
    setPendingRedirect(state, action) {
      state.pendingRedirect = typeof action.payload === 'string' ? action.payload : null;
    },
    resetAuthUi() {
      return initialState;
    },
  },
});

export const { setAuthBusy, setPendingRedirect, resetAuthUi } = authUiSlice.actions;

export const selectAuthBusy = (root) => root.authUi.busy;
export const selectPendingRedirect = (root) => root.authUi.pendingRedirect;

export default authUiSlice.reducer;
