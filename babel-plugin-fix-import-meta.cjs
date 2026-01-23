module.exports = function (babel) {
  const { types: t } = babel;
  return {
    visitor: {
      CallExpression(path) {
        if (
          t.isIdentifier(path.node.callee) &&
          path.node.callee.name === 'fileURLToPath' &&
          path.node.arguments.length === 1
        ) {
          const arg = path.node.arguments[0];
          if (
            t.isMemberExpression(arg) &&
            t.isMetaProperty(arg.object) &&
            arg.object.meta.name === 'import' &&
            arg.object.property.name === 'meta' &&
            t.isIdentifier(arg.property) &&
            arg.property.name === 'url'
          ) {
            path.replaceWith(t.identifier('__filename'));
          }
        }
      },
      MemberExpression(path) {
        if (
          t.isMetaProperty(path.node.object) &&
          path.node.object.meta.name === 'import' &&
          path.node.object.property.name === 'meta'
        ) {
          if (t.isIdentifier(path.node.property)) {
            if (path.node.property.name === 'webpackHot') {
              path.replaceWith(t.booleanLiteral(false));
            } else if (path.node.property.name === 'url') {
              const parent = path.findParent(p => 
                t.isCallExpression(p.node) && 
                t.isIdentifier(p.node.callee) &&
                p.node.callee.name === 'fileURLToPath'
              );
              if (!parent) {
                path.replaceWith(t.stringLiteral('file://' + __filename));
              }
            }
          }
        }
      },
    },
  };
};
