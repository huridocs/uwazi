import { UwaziJobHandler, UwaziJobParams } from '#api/core/infrastructure/jobs/UwaziJobHandler.js';
import { emitToTenant } from '#api/socketio/setupSockets.js';
import { JobsDispatcher } from '#api/core/libs/queue/application/contracts/JobsDispatcher.js';
import { ObjectId } from 'mongodb';
import ixmodels from '#api/services/informationextraction/ixmodels.js';
import { HeartbeatCallback } from '#api/core/libs/queue/application/contracts/Dispatchable.js';
import { AcceptSuggestionsUseCase } from '../application/AcceptSuggestionsUseCase.js';

type CustomParams = UwaziJobParams & {
  tenantName: string;
  extractorId: string;
};

type Props = {
  tenantName: string;
  useCase: AcceptSuggestionsUseCase;
  dispatcher: JobsDispatcher;
  batchSize: number;
};

export class AcceptSuggestionsJob extends UwaziJobHandler<CustomParams> {
  private props: Required<
    Props & { useCase: AcceptSuggestionsUseCase; dispatcher: JobsDispatcher; batchSize: number }
  >;

  constructor(
    props: Props & {
      useCase: AcceptSuggestionsUseCase;
      dispatcher: JobsDispatcher;
      batchSize: number;
    }
  ) {
    super();
    this.props = props as Required<
      Props & { useCase: AcceptSuggestionsUseCase; dispatcher: JobsDispatcher; batchSize: number }
    >;
  }

  // eslint-disable-next-line max-statements
  async handle(_heartBeatCallBack: HeartbeatCallback, params: CustomParams): Promise<void> {
    const { extractorId } = params;
    try {
      const { processed, progress } = await this.props.useCase.execute({
        extractorId,
        batchSize: this.props.batchSize,
      });

      if (progress) {
        const remaining = Math.max(0, (progress.total || 0) - (progress.processed || 0));
        emitToTenant(
          params.tenantName,
          'ix_model_status',
          extractorId,
          'processing_auto_accept',
          '',
          { total: progress.total, processed: progress.processed, remaining }
        );
        // If completed, finish without redispatch
        if ((progress.total || 0) > 0 && progress.processed >= (progress.total || 0)) {
          await ixmodels.stopTraining(ObjectId.createFromHexString(extractorId));
          emitToTenant(params.tenantName, 'ix_model_status', extractorId, 'ready', 'Completed');
          return;
        }
      } else {
        emitToTenant(params.tenantName, 'ix_model_status', extractorId, 'processing_auto_accept');
      }

      if (processed > 0) {
        await this.props.dispatcher.dispatch(AcceptSuggestionsJob, {
          extractorId,
          tenantName: params.tenantName,
          userId: params.userId,
        });
        return;
      }

      // Auto-accept finished: cleanup model run and emit 'ready'
      await ixmodels.stopTraining(ObjectId.createFromHexString(extractorId));
      emitToTenant(params.tenantName, 'ix_model_status', extractorId, 'ready', 'Completed');
    } catch (e) {
      // On error, best-effort cleanup to avoid leaving model in processing state
      await ixmodels.unsetProcessRun(extractorId);
      await ixmodels.stopTraining(ObjectId.createFromHexString(extractorId));
      throw e;
    }
  }
}
