import { IAssistantService } from "../interfaces/IAssistantService";
import { IMidjourneyService } from "../interfaces/IMidjourneyService";

export interface IAssistantCombinatorService {
  processTopic(
    topicName: string,
    sendUpdate: (data: any) => void
  ): Promise<void>;
}

export class AssistantCombinatorService implements IAssistantCombinatorService {
  private assistantService: IAssistantService;
  private assistantFactory: (assistantId: string) => IAssistantService;
  private midjourneyService: IMidjourneyService;

  constructor(
    assistantService: IAssistantService,
    assistantFactory: (assistantId: string) => IAssistantService,
    midjourneyService: IMidjourneyService
  ) {
    this.assistantService = assistantService;
    this.assistantFactory = assistantFactory;
    this.midjourneyService = midjourneyService;
  }

  async processTopic(
    topicName: string,
    sendUpdate: (data: any) => void
  ): Promise<void> {
    // First Assistant
    const firstAssistantResponse =
      await this.assistantService.getAssistantResponse(topicName);
    sendUpdate({ firstAssistantResponse });

    // Second Assistant
    const imagePromptCreatorAssistantId =
      process.env.IMAGE_PROMPT_CREATOR_ASSISTANT_ID;
    if (!imagePromptCreatorAssistantId) {
      throw new Error(
        "IMAGE_PROMPT_CREATOR_ASSISTANT_ID is not defined in environment variables."
      );
    }
    const imagePromptCreatorService = this.assistantFactory(
      imagePromptCreatorAssistantId
    );
    const imagePromptCreatorResponse =
      await imagePromptCreatorService.getAssistantResponse(
        JSON.stringify(firstAssistantResponse)
      );
    sendUpdate({ imagePromptCreatorResponse });

    // Third Assistant
    const imagePromptVerificatorAssistantId =
      process.env.IMAGE_PROMPT_VERIFICATOR_ASSISTANT_ID;
    if (!imagePromptVerificatorAssistantId) {
      throw new Error(
        "IMAGE_PROMPT_VERIFICATOR_ASSISTANT_ID is not defined in environment variables."
      );
    }
    const imagePromptVerificatorService = this.assistantFactory(
      imagePromptVerificatorAssistantId
    );
    const finalAssistantResponse =
      await imagePromptVerificatorService.getAssistantResponse(
        imagePromptCreatorResponse
      );
    sendUpdate({ finalAssistantResponse });

    // Midjourney Image Generation
    const onProgress = (uri: string, progress: string) => {
      sendUpdate({ midjourneyProgress: { uri, progress } });
    };

    const midjourneyResult = await this.midjourneyService.generateImages(
      finalAssistantResponse,
      onProgress
    );

    sendUpdate({ midjourneyResult });
  }
}
