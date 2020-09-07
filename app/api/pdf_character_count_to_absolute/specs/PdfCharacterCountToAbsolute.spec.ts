import {
  PdfCharacterCountToAbsolute,
  AbsolutePosition,
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
  it('should convert simple strings character count to absolute position', async () => {
    const pdfRelativePath = 'app/api/pdf_character_count_to_absolute/specs/pdf_to_be_converted.pdf';
    const shortLabel = '26.80';
    const longLabel =
      'B.Interactive dialogue and responses by the State under review13.During the interactive dialogue, 111 delegations made statements. ';

    const characterCountToAbsoluteConvertion = new PdfCharacterCountToAbsolute();
    await characterCountToAbsoluteConvertion.loadPdf(pdfRelativePath, pdfInfo);
    const absolutePositionShortLabel: AbsolutePosition = <AbsolutePosition>(
      characterCountToAbsoluteConvertion.convert(shortLabel, 32347, 32352)
    );
    const absolutePositionLongLabel: AbsolutePosition = <AbsolutePosition>(
      characterCountToAbsoluteConvertion.convert(longLabel, 6445, 6576)
    );

    expect(absolutePositionShortLabel.pageNumber).toBe(10);
    expect(absolutePositionShortLabel.top).toBe(506);
    expect(absolutePositionShortLabel.left).toBe(213);
    expect(absolutePositionShortLabel.bottom).toBe(519);
    expect(absolutePositionShortLabel.right).toBe(247);
    expect(absolutePositionShortLabel.text).toBe(shortLabel);

    expect(absolutePositionLongLabel.pageNumber).toBe(3);
    expect(absolutePositionLongLabel.top).toBe(668);
    expect(absolutePositionLongLabel.left).toBe(132);
    expect(absolutePositionLongLabel.bottom).toBe(720);
    expect(absolutePositionLongLabel.right).toBe(726);
    expect(absolutePositionLongLabel.text).toBe(longLabel);
  });

  it('should convert not founded string in pdf character count to absolute position', async () => {
    const pdfRelativePath = 'app/api/pdf_character_count_to_absolute/specs/pdf_to_be_converted.pdf';
    const notFoundedLabel = 'not founded label';

    const characterCountToAbsoluteConvertion = new PdfCharacterCountToAbsolute();
    await characterCountToAbsoluteConvertion.loadPdf(pdfRelativePath, pdfInfo);
    const absolutePositionNotFoundedLabel: AbsolutePosition = <AbsolutePosition>(
      characterCountToAbsoluteConvertion.convert(notFoundedLabel, 76656, 76844)
    );

    expect(absolutePositionNotFoundedLabel.text).toBe(notFoundedLabel);
    expect(absolutePositionNotFoundedLabel.pageNumber).toBe(24);
    expect(absolutePositionNotFoundedLabel.top).toBe(218);
    expect(absolutePositionNotFoundedLabel.left).toBe(170);
    expect(absolutePositionNotFoundedLabel.right).toBe(727);
    expect(absolutePositionNotFoundedLabel.bottom).toBe(295);
  });
});
