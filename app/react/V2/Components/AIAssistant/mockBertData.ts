import type { ChatMessage, ContextChip } from './types.js';

const DEFAULT_CONTEXT_CHIPS: ContextChip[] = [
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

const DEFAULT_BERT_MESSAGES: ChatMessage[] = [];

const CONTEXT_ADD_LABELS: Record<string, string> = {
  page: 'Page',
  template: 'Template',
  connections: 'Connections',
  files: 'Files',
  entity: 'Entity: Juan Carlos Abella',
  file: 'File: judgment-extract.pdf',
};

const buildContextSummary = (chips: ContextChip[]) => {
  const labels = chips
    .filter(chip => chip.kind !== 'link')
    .map(chip => chip.label.replace(/^(Document|Entity):\s*/, ''))
    .join(', ');
  return labels || 'the selected scope';
};

export { buildContextSummary, CONTEXT_ADD_LABELS, DEFAULT_BERT_MESSAGES, DEFAULT_CONTEXT_CHIPS };
