/* eslint-disable no-await-in-loop */
import { PdfCharacterCountToAbsolute } from 'api/migrations/pdf_character_count_to_absolute/PdfCharacterCountToAbsolute';
import path from 'path';
import { config } from 'api/config';

async function getCharacterCountToAbsolutePositionConvertor(file) {
  const filename = path.join(config.defaultTenant.uploadedDocuments, file.filename);
  const pageEndingCharacterCount = Object.values(file.pdfInfo).map(x => x.chars);

  const characterCountToAbsoluteConversion = new PdfCharacterCountToAbsolute();
  await characterCountToAbsoluteConversion.loadPdf(filename, pageEndingCharacterCount);
  return characterCountToAbsoluteConversion;
}

const absolutePositionReferenceToTextSelection = absolutePositionReference => {
  const { pageHeight } = absolutePositionReference;
  const textSelectionRectangles = absolutePositionReference.selectionRectangles.map(x => ({
    left: Math.round((1100 * x.left) / pageHeight),
    top: Math.round((1100 * x.top) / pageHeight),
    width: Math.round((1100 * x.width) / pageHeight),
    height: Math.round((1100 * x.height) / pageHeight),
    regionId: x.pageNumber,
  }));

  return {
    text: absolutePositionReference.text,
    selectionRectangles: textSelectionRectangles,
  };
};

const convertTocToAbsolutePosition = async (fileConvertor, file, db) => {
  const absolutePositionToc = file.toc.map(x => {
    const absolutePositionReference = fileConvertor.convert(x.label, x.range.start, x.range.end);
    const textSelection = absolutePositionReferenceToTextSelection(absolutePositionReference);

    return {
      selectionRectangles: textSelection.selectionRectangles,
      label: x.label,
      indentation: x.indentation,
    };
  });

  await db.collection('files').updateOne({ _id: file._id }, { $set: { toc: absolutePositionToc } });
};

async function convertConnectionsToAbsolutePosition(nullableFileConvertor, file, db) {
  const connections = await db
    .collection('connections')
    .find({ file: file._id.toString() })
    .toArray();

  let fileConvertor = null;

  for (let i = 0; i < connections.length; i += 1) {
    if (connections[i].range) {
      fileConvertor =
        fileConvertor ||
        nullableFileConvertor ||
        (await getCharacterCountToAbsolutePositionConvertor(file));
      const absolutePositionReference = fileConvertor.convert(
        connections[i].range.text,
        connections[i].range.start,
        connections[i].range.end
      );
      const textSelection = absolutePositionReferenceToTextSelection(absolutePositionReference);

      await db
        .collection('connections')
        .updateOne(
          { _id: connections[i]._id },
          { $set: { reference: textSelection }, $unset: { range: '' } }
        );
    }
  }
}

async function removeRangesFromToc(db, file) {
  await db.collection('files').updateOne({ _id: file._id }, { $set: { toc: [] } });
}

async function removeRangesFromConnections(db, file) {
  const connections = await db
    .collection('connections')
    .find({ file: file._id.toString() })
    .toArray();

  for (let i = 0; i < connections.length; i += 1) {
    await db
      .collection('connections')
      .updateOne({ _id: connections[i]._id }, { $unset: { range: '' } });
  }
}

export default {
  delta: 32,

  name: 'character-count-to-absolute-position',

  description: 'Convert the character count of pdf references to absolute position',

  async up(db) {
    process.stdout.write(`${this.name}...\r\n`);
    let tocCount = 0;
    const cursor = db.collection('files').find();
    let pdfNotAllowedToBeConverted = '';
    while (await cursor.hasNext()) {
      const file = await cursor.next();
      tocCount += 1;
      if (file.pdfInfo) {
        process.stdout.write(
          `${tocCount} converting to absolute position file ${file.filename}\r\n`
        );
        let nullableFileConvertor = null;
        try {
          if (file.toc && file.toc.length !== 0) {
            nullableFileConvertor = await getCharacterCountToAbsolutePositionConvertor(file);
            await convertTocToAbsolutePosition(nullableFileConvertor, file, db);
          }

          await convertConnectionsToAbsolutePosition(nullableFileConvertor, file, db);
        } catch (e) {
          process.stdout.write(`${tocCount} PDF not allowed to be converted ${file.filename}\r\n`);
          pdfNotAllowedToBeConverted += ` ${file.filename}`;
        }
      } else if (file.type === 'document') {
        process.stdout.write(`${tocCount} no pdfinfo file ${file.filename}\r\n`);
        await removeRangesFromToc(db, file);
        await removeRangesFromConnections(db, file);
      }
    }

    process.stdout.write(`PDFs not allowed to be converted: ${pdfNotAllowedToBeConverted}\r\n`);
  },
};
