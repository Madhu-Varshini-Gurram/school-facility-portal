/**
 * Centralised API helper.
 * In dev, Vite proxies "/api/..." to localhost:5000.
 * In production, set VITE_API_BASE_URL to your backend origin.
 */
const API_BASE = import.meta.env.VITE_API_BASE_URL || '';

let onUnauthorized = null;

export function setUnauthorizedHandler(handler) {
  onUnauthorized = handler;
}

export class ApiError extends Error {
  constructor(message, status) {
    super(message);
    this.name = 'ApiError';
    this.status = status;
  }
}

async function parseResponseBody(response) {
  const text = await response.text();
  if (!text) return {};
  try {
    return JSON.parse(text);
  } catch {
    return { message: text };
  }
}

/**
 * @param {string} path - API path starting with "/api/..."
 * @param {object} [options] - Standard fetch options
 * @param {string} [token] - Optional JWT Bearer token
 */
export async function apiFetch(path, options = {}, token = null) {
  const headers = { ...(options.headers || {}) };

  if (token) {
    headers.Authorization = `Bearer ${token}`;
  }

  if (options.body && typeof options.body === 'string') {
    headers['Content-Type'] = 'application/json';
  }

  const response = await fetch(`${API_BASE}${path}`, {
    ...options,
    headers
  });

  const data = await parseResponseBody(response);

  if (!response.ok) {
    if (response.status === 401 && onUnauthorized) {
      onUnauthorized();
    }
    const message = data.message || `Request failed with status ${response.status}`;
    throw new ApiError(message, response.status);
  }

  return data;
}

export function formatStatus(status) {
  if (status === 'in-progress') return 'In Progress';
  if (!status) return '';
  return status.charAt(0).toUpperCase() + status.slice(1);
}

export default API_BASE;
