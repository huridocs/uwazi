import { config } from 'api/config';
import { Repeater } from 'api/utils/Repeater';
import { TaskProvider } from 'shared/tasks/tasks';

async function startLegacyServicesNoMultiTenant() {
  if (config.multiTenant || config.clusterMode) {
    return;
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
