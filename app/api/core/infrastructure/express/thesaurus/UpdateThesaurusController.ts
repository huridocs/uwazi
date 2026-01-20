import { AbstractController } from 'api/common.v2/infrastructure/AbstractController';
import { z } from 'zod';
import { UpdateThesaurusUseCaseInput } from 'api/core/application/UpdateThesaurus';
import { LoggerFactory } from '../../factories/LoggerFactory';
import { ThesaurusDBO } from '../../mongodb/thesauri/ThesaurusDBO';
import { MongoThesaurusMapper } from '../../mongodb/thesauri/MongoThesaurusMapper';
import { UpdateThesaurusUseCaseFactory } from '../../factories/UpdateThesaurusUseCaseFactory';

const ValueEntrySchema = z.object({
  label: z.string(),
  id: z.string().optional(),
});

const ValueSchema = z.object({
  label: z.string(),
  id: z.string().optional(),
  values: z.array(ValueEntrySchema).optional(),
});

const RequestSchema = z.object({
  _id: z.string(),
  name: z.string(),
  values: z.array(ValueSchema),
});

type RequestDto = z.infer<typeof RequestSchema>;

type ResponseDto = ThesaurusDBO;

class UpdateThesaurusController extends AbstractController<RequestDto> {
  protected async handle(): Promise<void> {
    const logger = LoggerFactory.default();
    const useCase = UpdateThesaurusUseCaseFactory.default();

    try {
      const startTime = Date.now();

      const parsed = RequestSchema.parse(this.request?.body);
      const mapped: UpdateThesaurusUseCaseInput = {
        id: parsed._id,
        name: parsed.name,
        values: parsed.values,
      };

      const output = await useCase.execute(mapped);

      logger.info('Thesaurus Update executed successfully', {
        namespace: 'Thesaurus_Update',
        success: true,

        valuesCount: parsed.values.length,
        durationMs: Date.now() - startTime,
      });

      const response: ResponseDto = MongoThesaurusMapper.toDBO(output);

      this.request.sockets.emitToCurrentTenant('thesauriChange', response);
      this.response.status(200).json(response);
    } catch (error: unknown) {
      logger.info(
        `Thesaurus Update execution failed: ${error instanceof Error ? error.message : 'Unknown error'}`,
        {
          namespace: 'Thesaurus_Update',
          success: false,

          dto: JSON.stringify(this.request?.body || {}),
          error: JSON.stringify(error),
        }
      );

      throw error;
    }
  }
}

export { UpdateThesaurusController };
