import { Repository } from 'typeorm';
import { PodcastsService } from './podcasts.service';
import { Test } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Podcast } from './entities/podcast.entity';
import { Episode } from './entities/episode.entity';

const mockRepository = () => ({
  findOne: jest.fn(),
  find: jest.fn(),
  save: jest.fn(),
  create: jest.fn(),
  findOneOrFail: jest.fn(),
  delete: jest.fn(),
});
const podcastId = 1;
const episodeId = 1;
const mismatchedId = 999;
// 모의 데이터

const mockPodcast = {
  id: podcastId,
  createdAt: new Date(),
  updatedAt: new Date(),
  title: 'Podcast 1',
  category: 'a',
  rating: 1,
  episodes: [
    {
      id: episodeId,
      createdAt: new Date(),
      updatedAt: new Date(),
      title: 'title',
      category: 'category',
      podcast: {
        id: podcastId,
        createdAt: new Date(),
        updatedAt: new Date(),
        title: 'Podcast 1',
        category: 'a',
        rating: 1,
        episodes: [],
      },
    },
  ],
};
const mockPodcastPayload = {
  title: 'Podcast 1',
  category: 'a',
  rating: 1,
};
const mockPodcasts = [{ ...mockPodcast }, { ...mockPodcast }];
const InternalServerErrorOutput = {
  ok: false,
  error: 'Internal server error occurred.',
};
const foundPodcast = {
  ok: true,
  podcast: mockPodcast,
};

// const mockPodcastService = () => ({
//   getPodcast: jest.fn(),
// });
// const mockEpisodesService = () => ({
//   getEpisodes: jest.fn(),
// });

type MockRepository<T = any> = Partial<Record<keyof Repository<T>, jest.Mock>>;

describe('PodcastService', () => {
  let service: PodcastsService;
  let podCastRepository: MockRepository<Podcast>;
  let episodeRepository: MockRepository<Episode>;
  beforeEach(async () => {
    const module = await Test.createTestingModule({
      providers: [
        PodcastsService,
        {
          provide: getRepositoryToken(Podcast),
          useValue: mockRepository(),
        },
        {
          provide: getRepositoryToken(Episode),
          useValue: mockRepository(),
        },
      ],
    }).compile();
    service = module.get<PodcastsService>(PodcastsService);
    podCastRepository = module.get(getRepositoryToken(Podcast));
    episodeRepository = module.get(getRepositoryToken(Episode));
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('getAllPodcasts', () => {
    it('should return all podcasts', async () => {
      podCastRepository.find.mockResolvedValue(mockPodcasts);
      const result = await service.getAllPodcasts();
      expect(podCastRepository.find).toHaveBeenCalledTimes(1);
      expect(podCastRepository.find).toHaveBeenCalledWith();
      expect(result).toEqual({ ok: true, podcasts: mockPodcasts });
    });
    it('should fail on exception', async () => {
      podCastRepository.find.mockRejectedValue(new Error());
      const result = await service.getAllPodcasts();
      expect(podCastRepository.find).toHaveBeenCalledTimes(1);
      expect(podCastRepository.find).toHaveBeenCalledWith();
      expect(result).toEqual(InternalServerErrorOutput);
    });
  });

  describe('createPodcast', () => {
    const createPodcastArgs = { title: '', category: '' };

    it('should create a new podcast', async () => {
      podCastRepository.create.mockReturnValue(mockPodcast);
      podCastRepository.save.mockResolvedValue(mockPodcast);
      const result = await service.createPodcast(createPodcastArgs);
      expect(podCastRepository.create).toHaveBeenCalledTimes(1);
      expect(podCastRepository.create).toHaveBeenCalledWith(createPodcastArgs);
      expect(podCastRepository.save).toHaveBeenCalledTimes(1);
      expect(podCastRepository.save).toHaveBeenCalledWith(mockPodcast);
      expect(result).toEqual({ ok: true, id: 1 });
    });

    it('should fail on exception', async () => {
      podCastRepository.findOne.mockRejectedValue(new Error());
      const result = await service.createPodcast(createPodcastArgs);
      expect(result).toEqual(InternalServerErrorOutput);
    });
  });

  describe('getPodcast', () => {
    it('should fail if podcast not exist', async () => {
      podCastRepository.findOne.mockResolvedValue(null);
      const result = await service.getPodcast(podcastId);
      expect(result).toEqual({
        ok: false,
        error: `Podcast with id ${podcastId} not found`,
      });
    });

    it('should find an existing podcast', async () => {
      podCastRepository.findOne.mockResolvedValue(mockPodcast);
      const result = await service.getPodcast(podcastId);
      expect(result).toEqual(foundPodcast);
    });

    it('should fail on exception', async () => {
      podCastRepository.findOne.mockRejectedValue(new Error());
      const result = await service.getPodcast(podcastId);
      expect(result).toEqual(InternalServerErrorOutput);
    });
  });

  describe('deletePodcast', () => {
    it('should fail if podcast not exist', async () => {
      podCastRepository.findOne.mockResolvedValue(null);
      const result = await service.deletePodcast(podcastId);
      expect(result).toEqual({
        ok: false,
        error: `Podcast with id ${podcastId} not found`,
      });
    });

    it('should delete a podcast', async () => {
      podCastRepository.findOne.mockResolvedValue(foundPodcast);
      const result = await service.deletePodcast(podcastId);
      expect(result).toEqual({ ok: true });
    });

    it('should fail on exception', async () => {
      podCastRepository.findOne.mockResolvedValue(new Error());
      podCastRepository.delete.mockRejectedValue(new Error());
      const result = await service.deletePodcast(podcastId);
      expect(result).toEqual(InternalServerErrorOutput);
    });
  });

  describe('updatePodcast', () => {
    it('should fail if podcast not exist', async () => {
      podCastRepository.findOne.mockResolvedValue(null);
      const result = await service.updatePodcast({
        id: podcastId,
        payload: mockPodcastPayload,
      });
      expect(result).toEqual({
        ok: false,
        error: `Podcast with id ${podcastId} not found`,
      });
    });
    const RatingError = {
      ok: false,
      error: 'Rating must be between 1 and 5.',
    };
    it('should return error if rating is less than 1', async () => {
      podCastRepository.findOne.mockResolvedValue(mockPodcast);
      const result = await service.updatePodcast({
        id: podcastId,
        payload: { ...mockPodcastPayload, rating: 0 },
      });
      expect(result).toEqual(RatingError);
    });

    it('should return error if rating is greater than 5', async () => {
      podCastRepository.findOne.mockResolvedValue(mockPodcast);
      const result = await service.updatePodcast({
        id: podcastId,
        payload: { ...mockPodcastPayload, rating: 6 },
      });
      expect(result).toEqual(RatingError);
    });

    it('should be updated to podcast', async () => {
      podCastRepository.findOne.mockResolvedValue(mockPodcast);

      const result = await service.updatePodcast({
        id: podcastId,
        payload: mockPodcastPayload,
      });
      expect(podCastRepository.save).toHaveBeenCalledTimes(1);
      expect(podCastRepository.save).toHaveBeenCalledWith(mockPodcast);
      expect(result).toEqual({ ok: true });
    });

    it('should fail on exception', async () => {
      podCastRepository.findOne.mockResolvedValue(new Error());
      podCastRepository.save.mockRejectedValue(new Error());
      const result = await service.updatePodcast({
        id: podcastId,
        payload: mockPodcastPayload,
      });
      expect(result).toEqual(InternalServerErrorOutput);
    });
  });

  describe('getEpisodes', () => {
    it('should fail if podcast exist', async () => {
      jest
        .spyOn(service, 'getPodcast')
        .mockResolvedValue({ ok: false, error: 'Podcast Not Found' });
      const result = await service.getEpisodes(1);
      expect(result).toEqual({ ok: false, error: 'Podcast Not Found' });
    });

    it('should return all episodes', async () => {
      jest
        .spyOn(service, 'getPodcast')
        .mockResolvedValue({ podcast: mockPodcast, ok: true, error: null });
      const result = await service.getEpisodes(1);
      expect(result).toEqual({
        ok: true,
        episodes: mockPodcast.episodes,
      });
    });

    it('should return error on exception', async () => {
      jest.spyOn(service, 'getPodcast').mockRejectedValue(new Error());
      const result = await service.getEpisodes(1);
      expect(result).toEqual(InternalServerErrorOutput);
    });
  });
  describe('getEpisode', () => {
    it('should return error if podcast is not found', async () => {
      jest.spyOn(service, 'getEpisodes').mockResolvedValue({
        episodes: null,
        ok: false,
        error: `Podcast with id ${podcastId} not found`,
      });
      const result = await service.getEpisode({ podcastId, episodeId });
      expect(result).toEqual({
        ok: false,
        error: `Podcast with id ${podcastId} not found`,
      });
    });

    it('should return error if episode is not found', async () => {
      jest.spyOn(service, 'getEpisodes').mockResolvedValue({
        ok: true,
        episodes: mockPodcast.episodes,
      });
      const result = await service.getEpisode({
        podcastId,
        episodeId: mismatchedId,
      });
      expect(result).toEqual({
        ok: false,
        error: `Episode with id ${mismatchedId} not found in podcast with id ${podcastId}`,
      });
    });

    it('should return an episode if found', async () => {
      jest.spyOn(service, 'getEpisodes').mockResolvedValue({
        ok: true,
        episodes: mockPodcast.episodes,
      });
      const result = await service.getEpisode({ podcastId, episodeId });
      expect(result).toEqual({ ok: true, episode: mockPodcast.episodes[0] });
    });

    it('should return internal server error on exception', async () => {
      jest.spyOn(service, 'getEpisodes').mockRejectedValue(new Error());
      const result = await service.getEpisode({ podcastId, episodeId });
      expect(result).toEqual(InternalServerErrorOutput);
    });
  });

  describe('createEpisode', () => {
    const input = {
      podcastId,
      title: 'abc',
      category: 'def',
    };
    it('should return error if podcast is not found', async () => {
      jest.spyOn(service, 'getPodcast').mockResolvedValue({
        ok: false,
        error: `Podcast with id ${podcastId} not found`,
      });
      const result = await service.createEpisode(input);
      expect(result).toEqual({
        ok: false,
        error: `Podcast with id ${podcastId} not found`,
      });
    });

    it('should create a new podcast', async () => {
      jest.spyOn(service, 'getPodcast').mockResolvedValue({
        ok: true,
        podcast: mockPodcast,
      });

      episodeRepository.create.mockReturnValue(mockPodcast.episodes[0]);
      episodeRepository.save.mockResolvedValue({ id: 1 });

      const result = await service.createEpisode(input);
      expect(result).toEqual({
        ok: true,
        id: 1,
      });
    });

    it('should return internal server error on exception', async () => {
      jest.spyOn(service, 'getPodcast').mockResolvedValue({
        ok: true,
        podcast: mockPodcast,
      });
      episodeRepository.save.mockRejectedValue(new Error());
      const result = await service.createEpisode(input);
      expect(result).toEqual(InternalServerErrorOutput);
    });
  });
  describe('deleteEpisode', () => {
    const input = {
      podcastId,
      episodeId,
    };
    it('should return error if episode is not found', async () => {
      jest.spyOn(service, 'getEpisode').mockResolvedValue({
        ok: false,
        error: `episode with id ${episodeId} not found`,
      });
      const result = await service.deleteEpisode(input);
      expect(result).toEqual({
        ok: false,
        error: `episode with id ${episodeId} not found`,
      });
    });

    it('should delete an episode', async () => {
      jest.spyOn(service, 'getEpisode').mockResolvedValue({
        ok: true,
        episode: mockPodcast.episodes[0],
      });
      const result = await service.deleteEpisode(input);
      expect(result).toEqual({ ok: true });
    });

    it('should return internal server error on exception', async () => {
      jest.spyOn(service, 'getEpisode').mockResolvedValue({
        ok: true,
        episode: mockPodcast.episodes[0],
      });
      episodeRepository.delete.mockRejectedValue(new Error());
      const result = await service.deleteEpisode(input);
      expect(result).toEqual(InternalServerErrorOutput);
    });
  });

  describe('updateEpisode', () => {
    const input = { podcastId, episodeId, title: 'abc', category: 'def' };
    it('should return if podcast is not found', async () => {
      jest.spyOn(service, 'getEpisode').mockResolvedValue({
        ok: false,
        error: `episode with id ${episodeId} not found`,
      });
      const result = await service.updateEpisode(input);
      expect(result).toEqual({
        ok: false,
        error: `episode with id ${episodeId} not found`,
      });
    });

    it('should return if podcast is not found', async () => {
      jest
        .spyOn(service, 'getEpisode')
        .mockResolvedValue({ ok: true, episode: mockPodcast.episodes[0] });
      const result = await service.updateEpisode(input);
      episodeRepository.save.mockResolvedValue({ ok: true });
      expect(result).toEqual({ ok: true });
    });

    it('should return internal server error on exception', async () => {
      jest.spyOn(service, 'getEpisode').mockResolvedValue({
        ok: true,
        episode: mockPodcast.episodes[0],
      });
      episodeRepository.save.mockRejectedValue(new Error());
      const result = await service.updateEpisode(input);
      expect(result).toEqual(InternalServerErrorOutput);
    });
  });
});
