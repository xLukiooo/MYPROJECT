import React, { useEffect, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { activateAccount } from '../api/auth';

/**
 * Komponent ActivateAccount
 *
 * Umożliwia aktywację konta użytkownika poprzez pobranie parametrów uid i token z URL.
 * Po wywołaniu funkcji activateAccount, wyświetla komunikat o wyniku aktywacji
 * oraz przekierowuje użytkownika do strony logowania po 3 sekundach.
 */
function ActivateAccount() {
  const [message, setMessage] = useState('');
  const location = useLocation();
  const navigate = useNavigate();

  useEffect(() => {
    const params = new URLSearchParams(location.search);
    const uid = params.get('uid');
    const token = params.get('token');

    if (uid && token) {
      activateAccount(uid, token)
        .then(data => {
          setMessage(data.message || 'Konto zostało aktywowane!');
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
