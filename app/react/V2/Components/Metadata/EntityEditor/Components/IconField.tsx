import React from 'react';
import { Controller, FieldValues, useFormContext } from 'react-hook-form';
import { iconNames } from '#UI/Icon/library.js';
import { CountryList } from '#app/UI/index.js';
import { Icon } from '#UI/Icon/Icon.jsx';
import { Translate } from '#app/I18N/index.js';
import { CountryFlag } from '#V2/Components/CustomIcons/CoutryFlags.js';
import { Checkbox, SearchSelect } from '#V2/Components/Forms/index.js';

type EntityIcon = {
  _id: string | null;
  type: string;
  label: string;
};

const EMPTY_ICON: EntityIcon = { _id: null, type: 'Empty', label: '' };

const hasEntityIcon = (icon?: EntityIcon | null): boolean =>
  Boolean(icon?._id && icon.type !== 'Empty');

const selectionFromIcon = (icon?: EntityIcon | null): string => {
  if (!hasEntityIcon(icon)) {
    return '';
  }

  return `${icon!.type}:${icon!._id}`;
};

const iconFromSelection = (value: string): EntityIcon => {
  if (!value) {
    return EMPTY_ICON;
  }

  const separatorIndex = value.indexOf(':');
  const type = value.slice(0, separatorIndex);
  const id = value.slice(separatorIndex + 1);

  if (type === 'Flags') {
    const country = CountryList.get(id);
    return {
      _id: id,
      type,
      label: country?.label ?? id,
    };
  }

  return {
    _id: id,
    type,
    label: id,
  };
};

const iconSelectGroups = [
  {
    label: 'Icons',
    options: iconNames.map(name => ({
      value: `Icons:${name}`,
      searchLabel: name,
      label: name,
      prefix: <Icon icon={name} />,
    })),
  },
  {
    label: 'Flags',
    options: Array.from(CountryList).map(([, country]) => ({
      value: `Flags:${country.cca3}`,
      searchLabel: country.label,
      label: country.label,
      prefix: <CountryFlag id={country.cca3} />,
    })),
  },
];

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

export type { EntityIcon };
export { IconField, EMPTY_ICON, hasEntityIcon };
