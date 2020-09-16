import {
  PdfCharacterCountToAbsolute,
  AbsolutePositionReference,
} from 'api/pdf_character_count_to_absolute/PdfCharacterCountToAbsolute';
import { AbsolutePositionTag } from 'api/pdf_character_count_to_absolute/AbsolutePositionLettersList';

const pdfInfo = [
  390,
  4185,
  8442,
  13610,
  18103,
  21746,
  25061,
  28330,
  31252,
  34412,
  38036,
  41557,
  44914,
  48421,
  51783,
  54839,
  57931,
  61249,
  64451,
  67747,
  71099,
  74349,
  76609,
  78441,
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
  it('should convert short label to absolute position', async () => {
    const pdfRelativePath = 'app/api/pdf_character_count_to_absolute/specs/pdf_to_be_converted.pdf';
    const shortLabel = '26.80';

    const characterCountToAbsoluteConversion = new PdfCharacterCountToAbsolute();
    await characterCountToAbsoluteConversion.loadPdf(pdfRelativePath, pdfInfo);
    const absolutePosition = characterCountToAbsoluteConversion.convert(shortLabel, 32347, 32352);

    expect(absolutePosition.text).toBe(shortLabel);
    expect(absolutePosition.tags.length).toBe(1);
    checkAbsoluteTag(absolutePosition.tags[0], {
      pageNumber: 10,
      top: 506,
      left: 213,
      height: 13,
      width: 33,
      text: '',
    });
  });

  it('should convert the last text in a page to absolute position', async () => {
    const pdfRelativePath = 'app/api/pdf_character_count_to_absolute/specs/pdf_to_be_converted.pdf';
    const lastLabel = '•  Mr. Mostafa Nafari, member of delegation.';

    const characterCountToAbsoluteConversion = new PdfCharacterCountToAbsolute();
    await characterCountToAbsoluteConversion.loadPdf(pdfRelativePath, pdfInfo);
    const absolutePosition: AbsolutePositionReference = characterCountToAbsoluteConversion.convert(
      lastLabel,
      78397,
      78441
    );

    expect(absolutePosition.text).toBe(lastLabel);
    expect(absolutePosition.tags.length).toBe(1);
    checkAbsoluteTag(absolutePosition.tags[0], {
      pageNumber: 24,
      top: 953,
      left: 200,
      height: 17,
      width: 275,
      text: '',
    });
  });

  it('should convert special character string to absolute position', async () => {
    const pdfRelativePath = 'app/api/pdf_character_count_to_absolute/specs/pdf_to_be_converted.pdf';
    const specialCharactersString = '';

    const characterCountToAbsoluteConversion = new PdfCharacterCountToAbsolute();
    await characterCountToAbsoluteConversion.loadPdf(pdfRelativePath, pdfInfo);
    const absolutePosition: AbsolutePositionReference = characterCountToAbsoluteConversion.convert(
      specialCharactersString,
      16,
      25
    );

    expect(absolutePosition.text).toBe(specialCharactersString);
    expect(absolutePosition.tags.length).toBe(1);
    checkAbsoluteTag(absolutePosition.tags[0], {
      pageNumber: 1,
      top: 1185,
      left: 85,
      height: 42,
      width: 140,
      text: '',
    });
  });

  it('should convert long label strings to absolute position', async () => {
    const pdfRelativePath = 'app/api/pdf_character_count_to_absolute/specs/pdf_to_be_converted.pdf';
    const longLabel =
      'B.Interactive dialogue and responses by the State under review13.During the interactive dialogue, 111 delegations made statements. ';

    const characterCountToAbsoluteConversion = new PdfCharacterCountToAbsolute();
    await characterCountToAbsoluteConversion.loadPdf(pdfRelativePath, pdfInfo);
    const absolutePosition: AbsolutePositionReference = characterCountToAbsoluteConversion.convert(
      longLabel,
      6445,
      6576
    );

    expect(absolutePosition.text).toBe(longLabel);
    expect(absolutePosition.tags.length).toBe(11);
    checkAbsoluteTag(absolutePosition.tags[0], {
      pageNumber: 3,
      top: 668,
      left: 132,
      height: 16,
      width: 20,
      text: '',
    });
    checkAbsoluteTag(absolutePosition.tags[10], {
      pageNumber: 3,
      top: 707,
      left: 655,
      height: 13,
      width: 70,
      text: '',
    });
  });

  it('should convert to absolute when not founded string', async () => {
    const pdfRelativePath = 'app/api/pdf_character_count_to_absolute/specs/pdf_to_be_converted.pdf';
    const notFoundedLabel = 'not founded label';

    const characterCountToAbsoluteConversion = new PdfCharacterCountToAbsolute();
    await characterCountToAbsoluteConversion.loadPdf(pdfRelativePath, pdfInfo);
    const absolutePosition: AbsolutePositionReference = characterCountToAbsoluteConversion.convert(
      notFoundedLabel,
      76656,
      76844
    );

    expect(absolutePosition.text).toBe(notFoundedLabel);
    expect(absolutePosition.tags.length).toBe(4);

    checkAbsoluteTag(absolutePosition.tags[0], {
      pageNumber: 24,
      top: 177,
      left: 149,
      height: 19,
      width: 293,
      text: '',
    });
    checkAbsoluteTag(absolutePosition.tags[1], {
      pageNumber: 24,
      top: 218,
      left: 213,
      height: 13,
      width: 513,
      text: '',
    });
    checkAbsoluteTag(absolutePosition.tags[2], {
      pageNumber: 24,
      top: 236,
      left: 170,
      height: 13,
      width: 555,
      text: '',
    });
  });

  it('should match string and position when several matching strings occurs', async () => {
    const pdfRelativePath = 'app/api/pdf_character_count_to_absolute/specs/pdf_to_be_converted.pdf';
    const severalAppearancesString = 'Continue';

    const characterCountToAbsoluteConversion = new PdfCharacterCountToAbsolute();
    await characterCountToAbsoluteConversion.loadPdf(pdfRelativePath, pdfInfo);
    const absolutePosition: AbsolutePositionReference = characterCountToAbsoluteConversion.convert(
      severalAppearancesString,
      52284,
      52292
    );

    expect(absolutePosition.text).toBe(severalAppearancesString);
    expect(absolutePosition.tags.length).toBe(1);

    checkAbsoluteTag(absolutePosition.tags[0], {
      pageNumber: 16,
      top: 308,
      left: 276,
      height: 13,
      width: 449,
      text: '',
    });
  });

  it('should return absolute position when string matching across two pages', async () => {
    const pdfRelativePath = 'app/api/pdf_character_count_to_absolute/specs/pdf_to_be_converted.pdf';
    const stringSpreadTwoPages =
      'International Covenant on Civil and Political Rights (Ireland); A/HRC/43/121526.164';

    const characterCountToAbsoluteConversion = new PdfCharacterCountToAbsolute();
    await characterCountToAbsoluteConversion.loadPdf(pdfRelativePath, pdfInfo);
    const absolutePosition: AbsolutePositionReference = characterCountToAbsoluteConversion.convert(
      stringSpreadTwoPages,
      48358,
      48440
    );

    expect(absolutePosition.tags.length).toBe(4);

    checkAbsoluteTag(absolutePosition.tags[0], {
      pageNumber: 14,
      top: 1155,
      left: 213,
      height: 13,
      width: 403,
      text: '',
    });
    checkAbsoluteTag(absolutePosition.tags[1], {
      pageNumber: 15,
      top: 67,
      left: 730,
      height: 12,
      width: 80,
      text: '',
    });
    checkAbsoluteTag(absolutePosition.tags[2], {
      pageNumber: 15,
      top: 1208,
      left: 794,
      height: 12,
      width: 13,
      text: '',
    });
    checkAbsoluteTag(absolutePosition.tags[3], {
      pageNumber: 15,
      top: 110,
      left: 213,
      height: 13,
      width: 40,
      text: '',
    });
  });

  it('should return absolute position when character count across two pages', async () => {
    const pdfRelativePath = 'app/api/pdf_character_count_to_absolute/specs/pdf_to_be_converted.pdf';
    const nonExistentString = 'Non existent string';

    const characterCountToAbsoluteConversion = new PdfCharacterCountToAbsolute();
    await characterCountToAbsoluteConversion.loadPdf(pdfRelativePath, pdfInfo);
    const absolutePosition: AbsolutePositionReference = characterCountToAbsoluteConversion.convert(
      nonExistentString,
      48358,
      48440
    );

    checkAbsoluteTag(absolutePosition.tags[0], {
      pageNumber: 14,
      top: 1155,
      left: 213,
      height: 13,
      width: 403,
      text: '',
    });
    checkAbsoluteTag(absolutePosition.tags[1], {
      pageNumber: 15,
      top: 67,
      left: 730,
      height: 12,
      width: 80,
      text: '',
    });
    checkAbsoluteTag(absolutePosition.tags[2], {
      pageNumber: 15,
      top: 1208,
      left: 794,
      height: 12,
      width: 13,
      text: '',
    });
    checkAbsoluteTag(absolutePosition.tags[3], {
      pageNumber: 15,
      top: 110,
      left: 213,
      height: 13,
      width: 40,
      text: '',
    });
    checkAbsoluteTag(absolutePosition.tags[4], {
      pageNumber: 15,
      top: 110,
      left: 276,
      height: 13,
      width: 449,
      text: '',
    });
  });

  it('should not brake when range outside document and non existent string match', async () => {
    const pdfRelativePath = 'app/api/pdf_character_count_to_absolute/specs/pdf_to_be_converted.pdf';
    const outsideLabel = 'outside label';

    const characterCountToAbsoluteConversion = new PdfCharacterCountToAbsolute();
    await characterCountToAbsoluteConversion.loadPdf(pdfRelativePath, pdfInfo);
    const absolutePosition = characterCountToAbsoluteConversion.convert(
      outsideLabel,
      999999,
      1000000
    );
    expect(absolutePosition.tags.length).toBe(0);
  });

  it('should return first string match when range outside document', async () => {
    const pdfRelativePath = 'app/api/pdf_character_count_to_absolute/specs/pdf_to_be_converted.pdf';
    const label = '26.80';

    const characterCountToAbsoluteConversion = new PdfCharacterCountToAbsolute();
    await characterCountToAbsoluteConversion.loadPdf(pdfRelativePath, pdfInfo);
    const absolutePosition = characterCountToAbsoluteConversion.convert(label, 999999, 1000000);

    expect(absolutePosition.text).toBe(label);
    expect(absolutePosition.tags.length).toBe(1);
    checkAbsoluteTag(absolutePosition.tags[0], {
      pageNumber: 10,
      top: 506,
      left: 213,
      height: 13,
      width: 33,
      text: '',
    });
  });

  it('should convert to absolute position a different pdf', async () => {
    const otherPdfInfo = [1813, 5329, 8911, 13428, 17878, 22296, 25112, 25537];
    const pdfRelativePath =
      'app/api/pdf_character_count_to_absolute/specs/other_pdf_to_be_converted.pdf';
    const label = 'ISOLICITUD DE INTERPRETACIÓNY PROCEDIMIENTO ANTELA CORTE';

    const characterCountToAbsoluteConversion = new PdfCharacterCountToAbsolute();
    await characterCountToAbsoluteConversion.loadPdf(pdfRelativePath, otherPdfInfo);
    const absolutePosition = characterCountToAbsoluteConversion.convert(label, 1213, 1269);

    expect(absolutePosition.tags.length).toBe(3);

    checkAbsoluteTag(absolutePosition.tags[0], {
      pageNumber: 1,
      top: 810,
      left: 455,
      height: 18,
      width: 7,
      text: '',
    });
    checkAbsoluteTag(absolutePosition.tags[1], {
      pageNumber: 1,
      top: 828,
      left: 319,
      height: 18,
      width: 279,
      text: '',
    });
    checkAbsoluteTag(absolutePosition.tags[2], {
      pageNumber: 1,
      top: 846,
      left: 309,
      height: 18,
      width: 303,
      text: '',
    });
  });
});
