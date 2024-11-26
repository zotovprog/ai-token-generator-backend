import { Request, Response } from "express";
import { IAssistantService } from "../interfaces/IAssistantService";
import { IModerationService } from "../interfaces/IModerationService";
import {
  AssistantCombinatorService,
  IAssistantCombinatorService,
} from "../services/assistantCombinatorService";
import { OpenAIAssistantService } from "../services/assistantService";
import { MidjourneyService } from "../services/midjourneyService";

export class AssistantController {
  private moderationService: IModerationService;
  private assistantOrchestrator: IAssistantCombinatorService;

  constructor(
    assistantService: IAssistantService,
    moderationService: IModerationService
  ) {
    this.moderationService = moderationService;

    // Factory function to create assistant services
    const assistantFactory = (assistantId: string) =>
      new OpenAIAssistantService(assistantId);

    const midjourneyService = new MidjourneyService();

    this.assistantOrchestrator = new AssistantCombinatorService(
      assistantService,
      assistantFactory,
      midjourneyService
    );
  }

  async generateToken(req: Request, res: Response) {
    try {
      const { topicName, imageStyle } = req.body;
      const isFlagged = await this.moderationService.isContentFlagged(
        topicName
      );

      if (isFlagged) {
        res.status(400).json({ error: "Input violates policy." });
        return;
      }

      // Set up SSE headers
      res.setHeader("Content-Type", "text/event-stream");
      res.setHeader("Cache-Control", "no-cache");
      res.setHeader("Connection", "keep-alive");
      res.flushHeaders();

      // Function to send updates to the client
      const sendUpdate = (data: any) => {
        res.write(`data: ${JSON.stringify(data)}\n\n`);
      };

      // Process the topic using the orchestrator
      await this.assistantOrchestrator.processTopic(topicName, imageStyle, sendUpdate);

      // Signal the end of the SSE stream
      res.write("event: end\ndata: Stream closed\n\n");
      res.end();
    } catch (error) {
      console.error(error);
      if (error instanceof Error) {
        res.write(
          `event: error\ndata: ${JSON.stringify({ error: error.message })}\n\n`
        );
      } else {
        res.write(
          `event: error\ndata: ${JSON.stringify({
            error: "An unknown error occurred.",
          })}\n\n`
        );
      }
      res.end();
    }
  }
}
