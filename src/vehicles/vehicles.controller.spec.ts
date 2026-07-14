import { VehiclesController } from './vehicles.controller';

describe('VehiclesController', () => {
  let controller: VehiclesController;
  let vehiclesService: {
    create: jest.Mock;
    findAll: jest.Mock;
    findOne: jest.Mock;
    update: jest.Mock;
    remove: jest.Mock;
  };

  beforeEach(() => {
    vehiclesService = {
      create: jest.fn(),
      findAll: jest.fn(),
      findOne: jest.fn(),
      update: jest.fn(),
      remove: jest.fn(),
    };
    controller = new VehiclesController(vehiclesService);
  });

  it('delegates every CRUD method to vehiclesService', () => {
    controller.create({} as never);
    expect(vehiclesService.create).toHaveBeenCalled();

    controller.findAll();
    expect(vehiclesService.findAll).toHaveBeenCalled();

    controller.findOne('1');
    expect(vehiclesService.findOne).toHaveBeenCalledWith(1);

    controller.update('1', {});
    expect(vehiclesService.update).toHaveBeenCalledWith(1, {});

    controller.remove('1');
    expect(vehiclesService.remove).toHaveBeenCalledWith(1);
  });
});
