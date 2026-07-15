import { RatingsController } from './ratings.controller';

describe('RatingsController', () => {
  it('createRating delegates with the authenticated user id', () => {
    const ratingsService = { createRating: jest.fn() };
    const controller = new RatingsController(ratingsService as never);
    const dto = { ratedUserId: 'user-2' } as never;

    void controller.createRating(dto, { user: { id: 'user-1' } } as never);

    expect(ratingsService.createRating).toHaveBeenCalledWith('user-1', dto);
  });
});
