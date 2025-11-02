// Use environment variable for API URL in production, fallback to proxy in development
const API_URL = import.meta.env.VITE_API_URL || '/api';

// Get token from localStorage
function getToken() {
  return localStorage.getItem('token');
}

// Set token in localStorage
function setToken(token) {
  localStorage.setItem('token', token);
}

// Remove token from localStorage
function removeToken() {
  localStorage.removeItem('token');
}

// Get user from localStorage
function getUser() {
  const user = localStorage.getItem('user');
  return user ? JSON.parse(user) : null;
}

// Set user in localStorage
function setUser(user) {
  localStorage.setItem('user', JSON.stringify(user));
}

// Remove user from localStorage
function removeUser() {
  localStorage.removeItem('user');
}

// Generic fetch with auth
async function fetchAPI(endpoint, options = {}) {
  const token = getToken();
  const headers = {
    'Content-Type': 'application/json',
    ...options.headers,
  };

  if (token) {
    headers.Authorization = `Bearer ${token}`;
  }

  const response = await fetch(`${API_URL}${endpoint}`, {
    ...options,
    headers,
  });

  if (!response.ok) {
    const error = await response.json().catch(() => ({ error: 'An error occurred' }));
    throw new Error(error.error || 'An error occurred');
  }

  return response.json();
}

// Auth API
export const authAPI = {
  login: async (username, password) => {
    const data = await fetchAPI('/auth/login', {
      method: 'POST',
      body: JSON.stringify({ username, password }),
    });
    setToken(data.token);
    setUser(data.user);
    return data;
  },

  initAdmin: async (username, password) => {
    return fetchAPI('/auth/init-admin', {
      method: 'POST',
      body: JSON.stringify({ username, password }),
    });
  },

  register: async (username, password, role) => {
    return fetchAPI('/auth/register', {
      method: 'POST',
      body: JSON.stringify({ username, password, role }),
    });
  },

  logout: () => {
    removeToken();
    removeUser();
  },

  isAuthenticated: () => !!getToken(),

  getCurrentUser: getUser,
};

// Nominations API
export const nominationsAPI = {
  getAll: () => fetchAPI('/nominations'),

  getById: (id) => fetchAPI(`/nominations/${id}`),

  create: (nomination) => fetchAPI('/nominations', {
    method: 'POST',
    body: JSON.stringify(nomination),
  }),

  update: (id, nomination) => fetchAPI(`/nominations/${id}`, {
    method: 'PUT',
    body: JSON.stringify(nomination),
  }),

  delete: (id) => fetchAPI(`/nominations/${id}`, {
    method: 'DELETE',
  }),
};

// People API (grouped nominations)
export const peopleAPI = {
  getAll: () => fetchAPI('/people'),

  getNominations: (name, year) => fetchAPI(`/people/${encodeURIComponent(name)}/${encodeURIComponent(year)}/nominations`),
};

// Ballot API
export const ballotAPI = {
  getMySelections: () => fetchAPI('/ballot/my-selections'),

  saveSelections: (selections) => fetchAPI('/ballot', {
    method: 'POST',
    body: JSON.stringify({ selections }),
  }),
};

// Results API
export const resultsAPI = {
  get: () => fetchAPI('/results'),
};

// Users API
export const usersAPI = {
  getAll: () => fetchAPI('/users'),

  delete: (id) => fetchAPI(`/users/${id}`, {
    method: 'DELETE',
  }),
};

// Stats API
export const statsAPI = {
  get: () => fetchAPI('/stats'),
};
