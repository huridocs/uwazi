import React from 'react';
import { Translate } from '#app/I18N/index.js';
import { Label } from '#V2/Components/Forms/Label.js';
import { NeedAuthorization } from '#V2/Components/UI/index.js';

type ThesaurusFieldLabelProps = {
  htmlFor: string;
  context: string;
  label: string;
  required?: boolean;
  showAdd: boolean;
  showClear: boolean;
  onAdd: () => void;
  onClear: () => void;
};

const actionClass =
  'text-meta font-medium text-ink-tertiary transition-colors hover:text-ink-secondary cursor-pointer';

const ThesaurusFieldLabel = ({
  htmlFor,
  context,
  label,
  required,
  showAdd,
  showClear,
  onAdd,
  onClear,
}: ThesaurusFieldLabelProps) => (
  <div className="flex min-h-4 items-center gap-2">
    <Label htmlFor={htmlFor} variant="primary">
      <Translate context={context}>{label}</Translate>
      {required ? '*' : null}
    </Label>
    {(showClear || showAdd) && (
      <span className="ms-auto inline-flex items-center gap-3">
        {showClear && (
          <button type="button" className={actionClass} onClick={onClear}>
            <Translate>Clear</Translate>
          </button>
        )}
        {showAdd && (
          <NeedAuthorization roles={['admin']}>
            <button type="button" className={actionClass} onClick={onAdd}>
              <Translate>Add value</Translate>
            </button>
          </NeedAuthorization>
        )}
      </span>
    )}
  </div>
);

export { ThesaurusFieldLabel };
export type { ThesaurusFieldLabelProps };
