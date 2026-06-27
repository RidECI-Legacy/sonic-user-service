import { Injectable, Inject } from '@nestjs/common';
import { ClientProxy } from '@nestjs/microservices';

@Injectable()
export class RabbitmqService {
  constructor(
    @Inject('NOTIFICATION_SERVICE') private readonly client: ClientProxy,
  ) {}

  emitDriverVerificationPending(data: {
    profileId: string;
    userId: string;
    name: string;
    email: string;
  }) {
    return this.client.emit('driver.verification.pending', data);
  }

  emitDriverVerificationResolved(data: {
    profileId: string;
    userId: string;
    status: string;
    rejectionReason?: string;
  }) {
    return this.client.emit('driver.verification.resolved', data);
  }
}
