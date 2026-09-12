import { Controller } from '@nestjs/common';
import { GrpcMethod } from '@nestjs/microservices';
import { ClientsService } from './clients.service';

@Controller()
export class ClientsGrpcController {
  constructor(private readonly clientsService: ClientsService) {}

  @GrpcMethod('UsersGrpcService', 'ValidateClient')
  async validateClient(data: { id: string }) {
    try {
      const client = await this.clientsService.findOne(data.id);
      return { id: client.id, fullName: client.fullName, exists: true };
    } catch {
      return { id: data.id, fullName: '', exists: false };
    }
  }
}
