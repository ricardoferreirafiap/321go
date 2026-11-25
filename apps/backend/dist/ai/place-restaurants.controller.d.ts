import { PlaceRestaurantsService } from './place-restaurants.service';
export declare class PlaceRestaurantsController {
    private readonly placeRestaurantsService;
    constructor(placeRestaurantsService: PlaceRestaurantsService);
    searchRestaurants(place: string, cuisine?: string, priceRange?: string): Promise<{
        totalPlaces: number;
        options: {
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
        }[];
        fallback: string;
        missingInformation: string[];
    } | {
        totalPlaces: number;
        options: {
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
        }[];
        fallback?: undefined;
        missingInformation?: undefined;
    }>;
}
