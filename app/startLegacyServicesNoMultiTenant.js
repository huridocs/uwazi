import { config } from 'api/config';
import settings from 'api/settings/settings';
import { Repeater } from 'api/utils/Repeater';
import { TaskProvider } from 'shared/tasks/tasks';
import vaultSync from './api/evidences_vault';

async function startLegacyServicesNoMultiTenant() {
  if (config.multiTenant || config.clusterMode) {
    return;
  }

  const { evidencesVault } = await settings.get({}, '+evidencesVault');
  if (evidencesVault) {
    console.info('==> 📥  evidences vault config detected, started sync ....');
    const vaultSyncRepeater = new Repeater(() => vaultSync.sync(evidencesVault), 10000);
    vaultSyncRepeater.start();
  }

  const anHour = 3600000;
  const topicClassificationRepeater = new Repeater(
    () =>
      TaskProvider.runAndWait('TopicClassificationSync', 'TopicClassificationSync', {
        mode: 'onlynew',
        noDryRun: true,
        overwrite: true,
      }),
    anHour
  );
  topicClassificationRepeater.start();
}

export { startLegacyServicesNoMultiTenant };
