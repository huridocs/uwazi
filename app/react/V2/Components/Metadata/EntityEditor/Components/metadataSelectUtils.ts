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

const getOptionInfo = (selectedValue: string, options: MultiselectListOption[]) => {
  for (const option of options) {
    if (option.items?.length) {
      const child = option.items.find(item => item.value === selectedValue);
      if (child) {
        return {
          label: typeof child.label === 'string' ? child.label : undefined,
          parent:
            typeof option.label === 'string'
              ? { label: option.label, value: option.value }
              : undefined,
        };
      }
    }

    if (option.value === selectedValue) {
      return {
        label: typeof option.label === 'string' ? option.label : undefined,
        parent: undefined,
      };
    }
  }

  return { label: undefined, parent: undefined };
};

export { getMetadataSelectedValues, getOptionInfo };
