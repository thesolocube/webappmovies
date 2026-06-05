import { Routes, Route, Navigate } from 'react-router-dom';
import Home from './pages/Home.jsx';
import Login from './pages/Login.jsx';
import Register from './pages/Register.jsx';
import MovieDetail from './pages/MovieDetail.jsx';
import { getCurrentUser } from './lib/storage.js';

function ProtectedRoute({ children }) {
  const user = getCurrentUser();
  return user ? children : <Navigate to="/login" replace />;
}

export default function App() {
  return (
    <Routes>
      <Route path="/" element={<Navigate to="/login" replace />} />
      <Route path="/login" element={<Login />} />
      <Route path="/register" element={<Register />} />
      <Route
        path="/home"
        element={<ProtectedRoute><Home /></ProtectedRoute>}
      />
      <Route
        path="/details/:mediaType/:id"
        element={<ProtectedRoute><MovieDetail /></ProtectedRoute>}
      />
      <Route path="*" element={<Navigate to="/home" replace />} />
    </Routes>
  );
}
