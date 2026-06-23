import { IncomingHttpHeaders } from 'http';
import { TextSelection } from '@huridocs/react-text-selection-handler';
import { api } from '#app/utils/api.js';
import { RequestParams } from '#app/utils/RequestParams.js';
import { FetchResponseError } from '#shared/JSONRequest.js';
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

type EntityRelationshipParams = {
  sourceEntitySharedId: string;
  targetEntitySharedId: string;
  relationshipType: string;
  targetFileId?: string;
  targetSelection?: TextSelection;
};

const saveEntityRelationship = async (
  params: EntityRelationshipParams,
  headers?: IncomingHttpHeaders
): Promise<unknown | FetchResponseError> => {
  try {
    const sourceRelationship = {
      entity: params.sourceEntitySharedId,
      template: null,
    };
    const targetRelationship = buildTargetRelationship({
      sourceEntitySharedId: params.sourceEntitySharedId,
      sourceFileId: '',
      sourceSelection: { text: '', selectionRectangles: [] },
      targetEntitySharedId: params.targetEntitySharedId,
      relationshipType: params.relationshipType,
      ...(params.targetFileId && { targetFileId: params.targetFileId }),
      ...(params.targetSelection && { targetSelection: params.targetSelection }),
    });

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

const deleteReference = async (
  referenceId: string,
  headers?: IncomingHttpHeaders
): Promise<unknown | FetchResponseError> => {
  try {
    const requestParams = new RequestParams({ _id: referenceId }, headers);
    const response = await api.delete('references', requestParams);
    return response.json;
  } catch (e) {
    return e;
  }
};

export { saveTextReference, saveEntityRelationship, deleteReference, type TextReferenceParams };
