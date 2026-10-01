import { MultiselectListOption } from '#V2/Components/Forms/index.js';
import type { MetadataValue } from '#V2/formatters/types.js';

const getMetadataSelectedValues = (value: unknown): string[] => {
  if (!Array.isArray(value)) {
    return [];
  }

  return (value as MetadataValue[])
    .map(item => item.value)
    .filter((itemValue): itemValue is string => typeof itemValue === 'string');
};

const optionText = (option: MultiselectListOption) =>
  typeof option.label === 'string' ? option.label : option.searchLabel;

const getOptionInfo = (selectedValue: string, options: MultiselectListOption[]) => {
  for (const option of options) {
    if (option.items?.length) {
      const child = option.items.find(item => item.value === selectedValue);
      if (child) {
        return {
          label: optionText(child),
          parent: { label: optionText(option), value: option.value },
        };
      }
    }

    if (option.value === selectedValue) {
      return {
        label: optionText(option),
        parent: undefined,
      };
    }
  }

  return { label: undefined, parent: undefined };
};

export { getMetadataSelectedValues, getOptionInfo };
