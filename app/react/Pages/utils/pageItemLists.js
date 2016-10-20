const listPlaceholder = '{---UWAZILIST---}';

export default {
  generate: (originalText) => {
    const listMatch = /{list}\((.*?)\)/g;
    const params = [];
    const originalContent = originalText || '';

    const content = originalContent.replace(listMatch, (_, list) => {
      const listParams = /\?(.*)/g.exec(list);
      params.push(listParams ? listParams[0] : '');
      return listPlaceholder;
    });

    return {params, content};
  }
};
