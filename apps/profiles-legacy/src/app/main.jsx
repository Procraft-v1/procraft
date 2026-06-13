import React from 'react';
import ReactDOM from 'react-dom/client';
import { configureI18n } from '@procraft/i18n';

import App from './App.jsx';
import Providers from './providers.jsx';

import '../shared/styles/global.css';

async function bootstrap() {
  await configureI18n();

  ReactDOM.createRoot(document.getElementById('root')).render(
    <React.StrictMode>
      <Providers>
        <App />
      </Providers>
    </React.StrictMode>,
  );
}

bootstrap();
