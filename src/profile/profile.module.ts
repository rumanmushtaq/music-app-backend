import { Module } from '@nestjs/common';

import { UsersModule } from '../users/users.module';
import { PlansModule } from '../plans/plans.module';
import { ProfileController } from './profile.controller';
import { ProfileService } from './profile.service';

@Module({
  imports: [UsersModule, PlansModule],
  controllers: [ProfileController],
  providers: [ProfileService],
})
export class ProfileModule {}
