import { Injectable } from '@nestjs/common';

@Injectable()
export class HelloService {
  getHello(): HelloMessage {
    return { message: 'Hello from NestJS!' };
  }
}
