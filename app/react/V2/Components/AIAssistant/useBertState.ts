import { useBertContext } from './useBertContext.js';
import { useBertConversation } from './useBertConversation.js';
import type { ReplyScenario } from './useMockBertReplies.js';
import type { ChatMessage, ContextChip } from './types.js';

type UseBertStateOptions = {
  open: boolean;
  initialMessages?: ChatMessage[];
  initialContextChips?: ContextChip[];
  mockReplies?: boolean;
  replyScenario?: ReplyScenario;
};

const useBertState = ({
  open,
  initialMessages = [],
  initialContextChips = [],
  mockReplies = false,
  replyScenario = 'normal',
}: UseBertStateOptions) => {
  const context = useBertContext({ initialContextChips });
  const conversation = useBertConversation({
    open,
    mockReplies,
    replyScenario,
    initialMessages,
    contextChips: context.contextChips,
  });

  return {
    ...conversation,
    contextMode: context.contextMode,
    contextModeLabel: context.contextModeLabel,
    contextChips: context.contextChips,
    contextSummary: context.contextSummary,
    setContextMode: context.setContextMode,
    removeContextChip: context.removeContextChip,
    addContextOption: context.addContextOption,
  };
};

export { useBertState };
export type { ReplyScenario, UseBertStateOptions };
