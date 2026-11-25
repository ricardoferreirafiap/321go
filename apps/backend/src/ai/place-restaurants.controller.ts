import { Controller, Get, Query } from '@nestjs/common';
import { PlaceRestaurantsService } from './place-restaurants.service';

@Controller()
export class PlaceRestaurantsController {
  constructor(private readonly placeRestaurantsService: PlaceRestaurantsService) {}

  @Get('place-restaurants')
  searchRestaurants(
    @Query('place') place: string,
    @Query('cuisine') cuisine?: string,
    @Query('priceRange') priceRange?: string,
  ) {
    return this.placeRestaurantsService.searchRestaurants(place, cuisine, priceRange);
  }
}

