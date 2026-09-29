import type { NodePath } from '@babel/traverse';
import type { CallExpression, JSXAttribute, JSXElement, Node, ObjectProperty } from '@babel/types';

import {
  attrKind,
  attributeName,
  callCalleeName,
  isEntityLikeObject,
  isInsideSafeWrapper,
  isInsideTranslate,
  isOptionLikeObject,
  jsxName,
  jsxRootName,
  literalUsages,
  stringFromTemplate,
  usage,
} from './extractHelpers.js';
import {
  ALWAYS_UI_OBJECT_PROPS,
  NOTIFY_CALLEES,
  OPTION_ONLY_UI_PROPS,
  looksLikeUiCopy,
  normalizeKey,
} from './heuristics.js';
import type { ExtractedUsage, UsageKind } from './types.js';

type ExpressionInput = {
  kind: UsageKind;
  expression: Node;
  file: string;
  attr: string;
};

const extractFromExpression = ({
  kind,
  expression,
  file,
  attr,
}: ExpressionInput): ExtractedUsage[] => {
  if (expression.type === 'StringLiteral') {
    return literalUsages({ kind, text: expression.value, file, node: expression, attrName: attr });
  }
  if (expression.type !== 'TemplateLiteral') {
    return [];
  }
  const { text, static: isStatic } = stringFromTemplate(expression);
  return literalUsages({
    kind: isStatic ? kind : 'composed',
    text,
    file,
    node: expression,
    attrName: attr,
  });
};

const skippedJsxAttribute = (attr: string): boolean =>
  !attr || attr === 'no-translate' || attr === 'translationKey';

const jsxAttributeKind = (path: NodePath<JSXAttribute>): UsageKind | undefined => {
  const { parent, node } = path;
  if (parent.type !== 'JSXOpeningElement' || skippedJsxAttribute(attributeName(node))) {
    return undefined;
  }
  return attrKind({
    elementName: jsxName(parent.name),
    rootName: jsxRootName(parent.name),
    attr: attributeName(node),
  });
};

const extractFromJsxAttribute = (path: NodePath<JSXAttribute>, file: string): ExtractedUsage[] => {
  const { node } = path;
  const kind = jsxAttributeKind(path);
  if (!kind || !node.value) {
    return [];
  }
  const attr = attributeName(node);
  if (node.value.type === 'StringLiteral') {
    return literalUsages({ kind, text: node.value.value, file, node: node.value, attrName: attr });
  }
  if (node.value.type !== 'JSXExpressionContainer') {
    return [];
  }
  return extractFromExpression({ kind, expression: node.value.expression, file, attr });
};

const extractTCall = (path: NodePath<CallExpression>, file: string): ExtractedUsage[] => {
  const { arguments: args } = path.node;
  const [context, keyArg, fallbackArg] = args;
  if (
    callCalleeName(path.node) !== 't' ||
    args.length < 2 ||
    context?.type !== 'StringLiteral' ||
    context.value !== 'System' ||
    keyArg?.type !== 'StringLiteral'
  ) {
    return [];
  }
  const text =
    fallbackArg?.type === 'StringLiteral' && fallbackArg.value ? fallbackArg.value : keyArg.value;
  const extracted = usage({
    kind: 't-call',
    text,
    file,
    node: keyArg,
    extras: { key: keyArg.value, translated: true, fixable: false },
  });
  return extracted ? [extracted] : [];
};

const extractNotify = (path: NodePath<CallExpression>, file: string): ExtractedUsage[] => {
  const [message] = path.node.arguments;
  if (
    !NOTIFY_CALLEES.has(callCalleeName(path.node)) ||
    !message ||
    message.type !== 'StringLiteral'
  ) {
    return [];
  }
  const extracted = usage({
    kind: 'notify',
    text: message.value,
    file,
    node: message,
    extras: { fixable: true },
  });
  return extracted ? [extracted] : [];
};

const objectPropName = (path: NodePath<ObjectProperty>): string => {
  const { key } = path.node;
  if (key.type === 'Identifier') {
    return key.name;
  }
  if (key.type === 'StringLiteral') {
    return key.value;
  }
  return '';
};

const extractObjectLabel = (path: NodePath<ObjectProperty>, file: string): ExtractedUsage[] => {
  if (path.node.computed || isInsideSafeWrapper(path) || isEntityLikeObject(path)) {
    return [];
  }
  const propName = objectPropName(path);
  const isAlwaysUi = ALWAYS_UI_OBJECT_PROPS.has(propName);
  const isOptionUi = OPTION_ONLY_UI_PROPS.has(propName) && isOptionLikeObject(path);
  const { value } = path.node;
  if ((!isAlwaysUi && !isOptionUi) || value.type !== 'StringLiteral') {
    return [];
  }
  return literalUsages({
    kind: 'option-label',
    text: value.value,
    file,
    node: value,
    attrName: propName,
  });
};

const translationKeyFrom = (path: NodePath): string | undefined => {
  const parent = path.findParent(candidate =>
    candidate.isJSXElement()
  ) as NodePath<JSXElement> | null;
  const translationKeyAttr = parent?.node.openingElement.attributes.find(
    attr => attr.type === 'JSXAttribute' && attributeName(attr) === 'translationKey'
  );
  if (
    translationKeyAttr &&
    translationKeyAttr.type === 'JSXAttribute' &&
    translationKeyAttr.value?.type === 'StringLiteral'
  ) {
    return translationKeyAttr.value.value;
  }
  return undefined;
};

const extractJsxText = (path: NodePath, file: string): ExtractedUsage[] => {
  if (!path.isJSXText()) {
    return [];
  }
  const text = normalizeKey(path.node.value);
  if (!looksLikeUiCopy(text)) {
    return [];
  }
  const translated = isInsideTranslate(path);
  const extracted = usage({
    kind: translated ? 'translate-jsx' : 'jsx-text',
    text,
    file,
    node: path.node,
    extras: {
      key: translated ? (translationKeyFrom(path) ?? text) : text,
      translated,
      fixable: !translated,
    },
  });
  return extracted ? [extracted] : [];
};

const isComposedChild = (child: JSXElement['children'][number]): boolean => {
  if (child.type !== 'JSXExpressionContainer') {
    return false;
  }
  const { expression } = child;
  return (
    (expression.type === 'TemplateLiteral' && expression.expressions.length > 0) ||
    expression.type === 'BinaryExpression'
  );
};

const extractComposedTranslate = (path: NodePath<JSXElement>, file: string): ExtractedUsage[] => {
  if (jsxName(path.node.openingElement.name) !== 'Translate') {
    return [];
  }
  const composed = path.node.children.find(isComposedChild);
  if (!composed || composed.type !== 'JSXExpressionContainer') {
    return [];
  }
  const { expression } = composed;
  const text =
    expression.type === 'TemplateLiteral' ? stringFromTemplate(expression).text : 'composed string';
  const extracted = usage({ kind: 'composed', text, file, node: composed, extras: { key: text } });
  return extracted ? [extracted] : [];
};

const collectStringLiterals = (
  node: Node | null | undefined,
  literals: { value: string; node: Node }[]
) => {
  if (!node) {
    return;
  }
  if (node.type === 'StringLiteral') {
    literals.push({ value: node.value, node });
    return;
  }
  if (node.type === 'ConditionalExpression') {
    collectStringLiterals(node.consequent, literals);
    collectStringLiterals(node.alternate, literals);
  }
};

const extractLabelVariable = (path: NodePath, file: string): ExtractedUsage[] => {
  if (!path.isVariableDeclarator() || path.node.id.type !== 'Identifier') {
    return [];
  }
  const { name } = path.node.id;
  if (!ALWAYS_UI_OBJECT_PROPS.has(name)) {
    return [];
  }
  const literals: { value: string; node: Node }[] = [];
  collectStringLiterals(path.node.init, literals);
  return literals.flatMap(({ value, node }) =>
    literalUsages({ kind: 'option-label', text: value, file, node, attrName: name })
  );
};

export {
  extractComposedTranslate,
  extractFromJsxAttribute,
  extractJsxText,
  extractLabelVariable,
  extractNotify,
  extractObjectLabel,
  extractTCall,
};
