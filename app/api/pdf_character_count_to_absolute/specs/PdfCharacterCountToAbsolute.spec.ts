import {
  PdfCharacterCountToAbsolute,
  AbsolutePosition,
} from 'api/pdf_character_count_to_absolute/PdfCharacterCountToAbsolute';

describe('PdfCharacterCountToAbsolute', () => {
  it('should convert simple strings character count to absolute position', async () => {
    const pdfRelativePath = 'app/api/pdf_character_count_to_absolute/specs/pdf_to_be_converted.pdf';
    const shortLabel = '26.80';
    const longLabel =
      'B.Interactive dialogue and responses by the State under review13.During the interactive dialogue, 111 delegations made statements. ';

    const characterCountToAbsoluteConvertion = new PdfCharacterCountToAbsolute();
    await characterCountToAbsoluteConvertion.loadPdf(pdfRelativePath);
    const absolutePositionShortLabel: AbsolutePosition = <AbsolutePosition>(
      characterCountToAbsoluteConvertion.convert(shortLabel)
    );
    const absolutePositionLongLabel: AbsolutePosition = <AbsolutePosition>(
      characterCountToAbsoluteConvertion.convert(longLabel)
    );

    expect(absolutePositionShortLabel.pageNumber).toBe(10);
    expect(absolutePositionShortLabel.top).toBe(506);
    expect(absolutePositionShortLabel.left).toBe(213);
    expect(absolutePositionShortLabel.bottom).toBe(519);
    expect(absolutePositionShortLabel.right).toBe(247);

    expect(absolutePositionLongLabel.pageNumber).toBe(3);
    expect(absolutePositionLongLabel.top).toBe(668);
    expect(absolutePositionLongLabel.left).toBe(132);
    expect(absolutePositionLongLabel.bottom).toBe(720);
    expect(absolutePositionLongLabel.right).toBe(726);
  });
});
