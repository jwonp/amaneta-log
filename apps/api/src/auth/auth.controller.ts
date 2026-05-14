import { Body, Controller, HttpCode, HttpStatus, Post } from '@nestjs/common';
import { AuthService } from './auth.service';
import type { LoginRequest, SignupRequest } from './auth.dto.type';

@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Post('signup')
  @HttpCode(HttpStatus.CREATED)
  async signup(@Body() body: SignupRequest) {
    return await this.authService.signup(body.username, body.password);
  }
  @Post('login')
  @HttpCode(HttpStatus.OK)
  async login(@Body() body: LoginRequest) {
    return await this.authService.login(body.username, body.password);
  }
}
