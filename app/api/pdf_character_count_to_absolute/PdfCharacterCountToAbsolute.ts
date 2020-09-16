import { spawn } from 'child-process-promise';

import fs from 'fs';
import convert from 'xml-js';
import path from 'path';
import { promisify } from 'util';
import * as os from 'os';

import { AbsolutePositionLettersList, AbsolutePositionTag } from './AbsolutePositionLettersList';

export interface AbsolutePositionReference {
  text: string;
  tags: AbsolutePositionTag[];
}

export class PdfCharacterCountToAbsolute {
  lettersTags: AbsolutePositionLettersList;

  pdfInfo: number[];

  xmlRelativePath = '';

  pdfRelativePath = '';

  constructor() {
    this.lettersTags = new AbsolutePositionLettersList([]);
    this.pdfInfo = [];
  }

  async loadPdf(pdfRelativePath: string, pagesEndingCharacterCount: number[]) {
    this.pdfRelativePath = pdfRelativePath;
    this.pdfInfo = pagesEndingCharacterCount;
    this.setXmlRelativePath();
    await this.convertPdfToXML();
    const readFile = promisify(fs.readFile);
    const xmlContentString: Buffer = await readFile(this.xmlRelativePath);
    const xmlContentObject = JSON.parse(convert.xml2json(xmlContentString.toString()));
    await this.deleteXmlFile();
    this.lettersTags = AbsolutePositionLettersList.fromXmlObject(xmlContentObject);
  }

  setXmlRelativePath() {
    const fileName = path.basename(this.pdfRelativePath).replace('.pdf', '.xml');
    this.xmlRelativePath = `${os.tmpdir()}/${fileName}`;
  }

  async convertPdfToXML() {
    await spawn('pdftohtml', ['-xml', '-i', this.pdfRelativePath, this.xmlRelativePath]);
  }

  async deleteXmlFile() {
    const unlink = promisify(fs.unlink);
    await unlink(this.xmlRelativePath);
  }

  convert(label: string, startRange: number, endRange: number): AbsolutePositionReference {
    const absolutePositionByStringMatch = this.lettersTags.getAbsolutePositionByStringMatch(label);
    const absolutePositionByCharacterCount = this.getAbsolutePositionByCharacterCount(
      startRange,
      endRange
    );

    const existMatchByCharacterCount = absolutePositionByCharacterCount.length > 0;
    const existMatchByString = absolutePositionByStringMatch.length > 0;

    if (!existMatchByCharacterCount && !existMatchByString) {
      return { text: label, tags: [] };
    }

    if (!existMatchByCharacterCount) {
      return { text: label, tags: absolutePositionByStringMatch[0] };
    }

    const closerAbsolutePositionStringMatch = PdfCharacterCountToAbsolute.getCloserStringMatchToTag(
      absolutePositionByStringMatch,
      absolutePositionByCharacterCount[0]
    );

    return {
      tags:
        closerAbsolutePositionStringMatch ||
        absolutePositionByCharacterCount ||
        absolutePositionByStringMatch[0],
      text: label,
    };
  }

  static getCloserStringMatchToTag(
    stringMatches: AbsolutePositionTag[][],
    tag: AbsolutePositionTag
  ): AbsolutePositionTag[] {
    const stringMatchesFromMatchingPage = stringMatches.filter(
      x => x[0].pageNumber === tag.pageNumber
    );
    const { top } = tag;
    return stringMatchesFromMatchingPage.reduce(
      (acc, val) => (Math.abs(top - val[0].top) < Math.abs(top - acc[0].top) ? val : acc),
      stringMatches[0]
    );
  }

  private getAbsolutePositionByCharacterCount(startRange: number, endRange: number) {
    const pagesCharacterCountBeforeMatchingPage = this.pdfInfo.filter(x => x < startRange);
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
