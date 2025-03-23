import React, { Suspense, lazy, useState, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate, Link } from 'react-router-dom';
import ErrorBoundary from './components/ErrorBoundary';
import LoadingAnimation from './components/LoadingAnimation';
import { ensureCsrfToken } from './api/apiBase';
import { checkIsLoggedIn } from './api/auth';
import './App.css';

/**
 * Lazy loading stron - pozwala ładować strony tylko wtedy, gdy są potrzebne.
 */
const Home = lazy(() => import('./pages/Home'));
const Register = lazy(() => import('./pages/Register'));
const Login = lazy(() => import('./pages/Login'));
const ResetPassword = lazy(() => import('./pages/ResetPassword'));
const ResetPasswordConfirm = lazy(() => import('./pages/ResetPasswordConfirm'));
const ActivateAccount = lazy(() => import('./pages/ActivateAccount'));
const Dashboard = lazy(() => import('./pages/Dashboard'));

/**
 * Komponent PrivateRoute zabezpiecza dostęp do tras przeznaczonych dla zalogowanych użytkowników.
 * Renderuje zawartość, jeśli użytkownik jest zalogowany; w przeciwnym razie przekierowuje na stronę logowania.
 */
function PrivateRoute({ isLoggedIn, children }) {
  return isLoggedIn ? children : <Navigate to="/login" />;
}

/**
 * Główny komponent aplikacji.
 * Inicjalizuje token CSRF, sprawdza czy użytkownik jest zalogowany, oraz ustawia nawigację i trasy.
 */
function App() {
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [checkingAuth, setCheckingAuth] = useState(true);

  useEffect(() => {
    async function init() {
      try {
        await ensureCsrfToken();
        const loggedIn = await checkIsLoggedIn();
        setIsLoggedIn(loggedIn);
      } catch (error) {
        console.error('Błąd podczas inicjalizacji:', error);
      } finally {
        setCheckingAuth(false);
      }
    }
    init();
  }, []);

  if (checkingAuth) {
    return <LoadingAnimation />;
  }

  return (
    <Router>
      <div className="App" style={{ padding: "20px", fontFamily: "Arial, sans-serif" }}>
        <nav style={{ marginBottom: "20px" }}>
          <ul style={{ listStyle: "none", display: "flex", gap: "10px", padding: 0 }}>
            <li><Link to="/">Strona Główna</Link></li>
            {!isLoggedIn && (
              <>
                <li><Link to="/register">Rejestracja</Link></li>
                <li><Link to="/login">Logowanie</Link></li>
              </>
            )}
            <li><Link to="/reset-password">Reset Hasła</Link></li>
            {isLoggedIn && <li><Link to="/dashboard">Panel Użytkownika</Link></li>}
          </ul>
        </nav>
        <ErrorBoundary>
          <Suspense fallback={<LoadingAnimation />}>
            <Routes>
              <Route path="/" element={<Home />} />
              <Route path="/register" element={<Register />} />
              <Route path="/login" element={<Login onLoginSuccess={() => setIsLoggedIn(true)} />} />
              <Route path="/reset-password" element={<ResetPassword />} />
              <Route path="/reset-password/confirm" element={<ResetPasswordConfirm />} />
              <Route path="/activate" element={<ActivateAccount />} />
              <Route 
                path="/dashboard" 
                element={
                  <PrivateRoute isLoggedIn={isLoggedIn}>
                    <Dashboard />
                  </PrivateRoute>
                } 
              />
            </Routes>
          </Suspense>
        </ErrorBoundary>
      </div>
    </Router>
  );
}

export default App;
