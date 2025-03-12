// Konfiguracja adresów URL i endpointów
const config = {
  BASE_URL: 'http://localhost:8000/api',
  endpoints: {
    csrfToken: '/get-csrf-token/',
    register: '/register/',
    login: '/auth/token/',
    passwordReset: '/auth/password_reset/',
    passwordResetConfirm: '/auth/password_reset/confirm/',
  },
};

// Wspólna funkcja do wykonywania zapytań z obsługą timeoutu, logowania błędów oraz ustawień domyślnych
async function apiRequest(endpoint, options = {}) {
  const url = config.BASE_URL + endpoint;
  const mergedOptions = {
    credentials: 'include',
    headers: { 'Content-Type': 'application/json' },
    ...options
  };
  // Łączenie nagłówków domyślnych z opcjonalnymi
  mergedOptions.headers = { 'Content-Type': 'application/json', ...(options.headers || {}) };

  // Ustawienie timeoutu (domyślnie 10 sekund)
  const controller = new AbortController();
  const timeout = options.timeout || 10000;
  const timer = setTimeout(() => controller.abort(), timeout);
  mergedOptions.signal = controller.signal;

  try {
    const response = await fetch(url, mergedOptions);
    clearTimeout(timer);
    return response;
  } catch (error) {
    console.error(`Błąd w apiRequest dla ${url}:`, error);
    throw error;
  }
}

// Mapowanie komunikatów błędów z backendu na wersję polską
const errorMapping = {
  "This password is too short. It must contain at least 8 characters.": "Hasło jest za krótkie. Musi zawierać przynajmniej 8 znaków.",
  "This password is too common.": "To hasło jest zbyt popularne.",
  "This password is entirely numeric.": "To hasło nie może być wyłącznie numeryczne.",
  "A user with that username already exists.": "Użytkownik o takiej nazwie już istnieje.",
  "Enter a valid email address.": "Wprowadź prawidłowy adres email.",
  // Dodaj kolejne mapowania według potrzeb
};

function translateMessage(msg) {
  return errorMapping[msg] || msg;
}

// Funkcja pobierająca token CSRF z ciasteczek
function getCsrfToken() {
  const cookieValue = document.cookie
    .split('; ')
    .find(row => row.startsWith('csrftoken='));
  return cookieValue ? cookieValue.split('=')[1] : null;
}

// Funkcja sprawdzająca, czy token CSRF jest dostępny, a jeśli nie – pobiera go z backendu
async function ensureCsrfToken() {
  try {
    let token = getCsrfToken();
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

export async function register(username, email, firstName, lastName, password, password2) {
  try {
    // Zakładamy, że dane wejściowe są walidowane już w formularzu
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
        .map(([field, msgs]) => {
          const translated = Array.isArray(msgs)
            ? msgs.map(translateMessage).join(' ')
            : translateMessage(msgs);
          return translated;
        })
        .join(' | ');
      throw new Error(errorMessages);
    }
    return await response.json();
  } catch (error) {
    console.error('Błąd w rejestracji:', error);
    throw error;
  }
}

export async function login(email, password) {
  try {
    // Zakładamy, że dane wejściowe są walidowane już w formularzu
    const csrfToken = await ensureCsrfToken();
    const response = await apiRequest(config.endpoints.login, {
      method: 'POST',
      headers: { 'X-CSRFToken': csrfToken },
      body: JSON.stringify({ email, password })
    });
  
    if (!response.ok) {
      throw new Error('Błędny login lub hasło');
    }
    return await response.json();
  } catch (error) {
    console.error('Błąd w logowaniu:', error);
    throw error;
  }
}

export async function resetPassword(email) {
  try {
    // Zakładamy, że dane wejściowe są walidowane już w formularzu
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
    // Upewniamy się, że mamy token CSRF
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
