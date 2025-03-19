// src/api/auth.js

import Cookies from 'js-cookie';

/**
 * Ustawienia i endpointy
 */
const config = {
  BASE_URL: 'http://localhost:8000/api',
  endpoints: {
    csrfToken: '/get-csrf-token/',
    register: '/register/',
    login: '/auth/token/',
    refreshToken: '/auth/token/refresh/',
    passwordReset: '/auth/password_reset/',
    passwordResetConfirm: '/auth/password_reset/confirm/',
    logout: '/logout/',
    isLoggedIn: '/is-logged-in/', // Dodajemy endpoint do sprawdzania zalogowania
    resendActivation: '/resend-activation/', // Endpoint do ponownego wysyłania linku aktywacyjnego
  },
};

/**
 * Mapowanie komunikatów błędów na przyjazne tłumaczenia (przykład)
 */
const errorMapping = {
  "This password is too short. It must contain at least 8 characters.": "Hasło jest za krótkie. Musi zawierać przynajmniej 8 znaków.",
  "This password is too common.": "To hasło jest zbyt popularne.",
  "This password is entirely numeric.": "To hasło nie może być wyłącznie numeryczne.",
  "A user with that username already exists.": "Użytkownik o takiej nazwie już istnieje.",
  "Enter a valid email address.": "Wprowadź prawidłowy adres email.",
};

function translateMessage(msg) {
  return errorMapping[msg] || msg;
}

/**
 * Pobieranie lub generowanie tokena CSRF
 */
async function ensureCsrfToken() {
  try {
    let token = Cookies.get('csrftoken');
    if (!token) {
      const response = await apiRequest(config.endpoints.csrfToken);
      const data = await response.json();
      token = data.csrftoken;
    }
    return token;
  } catch (error) {
    console.error('Błąd podczas pobierania tokena CSRF:', error);
    throw error;
  }
}

/**
 * Główna funkcja do wysyłania zapytań do API
 * - ustawia credentials: 'include' (wysyłanie ciasteczek)
 * - ustawia Content-Type: application/json
 * - w razie 401 próbuje odświeżyć token i ponowić żądanie
 */
async function apiRequest(endpoint, options = {}) {
  const url = config.BASE_URL + endpoint;
  const mergedOptions = {
    ...options,
    credentials: 'include',
    headers: {
      'Content-Type': 'application/json',
      ...(options.headers || {})
    }
  };
  const controller = new AbortController();
  const timeout = options.timeout || 10000;
  const timer = setTimeout(() => controller.abort(), timeout);
  mergedOptions.signal = controller.signal;

  try {
    const response = await fetch(url, mergedOptions);
    clearTimeout(timer);

    // Jeśli dostaliśmy 401, spróbuj odświeżyć token i powtórz żądanie
    if (response.status === 401 && endpoint !== config.endpoints.isLoggedIn) {
      const refreshed = await refreshAuthToken();
      if (refreshed) {
        return apiRequest(endpoint, options);
      }
    }
  
    return response;
  } catch (error) {
    console.error(`Błąd w apiRequest dla ${url}:`, error);
    throw error;
  }
}

/**
 * Funkcje akcji (rejestracja, logowanie, wylogowanie, itd.)
 */

export async function register(username, email, firstName, lastName, password, password2) {
  try {
    const csrfToken = await ensureCsrfToken();
    const response = await apiRequest(config.endpoints.register, {
      method: 'POST',
      headers: { 'X-CSRFToken': csrfToken },
      body: JSON.stringify({
        username,
        email,
        first_name: firstName,
        last_name: lastName,
        password,
        password2
      })
    });

    if (!response.ok) {
      const errorData = await response.json();
      const errorMessages = Object.entries(errorData)
        .map(([_, msgs]) => 
          Array.isArray(msgs)
            ? msgs.map(translateMessage).join(' ')
            : translateMessage(msgs)
        )
        .join(' | ');
      throw new Error(errorMessages);
    }
    return await response.json();
  } catch (error) {
    console.error('Błąd w rejestracji:', error);
    throw error;
  }
}

export async function login(username, password) {
  try {
    const csrfToken = await ensureCsrfToken();
    const response = await apiRequest(config.endpoints.login, {
      method: 'POST',
      headers: { 'X-CSRFToken': csrfToken },
      body: JSON.stringify({ username, password })
    });

    if (!response.ok) {
      // Pobranie szczegółów błędu z odpowiedzi
      const errorData = await response.json();
      // Rzuć cały obiekt errorData, który powinien zawierać np.:
      // { error: "Konto nie zostało aktywowane. Proszę aktywować konto lub wyślij ponownie link aktywacyjny.", action: "resend_activation", email: "user@example.com" }
      throw errorData;
    }
    return await response.json();
  } catch (error) {
    console.error('Błąd w logowaniu:', error);
    throw error;
  }
}



export async function resetPassword(email) {
  try {
    const csrfToken = await ensureCsrfToken();
    const response = await apiRequest(config.endpoints.passwordReset, {
      method: 'POST',
      headers: { 'X-CSRFToken': csrfToken },
      body: JSON.stringify({ email })
    });

    if (!response.ok) {
      throw new Error('Błąd resetowania hasła');
    }
    return await response.json();
  } catch (error) {
    console.error('Błąd podczas resetowania hasła:', error);
    throw error;
  }
}

export async function confirmResetPassword(token, newPassword) {
  try {
    const csrfToken = await ensureCsrfToken();
    const response = await apiRequest(config.endpoints.passwordResetConfirm, {
      method: 'POST',
      headers: { 'X-CSRFToken': csrfToken },
      body: JSON.stringify({
        token: token,
        password: newPassword,
      })
    });

    if (!response.ok) {
      throw new Error('Nie udało się zresetować hasła');
    }
    return await response.json();
  } catch (error) {
    console.error('Błąd przy potwierdzaniu resetu hasła:', error);
    throw error;
  }
}

export async function logout() {
  try {
    const csrfToken = await ensureCsrfToken();
    const response = await apiRequest(config.endpoints.logout, {
      method: 'POST',
      headers: { 'X-CSRFToken': csrfToken },
    });

    if (!response.ok) {
      throw new Error('Błąd przy wylogowywaniu');
    }
    return await response.json();
  } catch (error) {
    console.error('Błąd podczas wylogowywania:', error);
    throw error;
  }
}

/**
 * Odświeżanie tokena – BEZ odczytu refresh_token z JS (bo jest HttpOnly).
 * Serwer odczytuje ciasteczko samodzielnie.
 */
async function refreshAuthToken() {
  try {
    // Nie próbujemy czytać refresh_token z cookies, bo jest HttpOnly
    // const refreshToken = Cookies.get('refresh_token'); // to będzie undefined

    const csrfToken = await ensureCsrfToken();
    const response = await apiRequest(config.endpoints.refreshToken, {
      method: 'POST',
      headers: {
        'X-CSRFToken': csrfToken
      },
    });
    if (!response.ok) {
      console.error('Nie udało się odświeżyć tokenu');
      return false;
    }
    return true; // odświeżenie się powiodło
  } catch (error) {
    console.error('Błąd podczas odświeżania tokenu:', error);
    return false;
  }
}

/**
 * Przykładowa funkcja sprawdzająca zalogowanie.
 * Zakładamy, że masz endpoint `/api/is-logged-in/` zwracający:
 *  { "isLoggedIn": true } lub 401 jeśli niezalogowany.
 */
export async function checkIsLoggedIn() {
  try {
    const response = await apiRequest(config.endpoints.isLoggedIn, {
      method: 'GET',
      // credentials: 'include' jest już w apiRequest
    });
    if (!response.ok) {
      // np. 401
      return false;
    }
    const data = await response.json();
    return data.isLoggedIn === true;
  } catch (error) {
    console.error('Błąd sprawdzania zalogowania:', error);
    return false;
  }
}

export async function resendActivation(username) {
  try {
    const csrfToken = await ensureCsrfToken();
    const response = await apiRequest(config.endpoints.resendActivation, {
      method: 'POST',
      headers: { 'X-CSRFToken': csrfToken },
      body: JSON.stringify({ username })
    });
    
    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.error || 'Błąd przy wysyłaniu linku aktywacyjnego');
    }
    return await response.json();
  } catch (error) {
    console.error('Błąd przy wysyłaniu linku aktywacyjnego:', error);
    throw error;
  }
}
