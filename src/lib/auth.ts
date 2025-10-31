// Mock authentication utilities using localStorage

export interface User {
  email: string;
  alteredId: string;
}

export interface AuthState {
  user: User | null;
  isAuthenticated: boolean;
}

const AUTH_KEY = 'mock_auth_state';

export function getAuthState(): AuthState {
  if (typeof window === 'undefined') {
    return { user: null, isAuthenticated: false };
  }
  
  const stored = localStorage.getItem(AUTH_KEY);
  if (stored) {
    try {
      const authState = JSON.parse(stored);
      return {
        user: authState.user,
        isAuthenticated: !!authState.user,
      };
    } catch {
      return { user: null, isAuthenticated: false };
    }
  }
  
  return { user: null, isAuthenticated: false };
}

export function setAuthState(user: User | null): void {
  if (typeof window === 'undefined') return;
  
  const authState: AuthState = {
    user,
    isAuthenticated: !!user,
  };
  
  localStorage.setItem(AUTH_KEY, JSON.stringify(authState));
}

export function logout(): void {
  setAuthState(null);
}

// Mock user database stored in localStorage
const USERS_KEY = 'mock_users';

interface StoredUser extends User {
  password: string; // In real app, this would be hashed
}

function getUsers(): StoredUser[] {
  if (typeof window === 'undefined') return [];
  
  const stored = localStorage.getItem(USERS_KEY);
  if (stored) {
    try {
      return JSON.parse(stored);
    } catch {
      return [];
    }
  }
  
  return [];
}

function saveUsers(users: StoredUser[]): void {
  if (typeof window === 'undefined') return;
  localStorage.setItem(USERS_KEY, JSON.stringify(users));
}

export function register(email: string, password: string, alteredId: string): Promise<void> {
  return new Promise((resolve, reject) => {
    const users = getUsers();
    
    // Check if user already exists
    if (users.some(u => u.email === email)) {
      reject(new Error('User with this email already exists'));
      return;
    }
    
    // Check if altered ID already exists
    if (users.some(u => u.alteredId === alteredId)) {
      reject(new Error('Altered ID already taken'));
      return;
    }
    
    // Create new user
    const newUser: StoredUser = {
      email,
      password,
      alteredId,
    };
    
    users.push(newUser);
    saveUsers(users);
    
    // Auto-login after registration
    setAuthState({ email, alteredId });
    
    resolve();
  });
}

export function login(email: string, password: string): Promise<void> {
  return new Promise((resolve, reject) => {
    const users = getUsers();
    const user = users.find(u => u.email === email && u.password === password);
    
    if (!user) {
      reject(new Error('Invalid email or password'));
      return;
    }
    
    setAuthState({ email: user.email, alteredId: user.alteredId });
    resolve();
  });
}

