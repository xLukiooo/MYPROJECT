import React, { useState } from 'react';
import { resetPassword } from '../api/auth';

/**
 * Komponent ResetPassword
 *
 * Umożliwia użytkownikowi wysłanie instrukcji resetu hasła poprzez podanie adresu email.
 */
function ResetPassword() {
  const [resetEmail, setResetEmail] = useState('');
  const [message, setMessage] = useState('');

  const handleResetPassword = async (e) => {
    e.preventDefault();
    try {
      await resetPassword(resetEmail);
      setMessage(`Instrukcje resetu hasła wysłane na: ${resetEmail}`);
    } catch (error) {
      setMessage(error.message);
    }
  };

  return (
    <div>
      <h2>Reset Hasła</h2>
      {message && <p style={{ color: "blue" }}>{message}</p>}
      <form onSubmit={handleResetPassword}>
        <div>
          <label>Email:</label><br />
          <input
            type="email"
            placeholder="Email"
            value={resetEmail}
            onChange={e => setResetEmail(e.target.value)}
            required
          />
        </div>
        <button type="submit">Resetuj hasło</button>
      </form>
    </div>
  );
}

export default ResetPassword;
