import { Dispatchable, HeartbeatCallback } from 'api/queue.v2/application/contracts/Dispatchable';
import { emitToTenant } from 'api/socketio/setupSockets';
import { JobsDispatcher } from 'api/queue.v2/application/contracts/JobsDispatcher';
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
    const { processed } = await this.props.useCase.execute({
      extractorId,
      batchSize: this.props.batchSize,
    });

    emitToTenant(this.props.tenantName, 'ix_model_status', extractorId, 'processing_auto_accept');

    if (processed > 0) {
      await this.props.dispatcher.dispatch(AcceptSuggestionsJob, { extractorId });
      return;
    }

    emitToTenant(this.props.tenantName, 'ix_model_status', extractorId, 'ready', 'Completed');
  }
}
