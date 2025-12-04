import { AbstractController } from 'api/common.v2/infrastructure/AbstractController';
import { CreateThesaurusUseCaseInput } from 'api/core/application/CreateThesaurus';
import { LoggerFactory } from '../../factories/LoggerFactory';
import { CreateThesaurusUseCaseFactory } from '../../factories/CreateThesaurusUseCaseFactory';
import { ThesaurusDBO } from '../../mongodb/thesauri/ThesaurusDBO';
import { MongoThesaurusMapper } from '../../mongodb/thesauri/MongoThesaurusMapper';

type RequestDto = CreateThesaurusUseCaseInput;

type ResponseDto = ThesaurusDBO;

class CreateThesaurusController extends AbstractController<RequestDto> {
  protected async handle(): Promise<void> {
    const logger = LoggerFactory.default();
    const useCase = CreateThesaurusUseCaseFactory.default();

    try {
      const startTime = Date.now();
      const output = await useCase.execute(this.request?.body);
      logger.info('Thesaurus Creation executed successfully', {
        namespace: 'Thesaurus_Creation',
        success: true,

        valuesCount: this.request?.body?.values?.length || 0,
        durationMs: Date.now() - startTime,
      });

      const response: ResponseDto = MongoThesaurusMapper.toDBO(output);

      this.response.status(201).json(response);
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
