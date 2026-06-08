type AIAssistantRequestStatus = 'pending' | 'completed' | 'error';

type AIAssistantContextChip = {
  id: string;
  label: string;
  kind: string;
};

type AIAssistantContextPayload = {
  mode: 'auto' | 'this-document';
  chips: AIAssistantContextChip[];
};

type UwaziCredentials = {
  url: string;
  username: string;
  password: string;
};

type SubmitMessageInput = {
  message: string;
  credentials: UwaziCredentials;
};

type SubmitMessageOutput = {
  jobId: string;
};

type PollResult =
  | { status: 'pending' }
  | { status: 'completed'; message: string }
  | { status: 'error'; error: string };

export type {
  AIAssistantContextChip,
  AIAssistantContextPayload,
  AIAssistantRequestStatus,
  PollResult,
  SubmitMessageInput,
  SubmitMessageOutput,
  UwaziCredentials,
};
