import { ClientesService } from './clientes.service';
import { CreateClienteDto } from './dto/create-cliente.dto';
import { UpdateClienteDto } from './dto/update-cliente.dto';
export declare class ClientesController {
    private readonly clientesService;
    constructor(clientesService: ClientesService);
    findAll(): Promise<import("./clientes.service").ClienteResponseDto[]>;
    findOne(id: number): Promise<import("./clientes.service").ClienteResponseDto>;
    create(dto: CreateClienteDto): Promise<import("./clientes.service").ClienteResponseDto>;
    update(id: number, dto: UpdateClienteDto): Promise<import("./clientes.service").ClienteResponseDto>;
    remove(id: number): Promise<{
        deleted: boolean;
        id: number;
    }>;
}
