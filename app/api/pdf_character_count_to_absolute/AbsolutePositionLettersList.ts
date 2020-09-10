import { AbsolutePositionReference } from 'api/pdf_character_count_to_absolute/PdfCharacterCountToAbsolute';

export interface AbsolutePositionTag {
  pageNumber: number;
  top: number;
  left: number;
  height: number;
  width: number;
  text: string;
}

export class AbsolutePositionLettersList {
  letterList: AbsolutePositionTag[];

  letterListNoSpaces: AbsolutePositionTag[];

  constructor(absolutePositionTagList: AbsolutePositionTag[]) {
    absolutePositionTagList = absolutePositionTagList.filter(x => x.text !== ' ');
    this.letterList = this.splitByLetters(absolutePositionTagList);
    this.letterListNoSpaces = this.letterList.filter(x => x.text !== ' ');
  }

  private splitByLetters(absolutePositionTagList: AbsolutePositionTag[]) {
    return absolutePositionTagList.reduce(
      (accumulator: AbsolutePositionTag[], currentValue: AbsolutePositionTag) => {
        const letters: AbsolutePositionTag[] = currentValue.text.split('').map((x: string) => ({
          pageNumber: currentValue.pageNumber,
          top: currentValue.top,
          left: currentValue.left,
          height: currentValue.height,
          width: currentValue.width,
          text: x,
        }));
        return accumulator.concat(letters);
      },
      []
    );
  }

  static fromXmlObject(xmlContentObject: any) {
    const pages = xmlContentObject.elements[1].elements;
    let allTags: AbsolutePositionTag[] = [];
    for (let pageIndex: number = 0; pageIndex < pages.length; pageIndex += 1) {
      let pageElements = pages[pageIndex].elements;

      pageElements = pageElements
        .reduce(AbsolutePositionLettersList.removeXmlOneLevel(), [])
        .reduce(AbsolutePositionLettersList.removeXmlOneLevel(), [])
        .reduce(AbsolutePositionLettersList.removeXmlOneLevel(), [])
        .reduce(AbsolutePositionLettersList.removeXmlOneLevel(), []);

      pageElements = pageElements.filter((x: { text: any }) => x.text);
      const pageTags: AbsolutePositionTag[] = pageElements.map(
        (x: { text: string; attributes: { top: any; left: any; height: any; width: any } }) => ({
          pageNumber: Number(pages[pageIndex].attributes.number),
          top: Number(x.attributes.top),
          left: Number(x.attributes.left),
          height: Number(x.attributes.height),
          width: Number(x.attributes.width),
          text: x.text.replace(/^\s+/g, ''),
        })
      );
      allTags = allTags.concat(pageTags);
    }

    return new AbsolutePositionLettersList(allTags);
  }

  static removeXmlOneLevel = () => (
    accumulator: any[],
    currentValue: { elements: { attributes: any }[]; attributes: any }
  ) => {
    if (currentValue.elements && currentValue.elements.length > 0) {
      return accumulator.concat(
        currentValue.elements.map((x: { attributes: any }) => {
          x.attributes = currentValue.attributes;
          return x;
        })
      );
    }
    accumulator.push(currentValue);
    return accumulator;
  };

  getStringMatches(label: string) {
    const labelNoSpaces: string = label.replace(/ /g, '');

    const absolutePositionReferences: AbsolutePositionReference[] = [];
    for (
      let lettersIndex = 0;
      lettersIndex < this.letterListNoSpaces.length - labelNoSpaces.length;
      lettersIndex += 1
    ) {
      let allWordsMatching = true;
      const absolutePositionTags: AbsolutePositionTag[] = [];
      for (
        let targetLabelIndex = 0;
        targetLabelIndex < labelNoSpaces.length;
        targetLabelIndex += 1
      ) {
        const letterTag = this.letterListNoSpaces[lettersIndex + targetLabelIndex];
        if (labelNoSpaces.charAt(targetLabelIndex) !== letterTag.text) {
          allWordsMatching = false;
          break;
        }
        if (!this.isTagInList(absolutePositionTags, letterTag)) {
          absolutePositionTags.push(Object.assign({}, letterTag));
        } else {
          absolutePositionTags.slice(-1)[0].text += letterTag.text;
        }
      }

      if (allWordsMatching) {
        absolutePositionReferences.push({
          text: label,
          tags: absolutePositionTags,
        });
      }
    }
    return absolutePositionReferences;
  }

  private isTagInList(tags: AbsolutePositionTag[], tag: AbsolutePositionTag) {
    if (tags.length === 0) {
      return false;
    }

    const lastTagInserted: AbsolutePositionTag = tags.slice(-1)[0];

    if (
      lastTagInserted.pageNumber === tag.pageNumber &&
      lastTagInserted.top === tag.top &&
      lastTagInserted.left === tag.left &&
      lastTagInserted.height === tag.height &&
      lastTagInserted.width === tag.width
    ) {
      return true;
    }

    return false;
  }

  getCharacterCountMatch(pageNumber: number, startRange: number, endRange: number) {
    const lettersFromMatchingPage = this.letterList.filter(x => x.pageNumber >= pageNumber);

    const matchingLetters = lettersFromMatchingPage.slice(startRange, endRange);

    const absolutePositionTags: AbsolutePositionTag[] = matchingLetters.reduce(
      (accumulator: AbsolutePositionTag[], letterTag: AbsolutePositionTag) => {
        if (this.isTagInList(accumulator, letterTag)) {
          accumulator.slice(-1)[0].text += letterTag.text;
        } else {
          accumulator.push(Object.assign({}, letterTag));
        }

        return accumulator;
      },
      []
    );

    return absolutePositionTags;
  }
}
