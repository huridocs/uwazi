import { PropertyAssignmentCreatorServiceStrategy } from '#api/core/application/propertyAssignmentCreatorService/PropertyAssignmentCreatorServiceStrategy.js';
import { PropertyAssignment } from '#api/core/domain/template/PropertyValue.js';
import { Template } from '#api/core/domain/template/Template.js';
import { InputFile } from '#api/core/infrastructure/files/InputFile.js';
import { LanguageISO6391 } from '#shared/types/commonTypes.js';
import { MappedAssignment } from '../services/CsvEntitiesImportMapper.js';
import { CsvImportPropertyValidationError } from '../services/CsvImportRowProcessingError.js';

type CreatePropertyAssignmentsInput = {
  propertyAssignmentCreatorServiceStrategy: PropertyAssignmentCreatorServiceStrategy;
  template: Template;
  assignments: MappedAssignment[];
  sanitizedHeaders: string[];
  rowValues: string[];
  attachments: InputFile[];
};

type LanguageScopedPropertyAssignment = {
  language: LanguageISO6391;
  assignment: PropertyAssignment;
};

const isEmptyRow = (rowValues: string[]) => rowValues.every(value => !value.trim());

const resolvePropertyInputContext = (params: {
  property: string;
  sanitizedHeaders: string[];
  rowValues: string[];
}) => {
  const { property, sanitizedHeaders, rowValues } = params;
  const matching = sanitizedHeaders
    .map((header, index) => ({
      header,
      value: (rowValues[index] || '').trim(),
    }))
    .filter(({ header }) => header === property || header.startsWith(`${property}__`));

  if (!matching.length) {
    return {};
  }

  const selected = matching.find(entry => entry.value) || matching[0];
  return {
    column: selected.header,
    rawValue: selected.value || undefined,
  };
};

const createPropertyAssignments = async (
  input: CreatePropertyAssignmentsInput
): Promise<LanguageScopedPropertyAssignment[]> => {
  const {
    propertyAssignmentCreatorServiceStrategy,
    template,
    assignments,
    sanitizedHeaders,
    rowValues,
    attachments,
  } = input;

  const createdAssignments: LanguageScopedPropertyAssignment[] = [];

  for (const assignment of assignments) {
    const inputContext = resolvePropertyInputContext({
      property: assignment.name,
      sanitizedHeaders,
      rowValues,
    });

    try {
      // eslint-disable-next-line no-await-in-loop
      const created = await propertyAssignmentCreatorServiceStrategy.bulkCreate(
        [assignment],
        template,
        attachments
      );
      const { language } = assignment;
      if (!language) {
        throw new Error(`Missing language for property assignment "${assignment.name}"`);
      }
      created.forEach(createdAssignment => {
        createdAssignments.push({
          language,
          assignment: createdAssignment,
        });
      });
    } catch (error) {
      throw new CsvImportPropertyValidationError({
        property: assignment.name,
        column: inputContext.column,
        rawValue: inputContext.rawValue,
        cause: error,
      });
    }
  }

  return createdAssignments;
};

export { createPropertyAssignments, isEmptyRow };
export type { LanguageScopedPropertyAssignment };
