import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { PrismaModule } from './prisma/prisma.module';
import { StorageModule } from './storage/storage.module';
import { AuthModule } from './auth/auth.module';
import { UserService } from './user/user.service';
import { UserModule } from './user/user.module';
import { JwtModule } from '@nestjs/jwt';
import { PostModule } from './post/post.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: ['.env'],
    }),
    JwtModule.registerAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (config: ConfigService) => ({
        global: true,
        secret: config.getOrThrow<string>('JWT_ACCESS_SECRET'),
        signOptions: {
          expiresIn: config.getOrThrow('JWT_ACCESS_EXPIRES_IN') ?? '1H',
        },
      }),
    }),
    AuthModule,
    PrismaModule,
    StorageModule,
    UserModule,
    PostModule,
  ],
  controllers: [AppController],
  providers: [AppService, UserService],
})
export class AppModule {}
