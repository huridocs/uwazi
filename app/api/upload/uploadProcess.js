import EventEmitter from 'events';

import entities from 'api/entities';
import entitiesModel from 'api/entities/entitiesModel';

import { deleteUploadedFile } from 'api/utils/files';
import PDF from './PDF';

const deleteIfUnused = async filename => {
  if (filename && !(await entities.count({ 'file.filename': filename }))) {
    await deleteUploadedFile(filename);
  }
};

const setUploaded = async (docs, file) =>
  entities.saveMultiple(docs.map(doc => ({ _id: doc._id, file, uploaded: true })));

const removeOldFiles = async docs =>
  Promise.all(docs.filter(doc => doc.file).map(doc => deleteIfUnused(doc.file.filename)));

const processFile = async (docs, file) => {
  const pdf = new PDF(file);
  const conversion = await pdf.convert();

  const convertedDocs = docs.map(doc => ({ ...doc, ...conversion }));
  await Promise.all(docs.map(doc => pdf.createThumbnail(doc._id.toString())));

  return entitiesModel.saveMultiple(
    convertedDocs.map(doc => ({
      ...doc,
      file: { ...doc.file, timestamp: Date.now() },
    }))
  );
};

class UploadFile extends EventEmitter {
  constructor(docs, file) {
    super();
    this.docs = docs;
    this.file = file;
  }

  async start() {
    try {
      await setUploaded(this.docs, this.file);
      await removeOldFiles(this.docs);

      this.emit('conversionStart');
      await processFile(this.docs, this.file);
    } catch (err) {
      await entities.saveMultiple(this.docs.map(doc => ({ _id: doc._id, processed: false })));
      throw err;
    }
  }
}

export default function(docs, file) {
  return new UploadFile(docs, file);
}
