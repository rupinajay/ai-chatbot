export const DEFAULT_CHAT_MODEL: string = 'chat-model';

export interface ChatModel {
  id: string;
  name: string;
  description: string;
}

export const chatModels: Array<ChatModel> = [
  {
    id: 'chat-model',
    name: 'Llama 3.1 8B',
    description: 'Fast and efficient model for general conversations',
  },
  {
    id: 'chat-model-reasoning',
    name: 'Llama 3.1 70B',
    description: 'Larger model with enhanced reasoning capabilities',
  },
];
