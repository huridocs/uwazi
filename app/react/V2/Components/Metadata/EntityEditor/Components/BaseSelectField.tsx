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
import { InputError } from '#V2/Components/Forms/InputError.js';
import { defaultSearch } from '#V2/Components/Forms/MultiselectList/MultiselectList.js';
import { getFieldErrorMessage } from '../functions/fieldErrorMessage.js';

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

  const renderLabel = (invalid: boolean) => (
    <div className={`font-semibold ${invalid ? 'text-(--color-theme-control-text-error)' : ''}`}>
      <Translate className="" context={context}>
        {label}
      </Translate>
      {registerOptions?.required && '*'}
    </div>
  );

  return (
    <Controller
      control={control}
      name={field}
      rules={registerOptions}
      render={({ field: fieldController, fieldState }) => {
        if (singleSelect) {
          const selectedValue = getSelectedValues(fieldController.value)[0] ?? '';

          return (
            <SearchSelect
              id={field}
              label={renderLabel(fieldState.invalid)}
              options={searchSelectOptions.options}
              groups={searchSelectOptions.groups}
              value={selectedValue}
              disabled={disabled}
              hasErrors={fieldState.invalid}
              onChange={value => {
                if (disabled) {
                  return;
                }

                fieldController.onChange(
                  onSelectedValuesChange(value ? [value] : [], optionsState)
                );
              }}
            />
          );
        }

        return (
          <div>
            <div className="h-52">
              <MultiselectList
                id={field}
                checkboxes
                label={renderLabel(fieldState.invalid)}
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

                  fieldController.onChange(onSelectedValuesChange(selectedValues, optionsState));
                }}
                hasErrors={fieldState.invalid}
                hideFilters={hideFilters}
              />
            </div>
            {fieldState.invalid && (
              <InputError>{getFieldErrorMessage(fieldState.error)}</InputError>
            )}
          </div>
        );
      }}
    />
  );
};

export { BaseSelectField };
