import type { ChatMessage, ContextChip } from './types.js';

const STORY_CONTEXT_CHIPS: ContextChip[] = [
  {
    id: 'library',
    label: 'View Library',
    kind: 'link',
    removable: false,
  },
  {
    id: 'document',
    label: 'Document: Velásquez-Rodríguez v. Honduras',
    kind: 'document',
    removable: true,
  },
];

const STORY_BERT_MESSAGES: ChatMessage[] = [];

export { STORY_BERT_MESSAGES, STORY_CONTEXT_CHIPS };
