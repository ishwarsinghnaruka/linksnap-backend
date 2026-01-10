export interface User {
  id: number;
  email: string;
  password_hash: string;
  name: string | null;
  created_at: Date;
  updated_at: Date;
  is_active: boolean;
}

export interface RegisterDTO {
  email: string;
  password: string;
  name?: string;
}

export interface LoginDTO {
  email: string;
  password: string;
}

export interface UserResponse {
  id: number;
  email: string;
  name: string | null;
  createdAt: Date;
}

export interface AuthTokens {
  accessToken: string;
  refreshToken: string;
}

export interface AuthResponse {
  user: UserResponse;
  tokens: AuthTokens;
}

export interface RefreshToken {
  id: number;
  user_id: number;
  token: string;
  expires_at: Date;
  created_at: Date;
}
