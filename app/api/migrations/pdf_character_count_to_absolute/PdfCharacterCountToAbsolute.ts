import { spawn } from 'child-process-promise';

import fs from 'fs';
import convert from 'xml-js';
import path from 'path';
import { promisify } from 'util';
import * as os from 'os';

import { AbsolutePositionLettersList, AbsolutePositionTag } from './AbsolutePositionLettersList';

export interface AbsolutePositionReference {
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

  xmlPath = '';

  htmlPath = '';

  pdfPath = '';

  pdfSanitizedPath = '';

  pageSizes: PageSize[];

  constructor() {
    this.lettersTags = new AbsolutePositionLettersList([], []);
    this.pdfInfo = [];
    this.pageSizes = [];
  }

  async loadPdf(pdfRelativePath: string, pagesEndingCharacterCount: number[]) {
    this.pdfPath = pdfRelativePath;
    this.pdfInfo = pagesEndingCharacterCount;
    this.setXmlRelativePath();
    await this.convertPdfToXML();

    let xmlContentString = await readXml(this.xmlPath);
    const htmlWordContentString = await readXml(this.htmlPath);
    let xmlContentObject = null;
    let htmlContentObject = null;
    let errorMessage = '';

    try {
      htmlContentObject = JSON.parse(convert.xml2json(htmlWordContentString));
    } catch (e) {}

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
      this.lettersTags = AbsolutePositionLettersList.fromXmlObject(
        xmlContentObject,
        htmlContentObject
      );
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
    const fileName = path.basename(this.pdfPath);
    this.pdfSanitizedPath = `${os.tmpdir()}/${fileName}`;
    this.xmlPath = `${os.tmpdir()}/${fileName.replace('.pdf', '.xml')}`;
    this.htmlPath = `${os.tmpdir()}/${fileName.replace('.pdf', '.html')}`;
  }

  async convertPdfToXML() {
    await spawn('gs', [
      '-o',
      this.pdfSanitizedPath,
      '-sDEVICE=pdfwrite',
      '-dPDFSETTINGS=/prepress',
      this.pdfPath,
    ]);

    await spawn('pdftohtml', [
      '-q',
      '-hidden',
      '-xml',
      '-zoom',
      '1.33333',
      '-i',
      this.pdfSanitizedPath,
      this.xmlPath,
    ]);

    await spawn('pdftotext', ['-q', '-bbox', '-raw', this.pdfSanitizedPath, this.htmlPath]);
  }

  async deleteXmlFile() {
    const unlink = promisify(fs.unlink);
    await unlink(this.xmlPath);
    await unlink(this.htmlPath);
    await unlink(this.pdfSanitizedPath);
  }

  convertToAbsolutePosition(
    label: string,
    startRange: number,
    endRange: number
  ): AbsolutePositionReference {
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
        selectionRectangles: [],
      };
    }
    if (!existMatchByCharacterCount) {
      return {
        text: label,
        selectionRectangles:
          this.lettersTags.getWordsAbsolutePositions(absolutePositionByStringMatch[0]) || [],
      };
    }

    const closerAbsolutePositionStringMatch = this.lettersTags.getWordsAbsolutePositions(
      PdfCharacterCountToAbsolute.getCloserStringMatchToTag(
        absolutePositionByStringMatch,
        absolutePositionByCharacterCount[0]
      )
    );

    const selectionRectangles =
      closerAbsolutePositionStringMatch ||
      absolutePositionByCharacterCount ||
      absolutePositionByStringMatch[0];

    return {
      selectionRectangles,
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

    const startRangeMatchingPage = Math.max(startRange - startingCharacterMatchingPage, 0);
    const endRangeMatchingPage = Math.max(
      endRange - startingCharacterMatchingPage,
      startRangeMatchingPage + 1
    );

    const pageNumber = pagesCharacterCountBeforeMatchingPage.length + 1;

    return this.lettersTags.getCharacterCountMatch(
      pageNumber,
      startRangeMatchingPage,
      endRangeMatchingPage
    );
  }
}
