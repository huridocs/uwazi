import { host } from '../config';
import disableTransitions from './disableTransitions';

const goToPublishedEntities = async () => {
  await page.goto(host);
  await disableTransitions();
};

const goToRestrictedEntities = async () => {
  await page.goto(host);
  await disableTransitions();
  await page.click('[title="Restricted"]');
  await page.click('[title="Published"]');
  await page.waitForNavigation();
};

const goToAllEntities = async () => {
  await page.goto(host);
  await disableTransitions();
  await page.click('[title="Restricted"]');
  await page.waitForNavigation();
};

export { goToPublishedEntities, goToRestrictedEntities, goToAllEntities };
