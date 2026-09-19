import { HttpException, Injectable, InternalServerErrorException, Logger, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';

import { Podcast } from './podcast.entity';
import { PodcastEpisode } from './podcast-episode.entity';
import { PodcastCategory } from './podcast-category.entity';
import {
  EpisodeData,
  PodcastCategoryData,
  PodcastDetailData,
  PodcastFeedItemData,
} from './podcast.types';
import {
  PODCASTS_CACHE_TTL_SECONDS,
  PODCASTS_CATEGORIES_CACHE_KEY,
  PODCASTS_FEED_CACHE_KEY,
  podcastDetailCacheKey,
  podcastEpisodeCacheKey,
} from '../constants/cache';
import { CommonMessages, PodcastsMessages } from '../constants/message';
import { RedisService } from '../redis/redis.service';

@Injectable()
export class PodcastsService {
  private readonly logger = new Logger(PodcastsService.name);

  constructor(
    @InjectRepository(Podcast)
    private readonly podcasts: Repository<Podcast>,
    @InjectRepository(PodcastEpisode)
    private readonly episodes: Repository<PodcastEpisode>,
    @InjectRepository(PodcastCategory)
    private readonly categories: Repository<PodcastCategory>,
    private readonly redisService: RedisService,
  ) {}

  async getCategories(): Promise<PodcastCategoryData[]> {
    try {
      const categories = await this.redisService.getOrSet(PODCASTS_CATEGORIES_CACHE_KEY, PODCASTS_CACHE_TTL_SECONDS, () =>
        this.categories.find(),
      );
      return categories.map((category) => ({ id: category.id, emoji: category.emoji, label: category.label }));
    } catch (error) {
      throw this.toHttpException(error, PodcastsMessages.loadCategoriesFailed);
    }
  }

  async getFeed(): Promise<PodcastFeedItemData[]> {
    try {
      const podcasts = await this.redisService.getOrSet(PODCASTS_FEED_CACHE_KEY, PODCASTS_CACHE_TTL_SECONDS, () =>
        this.podcasts.find(),
      );
      return podcasts.map((podcast) => this.toFeedItem(podcast));
    } catch (error) {
      throw this.toHttpException(error, PodcastsMessages.loadFeedFailed);
    }
  }

  async getPodcastDetail(id: string): Promise<PodcastDetailData> {
    try {
      const detail = await this.redisService.getOrSet(podcastDetailCacheKey(id), PODCASTS_CACHE_TTL_SECONDS, async () => {
        const podcast = await this.podcasts.findOne({ where: { id } });
        if (!podcast) {
          return null;
        }

        const [episodes, otherPodcasts] = await Promise.all([
          this.episodes.find({ where: { podcastId: id } }),
          this.podcasts.find(),
        ]);

        const episodeData: EpisodeData[] = episodes.map((episode) => this.toEpisodeData(episode));
        const similar: PodcastFeedItemData[] = otherPodcasts
          .filter((other) => other.id !== id)
          .map((other) => this.toFeedItem(other));

        const result: PodcastDetailData = {
          id: podcast.id,
          name: podcast.name,
          followers: podcast.followers,
          listeners: podcast.listeners,
          description: podcast.description,
          gradient: [podcast.gradientStart, podcast.gradientEnd],
          episodes: episodeData,
          similar,
        };
        return result;
      });

      if (!detail) {
        throw new NotFoundException(PodcastsMessages.podcastNotFound(id));
      }
      return detail;
    } catch (error) {
      throw this.toHttpException(error, PodcastsMessages.loadPodcastFailed(id));
    }
  }

  async getEpisode(podcastId: string, episodeId: string): Promise<EpisodeData> {
    try {
      const episode = await this.redisService.getOrSet(
        podcastEpisodeCacheKey(podcastId, episodeId),
        PODCASTS_CACHE_TTL_SECONDS,
        () => this.episodes.findOne({ where: { id: episodeId, podcastId } }),
      );
      if (!episode) {
        throw new NotFoundException(PodcastsMessages.episodeNotFound(episodeId, podcastId));
      }
      return this.toEpisodeData(episode);
    } catch (error) {
      throw this.toHttpException(error, PodcastsMessages.loadEpisodeFailed(episodeId, podcastId));
    }
  }

  private toFeedItem(podcast: Podcast): PodcastFeedItemData {
    return {
      id: podcast.id,
      podcastName: podcast.name,
      episodeTag: podcast.feedEpisodeTag,
      title: podcast.feedTitle,
      description: podcast.feedDescription,
      gradient: [podcast.gradientStart, podcast.gradientEnd],
    };
  }

  private toEpisodeData(episode: PodcastEpisode): EpisodeData {
    return {
      id: episode.id,
      title: episode.title,
      subtitle: episode.subtitle,
      number: episode.number,
      views: episode.views,
      daysAgo: episode.daysAgo,
      gradient: [episode.gradientStart, episode.gradientEnd],
    };
  }

  private toHttpException(error: unknown, context: string): HttpException {
    if (error instanceof HttpException) {
      return error;
    }
    this.logger.error(context, error instanceof Error ? error.stack : error);
    return new InternalServerErrorException(CommonMessages.unexpectedError);
  }
}
