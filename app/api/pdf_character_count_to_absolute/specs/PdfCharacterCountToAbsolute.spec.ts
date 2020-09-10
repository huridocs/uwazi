import {
  PdfCharacterCountToAbsolute,
  AbsolutePositionReference,
} from 'api/pdf_character_count_to_absolute/PdfCharacterCountToAbsolute';

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

describe('PdfCharacterCountToAbsolute', () => {
  it('should convert short label to absolute position', async () => {
    const pdfRelativePath = 'app/api/pdf_character_count_to_absolute/specs/pdf_to_be_converted.pdf';
    const shortLabel = '26.80';

    const characterCountToAbsoluteConversion = new PdfCharacterCountToAbsolute();
    await characterCountToAbsoluteConversion.loadPdf(pdfRelativePath, pdfInfo);
    const absolutePosition: AbsolutePositionReference = <AbsolutePositionReference>(
      characterCountToAbsoluteConversion.convert(shortLabel, 32347, 32352)
    );

    expect(absolutePosition.text).toBe(shortLabel);
    expect(absolutePosition.tags.length).toBe(1);
    expect(absolutePosition.tags[0].pageNumber).toBe(10);
    expect(absolutePosition.tags[0].top).toBe(506);
    expect(absolutePosition.tags[0].left).toBe(213);
    expect(absolutePosition.tags[0].height).toBe(13);
    expect(absolutePosition.tags[0].width).toBeGreaterThan(33);
    expect(absolutePosition.tags[0].width).toBeLessThan(40);
  });

  it('should convert last documents text to absolute position', async () => {
    const pdfRelativePath = 'app/api/pdf_character_count_to_absolute/specs/pdf_to_be_converted.pdf';
    const lastLabel = '•  Mr. Mostafa Nafari, member of delegation.';

    const characterCountToAbsoluteConversion = new PdfCharacterCountToAbsolute();
    await characterCountToAbsoluteConversion.loadPdf(pdfRelativePath, pdfInfo);
    const absolutePosition: AbsolutePositionReference = <AbsolutePositionReference>(
      characterCountToAbsoluteConversion.convert(lastLabel, 78397, 78441)
    );

    expect(absolutePosition.text).toBe(lastLabel);
    expect(absolutePosition.tags.length).toBe(1);
    expect(absolutePosition.tags[0].pageNumber).toBe(24);
    expect(absolutePosition.tags[0].top).toBe(953);
    expect(absolutePosition.tags[0].left).toBe(200);
    expect(absolutePosition.tags[0].width).toBeGreaterThan(275);
    expect(absolutePosition.tags[0].width).toBeLessThan(282);
    expect(absolutePosition.tags[0].height).toBe(17);
  });

  it('should convert special caracters string to absolute position', async () => {
    const pdfRelativePath = 'app/api/pdf_character_count_to_absolute/specs/pdf_to_be_converted.pdf';
    const specialCharactersString = '';

    const characterCountToAbsoluteConversion = new PdfCharacterCountToAbsolute();
    await characterCountToAbsoluteConversion.loadPdf(pdfRelativePath, pdfInfo);
    const absolutePosition: AbsolutePositionReference = <AbsolutePositionReference>(
      characterCountToAbsoluteConversion.convert(specialCharactersString, 16, 25)
    );

    expect(absolutePosition.text).toBe(specialCharactersString);
    expect(absolutePosition.tags.length).toBe(1);
    expect(absolutePosition.tags[0].pageNumber).toBe(1);
    expect(absolutePosition.tags[0].top).toBe(1185);
    expect(absolutePosition.tags[0].left).toBe(85);
    expect(absolutePosition.tags[0].width).toBeGreaterThan(140);
    expect(absolutePosition.tags[0].width).toBeLessThan(147);
    expect(absolutePosition.tags[0].height).toBe(42);
  });

  it('should convert long label strings character count to absolute position', async () => {
    const pdfRelativePath = 'app/api/pdf_character_count_to_absolute/specs/pdf_to_be_converted.pdf';
    const longLabel =
      'B.Interactive dialogue and responses by the State under review13.During the interactive dialogue, 111 delegations made statements. ';

    const characterCountToAbsoluteConversion = new PdfCharacterCountToAbsolute();
    await characterCountToAbsoluteConversion.loadPdf(pdfRelativePath, pdfInfo);
    const absolutePosition: AbsolutePositionReference = <AbsolutePositionReference>(
      characterCountToAbsoluteConversion.convert(longLabel, 6445, 6576)
    );

    expect(absolutePosition.text).toBe(longLabel);
    expect(absolutePosition.tags.length).toBe(11);
    expect(absolutePosition.tags[0].pageNumber).toBe(3);
    expect(absolutePosition.tags[0].top).toBe(668);
    expect(absolutePosition.tags[0].left).toBe(132);
    expect(absolutePosition.tags[0].width).toBeGreaterThan(20);
    expect(absolutePosition.tags[0].width).toBeLessThan(27);
    expect(absolutePosition.tags[0].height).toBe(16);

    expect(absolutePosition.tags[1].top).toBe(668);
    expect(absolutePosition.tags[2].top).toBe(707);
    expect(absolutePosition.tags[3].top).toBe(707);
    expect(absolutePosition.tags[4].top).toBe(707);
    expect(absolutePosition.tags[5].top).toBe(707);
    expect(absolutePosition.tags[6].top).toBe(707);
    expect(absolutePosition.tags[7].top).toBe(707);
    expect(absolutePosition.tags[8].top).toBe(707);
    expect(absolutePosition.tags[9].top).toBe(707);

    expect(absolutePosition.tags[10].top).toBe(707);
    expect(absolutePosition.tags[10].left).toBe(655);
    expect(absolutePosition.tags[10].width).toBeGreaterThan(70);
    expect(absolutePosition.tags[10].width).toBeLessThan(77);
    expect(absolutePosition.tags[10].height).toBe(13);
  });

  it('should convert not founded string in pdf character count to absolute position', async () => {
    const pdfRelativePath = 'app/api/pdf_character_count_to_absolute/specs/pdf_to_be_converted.pdf';
    const notFoundedLabel = 'not founded label';

    const characterCountToAbsoluteConversion = new PdfCharacterCountToAbsolute();
    await characterCountToAbsoluteConversion.loadPdf(pdfRelativePath, pdfInfo);
    const absolutePosition: AbsolutePositionReference = <AbsolutePositionReference>(
      characterCountToAbsoluteConversion.convert(notFoundedLabel, 76656, 76844)
    );

    expect(absolutePosition.text).toBe(notFoundedLabel);
    expect(absolutePosition.tags.length).toBe(4);

    expect(absolutePosition.tags[0].pageNumber).toBe(24);
    expect(absolutePosition.tags[0].top).toBe(177);
    expect(absolutePosition.tags[0].left).toBe(149);
    expect(absolutePosition.tags[0].width).toBeGreaterThan(293);
    expect(absolutePosition.tags[0].width).toBeLessThan(300);
    expect(absolutePosition.tags[0].height).toBe(19);

    expect(absolutePosition.tags[1].pageNumber).toBe(24);
    expect(absolutePosition.tags[1].top).toBe(218);
    expect(absolutePosition.tags[1].left).toBe(213);
    expect(absolutePosition.tags[1].width).toBeGreaterThan(513);
    expect(absolutePosition.tags[1].width).toBeLessThan(520);
    expect(absolutePosition.tags[1].height).toBe(13);

    expect(absolutePosition.tags[2].pageNumber).toBe(24);
    expect(absolutePosition.tags[2].top).toBe(236);
    expect(absolutePosition.tags[2].left).toBe(170);
    expect(absolutePosition.tags[2].width).toBeGreaterThan(555);
    expect(absolutePosition.tags[2].width).toBeLessThan(562);
    expect(absolutePosition.tags[2].height).toBe(13);
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

    expect(absolutePosition.tags[0].pageNumber).toBe(16);
    expect(absolutePosition.tags[0].top).toBe(308);
    expect(absolutePosition.tags[0].left).toBe(276);
    expect(absolutePosition.tags[0].width).toBeGreaterThan(449);
    expect(absolutePosition.tags[0].width).toBeLessThan(456);
    expect(absolutePosition.tags[0].height).toBe(13);
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

    expect(absolutePosition.text).toBe(stringSpreadTwoPages);
    expect(absolutePosition.tags.length).toBe(4);

    expect(absolutePosition.tags[0].pageNumber).toBe(14);
    expect(absolutePosition.tags[0].top).toBe(1155);
    expect(absolutePosition.tags[0].left).toBe(213);
    expect(absolutePosition.tags[0].width).toBeGreaterThan(403);
    expect(absolutePosition.tags[0].width).toBeLessThan(410);
    expect(absolutePosition.tags[0].height).toBe(13);

    expect(absolutePosition.tags[1].pageNumber).toBe(15);
    expect(absolutePosition.tags[1].top).toBe(67);
    expect(absolutePosition.tags[1].left).toBe(730);
    expect(absolutePosition.tags[1].width).toBeGreaterThan(80);
    expect(absolutePosition.tags[1].width).toBeLessThan(87);
    expect(absolutePosition.tags[1].height).toBe(12);

    expect(absolutePosition.tags[2].pageNumber).toBe(15);
    expect(absolutePosition.tags[2].top).toBe(1208);
    expect(absolutePosition.tags[2].left).toBe(794);
    expect(absolutePosition.tags[2].width).toBeGreaterThan(13);
    expect(absolutePosition.tags[2].width).toBeLessThan(20);
    expect(absolutePosition.tags[2].height).toBe(12);

    expect(absolutePosition.tags[3].pageNumber).toBe(15);
    expect(absolutePosition.tags[3].top).toBe(110);
    expect(absolutePosition.tags[3].left).toBe(213);
    expect(absolutePosition.tags[3].width).toBeGreaterThan(40);
    expect(absolutePosition.tags[3].width).toBeLessThan(47);
    expect(absolutePosition.tags[3].height).toBe(13);
  });

  it('should return absolute position when character count across two pages', async () => {
    const pdfRelativePath = 'app/api/pdf_character_count_to_absolute/specs/pdf_to_be_converted.pdf';
    const nonExistentString = 'Non existent string';

    const characterCountToAbsoluteConversion = new PdfCharacterCountToAbsolute();
    await characterCountToAbsoluteConversion.loadPdf(pdfRelativePath, pdfInfo);
    const absolutePosition: AbsolutePositionReference = <AbsolutePositionReference>(
      characterCountToAbsoluteConversion.convert(nonExistentString, 48358, 48440)
    );

    expect(absolutePosition.text).toBe(nonExistentString);
    expect(absolutePosition.tags.length).toBe(5);

    expect(absolutePosition.tags[0].pageNumber).toBe(14);
    expect(absolutePosition.tags[0].top).toBe(1155);
    expect(absolutePosition.tags[0].left).toBe(213);
    expect(absolutePosition.tags[0].width).toBeGreaterThan(403);
    expect(absolutePosition.tags[0].width).toBeLessThan(410);
    expect(absolutePosition.tags[0].height).toBe(13);

    expect(absolutePosition.tags[1].pageNumber).toBe(15);
    expect(absolutePosition.tags[1].top).toBe(67);
    expect(absolutePosition.tags[1].left).toBe(730);
    expect(absolutePosition.tags[1].width).toBeGreaterThan(80);
    expect(absolutePosition.tags[1].width).toBeLessThan(87);
    expect(absolutePosition.tags[1].height).toBe(12);

    expect(absolutePosition.tags[2].pageNumber).toBe(15);
    expect(absolutePosition.tags[2].top).toBe(1208);
    expect(absolutePosition.tags[2].left).toBe(794);
    expect(absolutePosition.tags[2].width).toBeGreaterThan(13);
    expect(absolutePosition.tags[2].width).toBeLessThan(20);
    expect(absolutePosition.tags[2].height).toBe(12);

    expect(absolutePosition.tags[3].pageNumber).toBe(15);
    expect(absolutePosition.tags[3].top).toBe(110);
    expect(absolutePosition.tags[3].left).toBe(213);
    expect(absolutePosition.tags[3].width).toBeGreaterThan(40);
    expect(absolutePosition.tags[3].width).toBeLessThan(47);
    expect(absolutePosition.tags[3].height).toBe(13);

    expect(absolutePosition.tags[4].pageNumber).toBe(15);
    expect(absolutePosition.tags[4].top).toBe(110);
    expect(absolutePosition.tags[4].left).toBe(276);
    expect(absolutePosition.tags[4].width).toBeGreaterThan(449);
    expect(absolutePosition.tags[4].width).toBeLessThan(456);
    expect(absolutePosition.tags[4].height).toBe(13);
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
    expect(absolutePosition.tags[0].pageNumber).toBe(10);
    expect(absolutePosition.tags[0].top).toBe(506);
    expect(absolutePosition.tags[0].left).toBe(213);
    expect(absolutePosition.tags[0].width).toBeGreaterThan(33);
    expect(absolutePosition.tags[0].width).toBeLessThan(40);
    expect(absolutePosition.tags[0].height).toBe(13);
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

    expect(absolutePosition.text).toBe(label);
    expect(absolutePosition.tags.length).toBe(3);

    expect(absolutePosition.tags[0].pageNumber).toBe(1);
    expect(absolutePosition.tags[0].top).toBe(810);
    expect(absolutePosition.tags[0].left).toBe(455);
    expect(absolutePosition.tags[0].width).toBeGreaterThan(7);
    expect(absolutePosition.tags[0].width).toBeLessThan(14);
    expect(absolutePosition.tags[0].height).toBe(18);

    expect(absolutePosition.tags[1].pageNumber).toBe(1);
    expect(absolutePosition.tags[1].top).toBe(828);
    expect(absolutePosition.tags[1].left).toBe(319);
    expect(absolutePosition.tags[1].width).toBeGreaterThan(279);
    expect(absolutePosition.tags[1].width).toBeLessThan(287);
    expect(absolutePosition.tags[1].height).toBe(18);

    expect(absolutePosition.tags[2].pageNumber).toBe(1);
    expect(absolutePosition.tags[2].top).toBe(846);
    expect(absolutePosition.tags[2].left).toBe(309);
    expect(absolutePosition.tags[2].width).toBeGreaterThan(303);
    expect(absolutePosition.tags[2].width).toBeLessThan(310);
    expect(absolutePosition.tags[2].height).toBe(18);
  });
});
