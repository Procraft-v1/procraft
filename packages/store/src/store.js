import { configureStore } from '@reduxjs/toolkit';
import uiReducer from './ui.slice.js';
import authUiReducer from './auth-ui.slice.js';

export function configureProcraftStore() {
  return configureStore({
    reducer: {
      ui: uiReducer,
      authUi: authUiReducer,
    },
  });
}
