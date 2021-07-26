import { PropertySchema } from 'shared/types/commonTypes';

export function groupSameRelationshipFields(fields: PropertySchema[]) {
  let alreadyGrouped: PropertySchema[] = [];

  return fields
    .map((field: PropertySchema) => {
      if (alreadyGrouped.includes(field)) {
        return false;
      }

      if (field.type !== 'relationship') {
        return field;
      }

      const multiEditingRelationshipFields = fields.filter(
        f => f.content === field.content && f.relationType === field.relationType
      );

      if (multiEditingRelationshipFields.length > 1) {
        alreadyGrouped = alreadyGrouped.concat(multiEditingRelationshipFields);
        return {
          ...field,
          multiEditingRelationshipFields,
        };
      }

      return field;
    })
    .filter(f => f);
}
