import { SaveUserResponse } from '../user/user.dto.type';

export interface SignupRequest {
  username: string;
  password: string;
}

export type LoginRequest = SignupRequest;

export interface LoginResponse {
  accessToken: string;
  user: SaveUserResponse;
}
