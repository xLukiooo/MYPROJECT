import React, { useEffect, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';

function ActivateAccount() {
  const [message, setMessage] = useState('');
  const location = useLocation();
  const navigate = useNavigate();

  useEffect(() => {
    // Pobierz parametry uid i token z query stringa
    const params = new URLSearchParams(location.search);
    const uid = params.get('uid');
    const token = params.get('token');

    if (uid && token) {
      // Wywołaj endpoint aktywacyjny na backendzie
      fetch(`http://localhost:8000/api/activate/?uid=${uid}&token=${token}`, {
        method: 'GET',
        credentials: 'include'
      })
        .then(response => {
          if (!response.ok) {
            throw new Error('Błąd aktywacji konta');
          }
          return response.json();
        })
        .then(data => {
          setMessage(data.message || 'Konto zostało aktywowane!');
          // Opcjonalne przekierowanie, np. do logowania po 3 sekundach:
          setTimeout(() => {
            navigate('/login');
          }, 3000);
        })
        .catch(error => {
          setMessage(error.message);
        });
    } else {
      setMessage('Brak wymaganych parametrów aktywacyjnych.');
    }
  }, [location.search, navigate]);

  return (
    <div>
      <h2>Aktywacja konta</h2>
      <p>{message}</p>
    </div>
  );
}

export default ActivateAccount;
