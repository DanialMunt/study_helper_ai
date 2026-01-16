import { Injectable } from '@nestjs/common';
import { BillingRepository } from '../billing/billing.repository';
import { McpTool } from '../../mcp/mcp-tool.interface';
import { Invoice } from 'src/invoice/entity/invoice.entity';
import { ReturnRepository } from './return.repository';
@Injectable()
export class ReturnTool {
    constructor(private readonly returnsRepo: ReturnRepository) { }

    async handle(invoiceId: number) {
        if (!invoiceId) {
            return { eligible: false, refunded: false, message: 'Missing invoiceId.' };
        }

        const returnRequest = await this.returnsRepo.findByInvoiceId(invoiceId);

        if (!returnRequest) {
            return { eligible: false, refunded: false, message: `No return request found for invoice ${invoiceId}.` };
        }

        if (!returnRequest.eligible) {
            return { eligible: false, refunded: false, message: `Invoice ${invoiceId} is not eligible for return.` };
        }

        if (returnRequest.refunded) {
            return { eligible: true, refunded: true, message: `Invoice ${invoiceId} is already refunded` };
        }

        return { eligible: true, refunded: false, message: `Invoice ${invoiceId} is eligible for return.` };


    }

}