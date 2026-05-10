import { createBrowserRouter, Navigate } from 'react-router-dom';
import { routes } from '@procraft/config';

import DashboardLayout from '../shared/layouts/DashboardLayout.jsx';

import Login from '../pages/auth/Login.jsx';
import Register from '../pages/auth/Register.jsx';
import ResetPassword from '../pages/auth/ResetPassword.jsx';
import DashboardHomePage from '../pages/dashboard/DashboardHomePage.jsx';
import ProfilePage from '../pages/profile/ProfilePage.jsx';
import AnalyticsPage from '../pages/analytics/AnalyticsPage.jsx';
import TemplatesPage from '../pages/templates/TemplatesPage.jsx';
import PdfPage from '../pages/pdf/PdfPage.jsx';
import SettingsPage from '../pages/settings/SettingsPage.jsx';
import NotFoundPage from '../pages/not-found/NotFoundPage.jsx';

/** The dashboard subdomain is the app shell; routes stay root-relative. */

const router = createBrowserRouter(
  [
    {
      path: '/login',
      element: <Login />,
    },
    {
      path: '/register',
      element: <Register />,
    },
    {
      path: '/reset-password',
      element: <ResetPassword />,
    },
    {
      path: '/',
      element: <DashboardLayout />,
      children: [
        { index: true, element: <DashboardHomePage /> },
        { path: 'profile', element: <ProfilePage /> },
        { path: 'templates', element: <TemplatesPage /> },
        { path: 'analytics', element: <AnalyticsPage /> },
        { path: 'pdf', element: <PdfPage /> },
        { path: 'subscription', element: <Navigate to={routes.dashboard} replace /> },
        { path: 'settings', element: <SettingsPage /> },
      ],
    },
    {
      path: '*',
      element: <NotFoundPage />,
    },
  ],
);

export default router;
