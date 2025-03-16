// src/pages/Login.js

import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';  // <-- import useNavigate
import { login } from '../api/auth';

function Login({ onLoginSuccess }) {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [message, setMessage] = useState('');
  const navigate = useNavigate();

  const handleLogin = async (e) => {
    e.preventDefault();
    try {
      await login(username, password);
      onLoginSuccess();
      navigate('/dashboard');
    } catch (error) {
      setMessage(error.message);
    }
  }
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
    </div>
  );
}

export default Login;
