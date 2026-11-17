import { Body, Controller, Post } from '@nestjs/common';
import { FuncionariosService } from './funcionarios.service';

type LoginBody = {
  email: string;
  password: string;
};

@Controller('auth/funcionarios')
export class AuthFuncionariosController {
  constructor(private readonly funcionariosService: FuncionariosService) {}

  @Post('login')
  login(@Body() body: LoginBody) {
    return this.funcionariosService.login(body.email, body.password);
  }
}

