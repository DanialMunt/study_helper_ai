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

  async findByUser(userId: number) {
    return this.repo.find({
      where: {
        user: { id: userId },
      },
      relations: ['user'], 
    });
  }

  async findOne(invoiceId: number): Promise<Invoice | null> {
    return this.repo.findOne({
      where: { id: invoiceId },
      relations: ['user'], 
    });
  }


  

   async findByInvoiceId(invoiceId: number): Promise<Invoice | null> {
        return this.repo.findOne({
            where: { id: invoiceId },
        });
    }


   async save(invoice: Invoice): Promise<Invoice> {
    return this.repo.save(invoice);
  }

  async findUnrefundedByUser(userId: number): Promise<Invoice[]> {
    return this.repo.find({
      where: { user: { id: userId }, refunded: false },
      order: { id: 'ASC' },
    });
  }


}

