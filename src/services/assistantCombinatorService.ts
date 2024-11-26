import { IAssistantService } from "../interfaces/IAssistantService";
import { IMidjourneyService } from "../interfaces/IMidjourneyService";

export interface IAssistantCombinatorService {
  processTopic(
    topicName: string,
    imageStyle: string,
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
    imageStyle: string,
    sendUpdate: (data: any) => void
  ): Promise<void> {
    const firstAssistantResponse =
      await this.assistantService.getAssistantResponse(topicName);
    sendUpdate({ firstAssistantResponse });

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
        JSON.stringify({ firstAssistantResponse, imageStyle })
      );
    sendUpdate({ imagePromptCreatorResponse });

    const onProgress = (uri: string, progress: string) => {
      sendUpdate({ midjourneyProgress: { uri, progress } });
    };

    const midjourneyResult = await this.midjourneyService.generateImages(
      imagePromptCreatorResponse,
      onProgress
    );

    sendUpdate({ midjourneyResult });
  }
}
