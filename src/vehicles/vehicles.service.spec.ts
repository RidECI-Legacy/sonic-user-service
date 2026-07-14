import { VehiclesService } from './vehicles.service';

describe('VehiclesService', () => {
  const service = new VehiclesService();

  it('create/findAll/findOne/update/remove return placeholder strings', () => {
    expect(service.create({} as never)).toBe('This action adds a new vehicle');
    expect(service.findAll()).toBe('This action returns all vehicles');
    expect(service.findOne(1)).toBe('This action returns a #1 vehicle');
    expect(service.update(1, {})).toBe('This action updates a #1 vehicle');
    expect(service.remove(1)).toBe('This action removes a #1 vehicle');
  });
});
