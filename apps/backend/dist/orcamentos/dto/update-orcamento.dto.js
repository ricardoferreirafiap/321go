"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.UpdateOrcamentoDto = void 0;
const mapped_types_1 = require("@nestjs/mapped-types");
const create_orcamento_dto_1 = require("./create-orcamento.dto");
class UpdateOrcamentoDto extends (0, mapped_types_1.PartialType)(create_orcamento_dto_1.CreateOrcamentoDto) {
}
exports.UpdateOrcamentoDto = UpdateOrcamentoDto;
//# sourceMappingURL=update-orcamento.dto.js.map