import { spawn } from 'child-process-promise';
import { AbsolutePositionLettersList, AbsolutePositionTag } from './AbsolutePositionLettersList';

const fs = require('fs');
const convert = require('xml-js');

export interface AbsolutePositionReference {
  text: string;
  tags: AbsolutePositionTag[];
}

export class PdfCharacterCountToAbsolute {
  lettersTags: AbsolutePositionLettersList;

  pagesEndingCharacterCount: number[];

  constructor() {
    this.lettersTags = new AbsolutePositionLettersList([]);
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
    this.lettersTags = AbsolutePositionLettersList.fromXmlObject(xmlContentObject);
  }

  getXmlRelativePath(pdfRelativePath: string) {
    const pathParts: string[] = pdfRelativePath.split('/');

    let fileName: string = <string>pathParts.slice(-1).pop();
    fileName = fileName.replace('.pdf', '.xml');

    return `temporal_files/${fileName}`;
  }

  async convertPdfToXML(pdfRelativePath: string, xmlRelativePath: string) {
    await spawn('pdftohtml', ['-xml', '-i', pdfRelativePath, xmlRelativePath], {
      capture: ['stdout', 'stderr'],
    });

    return true;
  }

  deleteXmlFile(xmlRelativePath: string) {
    try {
      fs.unlinkSync(xmlRelativePath);
    } catch (err) {
      console.error(err);
    }
  }

  convert(label: string, startRange: number, endRange: number): AbsolutePositionReference | null {
    const stringMatches: AbsolutePositionTag[][] = this.lettersTags.getStringMatches(label);
    const characterCountMatch: AbsolutePositionTag[] = this.getCharacterCountMatch(
      startRange,
      endRange
    );

    if (characterCountMatch.length === 0 && stringMatches.length === 0) {
      return null;
    }

    if (characterCountMatch.length === 0) {
      return {
        tags: stringMatches[0],
        text: label,
      };
    }

    return {
      tags:
        this.getCloserStringMatchToTag(stringMatches, characterCountMatch[0]) ||
        characterCountMatch,
      text: label,
    };
  }

  private getCloserStringMatchToTag(
    stringMatches: AbsolutePositionTag[][],
    tag: AbsolutePositionTag
  ): AbsolutePositionTag[] {
    stringMatches = stringMatches.filter(x => x[0].pageNumber === tag.pageNumber);
    const { top } = tag;
    return stringMatches.reduce(
      (acc, val) => (Math.abs(top - val[0].top) < Math.abs(top - acc[0].top) ? val : acc),
      stringMatches[0]
    );
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

    return this.lettersTags.getCharacterCountMatch(
      pageNumber,
      startRangeMatchingPage,
      endRangeMatchingPage
    );
  }
}
