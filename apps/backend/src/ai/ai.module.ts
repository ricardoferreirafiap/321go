import { Module } from '@nestjs/common';
import { AiController } from './ai.controller';
import { AiRepository } from './ai.repository';
import { AiService } from './ai.service';
import { PlaceRestaurantsController } from './place-restaurants.controller';
import { PlaceRestaurantsService } from './place-restaurants.service';

@Module({
  controllers: [AiController, PlaceRestaurantsController],
  providers: [AiRepository, AiService, PlaceRestaurantsService],
})
export class AiModule {}

