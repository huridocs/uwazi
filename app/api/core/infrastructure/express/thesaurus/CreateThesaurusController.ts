import { AbstractController } from '#api/common.v2/infrastructure/AbstractController.js';
import { CreateThesaurusUseCaseInput } from '#api/core/application/CreateThesaurus.js';
import { CSVLoader } from '#api/csv/index.js';
import { ObjectId } from 'mongodb';
import { LoggerFactory } from '../../factories/LoggerFactory.js';
import { CreateThesaurusUseCaseFactory } from '../../factories/CreateThesaurusUseCaseFactory.js';
import { ThesaurusDBO } from '../../mongodb/thesauri/ThesaurusDBO.js';
import { MongoThesaurusMapper } from '../../mongodb/thesauri/MongoThesaurusMapper.js';

type RequestDto = CreateThesaurusUseCaseInput;

type ResponseDto = ThesaurusDBO;

class CreateThesaurusController extends AbstractController<RequestDto> {
  protected async handle(): Promise<void> {
    const logger = LoggerFactory.default();
    const useCase = CreateThesaurusUseCaseFactory.default();

    try {
      const startTime = Date.now();
      const output = await useCase.execute(
        this.request.file ? JSON.parse((this.request.body as any)?.thesauri) : this.request?.body
      );
      logger.info('Thesaurus Creation executed successfully', {
        namespace: 'Thesaurus_Creation',
        success: true,

        valuesCount: this.request?.body?.values?.length || 0,
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

        const loaded = await loader.loadThesauri(this.request.file.path, output.id, {
          language: this.language,
        });
        response = { ...loaded, _id: new ObjectId(loaded._id) };
      }

      this.response.json(response);
      this.request.sockets.emitToCurrentTenant('thesauriChange', response);
    } catch (error: unknown) {
      logger.info(
        `Thesaurus Creation execution failed: ${error instanceof Error ? error.message : 'Unknown error'}`,
        {
          namespace: 'Thesaurus_Creation',
          success: false,

          dto: JSON.stringify(this.request?.body || {}),
          error: JSON.stringify(error),
        }
      );

      throw error;
    }
  }
}

export { CreateThesaurusController };
