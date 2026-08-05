type FileTabFooterMode = 'empty' | 'multi' | 'focused';

type ResolveFileTabFooterModeParams = {
  isEditing: boolean;
  isMulti: boolean;
  hasFocusedRow: boolean;
  filePanelMode: 'details' | 'preview';
};

const resolveFileTabFooterMode = ({
  isEditing,
  isMulti,
  hasFocusedRow,
  filePanelMode,
}: ResolveFileTabFooterModeParams): FileTabFooterMode => {
  if (isEditing) return 'empty';
  if (hasFocusedRow && filePanelMode === 'preview') return 'focused';
  if (isMulti) return 'multi';
  if (hasFocusedRow) return 'focused';
  return 'empty';
};

export { resolveFileTabFooterMode };
export type { FileTabFooterMode, ResolveFileTabFooterModeParams };
