import type { AIAssistantContextPayload } from './contracts/AIAssistantContracts.js';

const formatAIAssistantMessage = (message: string, context: AIAssistantContextPayload): string => {
  const chipLabels = context.chips
    .map(chip => chip.label)
    .filter(Boolean)
    .join(', ');

  if (!chipLabels) {
    return message;
  }

  return `[Context: ${chipLabels}]\n\n${message}`;
};

export { formatAIAssistantMessage };
