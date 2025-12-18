import { Injectable } from '@nestjs/common';
import axios from 'axios';

@Injectable()
export class LlmService {
  async generate(prompt: string): Promise<string> {
    const res = await axios.post('http://localhost:11434/api/generate', {
      model: 'gemma3:12b',
      prompt,
      stream: false,
    });

    return res.data.response;
  }
}
