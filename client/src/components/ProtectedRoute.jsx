import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext.jsx';
import { FullScreenLoader } from './ui.jsx';

export default function ProtectedRoute({ role, children }) {
  const { user, booting } = useAuth();
  const location = useLocation();
  if (booting) return <FullScreenLoader />;
  if (!user) return <Navigate to="/login" state={{ from: location.pathname }} replace />;
  if (role && user.role !== role) {
    return <Navigate to={user.role === 'admin' ? '/admin' : '/dashboard'} replace />;
  }
  return children;
}
