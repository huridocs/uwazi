import { EventsBus } from '#api/core/libs/eventsbus/index.js';
import { TemplateDeletedEvent } from '#api/core/domain/template/events/TemplateDeletedEvent.js';
import { TemplateUpdatedEvent } from '#api/core/domain/template/events/TemplateUpdatedEvent.js';
import { ReconcileFiltersOnTemplateChange } from '../ReconcileFiltersOnTemplateChange.js';

const createSut = (isRunning = false) => {
  const settingsService = {
    removeTemplateFromFilters: jest.fn().mockResolvedValue(true),
    updateFilterName: jest.fn().mockResolvedValue(true),
  };
  const transactionManager = {
    isRunning: jest.fn().mockReturnValue(isRunning),
    run: jest.fn(async (callback: () => Promise<unknown>) => callback()),
  };
  const eventBus = new EventsBus();
  new ReconcileFiltersOnTemplateChange(eventBus, () => ({
    settingsService: settingsService as never,
    transactionManager: transactionManager as never,
  })).start();

  return { eventBus, settingsService, transactionManager };
};

describe('ReconcileFiltersOnTemplateChange', () => {
  it('should remove the template from filters when it is deleted', async () => {
    const { eventBus, settingsService, transactionManager } = createSut();

    await eventBus.emit(new TemplateDeletedEvent({ templateId: 'tmpl1' }));

    expect(transactionManager.run).toHaveBeenCalled();
    expect(settingsService.removeTemplateFromFilters).toHaveBeenCalledWith('tmpl1');
  });

  it('should rename the filter when the template name changes', async () => {
    const { eventBus, settingsService } = createSut();

    await eventBus.emit(
      new TemplateUpdatedEvent({
        before: { _id: 'tmpl1', name: 'Old name' } as never,
        after: { _id: 'tmpl1', name: 'New name' } as never,
      })
    );

    expect(settingsService.updateFilterName).toHaveBeenCalledWith('tmpl1', 'New name');
  });

  it('should skip the write when the template name did not change', async () => {
    const { eventBus, settingsService, transactionManager } = createSut();

    await eventBus.emit(
      new TemplateUpdatedEvent({
        before: { _id: 'tmpl1', name: 'Same' } as never,
        after: { _id: 'tmpl1', name: 'Same' } as never,
      })
    );

    expect(transactionManager.run).not.toHaveBeenCalled();
    expect(settingsService.updateFilterName).not.toHaveBeenCalled();
  });

  it('should not nest a transaction when one is already running', async () => {
    const { eventBus, settingsService, transactionManager } = createSut(true);

    await eventBus.emit(new TemplateDeletedEvent({ templateId: 'tmpl1' }));

    expect(transactionManager.run).not.toHaveBeenCalled();
    expect(settingsService.removeTemplateFromFilters).toHaveBeenCalledWith('tmpl1');
  });
});
