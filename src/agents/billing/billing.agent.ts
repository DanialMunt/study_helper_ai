import { Injectable } from '@nestjs/common';
import { Agent } from '../agent.interface';
import { BillingTool } from 'src/tools/billing/billing.tool';

@Injectable()
export class BillingAgent implements Agent {
  name = 'billing';
  private readonly USER_ID = 1
  constructor(private readonly billingTool: BillingTool) { }

  async handle(plan: { action: string; input: any }): Promise<string> {
    switch (plan.action) {
      case 'get_total_balance': {
        const result = await this.billingTool.getTotalBalance(this.USER_ID);
        return `Your total outstanding balance is €${result.total}`;
      }

      case 'list_invoices': {
        const { invoices } = await this.billingTool.listInvoices(this.USER_ID);
        return invoices.length
          ? `Your invoices: ${invoices.map(inv => `#${inv.id}: €${inv.amount}`).join(', ')}`
          : 'You have no invoices.';
      }

      case 'get_invoice_details': {
        const { invoice } = await this.billingTool.getInvoiceDetails(plan.input.invoiceId);
        return invoice
          ? `Invoice #${invoice.id}: €${invoice.amount} (${invoice.description ?? 'no description'})`
          : 'Invoice not found.';
      }

      case 'explain_invoice': {
        const { explanation } = await this.billingTool.explainInvoice(plan.input.invoiceId);
        return explanation;
      }

      case 'issue_refund': {
        return `Refund has been issued for order ${plan.input.orderId}`
 
      }

      default:
        throw new Error(`Unknown billing action: ${plan.action}`);
    }
  }
}

