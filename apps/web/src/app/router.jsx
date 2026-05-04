import { createBrowserRouter, Navigate } from 'react-router-dom';

import DashboardLayout from '../shared/layouts/DashboardLayout.jsx';
import AuthGuard from '../shared/guards/AuthGuard.jsx';

import Login from '../pages/auth/Login.jsx';
import Register from '../pages/auth/Register.jsx';
import DashboardHomePage from '../pages/dashboard/DashboardHomePage.jsx';
import ProfilePage from '../pages/profile/ProfilePage.jsx';
import AnalyticsPage from '../pages/analytics/AnalyticsPage.jsx';
import TemplatesPage from '../pages/templates/TemplatesPage.jsx';
import PdfPage from '../pages/pdf/PdfPage.jsx';
import SubscriptionPage from '../pages/subscription/SubscriptionPage.jsx';
import SettingsPage from '../pages/settings/SettingsPage.jsx';
import NotFoundPage from '../pages/not-found/NotFoundPage.jsx';

/** Base path aligns with infra/nginx mounts under `/dashboard` in production builds. */

const router = createBrowserRouter(
  [
    { path: '/', element: <Navigate to="/dashboard" replace /> },
    {
      path: '/login',
      element: <Login />,
    },
    {
      path: '/register',
      element: <Register />,
    },
    {
      path: '/dashboard',
      element: (
        <AuthGuard>
          <DashboardLayout />
        </AuthGuard>
      ),
      children: [
        { index: true, element: <DashboardHomePage /> },
        { path: 'profile', element: <ProfilePage /> },
        { path: 'templates', element: <TemplatesPage /> },
        { path: 'analytics', element: <AnalyticsPage /> },
        { path: 'pdf', element: <PdfPage /> },
        { path: 'subscription', element: <SubscriptionPage /> },
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
