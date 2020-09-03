import {
  convertCharacterCountToAbsolute,
  AbsolutePosition,
} from 'api/pdf_character_count_to_absolute/pdfCharacterCountToAbsolute';

describe('Should convert form character count to absolute position', () => {
  it('Should convert ', async () => {
    const pdfRelativePath = 'app/api/pdf_character_count_to_absolute/specs/pdf_to_be_converted.pdf';
    const containedLabel = '26.80';

    const absolutePositionList: AbsolutePosition[] = await convertCharacterCountToAbsolute(
      pdfRelativePath,
      containedLabel
    );

    expect(absolutePositionList.length).toBe(1);
    expect(absolutePositionList[0].pageNumber).toBe(10);
    expect(absolutePositionList[0].top).toBe(506);
    expect(absolutePositionList[0].left).toBe(213);
    expect(absolutePositionList[0].bottom).toBe(519);
    expect(absolutePositionList[0].right).toBe(247);
  });
});
