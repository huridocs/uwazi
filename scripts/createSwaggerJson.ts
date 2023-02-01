/* eslint-disable no-console */
// eslint-disable-next-line node/no-restricted-import
import { writeFile } from 'fs/promises';
import { swaggerDocument } from '../app/swagger';

const jsonContent = JSON.stringify(swaggerDocument, null, 2);

const createJsonFile = async () => {
  try {
    await writeFile(`${__dirname}/../app/api/swagger.json`, jsonContent, 'utf-8');
    console.log('File swagger.json has been saved.');
  } catch (err) {
    console.log('An error occured while writing JSON Object to File.');
    console.log(err);
  }
};

createJsonFile();
