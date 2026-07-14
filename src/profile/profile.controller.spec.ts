import { ProfileController } from './profile.controller';

describe('ProfileController', () => {
  let controller: ProfileController;
  let profileService: {
    create: jest.Mock;
    findAll: jest.Mock;
    findOne: jest.Mock;
    update: jest.Mock;
    remove: jest.Mock;
  };

  beforeEach(() => {
    profileService = {
      create: jest.fn(),
      findAll: jest.fn(),
      findOne: jest.fn(),
      update: jest.fn(),
      remove: jest.fn(),
    };
    controller = new ProfileController(profileService);
  });

  it('delegates every CRUD method to profileService', () => {
    controller.create({} as never);
    expect(profileService.create).toHaveBeenCalled();

    controller.findAll();
    expect(profileService.findAll).toHaveBeenCalled();

    controller.findOne('1');
    expect(profileService.findOne).toHaveBeenCalledWith(1);

    controller.update('1', {});
    expect(profileService.update).toHaveBeenCalledWith(1, {});

    controller.remove('1');
    expect(profileService.remove).toHaveBeenCalledWith(1);
  });
});
