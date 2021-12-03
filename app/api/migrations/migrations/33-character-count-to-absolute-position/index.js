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
  const wrongConversion = [];

  const absolutePositionToc = file.toc.map(x => {
    const absolutePositionReference = fileConvertor.convertToAbsolutePosition(
      x.label,
      x.range.start,
      x.range.end
    );
    const textSelection = absolutePositionReferenceToTextSelection(absolutePositionReference);

    if (isWrongConversion(textSelection)) {
      wrongConversion.push(`${x.label}\t${x.range.start}\t${x.range.end}`);
    }

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
  const wrongConversion = [];
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

      if (isWrongConversion(textSelection)) {
        wrongConversion.push(
          `${connections[i].range.text}\t${connections[i].range.start}\t${connections[i].range.end}`
        );
      }

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
  if (file.toc && file.toc.length !== 0) {
    return true;
  }

  const connections = (
    await db
      .collection('connections')
      .find({ entity: file.entity, range: { $exists: true } })
      .toArray()
  ).filter(c => c.file === file._id.toString());

  if (connections.length) {
    return true;
  }

  return false;
}

async function removeRangesFromToc(db, file) {
  const removedTocs = [];
  if (file.toc && file.toc.length > 0) {
    removedTocs.push(...file.toc.map(x => `${x.label}\t${x.range.start}\t${x.range.end}`));
  }
  await db.collection('files').updateOne({ _id: file._id }, { $set: { toc: [] } });
  return removedTocs;
}

async function removeRangesFromConnections(db, file) {
  const removedConnection = [];
  const connections = await db
    .collection('connections')
    .find({ file: file._id.toString() })
    .toArray();

  for (let i = 0; i < connections.length; i += 1) {
    const connection = `${connections[i].range.text}\t${connections[i].range.start}\t${connections[i].range.end}`;
    removedConnection.push(connection);
    await db
      .collection('connections')
      .updateOne({ _id: connections[i]._id }, { $unset: { range: '', file: '' } });
  }
  return removedConnection;
}

function isValidPdfInfo(pdfInfo) {
  return (
    !!pdfInfo &&
    Object.keys(pdfInfo)
      .map(x => pdfInfo[x].chars)
      .filter(x => x !== 0).length > 0
  );
}

function getWrongConversions(wrongConversions, type, file) {
  const entityName = file.entity;
  const fileName = file.filename;

  return wrongConversions.map(x => `Entity\t${entityName}\tFile\t${fileName}\t${type}\t${x}`);
}

export default {
  delta: 33,

  name: 'character-count-to-absolute-position',

  description: 'Convert the character count of pdf references to absolute position',

  async up(db) {
    process.stdout.write(`${this.name}...\n`);
    let conversionsNumber = 0;
    const cursor = db.collection('files').find().addCursorFlag('noCursorTimeout', true);
    const wrongConversions = [];
    while (await cursor.hasNext()) {
      const file = await cursor.next();
      try {
        if (await existsRangesToConvert(db, file)) {
          conversionsNumber += 1;
          process.stdout.write(
            `${conversionsNumber} converting to absolute position file ${file.filename}\n`
          );

          if (!isValidPdfInfo(file.pdfInfo)) {
            process.stderr.write(`Warning: ${file.filename} wrong pdfinfo`);
            if (!file.pdfInfo) {
              file.pdfInfo = { 1: { chars: 0 } };
            }
          }

          const fileConvertor = await getCharacterCountToAbsolutePositionConvertor(file);
          if (file.toc && file.toc.length !== 0) {
            const wrongTocs = await convertTocToAbsolutePosition(fileConvertor, file, db);
            wrongConversions.push(...getWrongConversions(wrongTocs, 'TOC', file));
          }

          const wrongConnection = await convertConnectionsToAbsolutePosition(
            fileConvertor,
            file,
            db
          );

          wrongConversions.push(...getWrongConversions(wrongConnection, 'CONNECTION', file));
        }
      } catch (e) {
        process.stderr.write(`${e.stack}\r\n`);
        process.stderr.write(`${file.filename} ${conversionsNumber} total conversions `);

        const wrongTocs = await removeRangesFromToc(db, file);
        const wrongConnection = await removeRangesFromConnections(db, file);

        wrongConversions.push(...getWrongConversions(wrongTocs, 'TOC', file));
        wrongConversions.push(...getWrongConversions(wrongConnection, 'CONNECTION', file));
      }
    }

    process.stderr.write(`\n\nTotal files converted: ${conversionsNumber}\n`);
    process.stderr.write(`Wrong conversions number: ${wrongConversions.length}\n`);
    process.stderr.write(`${wrongConversions.join('\n')}\n`);

    cursor.close();
    return `${wrongConversions}`;
  },
};
