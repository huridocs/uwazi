/* eslint-disable no-await-in-loop */
import path from 'path';
import { config } from 'api/config';
import { PdfCharacterCountToAbsolute } from 'api/migrations/pdf_character_count_to_absolute/PdfCharacterCountToAbsolute';

const convertTocToAbsolutePosition = async (file, db) => {
  const filename = path.join(config.defaultTenant.uploadedDocuments, file.filename);
  const pageEndingCharacterCount = Object.values(file.pdfInfo).map(x => x.chars);

  const characterCountToAbsoluteConversion = new PdfCharacterCountToAbsolute();
  await characterCountToAbsoluteConversion.loadPdf(filename, pageEndingCharacterCount);

  const absolutePositionToc = file.toc.map(x => {
    const absolutePositionReference = characterCountToAbsoluteConversion.convert(
      x.label,
      x.range.start,
      x.range.end
    );

    const textSelectionRectangles = absolutePositionReference.selectionRectangles.map(
      selectionRectangle => ({
        left: selectionRectangle.left,
        top: selectionRectangle.top,
        width: selectionRectangle.width,
        height: selectionRectangle.height,
        pageNumber: selectionRectangle.pageNumber,
      })
    );

    return {
      selectionRectangles: textSelectionRectangles,
      label: x.label,
      indentation: x.indentation,
    };
  });

  await db.collection('files').updateOne({ _id: file._id }, { $set: { toc: absolutePositionToc } });
};

export default {
  delta: 32,

  name: 'toc-character-count-to-absolute-position',

  description: 'convert toc references from character count to absolute position',

  async up(db) {
    process.stdout.write(`${this.name}...\r\n`);
    let tocCount = 0;
    const cursor = db.collection('files').find();

    while (await cursor.hasNext()) {
      const file = await cursor.next();
      if (file.toc && file.toc.length !== 0 && file.pdfInfo) {
        tocCount += 1;
        process.stdout.write(`${tocCount} converting to absolute position ${file.filename}\r\n`);
        await convertTocToAbsolutePosition(file, db);
      }
      if (file.toc && file.toc.length !== 0 && !file.pdfInfo) {
        await db.collection('files').updateOne({ _id: file._id }, { $set: { toc: [] } });
        process.stdout.write(`No pdfinfo ${file.filename}\r\n`);
      }
    }

    process.stdout.write('\r\n');
  },
};
