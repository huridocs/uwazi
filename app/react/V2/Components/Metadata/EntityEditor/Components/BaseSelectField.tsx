import React, { useEffect, useMemo, useState } from 'react';
import { Controller, FieldValues, Path, RegisterOptions, useFormContext } from 'react-hook-form';
import type { ControllerFieldState } from 'react-hook-form';
import { Translate } from '#app/I18N/index.js';
import {
  MultiselectList,
  MultiselectListOption,
  SearchSelect,
  type SearchSelectGroup,
  type SearchSelectOption,
} from '#V2/Components/Forms/index.js';
import { Label } from '#V2/Components/Forms/Label.js';
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
  lookupSearch?: (search: string) => Promise<MultiselectListOption[]>;
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
  lookupSearch,
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

  const renderLabel = (fieldState: ControllerFieldState) => {
    const { showError } = getFieldErrorState(fieldState);

    return (
      <Label htmlFor={field} hasErrors={showError}>
        <Translate context={context}>{label}</Translate>
        {registerOptions?.required && '*'}
      </Label>
    );
  };

  return (
    <EntityField>
      <Controller
        control={control}
        name={field}
        rules={registerOptions}
        render={({ field: fieldController, fieldState }) => {
          const { showError, message } = getFieldErrorState(fieldState);

          if (singleSelect) {
            const selectedValue = getSelectedValues(fieldController.value)[0] ?? '';

            return (
              <SearchSelect
                id={field}
                label={renderLabel(fieldState)}
                options={searchSelectOptions.options}
                groups={searchSelectOptions.groups}
                value={selectedValue}
                disabled={disabled}
                hasErrors={showError}
                onChange={value => {
                  if (disabled) {
                    return;
                  }

                  fieldController.onChange(
                    onSelectedValuesChange(
                      value ? [value] : [],
                      lookupSearch ? optionsState : options
                    )
                  );
                }}
              />
            );
          }

          return (
            <div>
              <MultiselectList
                id={field}
                panel
                checkboxes
                label={renderLabel(fieldState)}
                items={optionsState}
                onSearch={async search => {
                  if (lookupSearch) {
                    const lookedUpOptions = await lookupSearch(search);
                    setOptionsState(lookedUpOptions);
                    return;
                  }

                  setOptionsState(defaultSearch(search, options));
                }}
                selectedValues={getSelectedValues(fieldController.value)}
                onChange={selectedValues => {
                  if (disabled) {
                    return;
                  }

                  fieldController.onChange(
                    onSelectedValuesChange(selectedValues, lookupSearch ? optionsState : options)
                  );
                }}
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
