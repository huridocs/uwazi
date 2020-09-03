import { spawn } from 'child-process-promise';

const fs = require('fs');
const convert = require('xml-js');

export interface AbsolutePosition {
  pageNumber: number;
  top: number;
  left: number;
  bottom: number;
  right: number;
}

const deleteXmlFile = (xmlRelativePath: string) => {
  try {
    fs.unlinkSync(xmlRelativePath);
  } catch (err) {
    console.error(err);
  }
};

const getXmlRelativePath = (pdfRelativePath: string) => {
  const pathParts: string[] = pdfRelativePath.split('/');

  let fileName: string = <string>pathParts.slice(-1).pop();
  fileName = fileName.replace('.pdf', '.xml');

  return `temporal_files/${fileName}`;
};

export const convertCharacterCountToAbsolute = async (
  pdfRelativePath: string,
  label: string
): Promise<AbsolutePosition[]> => {
  const xmlRelativePath: string = getXmlRelativePath(pdfRelativePath);

  await spawn('pdftohtml', ['-xml', '-i', pdfRelativePath, xmlRelativePath], {
    capture: ['stdout', 'stderr'],
  });

  const xmlContentString: string = await fs.readFileSync(xmlRelativePath, 'utf8');
  deleteXmlFile(xmlRelativePath);

  const json = JSON.parse(convert.xml2json(xmlContentString));
  const pages = json.elements[1].elements;

  for (let i: number = 0; i < pages.length; i += 1) {
    const elementsLabel = pages[i].elements.filter(
      (element: { name: string; content: string; elements: { text: string }[] }) =>
        element.name === 'text' &&
        element.elements &&
        element.elements.length > 0 &&
        element.elements[0].text &&
        element.elements[0].text.trim() === label
    );

    console.log(elementsLabel.length);
    if (elementsLabel.length > 0) {
      return [
        {
          pageNumber: Number(pages[i].attributes.number),
          top: Number(elementsLabel[0].attributes.top),
          left: Number(elementsLabel[0].attributes.left),
          bottom:
            Number(elementsLabel[0].attributes.top) + Number(elementsLabel[0].attributes.height),
          right:
            Number(elementsLabel[0].attributes.left) + Number(elementsLabel[0].attributes.width),
        },
      ];
    }
  }

  return [];
};
