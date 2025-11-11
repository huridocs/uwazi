import { PropertyAssignment } from 'api/core/domain/template/PropertyValue';
import { Template } from 'api/core/domain/template/Template';
import { LanguageISO6391 } from 'shared/types/commonTypes';

type PropertyValueInput =
  | { attachment: number }
  | { value: string }
  | { value: number }
  | { value: { from: number; to: number } }
  | { value: { lat: number; lon: number; label?: string } }
  | { value: { url: string; label?: string } }
  | { value: { [childName: string]: { value: unknown; label?: string }[] } };

type PropertyAssignmentInput<Value = PropertyValueInput> = {
  name: string;
  value: Value[];
  language?: LanguageISO6391;
};

type CreateInput<V = PropertyValueInput> = {
  template: Template;
  propertyAssignment: PropertyAssignmentInput<V>;
  attachments?: Express.Multer.File[];
};

interface PropertyAssignmentCreatorService {
  create(input: CreateInput): Promise<PropertyAssignment | PropertyAssignment[]>;
}

export type {
  PropertyAssignmentCreatorService,
  CreateInput as CreatePropertyAssignmentInput,
  PropertyAssignmentInput,
  PropertyValueInput,
};
