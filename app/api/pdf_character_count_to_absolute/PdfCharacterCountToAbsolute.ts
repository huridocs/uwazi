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
  allLettersTags: AbsolutePosition[];

  constructor() {
    this.allLettersTags = [];
  }

  async loadPdf(pdfRelativePath: string) {
    const xmlRelativePath: string = this.getXmlRelativePath(pdfRelativePath);

    await this.convertPdfToXML(pdfRelativePath, xmlRelativePath);

    const xmlContentString: string = fs.readFileSync(xmlRelativePath, 'utf8');
    const xmlContentObject = JSON.parse(convert.xml2json(xmlContentString));
    this.deleteXmlFile(xmlRelativePath);
    this.allLettersTags = this.getAllTags(xmlContentObject);
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

  getAllTags(xmlContentObject: any) {
    const pages = xmlContentObject.elements[1].elements;
    let allTags: AbsolutePosition[] = [];
    for (let pageIndex: number = 0; pageIndex < pages.length; pageIndex += 1) {
      let pageElements = pages[pageIndex].elements;
      pageElements = pageElements.reduce(this.removeXmlOneLevel(), []);
      pageElements = pageElements.reduce(this.removeXmlOneLevel(), []);
      pageElements = pageElements.reduce(this.removeXmlOneLevel(), []);
      pageElements = pageElements.reduce(this.removeXmlOneLevel(), []);
      pageElements = pageElements.filter((x: { text: any }) => x.text);
      const pageTags: AbsolutePosition[] = pageElements.map(
        (x: { text: string; attributes: { top: any; left: any; height: any; width: any } }) => ({
          pageNumber: Number(pages[pageIndex].attributes.number),
          top: Number(x.attributes.top),
          left: Number(x.attributes.left),
          bottom: Number(x.attributes.top) + Number(x.attributes.height),
          right: Number(x.attributes.left) + Number(x.attributes.width),
          text: x.text.replace(/ /g, ''),
        })
      );
      allTags = allTags.concat(pageTags);
    }
    allTags = allTags.reduce((accumulator: AbsolutePosition[], currentValue: AbsolutePosition) => {
      const letters: AbsolutePosition[] = currentValue.text.split('').map((x: string) => ({
        pageNumber: currentValue.pageNumber,
        top: currentValue.top,
        left: currentValue.left,
        bottom: currentValue.bottom,
        right: currentValue.right,
        text: x,
      }));
      return accumulator.concat(letters);
    }, []);
    return allTags;
  }

  removeXmlOneLevel() {
    return (
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
  }

  convert(label: string): AbsolutePosition | undefined {
    const targetLabelNoSpaces: string = label.replace(/ /g, '');

    for (
      let allLettersIndex = 0;
      allLettersIndex < this.allLettersTags.length - targetLabelNoSpaces.length;
      allLettersIndex += 1
    ) {
      let allWordsMatching = true;
      let { top } = this.allLettersTags[allLettersIndex];
      let { left } = this.allLettersTags[allLettersIndex];
      let { bottom } = this.allLettersTags[allLettersIndex];
      let { right } = this.allLettersTags[allLettersIndex];

      for (
        let targetLabelIndex = 0;
        targetLabelIndex < targetLabelNoSpaces.length;
        targetLabelIndex += 1
      ) {
        if (
          targetLabelNoSpaces.charAt(targetLabelIndex) !==
          this.allLettersTags[allLettersIndex + targetLabelIndex].text
        ) {
          allWordsMatching = false;
          break;
        }

        top = Math.min(top, this.allLettersTags[allLettersIndex + targetLabelIndex].top);
        left = Math.min(left, this.allLettersTags[allLettersIndex + targetLabelIndex].left);
        bottom = Math.max(bottom, this.allLettersTags[allLettersIndex + targetLabelIndex].bottom);
        right = Math.max(right, this.allLettersTags[allLettersIndex + targetLabelIndex].right);
      }

      if (allWordsMatching) {
        const absolutPosition = {
          pageNumber: this.allLettersTags[allLettersIndex].pageNumber,
          top,
          left,
          bottom,
          right,
          text: label,
        };
        return absolutPosition;
      }
    }
  }
}
