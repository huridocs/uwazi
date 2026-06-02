module.exports = function (babel) {
  const { types: t } = babel;
  return {
    visitor: {
      StringLiteral(path) {
        const value = path.node.value;
        if (
          (value.endsWith('.js') || value.endsWith('.jsx')) &&
          (value.startsWith('./') ||
            value.startsWith('../') ||
            value.startsWith('#app/') ||
            value.startsWith('#api/') ||
            value.startsWith('#shared/') ||
            value.startsWith('#V2/') ||
            value.startsWith('#UI/')) &&
          !value.includes('node_modules')
        ) {
          const parent = path.findParent(
            p =>
              t.isImportDeclaration(p.node) ||
              t.isExportNamedDeclaration(p.node) ||
              t.isExportAllDeclaration(p.node) ||
              (t.isCallExpression(p.node) &&
                t.isIdentifier(p.node.callee) &&
                p.node.callee.name === 'require')
          );

          if (parent) {
            if (value.endsWith('.jsx')) {
              path.node.value = value.slice(0, -4);
            } else {
              path.node.value = value.slice(0, -3);
            }
          }
        }
      },
    },
  };
};
