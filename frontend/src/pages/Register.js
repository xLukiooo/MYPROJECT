import React, { useState } from 'react';
import * as yup from 'yup';
import { register } from '../api/auth';

const schema = yup.object().shape({
  firstName: yup.string().required('Imię jest wymagane.'),
  lastName: yup.string().required('Nazwisko jest wymagane.'),
  username: yup.string().required('Username jest wymagany.'),
  email: yup
    .string()
    .email('Wprowadź prawidłowy adres email.')
    .required('Email jest wymagany.'),
  password: yup.string()
    .required('Hasło jest wymagane.')
    .min(8, 'Hasło jest za krótkie. Musi zawierać przynajmniej 8 znaków.')
    .matches(/[A-Z]/, 'Hasło musi zawierać przynajmniej jedną wielką literę.')
    .matches(/[a-z]/, 'Hasło musi zawierać przynajmniej jedną małą literę.')
    .matches(/[0-9]/, 'Hasło musi zawierać przynajmniej jedną cyfrę.')
    .matches(/[!@#$%^&*()_+]/, 'Hasło musi zawierać przynajmniej jeden znak specjalny: !@#$%^&*()_+'),
  password2: yup.string()
    .oneOf([yup.ref('password'), null], 'Hasła muszą się zgadzać.')
    .required('Potwierdzenie hasła jest wymagane.')
});

function Register() {
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [username, setUsername] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [password2, setPassword2] = useState('');
  const [message, setMessage] = useState('');

  const handleRegister = async (e) => {
    e.preventDefault();
    setMessage('');

    try {
      await schema.validate(
        { firstName, lastName, username, email, password, password2 },
        { abortEarly: false }
      );
    } catch (validationError) {
      const errors = validationError.inner.map(err => err.message).join(' | ');
      setMessage(errors);
      return;
    }

    try {
      const result = await register(username, email, firstName, lastName, password, password2);
      setMessage(`Rejestracja udana! Witaj, ${result.username}`);
    } catch (error) {
      setMessage("Błąd rejestracji: " + error.message);
    }
  };

  return (
    <div>
      <h2>Rejestracja</h2>
      {message && <p>{message}</p>}
      <form onSubmit={handleRegister}>
        <div>
          <label>Imię:</label><br />
          <input
            type="text"
            placeholder="Imię"
            value={firstName}
            onChange={e => setFirstName(e.target.value)}
            required
          />
        </div>
        <div>
          <label>Nazwisko:</label><br />
          <input
            type="text"
            placeholder="Nazwisko"
            value={lastName}
            onChange={e => setLastName(e.target.value)}
            required
          />
        </div>
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
          <label>Email:</label><br />
          <input
            type="email"
            placeholder="Email"
            value={email}
            onChange={e => setEmail(e.target.value)}
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
        <div>
          <label>Potwierdź hasło:</label><br />
          <input
            type="password"
            placeholder="Potwierdź hasło"
            value={password2}
            onChange={e => setPassword2(e.target.value)}
            required
          />
        </div>
        <button type="submit">Zarejestruj się</button>
      </form>
    </div>
  );
}

export default Register;
