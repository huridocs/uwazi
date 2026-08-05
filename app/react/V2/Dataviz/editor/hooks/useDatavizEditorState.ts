import { useCallback, useReducer } from 'react';
import type { DatavizDefinition } from '#V2/Dataviz/types/definition.js';

type EditorAction =
  | { type: 'replace'; definition: DatavizDefinition }
  | { type: 'patch'; patch: Partial<DatavizDefinition> }
  | { type: 'patchQuery'; patch: Partial<DatavizDefinition['query']> }
  | { type: 'patchChart'; patch: Partial<DatavizDefinition['chart']> }
  | { type: 'patchAppearance'; patch: Partial<DatavizDefinition['appearance']> }
  | { type: 'patchRefresh'; patch: Partial<DatavizDefinition['refresh']> };

const editorReducer = (state: DatavizDefinition, action: EditorAction): DatavizDefinition => {
  switch (action.type) {
    case 'replace':
      return action.definition;
    case 'patch':
      return { ...state, ...action.patch };
    case 'patchQuery':
      return { ...state, query: { ...state.query, ...action.patch } };
    case 'patchChart':
      return { ...state, chart: { ...state.chart, ...action.patch } };
    case 'patchAppearance':
      return { ...state, appearance: { ...state.appearance, ...action.patch } };
    case 'patchRefresh':
      return { ...state, refresh: { ...state.refresh, ...action.patch } };
    default:
      return state;
  }
};

const useDatavizEditorState = (initial: DatavizDefinition) => {
  const [definition, dispatch] = useReducer(editorReducer, initial);

  const replace = useCallback((next: DatavizDefinition) => {
    dispatch({ type: 'replace', definition: next });
  }, []);

  const patch = useCallback((patchValue: Partial<DatavizDefinition>) => {
    dispatch({ type: 'patch', patch: patchValue });
  }, []);

  const patchQuery = useCallback((patchValue: Partial<DatavizDefinition['query']>) => {
    dispatch({ type: 'patchQuery', patch: patchValue });
  }, []);

  const patchChart = useCallback((patchValue: Partial<DatavizDefinition['chart']>) => {
    dispatch({ type: 'patchChart', patch: patchValue });
  }, []);

  const patchAppearance = useCallback((patchValue: Partial<DatavizDefinition['appearance']>) => {
    dispatch({ type: 'patchAppearance', patch: patchValue });
  }, []);

  const patchRefresh = useCallback((patchValue: Partial<DatavizDefinition['refresh']>) => {
    dispatch({ type: 'patchRefresh', patch: patchValue });
  }, []);

  return {
    definition,
    replace,
    patch,
    patchQuery,
    patchChart,
    patchAppearance,
    patchRefresh,
  };
};

export { useDatavizEditorState };
