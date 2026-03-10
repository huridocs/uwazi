import { emitToTenant } from 'api/socketio/setupSockets';
import { JobsDispatcher } from 'api/core/libs/queue/application/contracts/JobsDispatcher';
import { ObjectId } from 'mongodb';
import ixmodels from 'api/services/informationextraction/ixmodels';
import {
  UserAwareDispatchable,
  UserAwareDispatchableParams,
} from 'api/core/libs/queue/application/contracts/UserAwareDispatchable';
import { HeartbeatCallback } from 'api/core/libs/queue/application/contracts/Dispatchable';
import { AcceptSuggestionsUseCase } from '../application/AcceptSuggestionsUseCase';

type CustomParams = UserAwareDispatchableParams & {
  extractorId: string;
};

type Props = {
  tenantName: string;
  useCase: AcceptSuggestionsUseCase;
  dispatcher: JobsDispatcher;
  batchSize: number;
};

export class AcceptSuggestionsJob extends UserAwareDispatchable<CustomParams> {
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
  async handle(_heartBeatCallBack: HeartbeatCallback): Promise<void> {
    const { extractorId } = this.params;
    try {
      const { processed, progress } = await this.props.useCase.execute({
        extractorId,
        batchSize: this.props.batchSize,
      });

      if (progress) {
        const remaining = Math.max(0, (progress.total || 0) - (progress.processed || 0));
        emitToTenant(
          this.tenantName,
          'ix_model_status',
          extractorId,
          'processing_auto_accept',
          '',
          { total: progress.total, processed: progress.processed, remaining }
        );
        // If completed, finish without redispatch
        if ((progress.total || 0) > 0 && progress.processed >= (progress.total || 0)) {
          await ixmodels.stopTraining(ObjectId.createFromHexString(extractorId));
          emitToTenant(this.tenantName, 'ix_model_status', extractorId, 'ready', 'Completed');
          return;
        }
      } else {
        emitToTenant(this.tenantName, 'ix_model_status', extractorId, 'processing_auto_accept');
      }

      if (processed > 0) {
        await this.props.dispatcher.dispatch(AcceptSuggestionsJob, {
          extractorId,
          tenantName: this.tenantName,
          userId: this.userId,
        });
        return;
      }

      // Auto-accept finished: cleanup model run and emit 'ready'
      await ixmodels.stopTraining(ObjectId.createFromHexString(extractorId));
      emitToTenant(this.tenantName, 'ix_model_status', extractorId, 'ready', 'Completed');
    } catch (e) {
      // On error, best-effort cleanup to avoid leaving model in processing state
      await ixmodels.unsetProcessRun(extractorId);
      await ixmodels.stopTraining(ObjectId.createFromHexString(extractorId));
      throw e;
    }
  }
}
