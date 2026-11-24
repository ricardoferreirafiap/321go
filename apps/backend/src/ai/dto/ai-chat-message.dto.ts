import { IsDefined, IsIn } from 'class-validator';

export class AiChatMessageDto {
  @IsIn(['user', 'assistant'])
  role: 'user' | 'assistant';

  @IsDefined()
  content: unknown;
}

