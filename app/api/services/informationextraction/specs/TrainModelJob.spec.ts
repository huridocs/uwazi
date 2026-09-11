import { TestUtils } from '#api/common.v2/utils/Test.js';
import { NonRetryableJobError } from '#api/core/libs/queue/infrastructure/errors.js';
import { testingEnvironment } from '#api/utils/testingEnvironment.js';
import * as setupSockets from '#api/socketio/setupSockets.js';
import { IXTrainModelJob, UntrainableExtractorSource } from '../TrainModelJob.js';
import { TrainModelForPDF } from '../TrainModelForPDF.js';
import { NoEntitiesForTraining, TrainModelForText } from '../TrainModelForText.js';
import { NoFilesForTraining, NoLabeledEntities, NoSegmentedFiles } from '../ixMaterials.js';
import { ExtractorNotFound, Extractors } from '../ixextractors.js';
import ixmodels from '../ixmodels.js';

jest.mock('api/socketio/setupSockets');

type Props = {
  trainModelForPDF: TrainModelForPDF;
  trainModelForText: TrainModelForText;
  extractorsDS: typeof Extractors;
};

const createSut = ({ extractorsDS, trainModelForPDF, trainModelForText }: Props) => {
  const sut = new IXTrainModelJob({
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

    const promise = sut.handleDispatch(undefined as any, {
      extractorId: 'any_extractor_id',
      userId: 'user1',
    });

    await expect(promise).rejects.toThrow(new NonRetryableJobError(error));
  });

  describe('when the job itself cannot start the training', () => {
    let markReady: jest.SpyInstance;
    let emit: jest.SpyInstance;

    beforeEach(() => {
      markReady = jest.spyOn(ixmodels, 'markReady').mockResolvedValue(undefined as any);
      emit = jest.spyOn(setupSockets, 'emitToTenantAdminsAndEditors').mockImplementation(() => {});
    });

    afterEach(() => {
      markReady.mockRestore();
      emit.mockRestore();
    });

    // Neither branch of `handle` matches, so nothing was ever sent for training. Without an
    // explicit failure the job returned successfully and left the model at
    // `status: processing, findingSuggestions: true` forever, with nothing surfaced anywhere.
    it('should fail, release the model and notify when the source is neither pdf nor property', async () => {
      const { sut, trainModelForPDF, trainModelForText } = createSut({
        extractorsDS: TestUtils.mockClass<typeof Extractors>({
          getById: jest.fn().mockResolvedValue({ _id: 'extractor1', source: {} }),
        }),
        trainModelForPDF: TestUtils.mockClass<TrainModelForPDF>({ execute: jest.fn() }),
        trainModelForText: TestUtils.mockClass<TrainModelForText>({ execute: jest.fn() }),
      });

      const promise = sut.handleDispatch(undefined as any, {
        extractorId: 'extractor1',
        userId: 'user1',
      });

      await expect(promise).rejects.toThrow(
        new NonRetryableJobError(new UntrainableExtractorSource('extractor1'))
      );
      expect(trainModelForPDF.execute).not.toHaveBeenCalled();
      expect(trainModelForText.execute).not.toHaveBeenCalled();
      expect(markReady).toHaveBeenCalledWith('extractor1');
      expect(emit).toHaveBeenCalledWith(
        expect.any(String),
        'ix:error_training_model',
        expect.objectContaining({ message: expect.stringContaining('extractor1') })
      );
    });

    it('should release the model and notify when the extractor is gone', async () => {
      const { sut } = createSut({
        extractorsDS: TestUtils.mockClass<typeof Extractors>({
          getById: jest.fn().mockResolvedValue(undefined),
        }),
        trainModelForPDF: TestUtils.mockClass<TrainModelForPDF>({ execute: jest.fn() }),
        trainModelForText: TestUtils.mockClass<TrainModelForText>({ execute: jest.fn() }),
      });

      const promise = sut.handleDispatch(undefined as any, {
        extractorId: 'extractor1',
        userId: 'user1',
      });

      await expect(promise).rejects.toThrow(
        new NonRetryableJobError(new ExtractorNotFound('extractor1'))
      );
      expect(markReady).toHaveBeenCalledWith('extractor1');
      expect(emit).toHaveBeenCalled();
    });
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

    const promise = sut.handleDispatch(undefined as any, { extractorId: 'any', userId: 'user1' });

    await expect(promise).rejects.toThrow(error);
  });
});
