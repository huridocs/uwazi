import { UseCase } from 'api/common.v2/contracts/UseCase';
import { TemplatesDataSource } from 'api/templates.v2/contracts/TemplatesDataSource';
import { Template } from 'api/templates.v2/model/Template';
import { z } from 'zod';
import { IdGenerator } from 'api/common.v2/contracts/IdGenerator';
import { CommonPropertyFactory } from '../domain/template/CommonPropertyFactory';
import { PropertyCreatorServiceStrategy } from '../domain/template/propertyCreatorService/PropertyCreatorServiceStrategy';
import { PropertyCreatorService } from '../domain/template/propertyCreatorService/PropertyCreatorService';
import { RelationshipPropertyCreatorService } from '../domain/template/propertyCreatorService/RelationshipPropertyCreatorService';
import {
  SelectPropertyCreatorService,
  ThesauriDataSource,
} from '../domain/template/propertyCreatorService/SelectPropertyCreatorService';
import { TemplateWithDuplicatedNameOnTheSystemError } from '../domain/template/errors';

const types = [
  'date',
  'daterange',
  'geolocation',
  'image',
  'link',
  'markdown',
  'media',
  'multidate',
  'multidaterange',
  'multiselect',
  'nested',
  'numeric',
  'preview',
  'relationship',
  'select',
  'text',
  'generatedid',
  'newRelationship',
] as const;

const PropertySchema = z.object({
  label: z.string(),
  type: z.enum(types),
  prioritySorting: z.boolean().optional(),
  generatedId: z.boolean().optional(),
  content: z.string().optional(), // Is the target template Id or thesaurus Id.
  relationType: z.string().optional(), // Only for relationship type properties
  inherit: z
    .object({
      property: z.string(),
    })
    .optional(), // Only for relationship type properties

  filter: z.boolean().optional(), // Depends on the type of Property
  defaultFilter: z.boolean().optional(), // Depends on the type of Property
  noLabel: z.boolean().optional(),
  fullWidth: z.boolean().optional(), // Only used when type is multiMedia
  style: z.string().optional(), // Related to multiMedia, create a enum for the correct values
  required: z.boolean().optional(),
  sortable: z.boolean().optional(),
  showInCard: z.boolean().optional(),
  nestedProperties: z.array(z.string()).optional(),
  query: z.unknown().optional(),
  denormalizedProperty: z.string().optional(),
  targetTemplates: z.union([z.literal(false), z.array(z.string())]).optional(),
});

const CommonPropertySchema = z.object({
  label: z.string(),
  type: z.enum(types),
  name: z.string(),
  isCommonProperty: z.literal(true),

  prioritySorting: z.boolean().optional(),
  generatedId: z.boolean().optional(),
});

const Schema = z.object({
  name: z.string({ message: 'Template name is required' }),
  color: z.string().optional(), // If not provided, domain will generate next on pallet
  entityViewPage: z.string().optional(),
  commonProperties: z.array(CommonPropertySchema),
  properties: z.array(PropertySchema).default([]),
});

type Input = z.infer<typeof Schema>;

type Output = void;

type Deps = {
  templatesDS: TemplatesDataSource;
  idGenerator: IdGenerator;
  thesauriDS: ThesauriDataSource;
};

class CreateTemplateUseCase implements UseCase<Input, Output> {
  propertyCreatorServiceStrategy: PropertyCreatorServiceStrategy;

  constructor(private deps: Deps) {
    this.propertyCreatorServiceStrategy = new PropertyCreatorServiceStrategy({
      default: new PropertyCreatorService({ templatesDS: this.deps.templatesDS }),
      relationship: new RelationshipPropertyCreatorService({ templatesDS: this.deps.templatesDS }),
      select: new SelectPropertyCreatorService({
        templatesDS: this.deps.templatesDS,
        thesauriDS: this.deps.thesauriDS,
      }),
    });
  }

  async execute(input: Input): Promise<Output> {
    const commonProperties = input.commonProperties.map(p =>
      CommonPropertyFactory.create({ ...p, id: this.deps.idGenerator.generate(), template: 'id' })
    );

    const properties = await Promise.all(
      input.properties.map(async p =>
        this.propertyCreatorServiceStrategy
          .getStrategy(p.type)
          .create({ ...p, id: this.deps.idGenerator.generate(), template: 'id' })
      )
    );

    const template = new Template(
      this.deps.idGenerator.generate(),
      input.name,
      properties,
      commonProperties,
      input.color
    );

    const isTemplateUnique = await this.deps.templatesDS.isTemplateUnique(template);
    if (!isTemplateUnique) {
      throw new TemplateWithDuplicatedNameOnTheSystemError(template);
    }

    await this.deps.templatesDS.create(template);
  }
}

export { CreateTemplateUseCase, Schema };
export type { Input as CreateTemplateInput, Output as CreateTemplateOutput };
