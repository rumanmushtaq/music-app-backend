import { BadRequestException, Body, Controller, Post, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiBody, ApiOperation, ApiTags } from '@nestjs/swagger';

import { AuthClaims, ClerkAuthGuard } from '../auth/clerk-auth.guard';
import { CurrentAuth } from '../auth/current-auth.decorator';
import { PlaysMessages } from '../constants/message';
import { PlaysService } from './plays.service';

type RecordPlayBody = { songId?: string };

@ApiTags('Plays')
@ApiBearerAuth('clerk-token')
@Controller('api/plays')
@UseGuards(ClerkAuthGuard)
export class PlaysController {
  constructor(private readonly playsService: PlaysService) {}

  @Post()
  @ApiOperation({
    summary: 'Record a song play',
    description: 'Call once each time the authenticated user starts playing a song. Feeds the admin dashboard metrics.',
  })
  @ApiBody({
    schema: { type: 'object', required: ['songId'], properties: { songId: { type: 'string', example: 'edm-house' } } },
  })
  async recordPlay(@CurrentAuth() auth: AuthClaims, @Body() body: RecordPlayBody) {
    const songId = typeof body?.songId === 'string' ? body.songId.trim() : '';
    if (!songId) {
      throw new BadRequestException(PlaysMessages.songIdRequired);
    }
    const play = await this.playsService.recordPlay(auth, songId);
    return { id: play.id, songId: play.songId, playedAt: play.playedAt };
  }
}
