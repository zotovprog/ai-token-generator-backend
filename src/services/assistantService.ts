import { TextContentBlock } from "openai/resources/beta/threads/messages";
import { IAssistantService } from "../interfaces/IAssistantService";
import OpenAI from "openai";

export class OpenAIAssistantService implements IAssistantService {
  private openai: OpenAI;
  private assistantId: string;

  constructor(assistantID?: string) {
    this.openai = new OpenAI({
      apiKey: process.env.OPENAI_API_KEY || "",
    });
    this.assistantId =
      assistantID ??
      process.env.ASSISTANT_ID ??
      "asst_pSUCMxZxyR21tTt8Z3i1Gfqf";
  }

  async getAssistantResponse(topicName: string): Promise<any> {
    const thread = await this.openai.beta.threads.create();
    const threadId = thread.id;

    await this.openai.beta.threads.messages.create(threadId, {
      role: "user",
      content: topicName,
    });

    const run = await this.openai.beta.threads.runs.create(threadId, {
      assistant_id: this.assistantId,
    });

    const runId = run.id;
    const assistantResponse = await this.pollForCompletion(threadId, runId);

    return assistantResponse;
  }

  private async pollForCompletion(
    threadId: string,
    runId: string
  ): Promise<any> {
    while (true) {
      const runObject = await this.openai.beta.threads.runs.retrieve(
        threadId,
        runId
      );
      const status = runObject.status;

      if (status === "completed") {
        const messagesList = await this.openai.beta.threads.messages.list(
          threadId
        );

        const assistantMessages = messagesList.data.filter(
          (message) => message.role === "assistant"
        );
        if (assistantMessages.length > 0) {
          const assistantContent = assistantMessages[0]
            .content[0] as TextContentBlock;

          let parsedResponse;
          try {
            parsedResponse = JSON.parse(assistantContent.text.value);
          } catch (e) {
            parsedResponse = assistantContent.text.value;
          }
          return parsedResponse;
        } else {
          throw new Error("Assistant response not found.");
        }
      } else if (status === "failed") {
        throw new Error("Assistant run failed.");
      } else {
        await new Promise((resolve) => setTimeout(resolve, 2000));
      }
    }
  }
}
