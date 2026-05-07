/* eslint-disable max-statements */
import { z } from 'zod';
import { AbstractController } from '#api/common.v2/infrastructure/AbstractController.js';
import { GrantEntityPermissionsUseCaseFactory } from '../../factories/GrantEntityPermissionsUseCaseFactory.js';
import { BulkGrantEntityPermissionsUseCaseFactory } from '../../factories/BulkGrantEntityPermissionsUseCaseFactory.js';
import { AccessGrantProps } from '#api/core/domain/entityAccessPolicy/AccessGrant.js';

const RequestSchema = z
  .object({
    ids: z.array(z.string()).min(1, 'At least one entity id is required'),
    permissions: z.array(
      z.object({
        refId: z.string(),
        type: z.enum(['user', 'group', 'public']),
        level: z.enum(['read', 'write', 'mixed']),
      })
    ),
  })
  .superRefine((data, ctx) => {
    if (data.ids.length === 1 && data.permissions.some(p => p.level === 'mixed')) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: 'Mixed level is not allowed for single entity permissions',
        path: ['permissions'],
      });
    }
  });

type RequestDto = z.infer<typeof RequestSchema>;

class EntityPermissionsController extends AbstractController<RequestDto> {
  protected async handle(): Promise<void> {
    const body = RequestSchema.parse(this.request.body);
    const { ids, permissions } = body;

    const publicEntry = permissions.find(p => p.type === 'public');
    const nonPublicGrants = permissions.filter(p => p.type !== 'public');

    if (ids.length === 1) {
      const isPublic = publicEntry !== undefined;
      const grants = nonPublicGrants as AccessGrantProps[];

      const useCase = GrantEntityPermissionsUseCaseFactory.default();
      await useCase.execute({ sharedId: ids[0], grants, isPublic });
    } else {
      let isPublic: boolean | undefined;
      if (!publicEntry || publicEntry.level === 'mixed') {
        isPublic = undefined;
      } else {
        isPublic = true;
      }

      const grants = nonPublicGrants.filter(g => g.level !== 'mixed') as AccessGrantProps[];

      const useCase = BulkGrantEntityPermissionsUseCaseFactory.default();
      await useCase.execute({ sharedIds: ids, grants, isPublic });
    }

    this.response.json(body);
  }
}

export { EntityPermissionsController };
export type { RequestDto as EntityPermissionsRequestDto };
