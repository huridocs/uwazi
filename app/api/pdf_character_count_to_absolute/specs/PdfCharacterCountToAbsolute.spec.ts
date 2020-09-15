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

const checkAbsoluteTag = (tag: AbsolutePositionTag, values: number[]) => {
  expect(tag.pageNumber).toBe(values[0]);
  expect(tag.top).toBe(values[1]);
  expect(tag.left).toBe(values[2]);
  expect(tag.height).toBe(values[3]);
  expect(tag.width).toBeGreaterThan(values[4]);
  expect(tag.width).toBeLessThan(values[4] + 8);
};

describe('PdfCharacterCountToAbsolute', () => {
  describe('should convert to absolute position', () => {
    it('short label', async () => {
      const pdfRelativePath =
        'app/api/pdf_character_count_to_absolute/specs/pdf_to_be_converted.pdf';
      const shortLabel = '26.80';

      const characterCountToAbsoluteConversion = new PdfCharacterCountToAbsolute();
      await characterCountToAbsoluteConversion.loadPdf(pdfRelativePath, pdfInfo);
      const absolutePosition: AbsolutePositionReference = <AbsolutePositionReference>(
        characterCountToAbsoluteConversion.convert(shortLabel, 32347, 32352)
      );

      expect(absolutePosition.text).toBe(shortLabel);
      expect(absolutePosition.tags.length).toBe(1);
      checkAbsoluteTag(absolutePosition.tags[0], [10, 506, 213, 13, 33]);
    });

    it('last documents text', async () => {
      const pdfRelativePath =
        'app/api/pdf_character_count_to_absolute/specs/pdf_to_be_converted.pdf';
      const lastLabel = '•  Mr. Mostafa Nafari, member of delegation.';

      const characterCountToAbsoluteConversion = new PdfCharacterCountToAbsolute();
      await characterCountToAbsoluteConversion.loadPdf(pdfRelativePath, pdfInfo);
      const absolutePosition: AbsolutePositionReference = <AbsolutePositionReference>(
        characterCountToAbsoluteConversion.convert(lastLabel, 78397, 78441)
      );

      expect(absolutePosition.text).toBe(lastLabel);
      expect(absolutePosition.tags.length).toBe(1);
      checkAbsoluteTag(absolutePosition.tags[0], [24, 953, 200, 17, 275]);
    });

    it('special caracters string', async () => {
      const pdfRelativePath =
        'app/api/pdf_character_count_to_absolute/specs/pdf_to_be_converted.pdf';
      const specialCharactersString = '';

      const characterCountToAbsoluteConversion = new PdfCharacterCountToAbsolute();
      await characterCountToAbsoluteConversion.loadPdf(pdfRelativePath, pdfInfo);
      const absolutePosition: AbsolutePositionReference = <AbsolutePositionReference>(
        characterCountToAbsoluteConversion.convert(specialCharactersString, 16, 25)
      );

      expect(absolutePosition.text).toBe(specialCharactersString);
      expect(absolutePosition.tags.length).toBe(1);
      checkAbsoluteTag(absolutePosition.tags[0], [1, 1185, 85, 42, 140]);
    });

    it('long label strings', async () => {
      const pdfRelativePath =
        'app/api/pdf_character_count_to_absolute/specs/pdf_to_be_converted.pdf';
      const longLabel =
        'B.Interactive dialogue and responses by the State under review13.During the interactive dialogue, 111 delegations made statements. ';

      const characterCountToAbsoluteConversion = new PdfCharacterCountToAbsolute();
      await characterCountToAbsoluteConversion.loadPdf(pdfRelativePath, pdfInfo);
      const absolutePosition: AbsolutePositionReference = <AbsolutePositionReference>(
        characterCountToAbsoluteConversion.convert(longLabel, 6445, 6576)
      );

      expect(absolutePosition.text).toBe(longLabel);
      expect(absolutePosition.tags.length).toBe(11);
      checkAbsoluteTag(absolutePosition.tags[0], [3, 668, 132, 16, 20]);
      checkAbsoluteTag(absolutePosition.tags[10], [3, 707, 655, 13, 70]);
    });

    it('when not founded string', async () => {
      const pdfRelativePath =
        'app/api/pdf_character_count_to_absolute/specs/pdf_to_be_converted.pdf';
      const notFoundedLabel = 'not founded label';

      const characterCountToAbsoluteConversion = new PdfCharacterCountToAbsolute();
      await characterCountToAbsoluteConversion.loadPdf(pdfRelativePath, pdfInfo);
      const absolutePosition: AbsolutePositionReference = <AbsolutePositionReference>(
        characterCountToAbsoluteConversion.convert(notFoundedLabel, 76656, 76844)
      );

      expect(absolutePosition.text).toBe(notFoundedLabel);
      expect(absolutePosition.tags.length).toBe(4);

      checkAbsoluteTag(absolutePosition.tags[0], [24, 177, 149, 19, 293]);
      checkAbsoluteTag(absolutePosition.tags[1], [24, 218, 213, 13, 513]);
      checkAbsoluteTag(absolutePosition.tags[2], [24, 236, 170, 13, 555]);
    });
  });

  it('should match string and position when several matching strings occurs', async () => {
    const pdfRelativePath = 'app/api/pdf_character_count_to_absolute/specs/pdf_to_be_converted.pdf';
    const severalAppearancesString = 'Continue';

    const characterCountToAbsoluteConversion = new PdfCharacterCountToAbsolute();
    await characterCountToAbsoluteConversion.loadPdf(pdfRelativePath, pdfInfo);
    const absolutePosition: AbsolutePositionReference = <AbsolutePositionReference>(
      characterCountToAbsoluteConversion.convert(severalAppearancesString, 52284, 52292)
    );

    expect(absolutePosition.text).toBe(severalAppearancesString);
    expect(absolutePosition.tags.length).toBe(1);

    checkAbsoluteTag(absolutePosition.tags[0], [16, 308, 276, 13, 449]);
  });

  it('should return absolute position when string matching across two pages', async () => {
    const pdfRelativePath = 'app/api/pdf_character_count_to_absolute/specs/pdf_to_be_converted.pdf';
    const stringSpreadTwoPages =
      'International Covenant on Civil and Political Rights (Ireland); A/HRC/43/121526.164';

    const characterCountToAbsoluteConversion = new PdfCharacterCountToAbsolute();
    await characterCountToAbsoluteConversion.loadPdf(pdfRelativePath, pdfInfo);
    const absolutePosition: AbsolutePositionReference = <AbsolutePositionReference>(
      characterCountToAbsoluteConversion.convert(stringSpreadTwoPages, 48358, 48440)
    );

    expect(absolutePosition.tags.length).toBe(4);

    checkAbsoluteTag(absolutePosition.tags[0], [14, 1155, 213, 13, 403]);
    checkAbsoluteTag(absolutePosition.tags[1], [15, 67, 730, 12, 80]);
    checkAbsoluteTag(absolutePosition.tags[2], [15, 1208, 794, 12, 13]);
    checkAbsoluteTag(absolutePosition.tags[3], [15, 110, 213, 13, 40]);
  });

  it('should return absolute position when character count across two pages', async () => {
    const pdfRelativePath = 'app/api/pdf_character_count_to_absolute/specs/pdf_to_be_converted.pdf';
    const nonExistentString = 'Non existent string';

    const characterCountToAbsoluteConversion = new PdfCharacterCountToAbsolute();
    await characterCountToAbsoluteConversion.loadPdf(pdfRelativePath, pdfInfo);
    const absolutePosition: AbsolutePositionReference = <AbsolutePositionReference>(
      characterCountToAbsoluteConversion.convert(nonExistentString, 48358, 48440)
    );

    checkAbsoluteTag(absolutePosition.tags[0], [14, 1155, 213, 13, 403]);
    checkAbsoluteTag(absolutePosition.tags[1], [15, 67, 730, 12, 80]);
    checkAbsoluteTag(absolutePosition.tags[2], [15, 1208, 794, 12, 13]);
    checkAbsoluteTag(absolutePosition.tags[3], [15, 110, 213, 13, 40]);
    checkAbsoluteTag(absolutePosition.tags[4], [15, 110, 276, 13, 449]);
  });

  it('should return false when trying to process an nonexistent document', async () => {
    const nonexistentPath = 'nonexistentPath';
    const characterCountToAbsoluteConversion = new PdfCharacterCountToAbsolute();
    const pdfLoaded = await characterCountToAbsoluteConversion.loadPdf(nonexistentPath, pdfInfo);
    expect(pdfLoaded).toBe(false);
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
    expect(absolutePosition).toBeNull();
  });

  it('should return first string match when range outside document', async () => {
    const pdfRelativePath = 'app/api/pdf_character_count_to_absolute/specs/pdf_to_be_converted.pdf';
    const label = '26.80';

    const characterCountToAbsoluteConversion = new PdfCharacterCountToAbsolute();
    await characterCountToAbsoluteConversion.loadPdf(pdfRelativePath, pdfInfo);
    const absolutePosition = <AbsolutePositionReference>(
      characterCountToAbsoluteConversion.convert(label, 999999, 1000000)
    );

    expect(absolutePosition.text).toBe(label);
    expect(absolutePosition.tags.length).toBe(1);
    checkAbsoluteTag(absolutePosition.tags[0], [10, 506, 213, 13, 33]);
  });

  it('should convert to absolute position a different pdf', async () => {
    const otherPdfInfo = [1813, 5329, 8911, 13428, 17878, 22296, 25112, 25537];
    const pdfRelativePath =
      'app/api/pdf_character_count_to_absolute/specs/other_pdf_to_be_converted.pdf';
    const label = 'ISOLICITUD DE INTERPRETACIÓNY PROCEDIMIENTO ANTELA CORTE';

    const characterCountToAbsoluteConversion = new PdfCharacterCountToAbsolute();
    await characterCountToAbsoluteConversion.loadPdf(pdfRelativePath, otherPdfInfo);
    const absolutePosition = <AbsolutePositionReference>(
      characterCountToAbsoluteConversion.convert(label, 1213, 1269)
    );

    expect(absolutePosition.tags.length).toBe(3);

    checkAbsoluteTag(absolutePosition.tags[0], [1, 810, 455, 18, 7]);
    checkAbsoluteTag(absolutePosition.tags[1], [1, 828, 319, 18, 279]);
    checkAbsoluteTag(absolutePosition.tags[2], [1, 846, 309, 18, 303]);
  });
});
