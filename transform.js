// Press ctrl+space for code completion
export default function transformer(file, api) {
  const j = api.jscodeshift;
  const root = j(file.source);
  return root
    .find(j.Identifier)
    .forEach(path => {
      if(path.value.name === "i") {
        const attributes = 
          path.parent.parent.node.openingElement ?
          path.parent.parent.node.openingElement.attributes : false;
        if (attributes) {
          attributes.map(attr => {
            if(attr.name.name === "className" && attr.value.value !== undefined) {
              if(attr.value.value.startsWith("fa fa-")) {
                attr.name.name = "icon";
                attr.value.value = attr.value.value.replace("fa fa-", "");
                path.value.name = "Icon"
                console.log(attr.name.name + attr.value.value)
              }
            }
          }
          )
        }
      }
    })
    .toSource();
}
