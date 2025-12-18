import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Invoice } from 'src/invoice/entity/invoice.entity';

@Injectable()
export class BillingRepository {
  constructor(
    @InjectRepository(Invoice)
    private readonly repo: Repository<Invoice>,
  ) {}

  findByUser(userId: number) {
    return this.repo.find({
      where: {
        user: { id: userId },
      },
      relations: ['user'], 
    });
  }
}

