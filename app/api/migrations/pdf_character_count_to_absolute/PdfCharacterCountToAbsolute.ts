import { spawn } from 'child-process-promise';

import fs from 'fs';
import convert from 'xml-js';
import path from 'path';
import { promisify } from 'util';
import * as os from 'os';

import { AbsolutePositionLettersList, AbsolutePositionTag } from './AbsolutePositionLettersList';

export interface AbsolutePositionReference {
  pageHeight: number;
  pageWidth: number;
  text: string;
  selectionRectangles: AbsolutePositionTag[];
}

export interface PageSize {
  number: number;
  width: number;
  height: number;
}

const readXml = async (xmlRelativePath: string) => {
  const readFile = promisify(fs.readFile);
  const xmlContentBuffer: Buffer = await readFile(xmlRelativePath);
  return xmlContentBuffer.toString();
};

export class PdfCharacterCountToAbsolute {
  lettersTags: AbsolutePositionLettersList;

  pdfInfo: number[];

  xmlRelativePath = '';

  pdfRelativePath = '';

  pageSizes: PageSize[];

  constructor() {
    this.lettersTags = new AbsolutePositionLettersList([]);
    this.pdfInfo = [];
    this.pageSizes = [];
  }

  async loadPdf(pdfRelativePath: string, pagesEndingCharacterCount: number[]) {
    this.pdfRelativePath = pdfRelativePath;
    this.pdfInfo = pagesEndingCharacterCount;
    this.setXmlRelativePath();
    await this.convertPdfToXML();

    let xmlContentString = await readXml(this.xmlRelativePath);
    let xmlContentObject = null;
    let errorMessage = '';
    for (let iterations = 0; iterations < 300; iterations += 1) {
      try {
        xmlContentObject = JSON.parse(convert.xml2json(xmlContentString));
      } catch (e) {
        errorMessage = e.toString();
        xmlContentString = this.removeFailingLines(errorMessage, xmlContentString);
      }

      if (xmlContentObject !== null) {
        break;
      }
    }

    if (xmlContentObject === null) {
      process.stdout.write(`xml2json error ${pdfRelativePath} ${errorMessage}\r\n`);
    } else {
      await this.deleteXmlFile();
      this.setPageSizes(xmlContentObject);
      this.lettersTags = AbsolutePositionLettersList.fromXmlObject(xmlContentObject);
    }
  }

  private sanitizeLine(line: string) {
    if (!line.includes('<text')) {
      return line;
    }

    return `${line.split('>')[0]}>${line.split('>')[1].split('<')[0]}</text>`;
  }

  private removeFailingLines(errorMessage: string, xmlContentString: string) {
    let sanitizedContentString = xmlContentString;
    const matches = sanitizedContentString.match(/<text.*<a href=".*<\/text>/g) || [];

    matches.forEach(line => {
      if (!line.includes('</a>')) {
        sanitizedContentString = sanitizedContentString.replace(line, this.sanitizeLine(line));
      }
    });

    const errorLineNumber = parseInt(errorMessage.split('Line: ')[1].split('Column')[0], 10);
    const problematicLine1 = xmlContentString.split('\n')[errorLineNumber - 1];
    const problematicLine2 = xmlContentString.split('\n')[errorLineNumber];

    sanitizedContentString = sanitizedContentString.replace(
      problematicLine1,
      this.sanitizeLine(problematicLine1)
    );
    sanitizedContentString = sanitizedContentString.replace(
      problematicLine2,
      this.sanitizeLine(problematicLine2)
    );
    return sanitizedContentString;
  }

  setXmlRelativePath() {
    const fileName = path.basename(this.pdfRelativePath).replace('.pdf', '.xml');
    this.xmlRelativePath = `${os.tmpdir()}/${fileName}`;
  }

  async convertPdfToXML() {
    await spawn('pdftohtml', [
      '-q',
      '-hidden',
      '-xml',
      '-i',
      this.pdfRelativePath,
      this.xmlRelativePath,
    ]);
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
      return {
        text: label,
        pageHeight: this.pageSizes[0].height,
        pageWidth: this.pageSizes[0].width,
        selectionRectangles: [],
      };
    }
    if (!existMatchByCharacterCount) {
      const pageSize = this.getPageSize(absolutePositionByStringMatch[0][0].pageNumber);
      return {
        pageWidth: pageSize.width,
        pageHeight: pageSize.height,
        text: label,
        selectionRectangles: absolutePositionByStringMatch[0],
      };
    }

    const closerAbsolutePositionStringMatch = PdfCharacterCountToAbsolute.getCloserStringMatchToTag(
      absolutePositionByStringMatch,
      absolutePositionByCharacterCount[0]
    );

    const selectionRectangles =
      closerAbsolutePositionStringMatch ||
      absolutePositionByCharacterCount ||
      absolutePositionByStringMatch[0];
    const pageSize = this.getPageSize(selectionRectangles[0].pageNumber);

    return {
      selectionRectangles,
      pageWidth: pageSize.width,
      pageHeight: pageSize.height,
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

  private setPageSizes(xmlContentObject: any) {
    this.pageSizes = xmlContentObject.elements[1].elements
      .filter((x: { attributes: { number: string } }) => x.attributes && x.attributes.number)
      .map((page: { attributes: { number: string; width: string; height: string } }) => ({
        number: parseInt(page.attributes.number, 10),
        width: parseInt(page.attributes.width, 10),
        height: parseInt(page.attributes.height, 10),
      }));
  }

  private getPageSize(pageNumber: number) {
    return this.pageSizes.filter(x => x.number === pageNumber)[0];
  }
}
