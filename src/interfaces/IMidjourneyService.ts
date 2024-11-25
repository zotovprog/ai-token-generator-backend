import { MJMessage } from "midjourney";

export interface IMidjourneyService {
  generateImages(
    prompt: string,
    onProgress: (uri: string, progress: string) => void
  ): Promise<MJMessage | null>;
}
