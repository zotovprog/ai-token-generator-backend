import { Midjourney, MJMessage } from "midjourney";
import { IMidjourneyService } from "../interfaces/IMidjourneyService";

export class MidjourneyService implements IMidjourneyService {
  private client: Midjourney;

  constructor() {
    const salaiToken = process.env.MIDJOURNEY_SALAI_TOKEN || "";
    const serverId = process.env.MIDJOURNEY_SERVER_ID || "";
    const channelId = process.env.MIDJOURNEY_CHANNEL_ID || "";

    if (!salaiToken || !serverId || !channelId) {
      throw new Error(
        "Midjourney configuration variables are not set properly."
      );
    }

    this.client = new Midjourney({
      SalaiToken: salaiToken,
      ServerId: serverId,
      ChannelId: channelId,
      Ws: true,
    });
  }

  async generateImages(
    prompt: string,
    onProgress: (uri: string, progress: string) => void
  ): Promise<MJMessage | null> {
    await this.client.init();
    const result = await this.client.Imagine(prompt, onProgress);
    return result;
  }
}
