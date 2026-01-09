import { Injectable } from '@nestjs/common';
import { Agent } from '../agent.interface';


@Injectable()
export class ReturnsAgent  {
  async handle(action: string, input: Record<string, any>) {
    if (action === 'check_return_eligibility') {
      return 'Return eligibility check completed.';
    }

    throw new Error('Unknown returns action');
  }
}
