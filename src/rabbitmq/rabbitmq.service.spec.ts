import { RabbitmqService } from './rabbitmq.service';

describe('RabbitmqService', () => {
  let service: RabbitmqService;
  let client: { emit: jest.Mock };

  beforeEach(() => {
    client = { emit: jest.fn() };
    service = new RabbitmqService(client as never);
  });

  it('emitDriverVerificationPending emits the correct pattern and payload', () => {
    const data = {
      profileId: 'p1',
      userId: 'u1',
      name: 'Juan',
      email: 'a@b.com',
    };
    service.emitDriverVerificationPending(data);
    expect(client.emit).toHaveBeenCalledWith(
      'driver.verification.pending',
      data,
    );
  });

  it('emitDriverVerificationResolved emits the correct pattern and payload', () => {
    const data = {
      profileId: 'p1',
      userId: 'u1',
      status: 'VERIFIED',
    };
    service.emitDriverVerificationResolved(data);
    expect(client.emit).toHaveBeenCalledWith(
      'driver.verification.resolved',
      data,
    );
  });
});
