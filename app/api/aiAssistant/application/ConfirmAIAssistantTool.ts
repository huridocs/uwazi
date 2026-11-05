import { AbstractUseCase } from '#api/core/libs/UseCase.js';
import type { ConfirmationDecision, ConfirmationGate } from './runtime/ConfirmationGate.js';

type Input = {
  jobId: string;
  toolCallId: string;
  decision: ConfirmationDecision;
  sessionId?: string;
};

type Output = { ok: true };

type Dependencies = {
  confirmationGate: ConfirmationGate;
};

class ConfirmAIAssistantTool extends AbstractUseCase<Input, Output, Dependencies> {
  async execute(input: Input): Promise<Output> {
    this.deps.confirmationGate.resolve(input);
    return { ok: true };
  }
}

export { ConfirmAIAssistantTool };
export type { Input as ConfirmAIAssistantToolInput };
