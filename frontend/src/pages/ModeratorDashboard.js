import React, { useState, useEffect } from 'react';
import { getModeratorUsers, getModeratorUser, deleteModeratorUser } from '../api/moderator';
import { logout } from '../api/auth';
import { useNavigate } from 'react-router-dom';

/**
 * Komponent ModeratorDashboard
 *
 * Wyświetla listę użytkowników w przewijalnej liście. Po kliknięciu na użytkownika,
 * wyświetlane są szczegółowe informacje (w tym email) oraz przycisk do usunięcia użytkownika.
 * Na górze po prawej stronie znajduje się przycisk wylogowania.
 */
function ModeratorDashboard() {
  const [users, setUsers] = useState([]);
  const [selectedUser, setSelectedUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const navigate = useNavigate();

  useEffect(() => {
    async function fetchUsers() {
      try {
        const data = await getModeratorUsers();
        setUsers(data);
      } catch (err) {
        setError('Błąd pobierania listy użytkowników');
      } finally {
        setLoading(false);
      }
    }
    fetchUsers();
  }, []);

  const handleUserClick = async (userId) => {
    try {
      const data = await getModeratorUser(userId);
      setSelectedUser(data);
    } catch (err) {
      setError('Błąd pobierania szczegółów użytkownika');
    }
  };

  const handleDeleteUser = async (userId) => {
    try {
      await deleteModeratorUser(userId);
      setUsers(prevUsers => prevUsers.filter(user => user.id !== userId));
      if (selectedUser && selectedUser.id === userId) {
        setSelectedUser(null);
      }
    } catch (err) {
      setError('Błąd przy usuwaniu użytkownika');
    }
  };

  const handleLogout = async () => {
    try {
      await logout();
      navigate('/login');
    } catch (err) {
      setError('Błąd podczas wylogowywania');
    }
  };

  if (loading) {
    return <div>Ładowanie...</div>;
  }

  return (
    <div style={{ padding: '20px', position: 'relative' }}>
      <button
        onClick={handleLogout}
        style={{ position: 'absolute', top: '20px', right: '20px' }}
      >
        Wyloguj
      </button>
      <h2>Panel Moderatora</h2>
      {error && <p style={{ color: 'red' }}>{error}</p>}
      <div style={{ display: 'flex', gap: '20px' }}>
        <div style={{ width: '40%', maxHeight: '500px', overflowY: 'auto', border: '1px solid #ccc', padding: '10px' }}>
          <h3>Lista użytkowników</h3>
          {users.length === 0 ? (
            <p>Brak użytkowników</p>
          ) : (
            <ul style={{ listStyle: 'none', padding: 0 }}>
              {users.map(user => (
                <li
                  key={user.id}
                  onClick={() => handleUserClick(user.id)}
                  style={{ cursor: 'pointer', padding: '5px', borderBottom: '1px solid #eee' }}
                >
                  {user.first_name} {user.last_name} ({user.username})
                </li>
              ))}
            </ul>
          )}
        </div>
        <div style={{ width: '60%', border: '1px solid #ccc', padding: '10px' }}>
          <h3>Szczegóły użytkownika</h3>
          {selectedUser ? (
            <div>
              <p><strong>Imię:</strong> {selectedUser.first_name}</p>
              <p><strong>Nazwisko:</strong> {selectedUser.last_name}</p>
              <p><strong>Username:</strong> {selectedUser.username}</p>
              <p><strong>Email:</strong> {selectedUser.email}</p>
              <button
                onClick={() => handleDeleteUser(selectedUser.id)}
                style={{ background: 'red', color: 'white', padding: '5px 10px', marginTop: '10px' }}
              >
                Usuń użytkownika
              </button>
            </div>
          ) : (
            <p>Wybierz użytkownika z listy, aby zobaczyć szczegóły.</p>
          )}
        </div>
      </div>
    </div>
  );
}

export default ModeratorDashboard;
