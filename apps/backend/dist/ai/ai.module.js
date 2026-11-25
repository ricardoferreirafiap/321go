"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.AiModule = void 0;
const common_1 = require("@nestjs/common");
const ai_controller_1 = require("./ai.controller");
const ai_repository_1 = require("./ai.repository");
const ai_service_1 = require("./ai.service");
const place_restaurants_controller_1 = require("./place-restaurants.controller");
const place_restaurants_service_1 = require("./place-restaurants.service");
let AiModule = class AiModule {
};
exports.AiModule = AiModule;
exports.AiModule = AiModule = __decorate([
    (0, common_1.Module)({
        controllers: [ai_controller_1.AiController, place_restaurants_controller_1.PlaceRestaurantsController],
        providers: [ai_repository_1.AiRepository, ai_service_1.AiService, place_restaurants_service_1.PlaceRestaurantsService],
    })
], AiModule);
//# sourceMappingURL=ai.module.js.map