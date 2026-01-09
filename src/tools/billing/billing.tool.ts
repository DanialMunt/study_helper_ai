import { Injectable } from '@nestjs/common';
import { BillingRepository } from './billing.repository';
import { McpTool } from '../../mcp/mcp-tool.interface';
import { Invoice } from 'src/invoice/entity/invoice.entity';
@Injectable()
export class BillingTool {
  constructor(private readonly repo: BillingRepository) {}

  async getTotalBalance(userId: number): Promise<{ total: number }> {
    const invoices = await this.repo.findByUser(userId);
    const total = invoices.reduce((sum, inv) => sum + Number(inv.amount), 0);
    return { total };
  }

  async listInvoices(userId: number): Promise<{ invoices: Invoice[] }> {
    const invoices = await this.repo.findByUser(userId);
    return { invoices };
  }

  async getInvoiceDetails(invoiceId: number): Promise<{ invoice: Invoice | null }> {
    const invoice = await this.repo.findOne(invoiceId);
    return { invoice };
  }

  async explainInvoice(invoiceId: number): Promise<{ explanation: string }> {
    const invoice = await this.repo.findOne(invoiceId);
    if (!invoice) return { explanation: 'Invoice not found' };
    return { explanation: `Invoice #${invoice.id} for €${invoice.amount} (${invoice.description ?? 'no description'})` };
  }

  async issueRefund(invoiceId: number, amount: number): Promise<{ success: boolean; refundedAmount: number }> {
    const invoice = await this.repo.findOne(invoiceId);
    if (!invoice || invoice.refunded) return { success: false, refundedAmount: 0 };
    
    
    invoice.refunded = true;
    await this.repo.save(invoice);

    return { success: true, refundedAmount: amount };
  }
}
