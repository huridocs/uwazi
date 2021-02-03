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
  const textSelectionRectangles = absolutePositionReference.selectionRectangles.map(x => ({
    left: x.left,
    top: x.top,
    width: x.width,
    height: x.height,
    page: x.pageNumber.toString(),
  }));

  textSelectionRectangles.sort((a, b) => (a.top >= b.top ? 1 : -1));

  return {
    text: absolutePositionReference.text,
    selectionRectangles:
      textSelectionRectangles.length > 0
        ? textSelectionRectangles
        : [
            {
              left: 0,
              top: 0,
              width: 0,
              height: 0,
              page: '1',
            },
          ],
  };
};

function isWrongConversion(textSelection) {
  let wrongConversion = false;
  for (let i = 0; i < textSelection.selectionRectangles.length; i += 1) {
    wrongConversion =
      wrongConversion ||
      (textSelection.selectionRectangles[i].left === 0 &&
        textSelection.selectionRectangles[i].top === 0 &&
        textSelection.selectionRectangles[i].page === '1');
  }

  return wrongConversion;
}

const convertTocToAbsolutePosition = async (fileConvertor, file, db) => {
  let wrongConversion = false;

  const absolutePositionToc = file.toc.map(x => {
    const absolutePositionReference = fileConvertor.convertToAbsolutePosition(
      x.label,
      x.range.start,
      x.range.end
    );
    const textSelection = absolutePositionReferenceToTextSelection(absolutePositionReference);

    wrongConversion = wrongConversion || isWrongConversion(textSelection);
    return {
      selectionRectangles: textSelection.selectionRectangles,
      label: x.label,
      indentation: x.indentation,
    };
  });

  await db.collection('files').updateOne({ _id: file._id }, { $set: { toc: absolutePositionToc } });
  return wrongConversion;
};

async function convertConnectionsToAbsolutePosition(fileConvertor, file, db) {
  let wrongConversion = false;
  const connections = await db
    .collection('connections')
    .find({ file: file._id.toString() })
    .toArray();

  for (let i = 0; i < connections.length; i += 1) {
    if (connections[i].range) {
      const absolutePositionReference = fileConvertor.convertToAbsolutePosition(
        connections[i].range.text,
        connections[i].range.start,
        connections[i].range.end
      );
      const textSelection = absolutePositionReferenceToTextSelection(absolutePositionReference);

      wrongConversion = wrongConversion || isWrongConversion(textSelection);

      await db.collection('connections').updateOne(
        { _id: connections[i]._id },
        {
          $set: { reference: textSelection },
          $unset: { range: '' },
        }
      );
    }
  }

  return wrongConversion;
}

async function existsRangesToConvert(db, file) {
  if (!file.pdfInfo) {
    return false;
  }

  if (file.toc && file.toc.length !== 0) {
    return true;
  }

  const connections = await db
    .collection('connections')
    .find({ file: file._id.toString() })
    .toArray();

  for (let i = 0; i < connections.length; i += 1) {
    if (connections[i].range) {
      return true;
    }
  }

  return false;
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
      .updateOne({ _id: connections[i]._id }, { $unset: { range: '', file: '' } });
  }
}

export default {
  delta: 32,

  name: 'character-count-to-absolute-position',

  description: 'Convert the character count of pdf references to absolute position',

  async up(db) {
    process.stdout.write(`${this.name}...\r\n`);
    let fileCount = 0;
    const cursor = db.collection('files').find();
    const pdfNotAllowedToBeConverted = [];
    const pdfWithWrongConversions = [];
    while (await cursor.hasNext()) {
      const file = await cursor.next();
      fileCount += 1;
      if (await existsRangesToConvert(db, file)) {
        process.stdout.write(
          `${fileCount} converting to absolute position file ${file.filename}\r\n`
        );

        let wrongConversions = false;
        try {
          const fileConvertor = await getCharacterCountToAbsolutePositionConvertor(file);

          if (file.toc && file.toc.length !== 0) {
            wrongConversions =
              wrongConversions || (await convertTocToAbsolutePosition(fileConvertor, file, db));
          }

          wrongConversions =
            wrongConversions ||
            (await convertConnectionsToAbsolutePosition(fileConvertor, file, db));

          if (wrongConversions) {
            process.stdout.write(`${fileCount} Wrong conversion for ${file.filename}\r\n`);

            pdfWithWrongConversions.push(file.filename);
          }
        } catch (e) {
          await removeRangesFromToc(db, file);
          await removeRangesFromConnections(db, file);
          process.stdout.write(`${fileCount} PDF not allowed to be converted ${file.filename}\r\n`);
          pdfNotAllowedToBeConverted.push(file.filename);
        }
      }
    }

    process.stderr.write(`PDFs not converted:\r\n${pdfNotAllowedToBeConverted.join('\r\n')}\r\n`);
    process.stderr.write(`PDFs wrong conversions:\r\n${pdfWithWrongConversions.join('\r\n')}\r\n`);
  },
};
