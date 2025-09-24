import { host } from '../config';
import disableTransitions from './disableTransitions';

const assessFilterStatus = async () => {
  // @ts-expect-error TS(2304): Cannot find name 'page'.
  const publishedStatus = await page.evaluate(() =>
    document.querySelector('#publishedStatuspublished')?.getAttribute('data-state')
  );

  // @ts-expect-error TS(2304): Cannot find name 'page'.
  const restrictedStatus = await page.evaluate(() =>
    document.querySelector('#publishedStatusrestricted')?.getAttribute('data-state')
  );

  return [publishedStatus === '2', restrictedStatus === '2'];
};

const goToPublishedEntities = async () => {
  // @ts-expect-error TS(2304): Cannot find name 'page'.
  await page.goto(host);
  // @ts-expect-error TS(2304): Cannot find name 'page'.
  await page.waitForSelector('[title="Published"]');
  const [publishedSelected, restrcitedSelected] = await assessFilterStatus();
  if (!publishedSelected) {
    // @ts-expect-error TS(2304): Cannot find name 'page'.
    await page.click('[title="Published"]');
    // @ts-expect-error TS(2304): Cannot find name 'page'.
    await page.waitForNavigation();
  }
  if (restrcitedSelected) {
    // @ts-expect-error TS(2304): Cannot find name 'page'.
    await page.click('[title="Restricted"]');
    // @ts-expect-error TS(2304): Cannot find name 'page'.
    await page.waitForNavigation();
  }
  await disableTransitions();
};

const goToRestrictedEntities = async () => {
  // @ts-expect-error TS(2304): Cannot find name 'page'.
  await page.goto(host);
  // @ts-expect-error TS(2304): Cannot find name 'page'.
  await page.waitForSelector('[title="Published"]');
  const [publishedSelected, restrcitedSelected] = await assessFilterStatus();
  if (publishedSelected) {
    // @ts-expect-error TS(2304): Cannot find name 'page'.
    await page.click('[title="Published"]');
    // @ts-expect-error TS(2304): Cannot find name 'page'.
    await page.waitForNavigation();
  }
  if (!restrcitedSelected) {
    // @ts-expect-error TS(2304): Cannot find name 'page'.
    await page.click('[title="Restricted"]');
    // @ts-expect-error TS(2304): Cannot find name 'page'.
    await page.waitForNavigation();
  }
  await disableTransitions();
};

const goToAllEntities = async () => {
  // @ts-expect-error TS(2304): Cannot find name 'page'.
  await page.goto(host);
  await disableTransitions();
  // @ts-expect-error TS(2304): Cannot find name 'page'.
  await page.waitForSelector('#publishedStatuspublished');

  const [publishedSelected, restrictedStatus] = await assessFilterStatus();
  if (!publishedSelected) {
    // @ts-expect-error TS(2304): Cannot find name 'page'.
    await page.click('[title="Published"]');
    // @ts-expect-error TS(2304): Cannot find name 'page'.
    await page.waitForNavigation();
  }
  if (!restrictedStatus) {
    // @ts-expect-error TS(2304): Cannot find name 'page'.
    await page.click('[title="Restricted"]');
    // @ts-expect-error TS(2304): Cannot find name 'page'.
    await page.waitForNavigation();
  }
  await disableTransitions();
};

export { goToPublishedEntities, goToRestrictedEntities, goToAllEntities };
