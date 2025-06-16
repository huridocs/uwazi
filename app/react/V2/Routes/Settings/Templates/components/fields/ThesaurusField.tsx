import React, { useMemo } from 'react';
import { Controller } from 'react-hook-form';
import { useAtomValue } from 'jotai';
import { Select } from 'V2/Components/Forms';
import { t, Translate } from 'app/I18N';
import { thesauriAtom } from 'V2/atoms';
import { ClientThesaurus } from 'app/apiResponseTypes';
import { orderBy } from 'lodash';

interface ThesaurusFieldProps {
  control: any;
  disabled?: boolean;
}

export const ThesaurusField = ({ control, disabled }: ThesaurusFieldProps) => {
  const thesauri = useAtomValue(thesauriAtom);

  const thesaurusOptions = useMemo(() => {
    const filteredThesauri = thesauri.filter(
      (thesaurus: ClientThesaurus) => thesaurus.type !== 'template'
    );

    const options = orderBy(
      filteredThesauri.map((thesaurus: ClientThesaurus) => ({
        value: thesaurus._id,
        label: t(thesaurus._id, thesaurus.name, null, false),
      })),
      'label'
    );

    options.unshift({
      value: '',
      label: t('System', 'Select...', null, false),
    });

    return options;
  }, [thesauri]);

  return (
    <Controller
      name="content"
      control={control}
      rules={{ required: true }}
      render={({ field }) => (
        <Select
          id="property-thesaurus"
          label={
            <div className="flex items-center gap-1">
              <Translate>Thesaurus</Translate>
              <span>*</span>
            </div>
          }
          options={thesaurusOptions}
          disabled={disabled}
          {...field}
        />
      )}
    />
  );
};
