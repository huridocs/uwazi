import React, { useState } from 'react';
import type { ClientThesaurus } from '#app/apiResponseTypes.js';
import type { MultiselectListOption } from '#V2/Components/Forms/index.js';
import { addValueScopes } from '../functions/addThesaurusValue.js';
import { thesaurusToOptions } from '../functions/relationshipFieldHelpers.js';
import { AddThesaurusValueModal } from './AddThesaurusValueModal.js';
import { ThesaurusFieldLabel } from './ThesaurusFieldLabel.js';
import { useAddThesaurusValue } from './useAddThesaurusValue.js';
import { useLiveThesaurus } from './useLiveThesaurus.js';

type ThesaurusValueControlsProps = {
  thesaurus: ClientThesaurus;
  singleSelect: boolean;
  selectedIds: string[];
  disabled?: boolean;
  label: string;
  context: string;
  required?: boolean;
  htmlFor: string;
  onApply: (ids: string[], source: ClientThesaurus, freshIds: ReadonlySet<string>) => void;
};

type ThesaurusAdornment = (api: {
  apply: (ids: string[], options?: MultiselectListOption[]) => void;
  selectedIds: string[];
}) => React.ReactNode;

type UseThesaurusAdornmentArgs = {
  thesaurus?: ClientThesaurus;
  options: MultiselectListOption[];
  singleSelect: boolean;
  disabled?: boolean;
  label: string;
  context: string;
  required?: boolean;
  htmlFor: string;
};

const ThesaurusValueControls = ({
  thesaurus,
  singleSelect,
  selectedIds,
  disabled,
  label,
  context,
  required,
  htmlFor,
  onApply,
}: ThesaurusValueControlsProps) => {
  const { adding, open, close, save, clear, saving } = useAddThesaurusValue({
    thesaurus,
    singleSelect,
    selectedIds,
    onApply,
  });

  return (
    <>
      <ThesaurusFieldLabel
        htmlFor={htmlFor}
        context={context}
        label={label}
        required={required}
        showAdd={!disabled}
        showClear={singleSelect && !disabled && selectedIds.length > 0}
        onAdd={open}
        onClear={clear}
      />
      {adding ? (
        <AddThesaurusValueModal
          thesaurusName={thesaurus.name}
          scopes={addValueScopes(thesaurus)}
          saving={saving}
          onSave={save}
          onClose={close}
        />
      ) : null}
    </>
  );
};

const useThesaurusAdornment = ({
  thesaurus,
  options,
  singleSelect,
  disabled,
  label,
  context,
  required,
  htmlFor,
}: UseThesaurusAdornmentArgs) => {
  const [freshIds, setFreshIds] = useState<ReadonlySet<string>>(() => new Set());
  const { live, options: fieldOptions } = useLiveThesaurus(thesaurus, options, freshIds);
  const adornment: ThesaurusAdornment | undefined = live
    ? ({ apply, selectedIds }) => (
        <ThesaurusValueControls
          thesaurus={live}
          singleSelect={singleSelect}
          selectedIds={selectedIds}
          disabled={disabled}
          label={label}
          context={context}
          required={required}
          htmlFor={htmlFor}
          onApply={(ids, source, fresh) => {
            setFreshIds(fresh);
            apply(ids, thesaurusToOptions([source], { content: source._id }, fresh));
          }}
        />
      )
    : undefined;

  return { options: fieldOptions, adornment, bound: Boolean(live) };
};

export { useThesaurusAdornment };
