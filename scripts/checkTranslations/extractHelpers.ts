import type { NodePath } from '@babel/traverse';
import type {
  CallExpression,
  JSXAttribute,
  JSXElement,
  Node,
  ObjectProperty,
  TemplateLiteral,
} from '@babel/types';

import {
  COMPOSED_PLACEHOLDER,
  COMPONENT_ARIA_ATTRS,
  ENTITY_ISH_PROPS,
  NATIVE_TRANSLATABLE_ATTRS,
  OPTION_ID_PROPS,
  SAFE_CALL_CALLEES,
  SAFE_LABEL_COMPONENTS,
  SAFE_OBJECT_WRAPPERS,
  SAFE_TITLE_COMPONENTS,
  looksLikeChromeCopy,
  looksLikeUiCopy,
  normalizeKey,
} from './heuristics.js';
import type { ExtractedUsage, SourceLoc, UsageKind } from './types.js';

type UsageInput = {
  kind: UsageKind;
  text: string;
  file: string;
  node: Node;
  extras?: Partial<ExtractedUsage>;
};

type LiteralUsageInput = {
  kind: UsageKind;
  text: string;
  file: string;
  node: Node;
  attrName: string;
};

type AttrKindInput = {
  elementName: string;
  rootName: string;
  attr: string;
};

const locFrom = (node: Node): SourceLoc => ({
  line: node.loc?.start.line ?? 0,
  column: node.loc?.start.column ?? 0,
  start: node.start ?? 0,
  end: node.end ?? 0,
});

const jsxName = (node: JSXElement['openingElement']['name']): string => {
  if (node.type === 'JSXIdentifier') {
    return node.name;
  }
  if (node.type === 'JSXMemberExpression') {
    return jsxName(node.property);
  }
  return '';
};

const jsxRootName = (node: JSXElement['openingElement']['name']): string => {
  if (node.type === 'JSXIdentifier') {
    return node.name;
  }
  if (node.type === 'JSXMemberExpression') {
    return jsxRootName(node.object);
  }
  return '';
};

const isNativeElement = (name: string): boolean =>
  Boolean(name) && name[0] === name[0].toLowerCase();

const attributeName = (attr: JSXAttribute): string =>
  attr.name.type === 'JSXIdentifier' ? attr.name.name : '';

const hasNoTranslate = (element: JSXElement): boolean =>
  element.openingElement.attributes.some(
    attr => attr.type === 'JSXAttribute' && attributeName(attr) === 'no-translate'
  );

const isInsideTranslate = (path: NodePath): boolean =>
  Boolean(
    path.findParent(
      parent => parent.isJSXElement() && jsxName(parent.node.openingElement.name) === 'Translate'
    )
  );

const objectPropNames = (path: NodePath<ObjectProperty>): Set<string> => {
  const { parent } = path;
  if (parent.type !== 'ObjectExpression') {
    return new Set();
  }
  return new Set(
    parent.properties.flatMap(property => {
      if (property.type !== 'ObjectProperty' || property.computed) {
        return [];
      }
      const { key } = property;
      if (key.type === 'Identifier') {
        return [key.name];
      }
      if (key.type === 'StringLiteral') {
        return [key.value];
      }
      return [];
    })
  );
};

const isEntityLikeObject = (path: NodePath<ObjectProperty>): boolean =>
  [...ENTITY_ISH_PROPS].some(name => objectPropNames(path).has(name));

const isOptionLikeObject = (path: NodePath<ObjectProperty>): boolean =>
  [...OPTION_ID_PROPS].some(name => objectPropNames(path).has(name));

const callCalleeName = (node: CallExpression): string => {
  const { callee } = node;
  if (callee.type === 'Identifier') {
    return callee.name;
  }
  if (callee.type === 'MemberExpression' && callee.property.type === 'Identifier') {
    return callee.property.name;
  }
  return '';
};

const enclosingCallName = (path: NodePath): string => {
  if (path.isCallExpression()) {
    return callCalleeName(path.node);
  }
  const call = path.findParent(parent => parent.isCallExpression());
  if (!call || !call.isCallExpression()) {
    return '';
  }
  return callCalleeName(call.node);
};

const isInsideSafeWrapper = (path: NodePath): boolean => {
  if (SAFE_CALL_CALLEES.has(enclosingCallName(path))) {
    return true;
  }
  return Boolean(
    path.findParent(
      parent =>
        parent.isJSXElement() && SAFE_OBJECT_WRAPPERS.has(jsxName(parent.node.openingElement.name))
    )
  );
};

const stringFromTemplate = (node: TemplateLiteral): { text: string; static: boolean } => {
  if (node.expressions.length === 0) {
    return {
      text: node.quasis.map(quasi => quasi.value.cooked ?? quasi.value.raw).join(''),
      static: true,
    };
  }
  const preview = node.quasis
    .map((quasi, index) => {
      const chunk = quasi.value.cooked ?? quasi.value.raw;
      return index < node.expressions.length ? `${chunk}${COMPOSED_PLACEHOLDER}` : chunk;
    })
    .join('');
  return { text: preview.trim() || COMPOSED_PLACEHOLDER, static: false };
};

const usage = ({ kind, text, file, node, extras = {} }: UsageInput): ExtractedUsage | undefined => {
  const normalizedText = normalizeKey(text);
  const key = normalizeKey(extras.key ?? text);
  if (!looksLikeUiCopy(normalizedText) && kind !== 'composed') {
    return undefined;
  }
  return {
    kind,
    file,
    loc: locFrom(node),
    translated: extras.translated ?? false,
    fixable: extras.fixable ?? false,
    text: extras.text ?? normalizedText,
    key,
    attrName: extras.attrName,
  };
};

const componentHasSafeTitle = (elementName: string, rootName: string): boolean =>
  SAFE_TITLE_COMPONENTS.has(elementName) || SAFE_TITLE_COMPONENTS.has(rootName);

const componentHasSafeLabel = (elementName: string, rootName: string): boolean =>
  SAFE_LABEL_COMPONENTS.has(elementName) || SAFE_LABEL_COMPONENTS.has(rootName);

const attrKind = ({ elementName, rootName, attr }: AttrKindInput): UsageKind | undefined => {
  const native = isNativeElement(elementName);
  const isNativeChrome = native && (NATIVE_TRANSLATABLE_ATTRS.has(attr) || attr === 'title');
  if (COMPONENT_ARIA_ATTRS.has(attr) || isNativeChrome) {
    return 'attribute';
  }
  const isComponentChrome =
    (elementName.includes('Tooltip') && attr === 'content') ||
    (attr === 'title' && !native && !componentHasSafeTitle(elementName, rootName)) ||
    (attr === 'label' && !native && !componentHasSafeLabel(elementName, rootName));
  if (!isComponentChrome) {
    return undefined;
  }
  return 'component-prop';
};

const literalUsages = ({
  kind,
  text,
  file,
  node,
  attrName,
}: LiteralUsageInput): ExtractedUsage[] => {
  if (kind !== 'composed' && !looksLikeChromeCopy(text)) {
    return [];
  }
  const extracted = usage({
    kind,
    text,
    file,
    node,
    extras: { fixable: kind === 'attribute', attrName },
  });
  return extracted ? [extracted] : [];
};

export {
  attrKind,
  attributeName,
  callCalleeName,
  hasNoTranslate,
  isEntityLikeObject,
  isInsideSafeWrapper,
  isInsideTranslate,
  isOptionLikeObject,
  jsxName,
  jsxRootName,
  literalUsages,
  stringFromTemplate,
  usage,
};
