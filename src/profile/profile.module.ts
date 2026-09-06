import { Module } from '@nestjs/common';

import { UsersModule } from '../users/users.module';
import { PlansModule } from '../plans/plans.module';
import { ProfileController } from './profile.controller';

@Module({
  imports: [UsersModule, PlansModule],
  controllers: [ProfileController],
})
export class ProfileModule {}
