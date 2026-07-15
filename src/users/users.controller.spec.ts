import { ForbiddenException } from '@nestjs/common';
import { UsersController } from './users.controller';

describe('UsersController', () => {
  let controller: UsersController;
  let usersService: {
    verifyRequest: jest.Mock;
    getProfile: jest.Mock;
    updateProfile: jest.Mock;
  };
  let ratingsService: { getTripsHistory: jest.Mock };

  beforeEach(() => {
    usersService = {
      verifyRequest: jest.fn(),
      getProfile: jest.fn(),
      updateProfile: jest.fn(),
    };
    ratingsService = { getTripsHistory: jest.fn() };
    controller = new UsersController(
      usersService as never,
      ratingsService as never,
    );
  });

  it('verifyRequest delegates with the authenticated user id', () => {
    void controller.verifyRequest({}, 'vehicle-1', {
      user: { id: 'user-1' },
    } as never);
    expect(usersService.verifyRequest).toHaveBeenCalledWith(
      'user-1',
      'vehicle-1',
      {},
    );
  });

  it('getProfile delegates with the target id and the authenticated requester id', () => {
    void controller.getProfile('user-1', { user: { id: 'user-2' } } as never);
    expect(usersService.getProfile).toHaveBeenCalledWith('user-1', 'user-2');
  });

  describe('updateProfile ownership', () => {
    it('throws ForbiddenException when there is no authenticated user', () => {
      expect(() =>
        controller.updateProfile('user-1', {}, undefined, {
          user: undefined,
        } as never),
      ).toThrow(ForbiddenException);
    });

    it('throws ForbiddenException when the token user does not match the param id', () => {
      expect(() =>
        controller.updateProfile('user-1', {}, undefined, {
          user: { id: 'someone-else' },
        } as never),
      ).toThrow(ForbiddenException);
    });

    it('delegates when the authenticated user matches the param id', () => {
      void controller.updateProfile('user-1', { name: 'x' }, undefined, {
        user: { id: 'user-1' },
      } as never);
      expect(usersService.updateProfile).toHaveBeenCalledWith(
        'user-1',
        { name: 'x' },
        undefined,
      );
    });
  });

  describe('getTripsHistory ownership', () => {
    it('throws ForbiddenException when the token user does not match the param id', () => {
      expect(() =>
        controller.getTripsHistory('user-1', {}, {
          user: { id: 'someone-else' },
        } as never),
      ).toThrow(ForbiddenException);
    });

    it('delegates to ratingsService when ownership matches', () => {
      void controller.getTripsHistory('user-1', { page: 1 }, {
        user: { id: 'user-1' },
      } as never);
      expect(ratingsService.getTripsHistory).toHaveBeenCalledWith('user-1', {
        page: 1,
      });
    });
  });
});
