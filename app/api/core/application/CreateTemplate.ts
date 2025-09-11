import { AbstractUseCase } from 'api/common.v2/contracts/UseCase';
import { TemplatesDataSource } from 'api/templates.v2/contracts/TemplatesDataSource';
import { Template } from 'api/templates.v2/model/Template';
import { z } from 'zod';
import { IdGenerator } from 'api/common.v2/contracts/IdGenerator';
import { SettingsDataSource } from 'api/settings.v2/contracts/SettingsDataSource';
import { RelationshipTypesDataSource } from 'api/relationshiptypes.v2/contracts/RelationshipTypesDataSource';
import { TransactionManager } from 'api/common.v2/contracts/TransactionManager';
import { CommonPropertyFactory } from '../domain/template/CommonPropertyFactory';
import { PropertyCreatorServiceStrategy } from '../domain/template/propertyCreatorService/PropertyCreatorServiceStrategy';
import { ThesauriDataSource } from '../domain/template/propertyCreatorService/SelectPropertyCreatorService';
import { TemplateWithDuplicatedNameOnTheSystemError } from '../domain/template/errors';
import { TranslationService } from '../domain/template/TranslationService';

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
      type: z.enum(types),
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

type Output = Template;

type Deps = {
  templatesDS: TemplatesDataSource;
  thesauriDS: ThesauriDataSource;
  translationService: TranslationService;
  settingsDS: SettingsDataSource;
  relationshipTypesDS: RelationshipTypesDataSource;
  idGenerator: IdGenerator;
  transactionManager: TransactionManager;
};

class CreateTemplateUseCase extends AbstractUseCase<Input, Output> {
  private propertyCreatorServiceStrategy: PropertyCreatorServiceStrategy;

  constructor(private deps: Deps) {
    super();

    this.propertyCreatorServiceStrategy = PropertyCreatorServiceStrategy.create(this.deps);
  }

  // eslint-disable-next-line max-statements
  protected async executeAsync(input: Input): Promise<Output> {
    const { newNameGeneration } = await this.deps.settingsDS.get();
    const templateId = this.deps.idGenerator.generate();

    const commonProperties = input.commonProperties.map(p =>
      CommonPropertyFactory.create(
        { ...p, id: this.deps.idGenerator.generate(), template: 'id' },
        { newNameGeneration }
      )
    );

    const properties = await Promise.all(
      input?.properties?.map(async p =>
        this.propertyCreatorServiceStrategy
          .getStrategy(p.type)
          .create(
            { ...p, id: this.deps.idGenerator.generate(), template: templateId },
            { newNameGeneration }
          )
      ) || []
    );

    const template = new Template(
      templateId,
      input.name,
      properties,
      commonProperties,
      input.color
    );

    const isTemplateUnique = await this.deps.templatesDS.isTemplateUnique(template);
    if (!isTemplateUnique) {
      throw new TemplateWithDuplicatedNameOnTheSystemError(template);
    }

    await this.deps.transactionManager.run(async () => {
      await this.deps.templatesDS.create(template);
      await this.deps.translationService.translate(template);
    });

    return template;
  }
}

export { CreateTemplateUseCase, Schema as CreateTemplateUseCaseSchema };
export type { Input as CreateTemplateInput, Output as CreateTemplateOutput };
