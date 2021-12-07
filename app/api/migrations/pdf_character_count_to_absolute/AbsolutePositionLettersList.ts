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

  wordPositionTagList: AbsolutePositionTag[] = [];

  constructor(
    absolutePositionTagList: AbsolutePositionTag[],
    wordPositionTagList: AbsolutePositionTag[]
  ) {
    this.wordPositionTagList = wordPositionTagList;
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

  static parseHtmlContent(htmlContentObject: any) {
    const tags: AbsolutePositionTag[] = [];
    const { elements } = htmlContentObject.elements[1];
    const body = elements.filter((x: { name: string }) => x.name === 'body')[0];
    const pages = body.elements.filter((x: { name: string }) => x.name === 'doc')[0].elements;
    for (let pageIndex: number = 0; pageIndex < pages.length; pageIndex += 1) {
      const pageElements = pages[pageIndex].elements || [];
      const pageTags: AbsolutePositionTag[] = pageElements.map(
        (x: {
          elements: { text: string }[];
          attributes: { xMin: any; yMin: any; xMax: any; yMax: any };
        }) =>
          x.elements
            ? {
                pageNumber: pageIndex + 1,
                top: Math.round(Number(x.attributes.yMin) / 0.75),
                left: Math.round(Number(x.attributes.xMin) / 0.75),
                height: Math.round(
                  Number(x.attributes.yMax) / 0.75 - Number(x.attributes.yMin) / 0.75
                ),
                width: Math.round(
                  Number(x.attributes.xMax) / 0.75 - Number(x.attributes.xMin) / 0.75
                ),
                text: x.elements[0].text,
              }
            : { pageNumber: 0, top: 0, left: 0, height: 0, width: 0, text: 0 }
      );

      Array.prototype.push.apply(tags, pageTags);
    }
    return tags;
  }

  static fromXmlObject(xmlContentObject: any, htmlContentObject: any) {
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
        .reduce(AbsolutePositionLettersList.removeXmlOneLevel(), [])
        .reduce(AbsolutePositionLettersList.removeXmlOneLevel(), []);

      pageElements = pageElements.filter(
        (x: { text: any; attributes: any }) => x.text && x.attributes && x.attributes.top
      );

      const pageTags: AbsolutePositionTag[] = pageElements.map(
        (x: { text: string; attributes: { top: any; left: any; height: any; width: any } }) => ({
          pageNumber: Number(pages[pageIndex].attributes.number),
          top: Math.round(Number(x.attributes.top)),
          left: Math.round(Number(x.attributes.left)),
          height: Math.round(Number(x.attributes.height)),
          width: Math.round(Number(x.attributes.width)),
          text: x.text.replace(/^\s+/g, ''),
        })
      );

      Array.prototype.push.apply(allTags, pageTags);
    }

    return new AbsolutePositionLettersList(
      allTags,
      AbsolutePositionLettersList.parseHtmlContent(htmlContentObject)
    );
  }

  static removeXmlOneLevel =
    () =>
    (accumulator: any[], currentValue: { elements: { attributes: any }[]; attributes: any }) => {
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

  getWordsAbsolutePositions(absolutePositionTags: AbsolutePositionTag[]) {
    if (!absolutePositionTags) {
      return undefined;
    }
    const wordsAbsolutePosition: AbsolutePositionTag[] = [];

    for (let tagIndex: number = 0; tagIndex < absolutePositionTags.length; tagIndex += 1) {
      const absolutePositionTag: AbsolutePositionTag = absolutePositionTags[tagIndex];

      const wordsInsideTag = this.wordPositionTagList.filter(
        x => x.pageNumber === absolutePositionTag.pageNumber && x.top === absolutePositionTag.top
      );

      const lineText = wordsInsideTag.reduce((acc: string, val) => acc + val.text, '') || '';
      const indexTextInRow = lineText.indexOf(absolutePositionTag.text);
      if (indexTextInRow === -1) {
        wordsAbsolutePosition.push(absolutePositionTags[tagIndex]);
      } else {
        const matchedWords: AbsolutePositionTag[] = [];
        let lettersCount = 0;
        for (let wordIndex: number = 0; wordIndex < wordsInsideTag.length; wordIndex += 1) {
          const wordEnd = lettersCount + wordsInsideTag[wordIndex].text.length;
          if (
            (lettersCount <= indexTextInRow && indexTextInRow < wordEnd) ||
            (lettersCount < indexTextInRow + absolutePositionTag.text.length &&
              indexTextInRow + absolutePositionTag.text.length <= wordEnd)
          ) {
            matchedWords.push(wordsInsideTag[wordIndex]);
          }
          lettersCount += wordsInsideTag[wordIndex].text.length;
        }

        wordsAbsolutePosition.push({
          pageNumber: matchedWords[0].pageNumber,
          top: matchedWords[0].top,
          left: matchedWords[0].left,
          height: matchedWords[0].height,
          width:
            matchedWords[matchedWords.length - 1].left +
            matchedWords[matchedWords.length - 1].width -
            matchedWords[0].left,
          text: '',
        });
      }
    }

    return wordsAbsolutePosition;
  }
}
