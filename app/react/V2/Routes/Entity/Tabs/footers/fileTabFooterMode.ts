type FileTabFooterMode = 'empty' | 'multi' | 'focused';

type ResolveFileTabFooterModeParams = {
  isEditing: boolean;
  isMulti: boolean;
  hasFocusedRow: boolean;
};

const resolveFileTabFooterMode = ({
  isEditing,
  isMulti,
  hasFocusedRow,
}: ResolveFileTabFooterModeParams): FileTabFooterMode => {
  if (isEditing) return 'empty';
  if (isMulti) return 'multi';
  if (hasFocusedRow) return 'focused';
  return 'empty';
};

export { resolveFileTabFooterMode };
export type { FileTabFooterMode, ResolveFileTabFooterModeParams };
