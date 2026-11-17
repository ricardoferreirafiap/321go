"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.UpdateFuncionarioDto = void 0;
const mapped_types_1 = require("@nestjs/mapped-types");
const create_funcionario_dto_1 = require("./create-funcionario.dto");
class UpdateFuncionarioDto extends (0, mapped_types_1.PartialType)(create_funcionario_dto_1.CreateFuncionarioDto) {
}
exports.UpdateFuncionarioDto = UpdateFuncionarioDto;
//# sourceMappingURL=update-funcionario.dto.js.map