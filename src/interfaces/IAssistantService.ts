export interface IAssistantService {
  getAssistantResponse(topicName: string): Promise<any>;
}
