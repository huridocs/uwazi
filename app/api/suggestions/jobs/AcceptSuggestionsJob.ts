import { Dispatchable, HeartbeatCallback } from 'api/queue.v2/application/contracts/Dispatchable';
import { tenants } from 'api/tenants';
import { IXSuggestionsModel } from 'api/suggestions/IXSuggestionsModel';
import ixmodels from 'api/services/informationextraction/ixmodels';
import { Suggestions } from 'api/suggestions/suggestions';
import { emitToTenant } from 'api/socketio/setupSockets';

type CustomParams = {
  extractorId: string;
};

type Props = {
  tenantName: string;
};

export class AcceptSuggestionsJob implements Dispatchable {
  private props: Required<Props>;

  constructor(props: Props) {
    this.props = props as Required<Props>;
  }

  async handleDispatch(_: HeartbeatCallback, { extractorId }: CustomParams): Promise<void> {
    // eslint-disable-next-line max-statements
    await tenants.run(async () => {
      const [model] = await ixmodels.get({ extractorId: extractorId as any });
      if (!model) return;

      const processRun: any = (model as any)?.processRun || {};
      const auto = processRun.autoAccept || {};
      const overwriteAll = auto.overwriteMode === 'overwrite_all';

      const match: any = {
        extractorId: model.extractorId,
        status: 'ready',
        date: { $ne: null },
        'state.withSuggestion': true,
      };
      if (auto.source !== 'all' && model.processRun?.suggestionsRunTimestamp) {
        match['modelData.suggestionsRunTimestamp'] = model.processRun.suggestionsRunTimestamp;
      }
      match['state.obsolete'] = { $ne: true };
      match['state.error'] = { $ne: true };
      if (!overwriteAll) match['state.withValue'] = { $ne: true };

      const BATCH = 50;
      const suggestions = await IXSuggestionsModel.get(match, '_id entityId');

      // Initialize progress total if missing
      if (!(model as any)?.processRun?.autoAcceptProgress?.total) {
        const total = await IXSuggestionsModel.db.countDocuments(match);
        await ixmodels.setAutoAcceptProgress(model.extractorId, { total, processed: 0 });
        emitToTenant(
          this.props.tenantName,
          'ix_model_status',
          extractorId,
          'processing_auto_accept',
          '',
          {
            total,
            processed: 0,
          }
        );
      }
      const toAccept = suggestions.slice(0, BATCH).map(s => ({
        _id: s._id,
        sharedId: s.entityId,
        entityId: s.entityId,
        overwriteAll,
      })) as any[];

      if (toAccept.length === 0) {
        // Completed
        emitToTenant(this.props.tenantName, 'ix_model_status', extractorId, 'ready', 'Completed');
        await ixmodels.unsetProcessRun(model.extractorId);
        return;
      }

      await Suggestions.accept(toAccept);

      // Update processed and emit progress every batch
      await ixmodels.incAutoAcceptProcessed(model.extractorId, toAccept.length);
      const [after] = await ixmodels.get({ extractorId: extractorId as any });
      const progress = (after as any)?.processRun?.autoAcceptProgress || {};
      emitToTenant(
        this.props.tenantName,
        'ix_model_status',
        extractorId,
        'processing_auto_accept',
        '',
        {
          total: progress.total || 0,
          processed: progress.processed || 0,
        }
      );

      const { DefaultDispatcher } = await import('api/queue.v2/configuration/factories');
      const dispatcher = await DefaultDispatcher(tenants.current().name, {
        lockWindow: 1000 * 60 * 10,
      });
      await dispatcher.dispatch(AcceptSuggestionsJob, { extractorId });
    }, this.props.tenantName);
  }
}
