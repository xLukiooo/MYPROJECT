import React, { Suspense, lazy } from 'react';
import { BrowserRouter as Router, Routes, Route, Link } from 'react-router-dom';
import ErrorBoundary from './components/ErrorBoundary';
import LoadingAnimation from './components/LoadingAnimation';
import './App.css';

const Home = lazy(() => import('./pages/Home'));
const Register = lazy(() => import('./pages/Register'));
const Login = lazy(() => import('./pages/Login'));
const ResetPassword = lazy(() => import('./pages/ResetPassword'));
const ResetPasswordConfirm = lazy(() => import('./pages/ResetPasswordConfirm'));
const ActivateAccount = lazy(() => import('./pages/ActivateAccount'));

function App() {
  return (
    <Router>
      <div className="App" style={{ padding: "20px", fontFamily: "Arial, sans-serif" }}>
        <nav style={{ marginBottom: "20px" }}>
          <ul style={{ listStyle: "none", display: "flex", gap: "10px", padding: 0 }}>
            <li><Link to="/">Strona Główna</Link></li>
            <li><Link to="/register">Rejestracja</Link></li>
            <li><Link to="/login">Logowanie</Link></li>
            <li><Link to="/reset-password">Reset Hasła</Link></li>
          </ul>
        </nav>
        <ErrorBoundary>
          <Suspense fallback={<LoadingAnimation />}>
            <Routes>
              <Route path="/" element={<Home />} />
              <Route path="/register" element={<Register />} />
              <Route path="/login" element={<Login />} />
              <Route path="/reset-password" element={<ResetPassword />} />
              <Route path="/reset-password/confirm" element={<ResetPasswordConfirm />} />
              <Route path="/activate" element={<ActivateAccount />} />
            </Routes>
          </Suspense>
        </ErrorBoundary>
      </div>
    </Router>
  );
}

export default App;
