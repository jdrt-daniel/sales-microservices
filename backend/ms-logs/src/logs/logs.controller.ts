import { Controller, DefaultValuePipe, Get, ParseIntPipe, Query } from '@nestjs/common';
import { Ctx, EventPattern, KafkaContext, Payload } from '@nestjs/microservices';
import { LogsService } from './logs.service';
import { AccessLogPayload } from './dto/access-log.dto';

@Controller('logs')
export class LogsController {
  constructor(private readonly logsService: LogsService) {}

  @EventPattern('gateway.access.logs')
  handleAccessLog(
    @Payload() payload: AccessLogPayload,
    @Ctx() _context: KafkaContext,
  ): Promise<void> {
    return this.logsService.save(payload);
  }

  @Get()
  findAll(
    @Query('limit', new DefaultValuePipe(50), ParseIntPipe) limit: number,
    @Query('offset', new DefaultValuePipe(0), ParseIntPipe) offset: number,
  ): Promise<unknown[]> {
    return this.logsService.findAll(Math.min(limit, 200), Math.max(offset, 0));
  }
}