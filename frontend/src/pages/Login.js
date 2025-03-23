import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { login, resendActivation, checkIsLoggedIn } from '../api/auth';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogContentText,
  DialogActions,
  Button
} from '@mui/material';

/**
 * Komponent Login
 *
 * Obsługuje logowanie użytkownika. Po pomyślnym logowaniu wywołuje dodatkową funkcję,
 * która sprawdza, czy użytkownik jest zalogowany oraz czy posiada rolę moderatora.
 * Na podstawie otrzymanych danych użytkownik zostanie przekierowany do odpowiedniego panelu
 * (moderatora lub zwykłego użytkownika). W przypadku nieaktywnego konta wyświetlany jest modal,
 * umożliwiający wysłanie ponownego linku aktywacyjnego.
 */
function Login({ onLoginSuccess }) {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [message, setMessage] = useState('');
  const [openActivationModal, setOpenActivationModal] = useState(false);
  const navigate = useNavigate();

  const handleLogin = async (e) => {
    e.preventDefault();
    try {
      await login(username, password);
      const authData = await checkIsLoggedIn();
      onLoginSuccess(authData);
      if (authData.isModerator) {
        navigate('/moderator-dashboard');
      } else {
        navigate('/dashboard');
      }
    } catch (error) {
      if (error && error.action === "resend_activation") {
        setOpenActivationModal(true);
        setMessage(error.error);
      } else {
        setMessage(error.error || error.message || "Błąd logowania");
      }
    }
  };

  const handleResendActivation = async () => {
    try {
      await resendActivation(username);
      setMessage("Nowy link aktywacyjny został wysłany.");
      setOpenActivationModal(false);
    } catch (error) {
      setMessage(error.error || error.message || "Błąd przy wysyłaniu linku aktywacyjnego");
    }
  };

  return (
    <div>
      <h2>Logowanie</h2>
      {message && <p style={{ color: "blue" }}>{message}</p>}
      <form onSubmit={handleLogin}>
        <div>
          <label>Username:</label><br />
          <input
            type="text"
            placeholder="Username"
            value={username}
            onChange={e => setUsername(e.target.value)}
            required
          />
        </div>
        <div>
          <label>Password:</label><br />
          <input
            type="password"
            placeholder="Password"
            value={password}
            onChange={e => setPassword(e.target.value)}
            required
          />
        </div>
        <button type="submit">Zaloguj się</button>
      </form>
      <Dialog open={openActivationModal} onClose={() => setOpenActivationModal(false)}>
        <DialogTitle>Konto nieaktywne</DialogTitle>
        <DialogContent>
          <DialogContentText>
            Twoje konto o nazwie <strong>{username}</strong> nie zostało aktywowane.
            Kliknij poniższy przycisk, aby wysłać ponownie link aktywacyjny.
          </DialogContentText>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setOpenActivationModal(false)}>Anuluj</Button>
          <Button onClick={handleResendActivation}>Wyślij link</Button>
        </DialogActions>
      </Dialog>
    </div>
  );
}

export default Login;
