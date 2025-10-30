import { PropertyAssignment } from 'api/core/domain/template/PropertyValue';
import { Template } from 'api/core/domain/template/Template';
import { PropertyAssignmentInput, ValueInput } from '../CreateEntity';

type CreateInput<Value = ValueInput> = {
  template: Template;
  propertyAssignment: PropertyAssignmentInput<Value>;
};

interface PropertyAssignmentCreatorService {
  create(input: CreateInput): Promise<PropertyAssignment | PropertyAssignment[]>;
}

export type { PropertyAssignmentCreatorService, CreateInput as CreateInputPropertyAssignment };
