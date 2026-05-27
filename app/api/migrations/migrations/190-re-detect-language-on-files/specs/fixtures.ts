import { ObjectId } from 'mongodb';

// Long enough for reliable franc detection (verified manually)
const frenchText =
  'La Déclaration universelle des droits de l homme est un document fondamental dans l histoire des droits de l homme. ' +
  'Adoptée par l Assemblée générale des Nations Unies le dix décembre mil neuf cent quarante-huit, cette déclaration est ' +
  'la première affirmation internationale des droits fondamentaux de tous les êtres humains. Elle comprend trente articles ' +
  'qui décrivent les droits fondamentaux de chaque individu dans le monde.';

const spanishText =
  'El español es una lengua romance hablada principalmente en España y América Latina. Es uno de los idiomas más hablados ' +
  'del mundo con más de cuatrocientos millones de hablantes nativos. La lengua española tiene una rica historia y una gran ' +
  'diversidad dialectal que se refleja en su literatura y cultura popular en todo el mundo.';

// Text with [[pageNum]] annotations (as stored in production fullText)
const frenchTextWithAnnotations = frenchText.replace(/(\S+)/g, '$1[[1]]');

// A document with detectable French text (plain, no annotations)
export const frenchDocument = {
  _id: new ObjectId(),
  type: 'document' as const,
  language: 'other',
  fullText: {
    1: frenchText,
  },
};

// A document with detectable text across multiple pages, with page annotations
export const annotatedFrenchDocument = {
  _id: new ObjectId(),
  type: 'document' as const,
  language: 'other',
  fullText: {
    1: frenchTextWithAnnotations,
  },
};

// A document with detectable Spanish text
export const spanishDocument = {
  _id: new ObjectId(),
  type: 'document' as const,
  language: 'other',
  fullText: {
    1: spanishText,
  },
};

// A document whose text is too short for franc to determine language
export const undetectableDocument = {
  _id: new ObjectId(),
  type: 'document' as const,
  language: 'other',
  fullText: {
    1: 'abc xyz',
  },
};

// A document without fullText — should not be touched
export const documentWithoutFullText = {
  _id: new ObjectId(),
  type: 'document' as const,
  language: 'other',
};

// An attachment with language 'other' — should not be touched
export const attachmentWithOther = {
  _id: new ObjectId(),
  type: 'attachment' as const,
  language: 'other',
  fullText: {
    1: frenchText,
  },
};

// A document already correctly detected — should not be touched
export const alreadyDetectedDocument = {
  _id: new ObjectId(),
  type: 'document' as const,
  language: 'fra',
  fullText: {
    1: frenchText,
  },
};

export const fixtures = {
  files: [
    frenchDocument,
    annotatedFrenchDocument,
    spanishDocument,
    undetectableDocument,
    documentWithoutFullText,
    attachmentWithOther,
    alreadyDetectedDocument,
  ],
};

export const noUpdateFixtures = {
  files: [undetectableDocument, documentWithoutFullText, attachmentWithOther],
};
