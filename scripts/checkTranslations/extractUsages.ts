import { parse } from '@babel/parser';
import _traverse from '@babel/traverse';

import { hasNoTranslate } from './extractHelpers.js';
import {
  extractComposedTranslate,
  extractFromJsxAttribute,
  extractJsxText,
  extractLabelVariable,
  extractNotify,
  extractObjectLabel,
  extractTCall,
} from './extractors.js';
import { isReactUiFile } from './heuristics.js';
import type { ExtractedUsage } from './types.js';

type TraverseFn = typeof _traverse;
const traverse: TraverseFn = ((_traverse as { default?: TraverseFn }).default ??
  _traverse) as TraverseFn;

const PARSER_OPTIONS = {
  sourceType: 'module' as const,
  plugins: ['jsx', 'typescript'] as ('jsx' | 'typescript')[],
};

const extractUsages = (source: string, file: string): ExtractedUsage[] => {
  const results: ExtractedUsage[] = [];
  let ast;
  try {
    ast = parse(source, PARSER_OPTIONS);
  } catch {
    return [];
  }

  const reactUi = isReactUiFile(file);

  traverse(ast, {
    JSXElement(path) {
      if (!reactUi) {
        return;
      }
      if (hasNoTranslate(path.node)) {
        path.skip();
        return;
      }
      results.push(...extractComposedTranslate(path, file));
    },
    JSXText(path) {
      if (reactUi) {
        results.push(...extractJsxText(path, file));
      }
    },
    JSXAttribute(path) {
      if (reactUi) {
        results.push(...extractFromJsxAttribute(path, file));
      }
    },
    CallExpression(path) {
      results.push(...extractTCall(path, file));
      if (reactUi) {
        results.push(...extractNotify(path, file));
      }
    },
    ObjectProperty(path) {
      if (reactUi) {
        results.push(...extractObjectLabel(path, file));
      }
    },
    VariableDeclarator(path) {
      if (reactUi) {
        results.push(...extractLabelVariable(path, file));
      }
    },
  });

  return results;
};

export { extractUsages };
