const BASE = '/api';

export const getToken = () => localStorage.getItem('token');

async function request(path, options = {}) {
  const token = getToken();
  const res = await fetch(BASE + path, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
  });
  if (res.status === 204) return null;
  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    const err = new Error(data.error || 'Request failed');
    err.status = res.status;
    throw err;
  }
  return data;
}

const send = (method, body) => ({ method, body: JSON.stringify(body) });

export const api = {
  register: (body) => request('/auth/register', send('POST', body)),
  login: (body) => request('/auth/login', send('POST', body)),
  listTasks: (query = '') => request('/tasks' + query),
  createTask: (body) => request('/tasks', send('POST', body)),
  updateTask: (id, body) => request(`/tasks/${id}`, send('PATCH', body)),
  deleteTask: (id) => request(`/tasks/${id}`, { method: 'DELETE' }),
};
