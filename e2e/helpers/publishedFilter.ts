import { host } from '../config';
import disableTransitions from './disableTransitions';

const assessFilterStatus = async () => {
  const publishedStatus = await page.evaluate(
    'document.querySelector("#publishedStatuspublished").getAttribute("data-State")'
  );
  const restrcitedStatus = await page.evaluate(
    'document.querySelector("#publishedStatusrestricted").getAttribute("data-State")'
  );
  return [publishedStatus === '2', restrcitedStatus === '2'];
};

const goToPublishedEntities = async () => {
  await page.goto(host);

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

  const [publishedSelected, restrcitedSelected] = await assessFilterStatus();
  if (!publishedSelected) {
    await page.click('[title="Published"]');
    await page.waitForNavigation();
  }
  if (!restrcitedSelected) {
    await page.click('[title="Restricted"]');
    await page.waitForNavigation();
  }
  await disableTransitions();
};

export { goToPublishedEntities, goToRestrictedEntities, goToAllEntities };
