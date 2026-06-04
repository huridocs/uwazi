import { AbstractController } from '#api/common.v2/infrastructure/AbstractController.js';
import { z } from 'zod';
import { UpdateThesaurusUseCaseInput } from '#api/core/application/UpdateThesaurus.js';
import { CSVLoader } from '#api/csv/index.js';
import { ObjectId } from 'mongodb';
import { LoggerFactory } from '../../factories/LoggerFactory.js';
import { ThesaurusDBO } from '../../mongodb/thesauri/ThesaurusDBO.js';
import { MongoThesaurusMapper } from '../../mongodb/thesauri/MongoThesaurusMapper.js';
import { UpdateThesaurusUseCaseFactory } from '../../factories/UpdateThesaurusUseCaseFactory.js';

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

/**
 * Note:  Validation at the border (controller) or validation inside domain objects
 * 1. This is the case where we have validation inside the domain object (Thesaurus), but also here at controller level.
 * 2. At the Controller level, we validate some minor details things, if you check, we mostly validate same thing.
 * (compare this schema with the one executed on the Thesaurus domain object)
 * 3. Strange thing is that, the Controller that creates thesaurus (CreateThesaurusController) does not have this validation at controller level,
 * because validation on domain object is considered enough.
 *
 * We need to standardize this approach, discuss patterns..
 */

type RequestDto = z.infer<typeof RequestSchema>;

type ResponseDto = ThesaurusDBO;

class UpdateThesaurusController extends AbstractController<RequestDto> {
  protected async handle(): Promise<void> {
    const logger = LoggerFactory.default();
    const useCase = UpdateThesaurusUseCaseFactory.default();

    try {
      const startTime = Date.now();

      const parsed = RequestSchema.parse(
        this.request.file ? JSON.parse((this.request.body as any)?.thesauri) : this.request?.body
      );
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

      let response: ResponseDto = MongoThesaurusMapper.toDBO(output);

      if (this.request.file) {
        /**
         * Note: Import Thesaurus values from CSV file
         *  1. Feature seems to be very fragile from UI/UX to backend architecture.
         *  2. This feature needs proper re-design and re-implementation.
         * 3. Validations, tracking etc..
         */

        const loader = new CSVLoader();

        const loaded = await loader.loadThesauri(this.request.file.path, new ObjectId(output.id), {
          language: this.language,
        });
        response = { ...loaded, _id: new ObjectId(loaded._id) };
      }

      this.response.json(response);
      this.request.sockets.emitToCurrentTenant('thesauriChange', response);
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
