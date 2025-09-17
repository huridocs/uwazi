import { Dispatchable, HeartbeatCallback } from 'api/queue.v2/application/contracts/Dispatchable';
import { emitToTenant } from 'api/socketio/setupSockets';
import { JobsDispatcher } from 'api/queue.v2/application/contracts/JobsDispatcher';
import { tenants } from 'api/tenants';
import { ObjectId } from 'mongodb';
import ixmodels from 'api/services/informationextraction/ixmodels';
import { AcceptSuggestionsUseCase } from '../application/AcceptSuggestionsUseCase';

type CustomParams = {
  extractorId: string;
};

type Props = {
  tenantName: string;
  useCase: AcceptSuggestionsUseCase;
  dispatcher: JobsDispatcher;
  batchSize: number;
};

export class AcceptSuggestionsJob implements Dispatchable {
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
    this.props = props as Required<
      Props & { useCase: AcceptSuggestionsUseCase; dispatcher: JobsDispatcher; batchSize: number }
    >;
  }

  async handleDispatch(_: HeartbeatCallback, { extractorId }: CustomParams): Promise<void> {
    // eslint-disable-next-line max-statements
    await tenants.run(async () => {
      try {
        const { processed, progress } = await this.props.useCase.execute({
          extractorId,
          batchSize: this.props.batchSize,
        });

        if (progress) {
          const remaining = Math.max(0, (progress.total || 0) - (progress.processed || 0));
          emitToTenant(
            this.props.tenantName,
            'ix_model_status',
            extractorId,
            'processing_auto_accept',
            '',
            { total: progress.total, processed: progress.processed, remaining }
          );
        } else {
          emitToTenant(
            this.props.tenantName,
            'ix_model_status',
            extractorId,
            'processing_auto_accept'
          );
        }

        if (processed > 0) {
          await this.props.dispatcher.dispatch(AcceptSuggestionsJob, { extractorId });
          return;
        }

        // Auto-accept finished: cleanup model run and emit 'ready'
        await ixmodels.stopTraining(ObjectId.createFromHexString(extractorId));
        emitToTenant(this.props.tenantName, 'ix_model_status', extractorId, 'ready', 'Completed');
      } catch (e) {
        // On error, best-effort cleanup to avoid leaving model in processing state
        await ixmodels.unsetProcessRun(extractorId);
        await ixmodels.stopTraining(ObjectId.createFromHexString(extractorId));
        throw e;
      }
    }, this.props.tenantName);
  }
}
