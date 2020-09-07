import { spawn } from 'child-process-promise';

const fs = require('fs');
const convert = require('xml-js');

export interface AbsolutePosition {
  pageNumber: number;
  top: number;
  left: number;
  bottom: number;
  right: number;
  text: string;
}

export class PdfCharacterCountToAbsolute {
  lettersTags: AbsolutePosition[];

  lettersTagsNoSpaces: AbsolutePosition[];

  pagesEndingCharacterCount: number[];

  constructor() {
    this.lettersTags = [];
    this.lettersTagsNoSpaces = [];
    this.pagesEndingCharacterCount = [];
  }

  async loadPdf(pdfRelativePath: string, pagesEndingCharacterCount: number[]) {
    this.pagesEndingCharacterCount = pagesEndingCharacterCount;
    const xmlRelativePath: string = this.getXmlRelativePath(pdfRelativePath);

    await this.convertPdfToXML(pdfRelativePath, xmlRelativePath);

    const xmlContentString: string = fs.readFileSync(xmlRelativePath, 'utf8');
    const xmlContentObject = JSON.parse(convert.xml2json(xmlContentString));
    this.deleteXmlFile(xmlRelativePath);
    this.setLettersTags(xmlContentObject);
  }

  async convertPdfToXML(pdfRelativePath: string, xmlRelativePath: string) {
    await spawn('pdftohtml', ['-xml', '-i', pdfRelativePath, xmlRelativePath], {
      capture: ['stdout', 'stderr'],
    });
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
    let allTags: AbsolutePosition[] = [];
    for (let pageIndex: number = 0; pageIndex < pages.length; pageIndex += 1) {
      let pageElements = pages[pageIndex].elements;

      pageElements = pageElements
        .reduce(this.removeXmlOneLevel(), [])
        .reduce(this.removeXmlOneLevel(), [])
        .reduce(this.removeXmlOneLevel(), [])
        .reduce(this.removeXmlOneLevel(), []);

      pageElements = pageElements.filter((x: { text: any }) => x.text);
      const pageTags: AbsolutePosition[] = pageElements.map(
        (x: { text: string; attributes: { top: any; left: any; height: any; width: any } }) => ({
          pageNumber: Number(pages[pageIndex].attributes.number),
          top: Number(x.attributes.top),
          left: Number(x.attributes.left),
          bottom: Number(x.attributes.top) + Number(x.attributes.height),
          right: Number(x.attributes.left) + Number(x.attributes.width),
          text: x.text,
        })
      );
      allTags = allTags.concat(pageTags);
    }

    this.lettersTags = allTags.reduce(
      (accumulator: AbsolutePosition[], currentValue: AbsolutePosition) => {
        const letters: AbsolutePosition[] = currentValue.text.split('').map((x: string) => ({
          pageNumber: currentValue.pageNumber,
          top: currentValue.top,
          left: currentValue.left,
          bottom: currentValue.bottom,
          right: currentValue.right,
          text: x,
        }));
        return accumulator.concat(letters);
      },
      []
    );

    this.lettersTags = this.lettersTags.filter(x => x.text !== ' ');
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

  convert(label: string, startRange: number, endRange: number): AbsolutePosition | undefined {
    const targetLabelNoSpaces: string = label.replace(/ /g, '');
    const stringMatches: AbsolutePosition[] = this.getStringMatches(targetLabelNoSpaces, label);
    const characterCountMatch: AbsolutePosition = this.getCharacterCountMatch(
      startRange,
      endRange,
      label
    );

    if (stringMatches.length === 0) {
      return characterCountMatch;
    }

    return stringMatches[0];
  }

  private getStringMatches(targetLabelNoSpaces: string, label: string) {
    const stringMatches: AbsolutePosition[] = [];
    for (
      let lettersIndex = 0;
      lettersIndex < this.lettersTagsNoSpaces.length - targetLabelNoSpaces.length;
      lettersIndex += 1
    ) {
      let allWordsMatching = true;
      let { top } = this.lettersTagsNoSpaces[lettersIndex];
      let { left } = this.lettersTagsNoSpaces[lettersIndex];
      let { bottom } = this.lettersTagsNoSpaces[lettersIndex];
      let { right } = this.lettersTagsNoSpaces[lettersIndex];

      for (
        let targetLabelIndex = 0;
        targetLabelIndex < targetLabelNoSpaces.length;
        targetLabelIndex += 1
      ) {
        if (
          targetLabelNoSpaces.charAt(targetLabelIndex) !==
          this.lettersTagsNoSpaces[lettersIndex + targetLabelIndex].text
        ) {
          allWordsMatching = false;
          break;
        }

        top = Math.min(top, this.lettersTagsNoSpaces[lettersIndex + targetLabelIndex].top);
        left = Math.min(left, this.lettersTagsNoSpaces[lettersIndex + targetLabelIndex].left);
        bottom = Math.max(bottom, this.lettersTagsNoSpaces[lettersIndex + targetLabelIndex].bottom);
        right = Math.max(right, this.lettersTagsNoSpaces[lettersIndex + targetLabelIndex].right);
      }

      if (allWordsMatching) {
        stringMatches.push({
          pageNumber: this.lettersTagsNoSpaces[lettersIndex].pageNumber,
          top,
          left,
          bottom,
          right,
          text: label,
        });
      }
    }
    return stringMatches;
  }

  private getCharacterCountMatch(startRange: number, endRange: number, label: string) {
    const endingCharactersBeforeRangeMatch = this.pagesEndingCharacterCount.filter(
      x => x < startRange
    );
    const startingCharacterMatchingPage = Number(endingCharactersBeforeRangeMatch.slice(-1)) + 1;

    const startRangeMatchingPage = Math.max(startRange - startingCharacterMatchingPage);
    const endRangeMatchingPage = endRange - startingCharacterMatchingPage;

    const pageNumber = endingCharactersBeforeRangeMatch.length + 1;
    const lettersFromMatchingPage = this.lettersTags.filter(x => x.pageNumber === pageNumber);

    const matchingLetters = lettersFromMatchingPage.slice(
      startRangeMatchingPage,
      endRangeMatchingPage
    );

    const matchingAbsolutePosition: AbsolutePosition = {
      pageNumber,
      top: Math.min(...matchingLetters.map(x => x.top)),
      left: Math.min(...matchingLetters.map(x => x.left)),
      bottom: Math.max(...matchingLetters.map(x => x.bottom)),
      right: Math.max(...matchingLetters.map(x => x.right)),
      text: label,
    };

    return matchingAbsolutePosition;
  }
}
