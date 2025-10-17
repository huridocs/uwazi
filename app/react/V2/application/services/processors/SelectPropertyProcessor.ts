import { SelectMetadataProperty, SelectPropertyTypes } from 'app/V2/domain/entities/types';
import { ClientThesaurus, ClientThesaurusValue } from 'app/apiResponseTypes';
import { MetadataObjectSchema } from 'shared/types/commonTypes';
import { ProcessingContext, AdapterMetadataProperty } from './types';
import { BasePropertyProcessor } from './BasePropertyProcessor';

export class SelectPropertyProcessor extends BasePropertyProcessor {
  readonly name = 'SelectPropertyProcessor';

  readonly propertyTypes: SelectPropertyTypes[] = ['select', 'multiselect'];

  protected formatProperty(
    property: AdapterMetadataProperty,
    context: ProcessingContext
  ): SelectMetadataProperty['values'] {
    if (
      property.properties.inherited &&
      property.properties.inheritedProperty?.type === 'multiselect'
    ) {
      return this.formatInheritedSelectProperty(property, context);
    }

    if (context.includeOptions) {
      const selectedValues = Array.isArray(property.value) ? property.value : [property.value];
      const options = this.buildFlattenedOptions(
        property,
        selectedValues.map(value => {
          // Handle both object and string values
          return typeof value === 'object' ? value.value : (value as any)?.toString() || '';
        }),
        context
      );
      property.properties.options = options;
    }

    if (property.value !== undefined && !property.properties.options) {
      const values = Array.isArray(property.value) ? property.value : [property.value];
      return values.map((value: MetadataObjectSchema) => ({
        value: value.value?.toString() || '',
        label: value.label || value.toString(),
        parent: value.parent,
      }));
    }

    if (property.properties.options && Array.isArray(property.properties.options)) {
      const values = Array.isArray(property.value) ? property.value : [property.value];

      return values.map((selectedValue: any) => {
        const valueToMatch =
          typeof selectedValue === 'object' ? selectedValue.value : selectedValue;
        const option = property.properties.options!.find((opt: any) => opt.value === valueToMatch);

        if (!option) {
          return {
            value: valueToMatch,
            label:
              typeof selectedValue === 'object' ? selectedValue.label : selectedValue.toString(),
            ...(typeof selectedValue === 'object' && selectedValue.parent
              ? { parent: selectedValue.parent }
              : {}),
          };
        }

        const translatedLabel =
          property.properties.translationContext?.values[option.label || ''] || option.label;

        return {
          value: valueToMatch,
          label: translatedLabel,
          ...(typeof selectedValue === 'object' && selectedValue.parent
            ? { parent: selectedValue.parent }
            : {}),
        };
      });
    }

    return [
      {
        value: property.value?.toString() || '',
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
    _context: ProcessingContext
  ): SelectMetadataProperty['values'] {
    const values = Array.isArray(property.value) ? property.value : [property.value];

    return values.map((item: any) => {
      return {
        value: item.value.value,
        label: item.value.label,
        source: item.source,
        parent: item.value.parent,
      };
    });
  }

  private buildFlattenedOptions(
    property: AdapterMetadataProperty,
    selectedValues: string[],
    context: ProcessingContext
  ): SelectMetadataProperty['values'] {
    const thesaurus = this.findThesaurusByContentId(
      property.properties.content || '',
      context.thesauri
    );

    if (!thesaurus || !thesaurus.values) {
      return [];
    }

    const flattenedOptions: SelectMetadataProperty['values'] = [];

    thesaurus.values.forEach((option: ClientThesaurusValue) => {
      flattenedOptions.push({
        value: option.id || '',
        label: option.label,
        selected: selectedValues.includes(option.id || ''),
        ...(context.translateLabels
          ? { translatedLabel: property.properties.translationContext?.values[option.label] }
          : {}),
      });

      if (option.values && Array.isArray(option.values)) {
        option.values.forEach((subOption: ClientThesaurusValue) => {
          flattenedOptions.push({
            value: subOption.id || '',
            label: context.translateLabels
              ? property.properties.translationContext?.values[subOption.label] || subOption.label
              : subOption.label,
            translatedLabel: context.translateLabels
              ? property.properties.translationContext?.values[subOption.label] || subOption.label
              : undefined,
            selected: selectedValues.includes(subOption.id || ''),
            parent: {
              value: option.id || '',
              label: option.label,
            },
          });
        });
      }
    });

    return flattenedOptions;
  }
}
