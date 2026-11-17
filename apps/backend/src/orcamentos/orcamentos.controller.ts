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
import { OrcamentosService } from './orcamentos.service';
import { CreateOrcamentoDto } from './dto/create-orcamento.dto';
import { UpdateOrcamentoDto } from './dto/update-orcamento.dto';

@Controller('orcamentos')
export class OrcamentosController {
  constructor(private readonly orcamentosService: OrcamentosService) {}

  @Get()
  findAll() {
    return this.orcamentosService.findAll();
  }

  @Get('numero/:numero')
  findByNumero(@Param('numero') numero: string) {
    return this.orcamentosService.findByNumero(numero);
  }

  @Get('public/:publicToken')
  findByPublicToken(@Param('publicToken') publicToken: string) {
    return this.orcamentosService.findByPublicToken(publicToken);
  }

  @Get(':id')
  findOne(@Param('id', ParseIntPipe) id: number) {
    return this.orcamentosService.findOne(id);
  }

  @Post()
  create(@Body() dto: CreateOrcamentoDto) {
    return this.orcamentosService.create(dto);
  }

  @Put(':id')
  update(@Param('id', ParseIntPipe) id: number, @Body() dto: UpdateOrcamentoDto) {
    return this.orcamentosService.update(id, dto);
  }

  @Delete(':id')
  remove(@Param('id', ParseIntPipe) id: number) {
    return this.orcamentosService.remove(id);
  }
}

