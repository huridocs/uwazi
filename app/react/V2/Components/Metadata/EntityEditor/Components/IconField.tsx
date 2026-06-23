import React from 'react';
import { Controller, FieldValues, useFormContext } from 'react-hook-form';
import { Translate } from '#app/I18N/index.js';
import { Checkbox, SearchSelect } from '#V2/Components/Forms/index.js';
import { iconSelectGroups } from '../functions/iconSelectOptions.js';
import {
  iconFromSelection,
  selectionFromIcon,
  type EntityIcon,
} from '../functions/iconSelectUtils.js';

type IconFieldFormValues = FieldValues & {
  showIcon: boolean;
  icon: EntityIcon;
};

type IconFieldProps = {
  disabled?: boolean;
};

const IconField = ({ disabled = false }: IconFieldProps) => {
  const { control, watch } = useFormContext<IconFieldFormValues>();
  const showIcon = watch('showIcon');
  const icon = watch('icon');
  const selectorDisabled = disabled || !showIcon;

  return (
    <div className="flex flex-col gap-3">
      <Controller
        control={control}
        name="showIcon"
        render={({ field }) => (
          <Checkbox
            name="showIcon"
            label="Show icon"
            checked={field.value}
            disabled={disabled}
            onChange={event => {
              field.onChange(event.currentTarget.checked);
            }}
          />
        )}
      />

      <div className={selectorDisabled ? 'pointer-events-none opacity-50' : ''}>
        <Controller
          control={control}
          name="icon"
          render={({ field }) => (
            <SearchSelect
              id="entity-icon"
              label={
                <span className="font-semibold">
                  <Translate context="System">Icon</Translate> /{' '}
                  <Translate context="System">Flag</Translate>
                </span>
              }
              groups={iconSelectGroups}
              value={selectionFromIcon(icon)}
              disabled={selectorDisabled}
              onChange={selectedValue => {
                field.onChange(iconFromSelection(selectedValue));
              }}
            />
          )}
        />
      </div>
    </div>
  );
};

export { IconField };
