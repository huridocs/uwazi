import { ElementHandle } from 'puppeteer';

interface FilesOptions {
  pdf?: string;
  supportingFile?: string;
}

const uploadPDFToEntity = async (pdfName: string) => {
  // @ts-expect-error TS(2304): Cannot find name 'page'.
  await expect(page).toUploadFile('#upload-button-input', pdfName);
};

export const uploadSupportingFileToEntity = async (fileName: string): Promise<void> => {
  const [fileChooser] = await Promise.all([
    // @ts-expect-error TS(2304): Cannot find name 'page'.
    page.waitForFileChooser(),
    // @ts-expect-error TS(2304): Cannot find name 'page'.
    page.click('div.attachments-modal__dropzone > button'),
  ]);
  await fileChooser.accept([fileName]);
};

export const createEntity = async (templateName: string, files: FilesOptions) => {
  // @ts-expect-error TS(2304): Cannot find name 'page'.
  await expect(page).toClick('a[aria-label="Library"]');
  // @ts-expect-error TS(2304): Cannot find name 'page'.
  await expect(page).toClick('button', { text: 'Create entity' });
  // @ts-expect-error TS(2304): Cannot find name 'page'.
  await page.waitForNetworkIdle();
  // @ts-expect-error TS(2304): Cannot find name 'page'.
  await expect(page).toFill('textarea[name="library.sidepanel.metadata.title"]', templateName);
  let options: ElementHandle<Element>[] = [];
  // @ts-expect-error TS(2304): Cannot find name 'page'.
  await page.waitForSelector('select.form-control > option');
  // @ts-expect-error TS(2304): Cannot find name 'page'.
  options = await page.$$('select.form-control > option');

  // @ts-ignore
  options.forEach(async (option: ElementHandle): void => {
    const value = await option.evaluate(optionEl => ({
      text: optionEl.textContent,
      value: optionEl.getAttribute('value') as string,
    }));
    // @ts-expect-error TS(2304): Cannot find name 'page'.
    if (value.text === templateName) await page.select('select.form-control', value.value);
  });
  // @ts-expect-error TS(2304): Cannot find name 'page'.
  await expect(page).toMatchElement('button[form="metadataForm"]', { text: 'Save' });
  // @ts-expect-error TS(2304): Cannot find name 'page'.
  await expect(page).toClick('button[form="metadataForm"]', { text: 'Save' });
  // @ts-expect-error TS(2304): Cannot find name 'page'.
  await expect(page).toClick('span', { text: 'Entity created' });
  if (files) {
    if (files.pdf) await uploadPDFToEntity(files.pdf);
    if (files.supportingFile) {
      // @ts-expect-error TS(2304): Cannot find name 'page'.
      await expect(page).toClick('button', { text: 'Add file' });
      await uploadSupportingFileToEntity(files.supportingFile);
    }
    // @ts-expect-error TS(2304): Cannot find name 'page'.
    await expect(page).toClick('.attachments-modal__close');
    // @ts-expect-error TS(2304): Cannot find name 'page'.
    await expect(page).toClick('span', { text: 'Attachment uploaded' });
  }
};
