import { BrowserRouter as Router, Route, Routes, Navigate } from 'react-router-dom';

import Dashboard from './components/dashboard/Dashboard';
import Login from './components/login/Login';
import { useAuthStore } from './store/AuthState';
import './App.css'
import Admin from './components/admin/Admin';
import Users from './components/users/User';
import Payments from './components/payments/Payments';
import Banners from './components/banner/Banners';
import Support from './components/support/Support';

const ProtectedRoute: React.FC<{ 
  element: React.ReactElement, 
  allowedRoles?: string[] 
}> = ({ element, allowedRoles }) => {

  const {isAuthenticated, userRole} = useAuthStore()

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }
  

  if (allowedRoles && userRole && !allowedRoles.includes(userRole)) {
    return <Navigate to="/" replace />;
  }

  return element;
};

function AppRoutes() {
  const {isAuthenticated} = useAuthStore()
  return (
    <Routes>
      <Route path="/login" element={!isAuthenticated ? <Login />: <Navigate to = "/" />} />
      {/* <Route path="/reset-password" element={!isAuthenticated ? <ForgotPassword />: <Navigate to = "/" />} /> */}
      <Route path="/" element={<ProtectedRoute element={<Dashboard />} />} />
      <Route path="/admins" element={<ProtectedRoute element={<Admin />} allowedRoles={['admin', 'superadmin']} />} />
      <Route path="/users" element={<ProtectedRoute element={<Users />} allowedRoles={['admin', 'superadmin']} />} />
      <Route path='/payouts' element={<ProtectedRoute element={<Payments/>} />} />
      <Route path="/banners" element={<ProtectedRoute element={<Banners />} />} />
      <Route path="/support" element={<ProtectedRoute element={<Support/>} />} />
      {/* 
       */}
      {/* <Route path="/activity" element={<ProtectedRoute element={<Activity />} />} />
      <Route path="/bots-activity" element={<ProtectedRoute element={<BotActivity />} />} /> */}
      {/* <Route path="/support" element={<ProtectedRoute element={<Support/>} />} />
      <Route path="/notifications" element={<ProtectedRoute element={<Notifications/>} />} />
      // 
      <Route path='/game/:name' element={<ProtectedRoute element={<Game/>} />} /> */}
    </Routes>
  );
}

function App() {
  return (
      <Router>
        <AppRoutes />
      </Router>
  );
}

export default App;