import { AbstractController } from 'api/common.v2/infrastructure/AbstractController';
import { CreateThesaurusUseCaseInput } from 'api/core/application/CreateThesaurus';
import { CSVLoader } from 'api/csv';
import { ObjectId } from 'mongodb';
import { TimedMethod } from 'api/core/libs/logger/TimedMethodDecorator';
import { LoggerFactory } from '../../factories/LoggerFactory';
import { CreateThesaurusUseCaseFactory } from '../../factories/CreateThesaurusUseCaseFactory';
import { ThesaurusDBO } from '../../mongodb/thesauri/ThesaurusDBO';
import { MongoThesaurusMapper } from '../../mongodb/thesauri/MongoThesaurusMapper';

type RequestDto = CreateThesaurusUseCaseInput;

type ResponseDto = ThesaurusDBO;

class CreateThesaurusController extends AbstractController<RequestDto> {
  @TimedMethod('create_thesaurus_controller')
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

        response = (await loader.loadThesauri(this.request.file.path, new ObjectId(output.id), {
          language: this.language,
        })) as ThesaurusDBO;
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
