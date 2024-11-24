export interface IModerationService {
  isContentFlagged(content: string): Promise<boolean>;
}
