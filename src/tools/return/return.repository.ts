import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Invoice } from 'src/invoice/entity/invoice.entity';

@Injectable()
export class ReturnRepository {
    constructor(
        @InjectRepository(Invoice)
        private readonly repo: Repository<Invoice>) { }

    async findByInvoiceId(invoiceId: number): Promise<Invoice | null> {
        return this.repo.findOne({
            where: { id: invoiceId },
        });
    }

}