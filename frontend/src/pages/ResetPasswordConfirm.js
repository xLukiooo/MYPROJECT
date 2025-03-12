// frontend/src/components/ResetPasswordConfirm.jsx
import React, { useState, useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { confirmResetPassword } from '../api/auth'; // importujemy naszą nową funkcję

function ResetPasswordConfirm() {
  const location = useLocation();
  const navigate = useNavigate();
  const [newPassword, setNewPassword] = useState('');
  const [newPassword2, setNewPassword2] = useState('');
  const [message, setMessage] = useState('');
  const [token, setToken] = useState('');

  useEffect(() => {
    // Wyciągamy token z URL, np. /reset-password/confirm?token=xyz
    const params = new URLSearchParams(location.search);
    const t = params.get('token');
    setToken(t || '');
  }, [location.search]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setMessage('');

    if (newPassword !== newPassword2) {
      setMessage('Hasła nie są takie same!');
      return;
    }

    try {
      await confirmResetPassword(token, newPassword);
      setMessage('Hasło zostało zmienione. Możesz się teraz zalogować.');
      // Opcjonalnie przeniesienie np. na stronę logowania:
      // navigate('/login');
    } catch (error) {
      setMessage(error.message);
    }
  };

  return (
    <div>
      <h2>Ustaw nowe hasło</h2>
      {message && <p>{message}</p>}

      {!token && <p style={{ color: 'red' }}>Brak tokenu w adresie!</p>}

      <form onSubmit={handleSubmit}>
        <div>
          <label>Nowe hasło:</label><br />
          <input
            type="password"
            value={newPassword}
            onChange={(e) => setNewPassword(e.target.value)}
            required
          />
        </div>
        <div>
          <label>Powtórz nowe hasło:</label><br />
          <input
            type="password"
            value={newPassword2}
            onChange={(e) => setNewPassword2(e.target.value)}
            required
          />
        </div>
        <br />
        <button type="submit">Zapisz nowe hasło</button>
      </form>
    </div>
  );
}

export default ResetPasswordConfirm;
