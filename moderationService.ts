import { IModerationService } from "./src/interfaces/IModerationService";
import OpenAI from "openai";

export class OpenAIModerationService implements IModerationService {
  private openai: OpenAI;

  constructor() {
    this.openai = new OpenAI({
      apiKey: process.env.OPENAI_API_KEY || "",
    });
  }

  async isContentFlagged(content: string): Promise<boolean> {
    const moderation = await this.openai.moderations.create({
      model: "omni-moderation-latest",
      input: content,
    });

    const isFlagged = moderation.results[0].flagged;
    return isFlagged;
  }
}
