import { Request, Response } from "express";
import { IAssistantService } from "../interfaces/IAssistantService";
import { IModerationService } from "../interfaces/IModerationService";

export class AssistantController {
  private assistantService: IAssistantService;
  private moderationService: IModerationService;

  constructor(
    assistantService: IAssistantService,
    moderationService: IModerationService
  ) {
    this.assistantService = assistantService;
    this.moderationService = moderationService;
  }

  async generateToken(req: Request, res: Response) {
    try {
      const { topicName } = req.body;
      const isFlagged = await this.moderationService.isContentFlagged(
        topicName
      );

      if (isFlagged) {
        res.status(400).json({ error: "Input violates policy." });
      } else {
        const assistantResponse =
          await this.assistantService.getAssistantResponse(topicName);

        res.json(assistantResponse);
      }
    } catch (error) {
      console.error(error);
      res.status(500).json({ error: "Internal server error." });
    }
  }
}
