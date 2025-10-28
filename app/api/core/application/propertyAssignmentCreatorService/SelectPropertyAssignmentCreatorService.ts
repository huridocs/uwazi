import { PropertyAssignment, SelectionEntry } from 'api/core/domain/template/PropertyValue';
import { SelectProperty } from 'api/core/domain/template/SelectProperty';
import { Template } from 'api/core/domain/template/Template';
import { TranslationsDataSource } from 'api/i18n.v2/contracts/TranslationsDataSource';
import { LanguageISO6391 } from 'shared/types/commonTypes';
import { ThesauriDataSource } from '../propertyCreatorService/SelectPropertyCreatorService';

type CreateInput = {
  template: Template;
  propertyAssignment: { name: string; value: string[] };
};

type Deps = {
  translationsDS: TranslationsDataSource;
  thesauriDS: ThesauriDataSource;
};

export class DefaultPropertyAssignmentCreatorService {
  constructor(private deps: Deps) {}

  // eslint-disable-next-line max-statements
  async create({ propertyAssignment, template }: CreateInput): Promise<PropertyAssignment[]> {
    const property = template.getPropertyByName<SelectProperty>(propertyAssignment.name);
    if (!property) {
      throw new Error(
        `Property with name ${propertyAssignment.name} does not exist in template ${template.name}`
      );
    }

    if (property.type !== 'select') {
      throw new Error(
        `Property with name ${propertyAssignment.name} is not of type select in template ${template.name}`
      );
    }

    const thesaurus = (await this.deps.thesauriDS.getById(property.content)).getDataOrThrow();

    const translations = await this.deps.translationsDS
      .getByContext(thesaurus._id!.toString())
      .all();

    const enrichedValues = propertyAssignment.value.map(value => ({
      key: thesaurus.values?.find(v => v.id === value)?.label,
      value,
    }));

    const localizedSelectValues = new Map<LanguageISO6391, SelectionEntry[]>();

    enrichedValues.forEach(value =>
      translations
        .filter(t => t.key === value.key)
        .forEach(t =>
          localizedSelectValues.set(t.language, [
            ...(localizedSelectValues.get(t.language) || []),
            {
              value: value.value,
              label: t.value,
            },
          ])
        )
    );

    const propertyAssignments: PropertyAssignment[] = [];

    localizedSelectValues.forEach((value, language) =>
      propertyAssignments.push(
        template.createPropertyAssignment(property.name, { value, language })
      )
    );

    return propertyAssignments;
  }
}
