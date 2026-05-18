import { SaveUserResponse } from '../user/user.dto.type';

export interface SignupRequest {
  username: string;
  password: string;
}

export type LoginRequest = SignupRequest;

export interface RefreshTokenRequest {
  refreshToken: string;
}

export interface AuthTokenResponse {
  accessToken: string;
  refreshToken: string;
  accessTokenExpiresAt: string;
}

export interface LoginResponse extends AuthTokenResponse {
  user: SaveUserResponse;
}
