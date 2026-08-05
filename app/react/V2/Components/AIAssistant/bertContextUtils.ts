import type { ContextAddOptionId, ContextChip, ContextChipKind } from './types.js';

const CONTEXT_ADD_LABELS: Record<ContextAddOptionId, string> = {
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

const contextKindForOption = (optionId: ContextAddOptionId): ContextChipKind => {
  if (optionId === 'entity') return 'entity';
  if (optionId === 'file') return 'file';
  if (optionId === 'template') return 'template';
  if (optionId === 'page') return 'page';
  return 'document';
};

export { buildContextSummary, CONTEXT_ADD_LABELS, contextKindForOption };
