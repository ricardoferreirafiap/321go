"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.UpdateTarefaDto = void 0;
const mapped_types_1 = require("@nestjs/mapped-types");
const create_tarefa_dto_1 = require("./create-tarefa.dto");
class UpdateTarefaDto extends (0, mapped_types_1.PartialType)(create_tarefa_dto_1.CreateTarefaDto) {
}
exports.UpdateTarefaDto = UpdateTarefaDto;
//# sourceMappingURL=update-tarefa.dto.js.map