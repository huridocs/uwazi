import React, { useEffect, useMemo, useState } from 'react';
import { Controller, FieldValues, Path, RegisterOptions, useFormContext } from 'react-hook-form';
import { Translate } from '#app/I18N/index.js';
import {
  MultiselectList,
  MultiselectListOption,
  SearchSelect,
  type SearchSelectGroup,
  type SearchSelectOption,
} from '#V2/Components/Forms/index.js';
import { defaultSearch } from '#V2/Components/Forms/MultiselectList/MultiselectList.js';
import { EntityFieldError, getFieldErrorState } from '../functions/fieldErrorState.js';
import { EntityField } from './EntityField.js';

const toSearchSelectOptions = (options: MultiselectListOption[]) => {
  const searchOptions: SearchSelectOption[] = [];
  const searchGroups: SearchSelectGroup[] = [];

  options.forEach(option => {
    if (option.items?.length) {
      searchGroups.push({
        label: typeof option.label === 'string' ? option.label : option.searchLabel,
        options: option.items.map(child => ({
          value: child.value,
          searchLabel: child.searchLabel,
          label: child.label,
        })),
      });
      return;
    }

    searchOptions.push({
      value: option.value,
      searchLabel: option.searchLabel,
      label: option.label,
    });
  });

  return { options: searchOptions, groups: searchGroups };
};

type BaseSelectFieldProps<TFormValues extends FieldValues = FieldValues> = {
  context: string;
  label: string;
  field: Path<TFormValues>;
  options: MultiselectListOption[];
  singleSelect?: boolean;
  registerOptions?: RegisterOptions<TFormValues, Path<TFormValues>>;
  disabled?: boolean;
  hideFilters?: boolean;
  hideLabel?: boolean;
  hideClear?: boolean;
  lookupSearch?: (search: string) => Promise<MultiselectListOption[]>;
  adornment?: (api: {
    apply: (ids: string[], options?: MultiselectListOption[]) => void;
    selectedIds: string[];
  }) => React.ReactNode;
  getSelectedValues: (value: unknown) => string[];
  onSelectedValuesChange: (selectedValues: string[], options: MultiselectListOption[]) => unknown;
};

const BaseSelectField = <TFormValues extends FieldValues = FieldValues>({
  context,
  label,
  field,
  registerOptions,
  disabled,
  options,
  singleSelect,
  hideFilters,
  hideLabel,
  hideClear,
  lookupSearch,
  adornment,
  getSelectedValues,
  onSelectedValuesChange,
}: BaseSelectFieldProps<TFormValues>) => {
  const { control } = useFormContext<TFormValues>();
  const [optionsState, setOptionsState] = useState<MultiselectListOption[]>(options);
  const searchSelectOptions = useMemo(() => toSearchSelectOptions(options), [options]);

  useEffect(() => {
    if (lookupSearch) {
      return;
    }
    setOptionsState(options);
  }, [lookupSearch, options]);

  useEffect(() => {
    let isMounted = true;

    const loadInitialLookup = async () => {
      if (!lookupSearch) {
        return;
      }

      const lookedUpOptions = await lookupSearch('');
      if (isMounted) {
        setOptionsState(lookedUpOptions);
      }
    };

    loadInitialLookup().catch(() => undefined);

    return () => {
      isMounted = false;
    };
  }, [lookupSearch]);

  const labelContent = (
    <>
      <Translate context={context}>{label}</Translate>
      {registerOptions?.required && '*'}
    </>
  );

  return (
    <EntityField>
      <Controller
        control={control}
        name={field}
        rules={registerOptions}
        render={({ field: fieldController, fieldState }) => {
          const { showError, message } = getFieldErrorState(fieldState);
          const selectedIds = getSelectedValues(fieldController.value);
          const currentOptions = lookupSearch ? optionsState : options;
          const apply = (ids: string[], optionOverride?: MultiselectListOption[]) => {
            if (disabled) {
              return;
            }
            fieldController.onChange(onSelectedValuesChange(ids, optionOverride ?? currentOptions));
          };
          const leading = adornment?.({ apply, selectedIds });

          if (singleSelect) {
            return (
              <div className="flex flex-col gap-1.5">
                {leading}
                <SearchSelect
                  id={field}
                  label={adornment ? undefined : labelContent}
                  hideLabel={hideLabel}
                  hideClear={hideClear}
                  options={searchSelectOptions.options}
                  groups={searchSelectOptions.groups}
                  value={selectedIds[0] ?? ''}
                  disabled={disabled}
                  hasErrors={showError}
                  onChange={value => apply(value ? [value] : [])}
                />
                <EntityFieldError showError={showError} message={message} />
              </div>
            );
          }

          return (
            <div className="flex flex-col gap-1.5">
              {leading}
              <MultiselectList
                id={field}
                panel
                checkboxes
                label={hideLabel ? undefined : labelContent}
                items={optionsState}
                onSearch={async search => {
                  if (lookupSearch) {
                    const lookedUpOptions = await lookupSearch(search);
                    setOptionsState(lookedUpOptions);
                    return;
                  }

                  setOptionsState(defaultSearch(search, options));
                }}
                selectedValues={selectedIds}
                onChange={apply}
                hasErrors={showError}
                hideFilters={hideFilters}
              />
              <EntityFieldError showError={showError} message={message} />
            </div>
          );
        }}
      />
    </EntityField>
  );
};

export { BaseSelectField };
