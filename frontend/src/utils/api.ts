import type {
  User,
  AuthResponse,
  Nomination,
  NominationInput,
  Person,
  BallotSelection,
  ResultPerson,
  Stats,
} from "../types";

// Use environment variable for API URL in production, fallback to proxy in development
const API_URL = import.meta.env.VITE_API_URL || "/api";

// Get token from localStorage
function getToken(): string | null {
  return localStorage.getItem("token");
}

// Set token in localStorage
function setToken(token: string): void {
  localStorage.setItem("token", token);
}

// Remove token from localStorage
function removeToken(): void {
  localStorage.removeItem("token");
}

// Get user from localStorage
function getUser(): User | null {
  const user = localStorage.getItem("user");
  return user ? JSON.parse(user) : null;
}

// Set user in localStorage
function setUser(user: User): void {
  localStorage.setItem("user", JSON.stringify(user));
}

// Remove user from localStorage
function removeUser(): void {
  localStorage.removeItem("user");
}

// Generic fetch with auth
async function fetchAPI<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
  const token = getToken();
  const headers: HeadersInit = {
    "Content-Type": "application/json",
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
    const error = await response.json().catch(() => ({ error: "An error occurred" }));
    throw new Error(error.error || "An error occurred");
  }

  return response.json();
}

// Auth API
export const authAPI = {
  login: async (username: string, password: string): Promise<AuthResponse> => {
    const data = await fetchAPI<AuthResponse>("/auth/login", {
      method: "POST",
      body: JSON.stringify({ username, password }),
    });
    setToken(data.token);
    setUser(data.user);
    return data;
  },

  register: async (
    username: string,
    password: string,
    role: "admin" | "committee"
  ): Promise<User> => {
    return fetchAPI<User>("/auth/register", {
      method: "POST",
      body: JSON.stringify({ username, password, role }),
    });
  },

  changePassword: async (
    currentPassword: string,
    newPassword: string
  ): Promise<{ message: string }> => {
    return fetchAPI<{ message: string }>("/auth/change-password", {
      method: "POST",
      body: JSON.stringify({ currentPassword, newPassword }),
    });
  },

  logout: (): void => {
    removeToken();
    removeUser();
  },

  isAuthenticated: (): boolean => !!getToken(),

  getCurrentUser: getUser,
};

// Nominations API
export const nominationsAPI = {
  getAll: (): Promise<Nomination[]> => fetchAPI<Nomination[]>("/nominations"),

  getById: (id: number): Promise<Nomination> => fetchAPI<Nomination>(`/nominations/${id}`),

  create: (nomination: NominationInput): Promise<Nomination> =>
    fetchAPI<Nomination>("/nominations", {
      method: "POST",
      body: JSON.stringify(nomination),
    }),

  update: (id: number, nomination: Partial<NominationInput>): Promise<Nomination> =>
    fetchAPI<Nomination>(`/nominations/${id}`, {
      method: "PUT",
      body: JSON.stringify(nomination),
    }),

  delete: (id: number): Promise<void> =>
    fetchAPI<void>(`/nominations/${id}`, {
      method: "DELETE",
    }),
};

// People API (grouped nominations)
export const peopleAPI = {
  getAll: (): Promise<Person[]> => fetchAPI<Person[]>("/people"),

  getNominations: (name: string, year: string): Promise<Nomination[]> =>
    fetchAPI<Nomination[]>(
      `/people/${encodeURIComponent(name)}/${encodeURIComponent(year)}/nominations`
    ),
};

// Ballot API
export const ballotAPI = {
  getMySelections: (): Promise<BallotSelection[]> =>
    fetchAPI<BallotSelection[]>("/ballot/my-selections"),

  saveSelections: (selections: BallotSelection[]): Promise<{ message: string }> =>
    fetchAPI<{ message: string }>("/ballot", {
      method: "POST",
      body: JSON.stringify({ selections }),
    }),
};

// Results API
export const resultsAPI = {
  get: (): Promise<ResultPerson[]> => fetchAPI<ResultPerson[]>("/results"),
};

// Users API
export const usersAPI = {
  getAll: (): Promise<User[]> => fetchAPI<User[]>("/users"),

  delete: (id: number): Promise<void> =>
    fetchAPI<void>(`/users/${id}`, {
      method: "DELETE",
    }),
};

// Stats API
export const statsAPI = {
  get: (): Promise<Stats> => fetchAPI<Stats>("/stats"),
};
