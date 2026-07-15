import { VehiclesController } from './vehicles.controller';

describe('VehiclesController', () => {
  let controller: VehiclesController;
  let vehiclesService: {
    create: jest.Mock;
    findMyVehicles: jest.Mock;
  };

  beforeEach(() => {
    vehiclesService = {
      create: jest.fn(),
      findMyVehicles: jest.fn(),
    };
    controller = new VehiclesController(vehiclesService as never);
  });

  it('create delegates with the authenticated user id', () => {
    const dto = { plate: 'ABC-123' } as never;

    void controller.create(dto, { user: { id: 'user-1' } } as never);

    expect(vehiclesService.create).toHaveBeenCalledWith('user-1', dto);
  });

  it('findMyVehicles delegates with the authenticated user id', () => {
    void controller.findMyVehicles({ user: { id: 'user-1' } } as never);

    expect(vehiclesService.findMyVehicles).toHaveBeenCalledWith('user-1');
  });
});
