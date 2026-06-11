import type {
  DatavizFilterOperator,
  FilterablePropertyType,
} from '#V2/Dataviz/types/definition.js';

const OPERATORS_BY_TYPE: Record<FilterablePropertyType, DatavizFilterOperator[]> = {
  select: ['eq', 'in'],
  multiselect: ['in'],
  numeric: ['eq', 'gte', 'lte', 'between'],
  date: ['gte', 'lte', 'between'],
  daterange: ['gte', 'lte', 'between'],
  multidate: ['gte', 'lte', 'between'],
  multidaterange: ['gte', 'lte', 'between'],
  generatedid: ['eq', 'contains'],
  text: ['contains', 'eq'],
};

export const getOperatorsForPropertyType = (
  propertyType: FilterablePropertyType
): DatavizFilterOperator[] => OPERATORS_BY_TYPE[propertyType] || ['eq'];

export const OPERATOR_LABELS: Record<DatavizFilterOperator, string> = {
  eq: 'Equals',
  in: 'Is any of',
  gte: 'From (≥)',
  lte: 'Up to (≤)',
  between: 'Between',
  contains: 'Contains',
};
