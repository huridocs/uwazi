import { ElementHandle } from 'puppeteer';

interface FilesOptions {
  pdf?: string;
  supportingFile?: string;
}

const uploadPDFToEntity = async (pdfName: string) => {
  await expect(page).toUploadFile('#upload-button-input', pdfName);
};

export const uploadSupportingFileToEntity = async (fileName: string): Promise<void> => {
  const [fileChooser] = await Promise.all([
    page.waitForFileChooser(),
    page.click('div.attachments-modal__dropzone > button'),
  ]);
  await fileChooser.accept([fileName]);
};

export const createEntity = async (templateName: string, files: FilesOptions) => {
  await expect(page).toClick('a[aria-label="Library"]');
  await expect(page).toClick('button', { text: 'Create entity' });
  await page.waitForNetworkIdle();
  await expect(page).toFill('textarea[name="library.sidepanel.metadata.title"]', templateName);
  let options: ElementHandle<Element>[] = [];
  await page.waitForSelector('select.form-control > option');
  options = await page.$$('select.form-control > option');

  // @ts-ignore
  options.forEach(async (option: ElementHandle): void => {
    const value = await option.evaluate(optionEl => ({
      text: optionEl.textContent,
      value: optionEl.getAttribute('value') as string,
    }));
    if (value.text === templateName) await page.select('select.form-control', value.value);
  });
  await expect(page).toMatchElement('button[form="metadataForm"]', { text: 'Save' });
  await expect(page).toClick('button[form="metadataForm"]', { text: 'Save' });
  await expect(page).toClick('span', { text: 'Entity created' });
  if (files) {
    if (files.pdf) await uploadPDFToEntity(files.pdf);
    if (files.supportingFile) {
      await expect(page).toClick('button', { text: 'Add file' });
      await uploadSupportingFileToEntity(files.supportingFile);
    }
    await expect(page).toClick('.attachments-modal__close');
    await expect(page).toClick('span', { text: 'Attachment uploaded' });
  }
};
