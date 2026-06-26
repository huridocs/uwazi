import type {
  DatavizFilterOperator,
  FilterablePropertyType,
} from '#V2/Dataviz/types/definition.js';

const OPERATORS_BY_TYPE: Record<FilterablePropertyType, DatavizFilterOperator[]> = {
  select: ['eq', 'ne', 'in', 'nin'],
  multiselect: ['in', 'nin'],
  numeric: ['eq', 'ne', 'gte', 'lte', 'between'],
  date: ['gte', 'lte', 'between'],
  daterange: ['gte', 'lte', 'between'],
  multidate: ['gte', 'lte', 'between'],
  multidaterange: ['gte', 'lte', 'between'],
  generatedid: ['eq', 'ne', 'contains'],
  text: ['contains', 'eq', 'ne'],
};

export const getOperatorsForPropertyType = (
  propertyType: FilterablePropertyType
): DatavizFilterOperator[] => OPERATORS_BY_TYPE[propertyType] || ['eq'];

export const usesMultipleValues = (operator: DatavizFilterOperator) =>
  operator === 'in' || operator === 'nin';

export const OPERATOR_LABELS: Record<DatavizFilterOperator, string> = {
  eq: 'Equals',
  ne: 'Is not',
  in: 'Is any of',
  nin: 'Is not any of',
  gte: 'From (≥)',
  lte: 'Up to (≤)',
  between: 'Between',
  contains: 'Contains',
};
