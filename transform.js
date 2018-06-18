// Press ctrl+space for code completion
export default function transformer(file, api) {
  const j = api.jscodeshift;
  const root = j(file.source);
  const isClassNameAttribute = path => (path.node.name === 'className' && path.parent.node.type === 'JSXAttribute');
  return root
    .find(j.Identifier)
    .forEach(path => {
      if(path.value.name === "className") {
        const element = 
          path.parent.parent.node.name !== undefined ?
          path.parent.parent.node.name.name : false;
        if(element === "i") {
          //const property = path.value.name;
          const value = path.parent.node.value.value;
          if (value !== undefined && value.startsWith("fa fa-")) {
            console.log(value);
          //path.parent.parent.node.name.name = "Icon";
          //path.value.name = "icon";
          //path.parent.node.value.value.replace("fa fa-", "");
          //console.log(`<${element} ${property}="${value}">`);
          //console.log(`<Icon icon="${value.replace("fa fa-", "")}">`)
          }
        }
      }
    })
    .toSource();
}
