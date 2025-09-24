// @ts-expect-error TS(2307): Cannot find module '../socketio/setupSockets.js' o... Remove this comment to see the full error message
import { emitToTenant } from '../socketio/setupSockets.js';
// @ts-expect-error TS(2307): Cannot find module '../queue.v2/application/contra... Remove this comment to see the full error message
import { JobsDispatcher } from '../queue.v2/application/contracts/JobsDispatcher.js';
import { ObjectId } from 'mongodb';
// @ts-expect-error TS(2307): Cannot find module '../services/informationextract... Remove this comment to see the full error message
import ixmodels from '../services/informationextraction/ixmodels.js';
import {
  UserAwareDispatchable,
  UserAwareDispatchableParams,
  // @ts-expect-error TS(2307): Cannot find module '../queue.v2/application/contra... Remove this comment to see the full error message
} from '../queue.v2/application/contracts/UserAwareDispatchable.js';
// @ts-expect-error TS(2307): Cannot find module '../queue.v2/application/contra... Remove this comment to see the full error message
import { HeartbeatCallback } from '../queue.v2/application/contracts/Dispatchable.js';
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
    // @ts-expect-error TS(2339): Property 'params' does not exist on type 'AcceptSu... Remove this comment to see the full error message
    const { extractorId } = this.params;
    try {
      const { processed, progress } = await this.props.useCase.execute({
        extractorId,
        batchSize: this.props.batchSize,
      });

      if (progress) {
        const remaining = Math.max(0, (progress.total || 0) - (progress.processed || 0));
        emitToTenant(
          // @ts-expect-error TS(2339): Property 'tenantName' does not exist on type 'Acce... Remove this comment to see the full error message
          this.tenantName,
          'ix_model_status',
          extractorId,
          'processing_auto_accept',
          '',
          { total: progress.total, processed: progress.processed, remaining }
        );
      } else {
        // @ts-expect-error TS(2339): Property 'tenantName' does not exist on type 'Acce... Remove this comment to see the full error message
        emitToTenant(this.tenantName, 'ix_model_status', extractorId, 'processing_auto_accept');
      }

      if (processed > 0) {
        await this.props.dispatcher.dispatch(AcceptSuggestionsJob, {
          extractorId,
          // @ts-expect-error TS(2339): Property 'tenantName' does not exist on type 'Acce... Remove this comment to see the full error message
          tenantName: this.tenantName,
          // @ts-expect-error TS(2339): Property 'userId' does not exist on type 'AcceptSu... Remove this comment to see the full error message
          userId: this.userId,
        });
        return;
      }

      // Auto-accept finished: cleanup model run and emit 'ready'
      await ixmodels.stopTraining(ObjectId.createFromHexString(extractorId));
      // @ts-expect-error TS(2339): Property 'tenantName' does not exist on type 'Acce... Remove this comment to see the full error message
      emitToTenant(this.tenantName, 'ix_model_status', extractorId, 'ready', 'Completed');
    } catch (e) {
      // On error, best-effort cleanup to avoid leaving model in processing state
      await ixmodels.unsetProcessRun(extractorId);
      await ixmodels.stopTraining(ObjectId.createFromHexString(extractorId));
      throw e;
    }
  }
}
