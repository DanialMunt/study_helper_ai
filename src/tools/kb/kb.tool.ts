import { Injectable } from "@nestjs/common";
import * as fs from "node:fs/promises";
import * as path from "node:path";

type KbArticle = {
  id: string;
  title: string;
  tags: string[];
  content: string;
};

@Injectable()
export class KbTool {
  private readonly kbPath = path.join(
  process.cwd(),
  "assets",
  "kb.json",
);


  async search(query: string, limit = 3): Promise<{ results: KbArticle[] }> {
    const raw = await fs.readFile(this.kbPath, "utf8");
    const data = JSON.parse(raw) as KbArticle[];

    const q = query.toLowerCase().trim();
    const tokens = q.split(/\s+/).filter(Boolean);

    const scored = data
      .map((a) => {
        const hay = `${a.title} ${a.tags.join(" ")} ${a.content}`.toLowerCase();
        let score = 0;

        if (hay.includes(q)) score += 5;

   
        for (const t of tokens) {
          if (hay.includes(t)) score += 1;
        }

        
        for (const tag of a.tags) {
          if (tokens.includes(tag.toLowerCase())) score += 2;
        }

        return { a, score };
      })
      .filter((x) => x.score > 0)
      .sort((x, y) => y.score - x.score)
      .slice(0, limit)
      .map((x) => x.a);

    return { results: scored };
  }
}
