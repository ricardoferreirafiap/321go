"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.PlaceRestaurantsService = void 0;
const common_1 = require("@nestjs/common");
const ai_repository_1 = require("./ai.repository");
let PlaceRestaurantsService = class PlaceRestaurantsService {
    aiRepository;
    maxRestaurants = 5;
    constructor(aiRepository) {
        this.aiRepository = aiRepository;
    }
    async searchRestaurants(place, cuisine, priceRange) {
        const normalizedPlace = String(place || '').trim();
        if (!normalizedPlace) {
            throw new common_1.BadRequestException('Parâmetro place é obrigatório.');
        }
        const normalizedCuisine = String(cuisine || '').trim();
        const normalizedPriceRange = String(priceRange || '').trim();
        const promptLines = [
            `BUSCA_RESTAURANTE: ${normalizedPlace}`,
            normalizedCuisine ? `COZINHA: ${normalizedCuisine}` : '',
            normalizedPriceRange ? `FAIXA_PRECO: ${normalizedPriceRange}` : '',
            `LIMITE_RESTAURANTES: ${this.maxRestaurants}`,
            'Retorne exatamente 5 restaurantes reais quando houver disponibilidade.',
        ].filter(Boolean);
        const messages = [{ role: 'user', content: promptLines.join('\n') }];
        let rawReply = '';
        try {
            rawReply = await this.aiRepository.generateReply('wonderful', messages);
        }
        catch (error) {
            if (error instanceof ai_repository_1.AiRepositoryError) {
                if (error.code === 'WONDERFUL_REQUEST_FAILED') {
                    const missingInformation = this.extractMissingInformationFromErrorMessage(error.message);
                    if (missingInformation.length > 0) {
                        return {
                            totalPlaces: 0,
                            options: [],
                            fallback: 'wonderful-missing-information',
                            missingInformation,
                        };
                    }
                }
                const shouldFallbackToGoogle = error.code === 'WONDERFUL_TIMEOUT' ||
                    error.code === 'AI_PROVIDER_UNAVAILABLE' ||
                    error.code === 'WONDERFUL_REQUEST_FAILED';
                if (shouldFallbackToGoogle) {
                    const googleOptions = await this.searchGoogleMapsRestaurants(normalizedPlace, normalizedCuisine, normalizedPriceRange);
                    if (googleOptions.length > 0) {
                        return {
                            totalPlaces: googleOptions.length,
                            options: googleOptions,
                        };
                    }
                }
                throw new common_1.HttpException({
                    message: error.message,
                    code: error.code,
                }, error.statusCode);
            }
            throw new common_1.InternalServerErrorException('Falha ao buscar restaurantes com a Wonderful.');
        }
        const parsed = this.parseAiFallbackJson(rawReply);
        const options = await this.normalizeRestaurantAiOptions(parsed, normalizedPlace);
        if (options.length > 0) {
            return {
                totalPlaces: options.length,
                options,
            };
        }
        throw new common_1.InternalServerErrorException('Wonderful retornou resposta sem restaurantes utilizáveis.');
    }
    extractMissingInformationFromErrorMessage(message) {
        const raw = String(message || '');
        const marker = 'Detalhe:';
        const markerIndex = raw.indexOf(marker);
        if (markerIndex < 0) {
            return [];
        }
        const detail = raw.slice(markerIndex + marker.length).trim();
        if (!detail) {
            return [];
        }
        try {
            const parsed = JSON.parse(detail);
            if (Array.isArray(parsed?.missing_information)) {
                return parsed.missing_information
                    .map((item) => String(item || '').trim())
                    .filter(Boolean);
            }
        }
        catch {
        }
        return [];
    }
    parseAiFallbackJson(raw) {
        const parseCandidate = (candidate) => {
            try {
                return JSON.parse(candidate);
            }
            catch {
                return null;
            }
        };
        const normalizeParsed = (value) => {
            if (typeof value === 'string') {
                const trimmed = value.trim();
                if (!trimmed) {
                    return null;
                }
                return parseCandidate(trimmed) ?? value;
            }
            return value;
        };
        const cleaned = String(raw || '')
            .replace(/^```json\s*/i, '')
            .replace(/^```\s*/i, '')
            .replace(/```\s*$/i, '')
            .trim();
        if (!cleaned) {
            return null;
        }
        const direct = normalizeParsed(parseCandidate(cleaned));
        if (direct) {
            return direct;
        }
        const firstObject = cleaned.indexOf('{');
        const lastObject = cleaned.lastIndexOf('}');
        if (firstObject >= 0 && lastObject > firstObject) {
            const parsedObject = normalizeParsed(parseCandidate(cleaned.slice(firstObject, lastObject + 1)));
            if (parsedObject) {
                return parsedObject;
            }
        }
        const firstArray = cleaned.indexOf('[');
        const lastArray = cleaned.lastIndexOf(']');
        if (firstArray >= 0 && lastArray > firstArray) {
            return normalizeParsed(parseCandidate(cleaned.slice(firstArray, lastArray + 1)));
        }
        return null;
    }
    async normalizeRestaurantAiOptions(parsed, place) {
        const baseItems = Array.isArray(parsed)
            ? parsed
            : this.buildRestaurantOptionsFromStructuredResponse(parsed, place);
        if (!Array.isArray(baseItems) || baseItems.length === 0) {
            return [];
        }
        const apiKey = this.getGoogleMapsApiKey();
        const normalized = [];
        for (const [index, rawItem] of baseItems.slice(0, this.maxRestaurants).entries()) {
            const item = rawItem;
            const nome = String(item.nome || item.name || place).trim() || place;
            let local = String(item.local || item.neighborhood || place).trim() || place;
            let endereco = String(item.endereco || item.address || '').trim();
            let telefone = String(item.telefone || item.phone || '').trim();
            let website = String(item.website || '').trim();
            let classificacao = Number(item.classificacao || item.rating || 0);
            let totalAvaliacoes = Number(item.totalAvaliacoes || item.reviews || 0);
            let urlMaps = String(item.urlMaps || item.googleMapsUrl || item.maps_url || '').trim() ||
                this.buildGoogleMapsSearchUrl(nome, endereco || local || place);
            const real = item.real === true || item.is_real === true || item.real_place === true;
            if (apiKey && (real || !endereco || !urlMaps)) {
                const best = await this.searchGoogleMapsPlace(`${nome} ${local || place}`.trim(), apiKey);
                if (best) {
                    endereco = String(best.formattedAddress || endereco || '').trim();
                    const resolvedFormattedAddress = String(best.formattedAddress || local || place);
                    local = String(resolvedFormattedAddress.split(',')[0] || local || place).trim();
                    telefone = String(best.internationalPhoneNumber || telefone || '').trim();
                    website = String(best.websiteUri || website || '').trim();
                    urlMaps = String(best.googleMapsUri || urlMaps || '').trim();
                    classificacao = Number(best.rating || classificacao || 0);
                    totalAvaliacoes = Number(best.userRatingCount || totalAvaliacoes || 0);
                }
            }
            normalized.push({
                placeId: index + 1,
                nome,
                local,
                endereco: endereco || `${local || place}, Brasil`,
                classificacao,
                totalAvaliacoes,
                telefone,
                website,
                priceLevel: String(item.priceLevel || item.price_range || '$$').trim() || '$$',
                urlMaps: urlMaps || this.buildGoogleMapsSearchUrl(nome, endereco || local || place),
            });
        }
        return normalized;
    }
    buildRestaurantOptionsFromStructuredResponse(parsed, place) {
        if (!parsed || typeof parsed !== 'object') {
            return [];
        }
        const typed = parsed;
        const restaurantsRaw = Array.isArray(typed.restaurants) ? typed.restaurants : [];
        const attractionsRaw = Array.isArray(typed.attractions) ? typed.attractions : [];
        const fromAttractions = restaurantsRaw.length === 0
            ? attractionsRaw.filter((item) => {
                const typedItem = item;
                const type = String(typedItem.type || '').toLowerCase();
                const name = String(typedItem.name || typedItem.nome || '').trim();
                return !!name && (type.includes('restaurante') || type.includes('restaurant'));
            })
            : [];
        const source = restaurantsRaw.length > 0 ? restaurantsRaw : fromAttractions;
        return source.map((item) => {
            const typedItem = item;
            const name = String(typedItem.name || typedItem.nome || '').trim();
            const neighborhood = String(typedItem.neighborhood || typedItem.bairro || typedItem.local || '').trim();
            const address = String(typedItem.address || typedItem.endereco || '').trim();
            return {
                nome: name || place,
                local: neighborhood || place,
                endereco: address,
                classificacao: Number(typedItem.rating || typedItem.classificacao || 0),
                totalAvaliacoes: Number(typedItem.reviews || typedItem.totalAvaliacoes || 0),
                telefone: String(typedItem.phone || typedItem.telefone || '').trim(),
                website: String(typedItem.website || '').trim(),
                priceLevel: String(typedItem.price_range || typedItem.priceLevel || '$$').trim() || '$$',
                urlMaps: String(typedItem.urlMaps || typedItem.googleMapsUrl || typedItem.maps_url || '').trim() ||
                    this.buildGoogleMapsSearchUrl(name, address || neighborhood || place),
                real: typedItem.real === true || typedItem.is_real === true || typedItem.real_place === true,
            };
        });
    }
    getGoogleMapsApiKey() {
        return String(process.env.GOOGLE_MAPS_API_KEY || '').trim();
    }
    buildGoogleMapsSearchUrl(name, reference) {
        const query = [String(name || '').trim(), String(reference || '').trim()].filter(Boolean).join(' ').trim();
        if (!query) {
            return '';
        }
        return `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(query)}`;
    }
    async searchGoogleMapsPlace(textQuery, apiKey) {
        if (!textQuery || !apiKey) {
            return null;
        }
        try {
            const response = await fetch('https://places.googleapis.com/v1/places:searchText', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'X-Goog-Api-Key': apiKey,
                    'X-Goog-FieldMask': 'places.displayName,places.formattedAddress,places.rating,places.userRatingCount,places.priceLevel,places.internationalPhoneNumber,places.websiteUri,places.googleMapsUri',
                },
                body: JSON.stringify({
                    textQuery,
                    languageCode: 'pt-BR',
                    pageSize: 1,
                }),
            });
            if (!response.ok) {
                return null;
            }
            const payload = (await response.json());
            return Array.isArray(payload.places) && payload.places.length > 0 ? payload.places[0] : null;
        }
        catch {
            return null;
        }
    }
    async searchGoogleMapsRestaurants(place, cuisine, priceRange) {
        const apiKey = this.getGoogleMapsApiKey();
        if (!apiKey) {
            return [];
        }
        const cuisineHint = String(cuisine || '').trim();
        const priceHint = String(priceRange || '').trim();
        const query = [
            'restaurantes',
            cuisineHint,
            place,
            priceHint ? `faixa ${priceHint}` : '',
        ]
            .filter(Boolean)
            .join(' ')
            .trim();
        try {
            const response = await fetch('https://places.googleapis.com/v1/places:searchText', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'X-Goog-Api-Key': apiKey,
                    'X-Goog-FieldMask': 'places.displayName,places.formattedAddress,places.rating,places.userRatingCount,places.priceLevel,places.internationalPhoneNumber,places.websiteUri,places.googleMapsUri',
                },
                body: JSON.stringify({
                    textQuery: query,
                    languageCode: 'pt-BR',
                    pageSize: this.maxRestaurants,
                }),
            });
            if (!response.ok) {
                return [];
            }
            const payload = (await response.json());
            const places = Array.isArray(payload.places) ? payload.places : [];
            return places.slice(0, this.maxRestaurants).map((item, index) => {
                const nome = String(item.displayName?.text || place).trim() || place;
                const endereco = String(item.formattedAddress || place).trim() || place;
                const local = String(endereco.split(',')[0] || place).trim() || place;
                return {
                    placeId: index + 1,
                    nome,
                    local,
                    endereco,
                    classificacao: Number(item.rating || 0),
                    totalAvaliacoes: Number(item.userRatingCount || 0),
                    telefone: String(item.internationalPhoneNumber || '').trim(),
                    website: String(item.websiteUri || '').trim(),
                    priceLevel: String(item.priceLevel || '$$').replace('PRICE_LEVEL_', ''),
                    urlMaps: String(item.googleMapsUri || '').trim() ||
                        this.buildGoogleMapsSearchUrl(nome, endereco || local || place),
                };
            });
        }
        catch {
            return [];
        }
    }
};
exports.PlaceRestaurantsService = PlaceRestaurantsService;
exports.PlaceRestaurantsService = PlaceRestaurantsService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [ai_repository_1.AiRepository])
], PlaceRestaurantsService);
//# sourceMappingURL=place-restaurants.service.js.map