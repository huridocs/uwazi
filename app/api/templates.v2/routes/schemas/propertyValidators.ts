import {
  MatchQueryInputType,
  TraverseInputType,
  TraverseQueryInputType,
} from 'shared/types/relationshipsQueryTypes';

let validateMatchQueryInput = (input: any): input is MatchQueryInputType => false;

const validateTraverseQueryInput = (input: any): input is TraverseQueryInputType => {
  if (input.direction !== 'in' && input.direction !== 'out') {
    return false;
  }
  if (!Array.isArray(input.types) || !input.types.every((t: any) => typeof t === 'string')) {
    return false;
  }
  if (!Array.isArray(input.match) || !input.match.every(validateMatchQueryInput)) {
    return false;
  }
  return true;
};

const validateTraverseInput = (input: any): input is TraverseInputType => {
  if (!Array.isArray(input) || !input.every(validateTraverseQueryInput)) {
    return false;
  }
  return true;
};

validateMatchQueryInput = (input: any): input is MatchQueryInputType => {
  if (
    !Array.isArray(input.templates) ||
    !input.templates.every((t: any) => typeof t === 'string')
  ) {
    return false;
  }
  if (input.traverse && !validateTraverseInput(input.traverse)) {
    return false;
  }
  return true;
};

const validateNewRelationshipQueryInput = (query: any): query is TraverseInputType =>
  validateTraverseInput(query);

export { validateNewRelationshipQueryInput };
