import { spawn } from 'child-process-promise';

const fs = require('fs');
const convert = require('xml-js');

export interface AbsolutePositionTag {
  pageNumber: number;
  top: number;
  left: number;
  height: number;
  width: number;
  text: string;
}

export interface AbsolutePositionReference {
  text: string;
  tags: AbsolutePositionTag[];
}

export class PdfCharacterCountToAbsolute {
  lettersTags: AbsolutePositionTag[];

  lettersTagsNoSpaces: AbsolutePositionTag[];

  pagesEndingCharacterCount: number[];

  constructor() {
    this.lettersTags = [];
    this.lettersTagsNoSpaces = [];
    this.pagesEndingCharacterCount = [];
  }

  async loadPdf(pdfRelativePath: string, pagesEndingCharacterCount: number[]) {
    this.pagesEndingCharacterCount = pagesEndingCharacterCount;
    const xmlRelativePath: string = this.getXmlRelativePath(pdfRelativePath);

    try {
      await this.convertPdfToXML(pdfRelativePath, xmlRelativePath);
    } catch (error) {
      return false;
    }
    const xmlContentString: string = fs.readFileSync(xmlRelativePath, 'utf8');
    const xmlContentObject = JSON.parse(convert.xml2json(xmlContentString));
    this.deleteXmlFile(xmlRelativePath);
    this.setLettersTags(xmlContentObject);
  }

  async convertPdfToXML(pdfRelativePath: string, xmlRelativePath: string) {
    await spawn('pdftohtml', ['-xml', '-i', pdfRelativePath, xmlRelativePath], {
      capture: ['stdout', 'stderr'],
    });

    return true;
  }

  getXmlRelativePath(pdfRelativePath: string) {
    const pathParts: string[] = pdfRelativePath.split('/');

    let fileName: string = <string>pathParts.slice(-1).pop();
    fileName = fileName.replace('.pdf', '.xml');

    return `temporal_files/${fileName}`;
  }

  deleteXmlFile(xmlRelativePath: string) {
    try {
      fs.unlinkSync(xmlRelativePath);
    } catch (err) {
      console.error(err);
    }
  }

  setLettersTags(xmlContentObject: any) {
    const pages = xmlContentObject.elements[1].elements;
    let allTags: AbsolutePositionTag[] = [];
    for (let pageIndex: number = 0; pageIndex < pages.length; pageIndex += 1) {
      let pageElements = pages[pageIndex].elements;

      pageElements = pageElements
        .reduce(this.removeXmlOneLevel(), [])
        .reduce(this.removeXmlOneLevel(), [])
        .reduce(this.removeXmlOneLevel(), [])
        .reduce(this.removeXmlOneLevel(), []);

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
    allTags = allTags.filter(x => x.text !== ' ');
    allTags.sort((a, b) => {
      if (a.pageNumber !== b.pageNumber) {
        return a.pageNumber > b.pageNumber ? 1 : -1;
      }

      if (a.top !== b.top) {
        return a.top > b.top ? 1 : -1;
      }

      return a.left > b.left ? 1 : -1;
    });

    this.lettersTags = allTags.reduce(
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

    this.lettersTagsNoSpaces = this.lettersTags.filter(x => x.text !== ' ');
  }

  removeXmlOneLevel = () => (
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

  convert(label: string, startRange: number, endRange: number): AbsolutePositionReference | null {
    let stringMatches: AbsolutePositionReference[] = this.getStringMatches(label);
    let characterCountMatch: AbsolutePositionTag[] = this.getCharacterCountMatch(
      startRange,
      endRange
    );

    if (characterCountMatch.length === 0 && stringMatches.length === 0) {
      return null;
    }

    if (characterCountMatch.length === 0) {
      characterCountMatch = stringMatches[0].tags;
    }

    const startingPageNumber = characterCountMatch[0].pageNumber;
    stringMatches = stringMatches.filter(x => x.tags[0].pageNumber === startingPageNumber);

    if (stringMatches.length === 0) {
      return {
        tags: characterCountMatch,
        text: label,
      };
    }

    const { top } = characterCountMatch[0];
    return stringMatches.reduce(
      (acc, val) => (Math.abs(top - val.tags[0].top) < Math.abs(top - acc.tags[0].top) ? val : acc),
      stringMatches[0]
    );
  }

  private getStringMatches(label: string) {
    const targetLabelNoSpaces: string = label.replace(/ /g, '');

    const absolutePositionReferences: AbsolutePositionReference[] = [];
    for (
      let lettersIndex = 0;
      lettersIndex < this.lettersTagsNoSpaces.length - targetLabelNoSpaces.length;
      lettersIndex += 1
    ) {
      let allWordsMatching = true;
      const absolutePositionTags: AbsolutePositionTag[] = [];
      for (
        let targetLabelIndex = 0;
        targetLabelIndex < targetLabelNoSpaces.length;
        targetLabelIndex += 1
      ) {
        const letterTag = this.lettersTagsNoSpaces[lettersIndex + targetLabelIndex];
        if (targetLabelNoSpaces.charAt(targetLabelIndex) !== letterTag.text) {
          allWordsMatching = false;
          break;
        }
        if (!this.isTagInList(absolutePositionTags, letterTag)) {
          absolutePositionTags.push(this.lettersTagsNoSpaces[lettersIndex + targetLabelIndex]);
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

  private getCharacterCountMatch(startRange: number, endRange: number) {
    const pagesCharacterCountBeforeMatchingPage = this.pagesEndingCharacterCount.filter(
      x => x < startRange
    );
    const startingCharacterMatchingPage =
      Number(pagesCharacterCountBeforeMatchingPage.slice(-1)) + 1;

    const startRangeMatchingPage = Math.max(startRange - startingCharacterMatchingPage);
    const endRangeMatchingPage = endRange - startingCharacterMatchingPage;

    const pageNumber = pagesCharacterCountBeforeMatchingPage.length + 1;
    const lettersFromMatchingPage = this.lettersTags.filter(x => x.pageNumber >= pageNumber);

    const matchingLetters = lettersFromMatchingPage.slice(
      startRangeMatchingPage,
      endRangeMatchingPage
    );

    const absolutePositionTags: AbsolutePositionTag[] = matchingLetters.reduce(
      (accumulator: AbsolutePositionTag[], letterTag: AbsolutePositionTag) => {
        if (this.isTagInList(accumulator, letterTag)) {
          accumulator.slice(-1)[0].text += letterTag.text;
        } else {
          accumulator.push(letterTag);
        }

        return accumulator;
      },
      []
    );

    return absolutePositionTags;
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
}
