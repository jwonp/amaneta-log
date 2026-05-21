import { Body, Controller, HttpCode, HttpStatus, Post } from '@nestjs/common';
import { Throttle } from '@nestjs/throttler';
import { AuthService } from './auth.service';
import type {
  LoginRequest,
  RefreshTokenRequest,
  SignupRequest,
} from './auth.dto.type';
import {
  ParseLoginRequestPipe,
  ParseRefreshTokenRequestPipe,
  ParseSignupRequestPipe,
} from './auth.validation';

@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Post('signup')
  @HttpCode(HttpStatus.CREATED)
  @Throttle({ default: { limit: 5, ttl: 60_000 } })
  async signup(@Body(new ParseSignupRequestPipe()) body: SignupRequest) {
    return await this.authService.signup(body.username, body.password);
  }
  @Post('login')
  @HttpCode(HttpStatus.OK)
  @Throttle({ default: { limit: 5, ttl: 60_000 } })
  async login(@Body(new ParseLoginRequestPipe()) body: LoginRequest) {
    return await this.authService.login(body.username, body.password);
  }

  @Post('refresh')
  @HttpCode(HttpStatus.OK)
  @Throttle({ default: { limit: 10, ttl: 60_000 } })
  async refresh(@Body(new ParseRefreshTokenRequestPipe()) body: RefreshTokenRequest) {
    return await this.authService.refresh(body.refreshToken);
  }
}
