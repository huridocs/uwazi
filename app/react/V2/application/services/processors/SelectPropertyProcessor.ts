import { SelectPropertyTypes } from 'app/V2/domain/entities/types';
import { ClientThesaurus, ClientThesaurusValue } from 'app/apiResponseTypes';
import { MetadataProperty } from 'app/V2/domain/entities/types';
import {
  ProcessingContext,
  AdapterMetadataProperty,
} from './types';
import { BasePropertyProcessor } from './BasePropertyProcessor';

export class SelectPropertyProcessor extends BasePropertyProcessor {
  readonly name = 'SelectPropertyProcessor';

  readonly propertyTypes: SelectPropertyTypes[] = ['select', 'multiselect'];

  protected formatProperty(
    property: AdapterMetadataProperty,
    context: ProcessingContext
  ): MetadataProperty["values"] {
    if (property.inherited && property.inheritedType === 'multiselect') {
      return this.formatInheritedSelectProperty(property, context);
    }

    if (property.value !== undefined && !property.properties.options) {
      const values = Array.isArray(property.value) ? property.value : [property.value];

      return values.map((value: any) => ({
        value,
        label: value.label || value.toString(),
      }));
    }

    if (property.properties.options && Array.isArray(property.properties.options)) {
      const values = Array.isArray(property.value) ? property.value : [property.value];

      return values.map((selectedValue: any) => {
        const option = property.properties.options!.find((opt: any) => opt.value === selectedValue);

        if (!option) {
          return {
            value: selectedValue,
            label: selectedValue.toString(),
          };
        }

        const translatedLabel = this.getTranslatedLabel(property, option.label, context) || option.label;

        return {
          value: selectedValue,
          label: translatedLabel,
        };
      });
    }

    return [
      {
        value: property.value,
        label: property.value?.toString() || '',
      },
    ];
  }

  private findThesaurusByContentId(
    contentId: string,
    thesauri: ClientThesaurus[]
  ): ClientThesaurus | undefined {
    return thesauri.find(t => t._id === contentId);
  }

  private formatInheritedSelectProperty(
    property: AdapterMetadataProperty,
    context: ProcessingContext
  ): MetadataProperty["values"] {
    const values = Array.isArray(property.value) ? property.value : [property.value];

    return values.map((item: any) => {
      const inheritedValue = item.value;
      const relationshipMetadata = item._relationshipMetadata;

      return {
        value: inheritedValue,
        label: relationshipMetadata?.label || inheritedValue?.label || inheritedValue?.toString(),
      };
    });
  }

  private buildFlattenedOptions(
    property: AdapterMetadataProperty,
    selectedValues: string[],
    thesauri: ClientThesaurus[],
    translations: Record<string, string>,
    selectFormatting: {
      showLabels: boolean;
      showIcons: boolean;
      showUrls: boolean;
    }
  ): Array<{
    value: string;
    label?: string;
    displayValue: string;
    selected: boolean;
    group: string | null;
    level: number;
  }> {
    const thesaurus = this.findThesaurusByContentId(property.properties.content || '', thesauri);

    if (!thesaurus || !thesaurus.values) {
      return [];
    }

    const flattenedOptions: Array<{
      value: string;
      label?: string;
      displayValue: string;
      selected: boolean;
      group: string | null;
      level: number;
    }> = [];

    thesaurus.values.forEach((option: ClientThesaurusValue) => {
      flattenedOptions.push({
        value: option.id || '',
        label: selectFormatting.showLabels ? translations[option.label] || option.label : undefined,
        displayValue: selectFormatting.showLabels ? translations[option.label] || option.label : '',
        selected: selectedValues.includes(option.id || ''),
        group: null,
        level: 0,
      });

      if (option.values && Array.isArray(option.values)) {
        option.values.forEach((subOption: ClientThesaurusValue) => {
          flattenedOptions.push({
            value: subOption.id || '',
            label: selectFormatting.showLabels
              ? translations[subOption.label] || subOption.label
              : undefined,
            displayValue: selectFormatting.showLabels
              ? translations[subOption.label] || subOption.label
              : '',
            selected: selectedValues.includes(subOption.id || ''),
            group: option.id || null,
            level: 1,
          });
        });
      }
    });

    return flattenedOptions;
  }
}
