import React from 'react';
import { useNavigate } from 'react-router-dom';
import { logout } from '../api/auth';

function Dashboard() {
  const navigate = useNavigate();

  const handleLogout = async () => {
    try {
      await logout();
      navigate('/login'); // Po wylogowaniu przekieruj do strony logowania
    } catch (error) {
      console.error("Błąd podczas wylogowywania:", error);
    }
  };

  return (
    <div>
      <h1>Panel Użytkownika</h1>
      <p>Witamy, jesteś zalogowany!</p>
      <button onClick={handleLogout}>Wyloguj</button>
    </div>
  );
}

export default Dashboard;
