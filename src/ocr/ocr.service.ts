import { Injectable } from "@nestjs/common";
import * as Tesseract from "tesseract.js";
import sharp from "sharp";

@Injectable()
export class OcrService {
  async process(imageBuffer: Buffer): Promise<{
    text: string;
    extracted: { orderId?: number; email?: string };
  }> {
    
    const preprocessed = await sharp(imageBuffer)
      .grayscale()
      .normalize()
      .resize({ width: 1400, withoutEnlargement: true })
      .toBuffer();

    const res = await Tesseract.recognize(preprocessed, "eng", {
      logger: () => {}, 
    });

    const text = res.data.text || "";
    const extracted = this.extract(text);

    return { text, extracted };
  }

  private extract(text: string): { orderId?: number; email?: string } {
    const t = text.replace(/\s+/g, " ").trim();

   
    const idMatch =
      /(?:invoice|order)\s*(?:id|no|#|number)?\s*[:#]?\s*(\d{1,10})/i.exec(t) ||
      /\b(\d{5,10})\b/.exec(t); 

    const emailMatch = /\b[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}\b/i.exec(t);

    const orderId = idMatch ? Number(idMatch[1]) : undefined;
    const email = emailMatch ? emailMatch[0] : undefined;

    return {
      ...(orderId && !Number.isNaN(orderId) ? { orderId } : {}),
      ...(email ? { email } : {}),
    };
  }
}
