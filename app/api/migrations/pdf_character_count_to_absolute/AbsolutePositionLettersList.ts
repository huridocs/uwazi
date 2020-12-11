export interface AbsolutePositionTag {
  pageNumber: number;
  top: number;
  left: number;
  height: number;
  width: number;
  text: string;
}

export class AbsolutePositionLettersList {
  letterList: AbsolutePositionTag[] = [];

  letterListNoSpaces: AbsolutePositionTag[] = [];

  constructor(absolutePositionTagList: AbsolutePositionTag[]) {
    const tagListNoEmpty = absolutePositionTagList.filter(x => x.text !== ' ');
    this.splitByLetters(tagListNoEmpty);
  }

  private splitByLetters(absolutePositionTagList: AbsolutePositionTag[]) {
    this.letterList = absolutePositionTagList.reduce(
      (accumulator: AbsolutePositionTag[], currentValue: AbsolutePositionTag) => {
        const letters: AbsolutePositionTag[] = currentValue.text.split('').map((x: string) => ({
          pageNumber: currentValue.pageNumber,
          top: currentValue.top,
          left: currentValue.left,
          height: currentValue.height,
          width: currentValue.width,
          text: x,
        }));
        Array.prototype.push.apply(accumulator, letters);
        return accumulator;
      },
      []
    );

    this.letterListNoSpaces = this.letterList.filter(x => x.text !== ' ');
  }

  getAbsolutePositionByStringMatch(label: string) {
    const labelNoSpaces: string = label.replace(/ /g, '');

    const absolutePositionsLists: AbsolutePositionTag[][] = [];

    for (let startRange = 0; startRange < this.letterListNoSpaces.length; startRange += 1) {
      if (labelNoSpaces[0] === this.letterListNoSpaces[startRange].text) {
        const endRange = startRange + labelNoSpaces.length;
        const lettersToMatch = this.letterListNoSpaces.slice(startRange, endRange);

        if (labelNoSpaces === lettersToMatch.map(x => x.text).join('')) {
          absolutePositionsLists.push(
            AbsolutePositionLettersList.lettersTagsToAbsolutePositionTags(lettersToMatch)
          );
        }
      }
    }

    return absolutePositionsLists;
  }

  getCharacterCountMatch(pageNumber: number, startRange: number, endRange: number) {
    const lettersFromMatchingPage = this.letterList.filter(x => x.pageNumber >= pageNumber);

    const matchingLetters = lettersFromMatchingPage.slice(startRange, endRange);

    return AbsolutePositionLettersList.lettersTagsToAbsolutePositionTags(matchingLetters);
  }

  static fromXmlObject(xmlContentObject: any) {
    const pages = xmlContentObject.elements[1].elements.filter(
      (x: { attributes: { number: any } }) => x.attributes && x.attributes.number
    );
    const allTags: AbsolutePositionTag[] = [];
    for (let pageIndex: number = 0; pageIndex < pages.length; pageIndex += 1) {
      let pageElements = pages[pageIndex].elements || [];

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

      Array.prototype.push.apply(allTags, pageTags);
    }

    return new AbsolutePositionLettersList(allTags);
  }

  static removeXmlOneLevel = () => (
    accumulator: any[],
    currentValue: { elements: { attributes: any }[]; attributes: any }
  ) => {
    if (currentValue.elements && currentValue.elements.length > 0) {
      Array.prototype.push.apply(
        accumulator,
        currentValue.elements.map((x: { attributes: any }) => {
          const flatOneLevel = x;
          flatOneLevel.attributes = currentValue.attributes;
          return flatOneLevel;
        })
      );

      return accumulator;
    }
    accumulator.push(currentValue);
    return accumulator;
  };

  static isTagInList(tags: AbsolutePositionTag[], tag: AbsolutePositionTag) {
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

  static lettersTagsToAbsolutePositionTags(lettersTags: AbsolutePositionTag[]) {
    return lettersTags.reduce(
      (accumulator: AbsolutePositionTag[], letterTag: AbsolutePositionTag) => {
        if (AbsolutePositionLettersList.isTagInList(accumulator, letterTag)) {
          accumulator.slice(-1)[0].text += letterTag.text;
        } else {
          accumulator.push({ ...letterTag });
        }

        return accumulator;
      },
      []
    );
  }
}
