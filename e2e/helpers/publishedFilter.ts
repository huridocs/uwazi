import { host } from '../config';
import disableTransitions from './disableTransitions';

const assessFilterStatus = async () => {
  const publishedStatus = await page.evaluate(
    () => document.querySelector('#publishedStatuspublished')?.getAttribute('data-state')
  );

  const restrictedStatus = await page.evaluate(
    () => document.querySelector('#publishedStatusrestricted')?.getAttribute('data-state')
  );

  return [publishedStatus === '2', restrictedStatus === '2'];
};

const goToPublishedEntities = async () => {
  await page.goto(host);
  await page.waitForSelector('[title="Published"]');
  const [publishedSelected, restrcitedSelected] = await assessFilterStatus();
  if (!publishedSelected) {
    await page.click('[title="Published"]');
    await page.waitForNavigation();
  }
  if (restrcitedSelected) {
    await page.click('[title="Restricted"]');
    await page.waitForNavigation();
  }
  await disableTransitions();
};

const goToRestrictedEntities = async () => {
  await page.goto(host);
  await page.waitForSelector('[title="Published"]');
  const [publishedSelected, restrcitedSelected] = await assessFilterStatus();
  if (publishedSelected) {
    await page.click('[title="Published"]');
    await page.waitForNavigation();
  }
  if (!restrcitedSelected) {
    await page.click('[title="Restricted"]');
    await page.waitForNavigation();
  }
  await disableTransitions();
};

const goToAllEntities = async () => {
  await page.goto(host);
  await disableTransitions();
  await page.waitForSelector('#publishedStatuspublished');

  const [publishedSelected, restrictedStatus] = await assessFilterStatus();
  if (!publishedSelected) {
    await page.click('[title="Published"]');
    await page.waitForNavigation();
  }
  if (!restrictedStatus) {
    await page.click('[title="Restricted"]');
    await page.waitForNavigation();
  }
  await disableTransitions();
};

export { goToPublishedEntities, goToRestrictedEntities, goToAllEntities };
