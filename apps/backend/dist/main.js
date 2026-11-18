"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const core_1 = require("@nestjs/core");
const common_1 = require("@nestjs/common");
const app_module_1 = require("./app.module");
const http_exception_filter_1 = require("./common/filters/http-exception.filter");
const bigIntPrototype = BigInt.prototype;
if (!bigIntPrototype.toJSON) {
    Object.defineProperty(BigInt.prototype, 'toJSON', {
        value() {
            return this.toString();
        },
        writable: true,
        configurable: true,
    });
}
async function bootstrap() {
    const app = await core_1.NestFactory.create(app_module_1.AppModule);
    app.useBodyParser('json', { limit: '25mb' });
    app.useBodyParser('urlencoded', { extended: true, limit: '25mb' });
    app.setGlobalPrefix('api');
    app.useGlobalFilters(new http_exception_filter_1.HttpExceptionFilter());
    app.useGlobalPipes(new common_1.ValidationPipe({
        whitelist: true,
        forbidNonWhitelisted: true,
        transform: true,
    }));
    app.enableCors({
        origin: true,
        credentials: true,
    });
    const port = Number(process.env.PORT || 3001);
    await app.listen(port);
}
bootstrap().catch((error) => {
    console.error('Falha ao iniciar backend:', error);
    process.exit(1);
});
//# sourceMappingURL=main.js.map