import { TestUtils } from 'api/common.v2/utils/Test';
import { NonRetryableJobError } from 'api/core/libs/queue/infrastructure/errors';
import { testingEnvironment } from 'api/utils/testingEnvironment';
import { IXTrainModelJob } from '../TrainModelJob';
import { TrainModelForPDF } from '../TrainModelForPDF';
import { NoEntitiesForTraining, TrainModelForText } from '../TrainModelForText';
import { NoFilesForTraining, NoLabeledEntities, NoSegmentedFiles } from '../ixMaterials';
import { ExtractorNotFound, Extractors } from '../ixextractors';

type Props = {
  trainModelForPDF: TrainModelForPDF;
  trainModelForText: TrainModelForText;
  extractorsDS: typeof Extractors;
};

const createSut = ({ extractorsDS, trainModelForPDF, trainModelForText }: Props) => {
  const sut = new IXTrainModelJob({
    tenantName: 'any_tenant',
    trainModelForPDF,
    trainModelForText,
    extractorsDS,
  });

  return {
    sut,
    trainModelForPDF,
    trainModelForText,
  };
};

describe('TrainModelJob', () => {
  beforeAll(async () => {
    await testingEnvironment.setUp({});
  });

  afterAll(async () => {
    await testingEnvironment.tearDown();
  });

  it.each([
    {
      error: new NoEntitiesForTraining(),
      extractor: {
        source: { property: 'any_property' },
      },
    },
    {
      error: new NoFilesForTraining(),
      extractor: {
        source: {
          pdf: true,
        },
      },
    },
    {
      error: new NoLabeledEntities(),
      extractor: {
        source: {
          pdf: true,
        },
      },
    },
    {
      error: new NoSegmentedFiles(),
      extractor: {
        source: {
          pdf: true,
        },
      },
    },
    {
      error: new ExtractorNotFound('any_extractor_id'),
      extractor: {
        source: {
          pdf: true,
        },
      },
    },
  ])('should catch and convert to NonRetryableJobError', async ({ error, extractor }) => {
    const { sut } = createSut({
      extractorsDS: TestUtils.mockClass<typeof Extractors>({
        getById: jest.fn().mockResolvedValue(extractor),
      }),
      trainModelForPDF: TestUtils.mockClass<TrainModelForPDF>({
        execute: jest.fn().mockRejectedValue(error),
      }),
      trainModelForText: TestUtils.mockClass<TrainModelForText>({
        execute: jest.fn().mockRejectedValue(error),
      }),
    });

    const promise = sut.handleDispatch(undefined as any, { extractorId: 'any_extractor_id' });

    await expect(promise).rejects.toThrow(new NonRetryableJobError(error));
  });

  it('should NOT map to NonRetryableJobError', async () => {
    const error = new Error('any_error');
    const { sut } = createSut({
      extractorsDS: TestUtils.mockClass<typeof Extractors>({
        getById: jest.fn().mockResolvedValue({ source: { property: 'any' } }),
      }),
      trainModelForPDF: TestUtils.mockClass<TrainModelForPDF>({
        execute: jest.fn().mockRejectedValue(error),
      }),
      trainModelForText: TestUtils.mockClass<TrainModelForText>({
        execute: jest.fn().mockRejectedValue(error),
      }),
    });

    const promise = sut.handleDispatch(undefined as any, { extractorId: 'any' });

    await expect(promise).rejects.toThrow(error);
  });
});
