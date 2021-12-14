import {
  PdfCharacterCountToAbsolute,
  AbsolutePositionReference,
} from 'api/migrations/pdf_character_count_to_absolute/PdfCharacterCountToAbsolute';
import { AbsolutePositionTag } from 'api/migrations/pdf_character_count_to_absolute/AbsolutePositionLettersList';

const pdfInfo = [
  390, 4185, 8442, 13610, 18103, 21746, 25061, 28330, 31252, 34412, 38036, 41557, 44914, 48421,
  51783, 54839, 57931, 61249, 64451, 67747, 71099, 74349, 76609, 78441,
];

const checkAbsoluteTag = (tag: AbsolutePositionTag, tagExpected: AbsolutePositionTag) => {
  expect(tag.pageNumber).toBe(tagExpected.pageNumber);
  expect(tag.top).toBe(tagExpected.top);
  expect(tag.left).toBe(tagExpected.left);
  expect(tag.height).toBe(tagExpected.height);
  expect(tag.width).toBeGreaterThan(tagExpected.width);
  expect(tag.width).toBeLessThan(tagExpected.width + 8);
};

describe('PdfCharacterCountToAbsolute', () => {
  it('should convert first label to absolute position', async () => {
    const pdfRelativePath =
      'app/api/migrations/pdf_character_count_to_absolute/specs/pdf_to_be_converted.pdf';
    const firstLabel = 'first label';

    const characterCountToAbsoluteConversion = new PdfCharacterCountToAbsolute();
    await characterCountToAbsoluteConversion.loadPdf(pdfRelativePath, pdfInfo);
    const absolutePosition = characterCountToAbsoluteConversion.convertToAbsolutePosition(
      firstLabel,
      0,
      1
    );

    expect(absolutePosition.text).toBe(firstLabel);
    expect(absolutePosition.selectionRectangles.length).toBe(1);
    checkAbsoluteTag(absolutePosition.selectionRectangles[0], {
      pageNumber: 1,
      top: 1035,
      left: 76,
      height: 12,
      width: 90,
      text: 'G',
    });
  });

  it('should convert short label to absolute position', async () => {
    const pdfRelativePath =
      'app/api/migrations/pdf_character_count_to_absolute/specs/pdf_to_be_converted.pdf';
    const shortLabel = '26.80';

    const characterCountToAbsoluteConversion = new PdfCharacterCountToAbsolute();
    await characterCountToAbsoluteConversion.loadPdf(pdfRelativePath, pdfInfo);
    const absolutePosition = characterCountToAbsoluteConversion.convertToAbsolutePosition(
      shortLabel,
      32347,
      32352
    );

    expect(absolutePosition.text).toBe(shortLabel);
    expect(absolutePosition.selectionRectangles.length).toBe(1);
    checkAbsoluteTag(absolutePosition.selectionRectangles[0], {
      pageNumber: 10,
      top: 450,
      left: 189,
      height: 12,
      width: 29,
      text: '',
    });
  });

  it('should convert few words inside line to absolute position', async () => {
    const pdfRelativePath =
      'app/api/migrations/pdf_character_count_to_absolute/specs/pdf_to_be_converted.pdf';
    const labelInsideTag = '15  January  2019';

    const characterCountToAbsoluteConversion = new PdfCharacterCountToAbsolute();
    await characterCountToAbsoluteConversion.loadPdf(pdfRelativePath, pdfInfo);
    const absolutePosition = characterCountToAbsoluteConversion.convertToAbsolutePosition(
      labelInsideTag,
      994,
      1011
    );

    expect(absolutePosition.text).toBe(labelInsideTag);
    expect(absolutePosition.selectionRectangles.length).toBe(1);
    checkAbsoluteTag(absolutePosition.selectionRectangles[0], {
      pageNumber: 2,
      top: 262,
      left: 211,
      height: 12,
      width: 95,
      text: '',
    });
  });

  it('should convert special character string to absolute position', async () => {
    const pdfRelativePath =
      'app/api/migrations/pdf_character_count_to_absolute/specs/pdf_to_be_converted.pdf';
    const specialCharactersString = '';

    const characterCountToAbsoluteConversion = new PdfCharacterCountToAbsolute();
    await characterCountToAbsoluteConversion.loadPdf(pdfRelativePath, pdfInfo);
    const absolutePosition: AbsolutePositionReference =
      characterCountToAbsoluteConversion.convertToAbsolutePosition(specialCharactersString, 16, 25);

    expect(absolutePosition.text).toBe(specialCharactersString);
    expect(absolutePosition.selectionRectangles.length).toBe(1);
    checkAbsoluteTag(absolutePosition.selectionRectangles[0], {
      pageNumber: 1,
      top: 1054,
      left: 76,
      height: 31,
      width: 125,
      text: '',
    });
  });

  it('should convert long label strings to absolute position', async () => {
    const pdfRelativePath =
      'app/api/migrations/pdf_character_count_to_absolute/specs/pdf_to_be_converted.pdf';
    const longLabel =
      'B.Interactive dialogue and responses by the State under review13.During the interactive dialogue, 111 delegations made statements. ';

    const characterCountToAbsoluteConversion = new PdfCharacterCountToAbsolute();
    await characterCountToAbsoluteConversion.loadPdf(pdfRelativePath, pdfInfo);
    const absolutePosition: AbsolutePositionReference =
      characterCountToAbsoluteConversion.convertToAbsolutePosition(longLabel, 6445, 6576);

    expect(absolutePosition.text).toBe(longLabel);
    expect(absolutePosition.selectionRectangles.length).toBe(11);
    checkAbsoluteTag(absolutePosition.selectionRectangles[0], {
      pageNumber: 3,
      top: 594,
      left: 118,
      height: 14,
      width: 14,
      text: '',
    });
    checkAbsoluteTag(absolutePosition.selectionRectangles[10], {
      pageNumber: 3,
      top: 628,
      left: 583,
      height: 12,
      width: 58,
      text: '',
    });
  });

  it('should convert to absolute when not founded string', async () => {
    const pdfRelativePath =
      'app/api/migrations/pdf_character_count_to_absolute/specs/pdf_to_be_converted.pdf';
    const notFoundedLabel = 'not founded label';

    const characterCountToAbsoluteConversion = new PdfCharacterCountToAbsolute();
    await characterCountToAbsoluteConversion.loadPdf(pdfRelativePath, pdfInfo);
    const absolutePosition: AbsolutePositionReference =
      characterCountToAbsoluteConversion.convertToAbsolutePosition(notFoundedLabel, 76656, 76844);

    expect(absolutePosition.text).toBe(notFoundedLabel);
    expect(absolutePosition.selectionRectangles.length).toBe(4);

    checkAbsoluteTag(absolutePosition.selectionRectangles[0], {
      pageNumber: 24,
      top: 157,
      left: 132,
      height: 17,
      width: 261,
      text: '',
    });
    checkAbsoluteTag(absolutePosition.selectionRectangles[1], {
      pageNumber: 24,
      top: 194,
      left: 189,
      height: 12,
      width: 456,
      text: '',
    });
    checkAbsoluteTag(absolutePosition.selectionRectangles[2], {
      pageNumber: 24,
      top: 210,
      left: 151,
      height: 12,
      width: 493,
      text: '',
    });
  });

  it('should match string and position when several matching strings occurs', async () => {
    const pdfRelativePath =
      'app/api/migrations/pdf_character_count_to_absolute/specs/pdf_to_be_converted.pdf';
    const severalAppearancesString = 'Continue';

    const characterCountToAbsoluteConversion = new PdfCharacterCountToAbsolute();
    await characterCountToAbsoluteConversion.loadPdf(pdfRelativePath, pdfInfo);
    const absolutePosition: AbsolutePositionReference =
      characterCountToAbsoluteConversion.convertToAbsolutePosition(
        severalAppearancesString,
        52284,
        52292
      );

    expect(absolutePosition.text).toBe(severalAppearancesString);
    expect(absolutePosition.selectionRectangles.length).toBe(1);

    checkAbsoluteTag(absolutePosition.selectionRectangles[0], {
      pageNumber: 16,
      top: 274,
      left: 246,
      height: 12,
      width: 51,
      text: '',
    });
  });

  it('should return absolute position when string matching across two pages', async () => {
    const pdfRelativePath =
      'app/api/migrations/pdf_character_count_to_absolute/specs/pdf_to_be_converted.pdf';
    const stringSpreadTwoPages =
      'International Covenant on Civil and Political Rights (Ireland); A/HRC/43/121526.164';

    const characterCountToAbsoluteConversion = new PdfCharacterCountToAbsolute();
    await characterCountToAbsoluteConversion.loadPdf(pdfRelativePath, pdfInfo);
    const absolutePosition: AbsolutePositionReference =
      characterCountToAbsoluteConversion.convertToAbsolutePosition(
        stringSpreadTwoPages,
        48358,
        48440
      );

    expect(absolutePosition.selectionRectangles.length).toBe(4);

    checkAbsoluteTag(absolutePosition.selectionRectangles[0], {
      pageNumber: 14,
      top: 1026,
      left: 189,
      height: 12,
      width: 354,
      text: '',
    });
    checkAbsoluteTag(absolutePosition.selectionRectangles[1], {
      pageNumber: 15,
      top: 60,
      left: 649,
      height: 11,
      width: 68,
      text: '',
    });
    checkAbsoluteTag(absolutePosition.selectionRectangles[2], {
      pageNumber: 15,
      top: 1074,
      left: 706,
      height: 11,
      width: 11,
      text: '',
    });
    checkAbsoluteTag(absolutePosition.selectionRectangles[3], {
      pageNumber: 15,
      top: 98,
      left: 189,
      height: 12,
      width: 36,
      text: '',
    });
  });

  it('should return absolute position when character count across two pages', async () => {
    const pdfRelativePath =
      'app/api/migrations/pdf_character_count_to_absolute/specs/pdf_to_be_converted.pdf';
    const nonExistentString = 'Non existent string';

    const characterCountToAbsoluteConversion = new PdfCharacterCountToAbsolute();
    await characterCountToAbsoluteConversion.loadPdf(pdfRelativePath, pdfInfo);
    const absolutePosition: AbsolutePositionReference =
      characterCountToAbsoluteConversion.convertToAbsolutePosition(nonExistentString, 48358, 48440);

    checkAbsoluteTag(absolutePosition.selectionRectangles[0], {
      pageNumber: 14,
      top: 1026,
      left: 189,
      height: 12,
      width: 358,
      text: '',
    });
    checkAbsoluteTag(absolutePosition.selectionRectangles[1], {
      pageNumber: 15,
      top: 60,
      left: 649,
      height: 11,
      width: 71,
      text: '',
    });
    checkAbsoluteTag(absolutePosition.selectionRectangles[2], {
      pageNumber: 15,
      top: 1074,
      left: 706,
      height: 11,
      width: 11,
      text: '',
    });
    checkAbsoluteTag(absolutePosition.selectionRectangles[3], {
      pageNumber: 15,
      top: 98,
      left: 189,
      height: 12,
      width: 36,
      text: '',
    });
    checkAbsoluteTag(absolutePosition.selectionRectangles[4], {
      pageNumber: 15,
      top: 98,
      left: 246,
      height: 12,
      width: 399,
      text: '',
    });
  });

  it('should not brake when range outside document and non existent string match', async () => {
    const pdfRelativePath =
      'app/api/migrations/pdf_character_count_to_absolute/specs/pdf_to_be_converted.pdf';
    const outsideLabel = 'outside label';

    const characterCountToAbsoluteConversion = new PdfCharacterCountToAbsolute();
    await characterCountToAbsoluteConversion.loadPdf(pdfRelativePath, pdfInfo);
    const absolutePosition = characterCountToAbsoluteConversion.convertToAbsolutePosition(
      outsideLabel,
      999999,
      1000000
    );
    expect(absolutePosition.selectionRectangles.length).toBe(0);
  });

  it('should return first string match when range outside document', async () => {
    const pdfRelativePath =
      'app/api/migrations/pdf_character_count_to_absolute/specs/pdf_to_be_converted.pdf';
    const label = '26.80';

    const characterCountToAbsoluteConversion = new PdfCharacterCountToAbsolute();
    await characterCountToAbsoluteConversion.loadPdf(pdfRelativePath, pdfInfo);
    const absolutePosition = characterCountToAbsoluteConversion.convertToAbsolutePosition(
      label,
      999999,
      999999
    );

    expect(absolutePosition.text).toBe(label);
    expect(absolutePosition.selectionRectangles.length).toBe(1);
    checkAbsoluteTag(absolutePosition.selectionRectangles[0], {
      pageNumber: 10,
      top: 450,
      left: 189,
      height: 12,
      width: 29,
      text: '',
    });
  });

  it('should convert to absolute position a different pdf', async () => {
    const otherPdfInfo = [1813, 5329, 8911, 13428, 17878, 22296, 25112, 25537];
    const pdfRelativePath =
      'app/api/migrations/pdf_character_count_to_absolute/specs/other_pdf_to_be_converted.pdf';
    const label = 'ISOLICITUD DE INTERPRETACIÓNY PROCEDIMIENTO ANTELA CORTE';

    const characterCountToAbsoluteConversion = new PdfCharacterCountToAbsolute();
    await characterCountToAbsoluteConversion.loadPdf(pdfRelativePath, otherPdfInfo);
    const absolutePosition = characterCountToAbsoluteConversion.convertToAbsolutePosition(
      label,
      1213,
      1269
    );

    expect(absolutePosition.selectionRectangles.length).toBe(3);

    checkAbsoluteTag(absolutePosition.selectionRectangles[0], {
      pageNumber: 1,
      top: 723,
      left: 404,
      height: 14,
      width: 6,
      text: '',
    });
    checkAbsoluteTag(absolutePosition.selectionRectangles[1], {
      pageNumber: 1,
      top: 739,
      left: 283,
      height: 14,
      width: 248,
      text: '',
    });
    checkAbsoluteTag(absolutePosition.selectionRectangles[2], {
      pageNumber: 1,
      top: 755,
      left: 275,
      height: 14,
      width: 265,
      text: '',
    });
  });
});
