import React from 'react';
import { AlertBanner } from '#V2/Components/UI/index.js';
import { Translate } from '#app/I18N/index.js';

const SyncDangerWarning = () => (
  <AlertBanner variant="warning">
    <p className="font-semibold">
      <Translate>
        Do not change sync configuration unless you know exactly what you are doing.
      </Translate>
    </p>
    <p className="mt-1">
      <Translate>
        Sync pushes selected templates and properties to a remote Uwazi instance. Incorrect
        configuration can overwrite or delete data on the remote collection.
      </Translate>
    </p>
  </AlertBanner>
);

const SyncActivateWarning = ({ activating }: { activating: boolean }) => (
  <AlertBanner variant="warning">
    {activating ? (
      <Translate>
        Activating sync will start pushing changes to the remote instance. Make sure the remote URL
        and credentials are correct before continuing.
      </Translate>
    ) : (
      <Translate>
        Deactivating sync stops outbound synchronization. Data already synced on the remote instance
        will remain there until changed or deleted manually.
      </Translate>
    )}
  </AlertBanner>
);

const SyncRemoveTemplateWarning = () => (
  <AlertBanner variant="error">
    <Translate>
      Removing a template from sync can cause matching entities to be deleted on the synchronized
      remote instance. Only continue if you intend that outcome.
    </Translate>
  </AlertBanner>
);

export { SyncDangerWarning, SyncActivateWarning, SyncRemoveTemplateWarning };
