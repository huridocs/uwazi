import type { AIAssistantContextPayload } from '../domain/AIAssistantTypes.js';

const formatAIAssistantMessage = (
  message: string,
  context: AIAssistantContextPayload
): string => {
  const chipLabels = context.chips
    .map(chip => chip.label)
    .filter(Boolean)
    .join(', ');
  const scope = chipLabels || context.mode;

  return `[Context: ${scope}]\n\n${message}`;
};

export { formatAIAssistantMessage };
