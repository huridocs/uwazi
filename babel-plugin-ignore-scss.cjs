module.exports = function ignoreScssImports() {
  return {
    visitor: {
      ImportDeclaration(path) {
        if (
          path.node.source.value.endsWith('.scss') ||
          path.node.source.value.endsWith('.sass') ||
          path.node.source.value.endsWith('.css')
        ) {
          path.remove();
        }
      },
    },
  };
};
