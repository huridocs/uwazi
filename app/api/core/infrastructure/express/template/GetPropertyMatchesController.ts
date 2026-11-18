import { z } from 'zod';
import { AbstractController } from '#api/common.v2/infrastructure/AbstractController.js';
import { CorePropertyTypeSchema } from '#api/core/application/TemplateDTOs.js';
import { Authorize } from '#api/core/infrastructure/express/decorators/Authorize.js';
import { TemplatesQueryServiceFactory } from '#api/core/infrastructure/factories/TemplatesQueryServiceFactory.js';
import type { PropertyCandidate } from '#api/core/infrastructure/template/TemplatesQueryService.js';
import type { GetPropertyMatchesResponse } from '#shared/contracts/Template.js';

const RequestSchema = z
  .object({
    label: z.string().trim().min(1),
    type: CorePropertyTypeSchema,
    templateId: z.string().optional(),
    content: z.string().optional(),
    relationType: z.string().optional(),
    inheritProperty: z.string().optional(),
    inheritType: CorePropertyTypeSchema.optional(),
  })
  .refine(query => query.type !== 'relationship' || !!query.relationType, {
    message: 'relationType is required for relationship properties',
    path: ['relationType'],
  });

type RequestDto = z.infer<typeof RequestSchema>;

class GetPropertyMatchesController extends AbstractController {
  @Authorize(['admin'])
  protected async handle(): Promise<void> {
    const query = RequestSchema.parse(this.request.query);

    const response: GetPropertyMatchesResponse =
      await TemplatesQueryServiceFactory.default().getPropertyMatches(
        GetPropertyMatchesController.toCandidate(query)
      );

    this.response.json(response);
  }

  private static toCandidate({
    inheritProperty,
    inheritType,
    ...candidate
  }: RequestDto): PropertyCandidate {
    return {
      ...candidate,
      ...(inheritProperty &&
        inheritType && { inherit: { property: inheritProperty, type: inheritType } }),
    };
  }
}

export { GetPropertyMatchesController };
