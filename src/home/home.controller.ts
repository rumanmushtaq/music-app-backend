import { Controller, Get } from '@nestjs/common';

import { HomeFeed } from './home.types';
import { HomeService } from './home.service';

@Controller()
export class HomeController {
  constructor(private readonly homeService: HomeService) {}

  @Get('home')
  getHome(): HomeFeed {
    return this.homeService.getHomeFeed();
  }
}
