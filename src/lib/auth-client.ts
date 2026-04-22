interface AuthRedirectResponse {
  url?: string;
}

async function readJson<T>(response: Response): Promise<T> {
  const text = await response.text();
  try {
    return JSON.parse(text) as T;
  } catch {
    throw new Error(`Respuesta invalida del servidor auth (${response.status}): ${text.slice(0, 120)}`);
  }
}

async function fetchCsrfToken(prefix = '/api/auth/'): Promise<string> {
  const response = await fetch(`${prefix}csrf/`, {
    method: 'GET',
    credentials: 'same-origin'
  });

  if (!response.ok) {
    throw new Error(`No se pudo obtener CSRF token (${response.status}).`);
  }

  const payload = await readJson<{ csrfToken?: string }>(response);
  if (!payload.csrfToken) {
    throw new Error('CSRF token ausente en respuesta de auth.');
  }

  return payload.csrfToken;
}

export async function signInWithGitHub(prefix = '/api/auth/'): Promise<void> {
  const callbackUrl = window.location.origin + '/';
  const csrfToken = await fetchCsrfToken(prefix);

  const response = await fetch(`${prefix}signin/github/`, {
    method: 'POST',
    credentials: 'same-origin',
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded',
      'X-Auth-Return-Redirect': '1'
    },
    body: new URLSearchParams({
      csrfToken,
      callbackUrl
    })
  });

  if (!response.ok) {
    throw new Error(`No se pudo iniciar login con GitHub (${response.status}).`);
  }

  const payload = await readJson<AuthRedirectResponse>(response);
  window.location.href = payload.url || callbackUrl;
}

export async function signOutUser(prefix = '/api/auth/'): Promise<void> {
  const callbackUrl = window.location.origin + '/login/';
  const csrfToken = await fetchCsrfToken(prefix);

  const response = await fetch(`${prefix}signout/`, {
    method: 'POST',
    credentials: 'same-origin',
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded',
      'X-Auth-Return-Redirect': '1'
    },
    body: new URLSearchParams({
      csrfToken,
      callbackUrl
    })
  });

  if (!response.ok) {
    throw new Error(`No se pudo cerrar sesion (${response.status}).`);
  }

  const payload = await readJson<AuthRedirectResponse>(response);
  window.location.href = payload.url || callbackUrl;
}