import { Outlet } from 'react-router-dom';
import AuthGuard from './AuthGuard.jsx';

export default function ProtectedRoute() {
  return (
    <AuthGuard>
      <Outlet />
    </AuthGuard>
  );
}
