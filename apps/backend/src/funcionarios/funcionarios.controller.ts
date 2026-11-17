import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  ParseIntPipe,
  Post,
  Put,
} from '@nestjs/common';
import { CreateFuncionarioDto } from './dto/create-funcionario.dto';
import { UpdateFuncionarioDto } from './dto/update-funcionario.dto';
import { FuncionariosService } from './funcionarios.service';

@Controller('funcionarios')
export class FuncionariosController {
  constructor(private readonly funcionariosService: FuncionariosService) {}

  @Get()
  findAll() {
    return this.funcionariosService.findAll();
  }

  @Get(':id')
  findOne(@Param('id', ParseIntPipe) id: number) {
    return this.funcionariosService.findOne(id);
  }

  @Post()
  create(@Body() dto: CreateFuncionarioDto) {
    return this.funcionariosService.create(dto);
  }

  @Put(':id')
  update(@Param('id', ParseIntPipe) id: number, @Body() dto: UpdateFuncionarioDto) {
    return this.funcionariosService.update(id, dto);
  }

  @Delete(':id')
  remove(@Param('id', ParseIntPipe) id: number) {
    return this.funcionariosService.remove(id);
  }

  @Post('login')
  login(@Body() body: { email: string; password: string }) {
    return this.funcionariosService.login(body.email, body.password);
  }
}

