module.exports = function (babel) {
  const { types: t } = babel;
  const path = require('path');

  return {
    visitor: {
      VariableDeclaration(varPath) {
        if (varPath.node.declarations.length === 1) {
          const decl = varPath.node.declarations[0];
          const filePath = varPath.hub.file.opts.filename;
          if (!filePath) return;

          if (t.isIdentifier(decl.id) && decl.id.name === '__filename') {
            if (
              t.isCallExpression(decl.init) &&
              t.isIdentifier(decl.init.callee) &&
              decl.init.callee.name === 'fileURLToPath' &&
              decl.init.arguments.length === 1 &&
              t.isMemberExpression(decl.init.arguments[0]) &&
              t.isMetaProperty(decl.init.arguments[0].object) &&
              decl.init.arguments[0].object.meta.name === 'import' &&
              decl.init.arguments[0].object.property.name === 'meta' &&
              t.isIdentifier(decl.init.arguments[0].property) &&
              decl.init.arguments[0].property.name === 'url'
            ) {
              const absPath = path.resolve(filePath);
              decl.init = t.stringLiteral(absPath);
            }
          }

          if (t.isIdentifier(decl.id) && decl.id.name === '__dirname') {
            const init = decl.init;
            if (t.isCallExpression(init)) {
              let isDirnameCall = false;

              if (
                t.isIdentifier(init.callee) &&
                init.callee.name === 'dirname' &&
                init.arguments.length === 1 &&
                t.isIdentifier(init.arguments[0]) &&
                init.arguments[0].name === '__filename'
              ) {
                isDirnameCall = true;
              } else if (
                t.isSequenceExpression(init.callee) &&
                init.callee.expressions.length === 2 &&
                t.isNumericLiteral(init.callee.expressions[0]) &&
                init.callee.expressions[0].value === 0 &&
                t.isMemberExpression(init.callee.expressions[1]) &&
                t.isIdentifier(init.callee.expressions[1].object) &&
                init.callee.expressions[1].object.name === '_path' &&
                t.isIdentifier(init.callee.expressions[1].property) &&
                init.callee.expressions[1].property.name === 'dirname' &&
                init.arguments.length === 1 &&
                t.isIdentifier(init.arguments[0]) &&
                init.arguments[0].name === '__filename'
              ) {
                isDirnameCall = true;
              }

              if (isDirnameCall) {
                const absPath = path.resolve(filePath);
                const dirnamePath = path.dirname(absPath);
                decl.init = t.stringLiteral(dirnamePath);
              }
            }
          }
        }
      },
      CallExpression(callPath) {
        if (
          t.isIdentifier(callPath.node.callee) &&
          callPath.node.callee.name === 'fileURLToPath' &&
          callPath.node.arguments.length === 1
        ) {
          const arg = callPath.node.arguments[0];
          if (
            t.isMemberExpression(arg) &&
            t.isMetaProperty(arg.object) &&
            arg.object.meta.name === 'import' &&
            arg.object.property.name === 'meta' &&
            t.isIdentifier(arg.property) &&
            arg.property.name === 'url'
          ) {
            const filePath = callPath.hub.file.opts.filename;
            if (filePath) {
              const absPath = path.resolve(filePath);
              callPath.replaceWith(t.stringLiteral(absPath));
            }
          }
        }
      },
      MemberExpression(memberPath) {
        if (
          t.isMetaProperty(memberPath.node.object) &&
          memberPath.node.object.meta.name === 'import' &&
          memberPath.node.object.property.name === 'meta'
        ) {
          if (t.isIdentifier(memberPath.node.property)) {
            if (memberPath.node.property.name === 'webpackHot') {
              memberPath.replaceWith(t.booleanLiteral(false));
            }
          }
        }
      },
    },
  };
};
