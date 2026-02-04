import { IncomingHttpHeaders } from 'http';
import api from '#app/utils/api.js';
import { RequestParams } from '#app/utils/RequestParams.js';
import { FetchResponseError } from '#shared/JSONRequest.js';
import { TextSelection } from '@huridocs/react-text-selection-handler';
import { ConnectionSchema } from '#shared/types/connectionType.js';

type TextReferenceParams = {
  sourceEntitySharedId: string;
  sourceFileId: string;
  sourceSelection: TextSelection;
  targetEntitySharedId: string;
  relationshipType: string;
  targetFileId?: string; // Optional: only for text-to-text references
  targetSelection?: TextSelection; // Optional: text selection in target file (for text-to-text references)
};

/**
 * Transforms a TextSelection from the UI format (with regionId) to the API format (with page as string)
 */
const transformTextSelectionToAPI = (
  selection: TextSelection
): NonNullable<ConnectionSchema['reference']> => {
  const rectangles = selection.selectionRectangles.map(rectangle => ({
    top: rectangle.top || 0,
    left: rectangle.left || 0,
    width: rectangle.width || 0,
    height: rectangle.height || 0,
    page: String(rectangle.regionId || '1'), // Convert regionId to page string
  }));

  // Ensure at least one rectangle exists (required by ConnectionSchema)
  if (rectangles.length === 0) {
    rectangles.push({ top: 0, left: 0, width: 0, height: 0, page: '1' });
  }

  return {
    text: selection.text || '',
    selectionRectangles: [rectangles[0], ...rectangles.slice(1)] as NonNullable<
      ConnectionSchema['reference']
    >['selectionRectangles'],
  };
};

type SourceRelationship = {
  entity: string;
  template: null;
  reference: NonNullable<ConnectionSchema['reference']>;
  file: string;
};

type TargetRelationship = {
  entity: string;
  template: string;
  reference?: NonNullable<ConnectionSchema['reference']>;
  file?: string;
};

const buildTargetRelationship = (params: TextReferenceParams): TargetRelationship => {
  if (!params.targetEntitySharedId) {
    throw new Error('targetEntitySharedId is required');
  }

  const targetRelationship: TargetRelationship = {
    entity: params.targetEntitySharedId,
    template: params.relationshipType,
  };

  if (params.targetFileId) {
    targetRelationship.file = params.targetFileId;

    if (params.targetSelection) {
      targetRelationship.reference = transformTextSelectionToAPI(params.targetSelection);
    }
  }

  return targetRelationship;
};

const saveTextReference = async (
  params: TextReferenceParams,
  headers?: IncomingHttpHeaders
): Promise<unknown | FetchResponseError> => {
  try {
    const sourceReference = transformTextSelectionToAPI(params.sourceSelection);

    const sourceRelationship: SourceRelationship = {
      entity: params.sourceEntitySharedId,
      template: null,
      reference: sourceReference,
      file: params.sourceFileId,
    };

    const targetRelationship = buildTargetRelationship(params);

    const requestParams = new RequestParams(
      {
        delete: [],
        save: [[sourceRelationship, targetRelationship]],
      },
      headers
    );

    const response = await api.post('relationships/bulk', requestParams);
    return response.json;
  } catch (e) {
    return e;
  }
};

export { saveTextReference, type TextReferenceParams };
