import type { Express } from "express";
import { Controller, Post, Body } from '@nestjs/common';
import { OrchestratorAgent } from '../orchestrator/orchestrator.agent';
import { UploadedFile, UseInterceptors } from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { OcrService } from 'src/ocr/ocr.service';
@Controller('chat')
export class ChatController {
  constructor(private readonly orchestrator: OrchestratorAgent,
    private readonly ocr: OcrService
  ) {}

  @Post()
 async chat(@Body("message") message: string, @Body("sessionId") sessionId?: string) {
  const reply = await this.orchestrator.handle(message, sessionId);
    return { reply };
  }


  @Post("ocr")
  @UseInterceptors(FileInterceptor("file"))
  async chatOcr(
    @UploadedFile() file: Express.Multer.File,
    @Body("sessionId") sessionId?: string,
  ) {
    if (!file?.buffer) {
      return { reply: "No file uploaded." };
    }

    const { text, extracted } = await this.ocr.process(file.buffer);

    // Choose one: auto-run refund flow if we found orderId
    if (extracted.orderId) {
      // 1) start refund
      const first = await this.orchestrator.handle("I want a refund", sessionId);
      const sid = first.sessionId;

      // 2) provide orderId
      const second = await this.orchestrator.handle(String(extracted.orderId), sid);

      // 3) provide email if we found it; otherwise user will be asked
      if (extracted.email) {
        const third = await this.orchestrator.handle(extracted.email, sid);
        return { sessionId: sid, reply: third.reply, extracted, ocrText: text };
      }

      return { sessionId: sid, reply: second.reply, extracted, ocrText: text };
    }

    // If we couldn’t find orderId, return OCR text and ask user
    return {
      sessionId,
      reply: "I read the document but couldn't confidently find an order/invoice ID. Please tell me the orderId.",
      extracted,
      ocrText: text,
    };
  }
}
