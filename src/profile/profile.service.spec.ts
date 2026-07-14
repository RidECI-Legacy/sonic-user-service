import { ProfileService } from './profile.service';

describe('ProfileService', () => {
  const service = new ProfileService();

  it('create/findAll/findOne/update/remove return placeholder strings', () => {
    expect(service.create({} as never)).toBe('This action adds a new profile');
    expect(service.findAll()).toBe('This action returns all profile');
    expect(service.findOne(1)).toBe('This action returns a #1 profile');
    expect(service.update(1, {})).toBe('This action updates a #1 profile');
    expect(service.remove(1)).toBe('This action removes a #1 profile');
  });
});
