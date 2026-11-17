"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.UpdateFornecedorDto = void 0;
const mapped_types_1 = require("@nestjs/mapped-types");
const create_fornecedor_dto_1 = require("./create-fornecedor.dto");
class UpdateFornecedorDto extends (0, mapped_types_1.PartialType)(create_fornecedor_dto_1.CreateFornecedorDto) {
}
exports.UpdateFornecedorDto = UpdateFornecedorDto;
//# sourceMappingURL=update-fornecedor.dto.js.map