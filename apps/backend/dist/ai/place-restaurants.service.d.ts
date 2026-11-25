import { AiRepository } from './ai.repository';
type RestaurantOption = {
    placeId: number;
    nome: string;
    local: string;
    endereco: string;
    classificacao: number;
    totalAvaliacoes: number;
    telefone: string;
    website: string;
    priceLevel: string;
    urlMaps: string;
};
export declare class PlaceRestaurantsService {
    private readonly aiRepository;
    private readonly maxRestaurants;
    constructor(aiRepository: AiRepository);
    searchRestaurants(place: string, cuisine?: string, priceRange?: string): Promise<{
        totalPlaces: number;
        options: RestaurantOption[];
        fallback: string;
        missingInformation: string[];
    } | {
        totalPlaces: number;
        options: RestaurantOption[];
        fallback?: undefined;
        missingInformation?: undefined;
    }>;
    private extractMissingInformationFromErrorMessage;
    private parseAiFallbackJson;
    private normalizeRestaurantAiOptions;
    private buildRestaurantOptionsFromStructuredResponse;
    private getGoogleMapsApiKey;
    private buildGoogleMapsSearchUrl;
    private searchGoogleMapsPlace;
    private searchGoogleMapsRestaurants;
}
export {};
