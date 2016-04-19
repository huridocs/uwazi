const defaultFields = ['doc.fullText', 'doc.metadata.*', 'doc.title'];
export default function (searchTerm, fields = defaultFields, highlights, size = 100) {
  let query = {match_all: {}};
  if (searchTerm) {
    query = {
      multi_match: {
        query: searchTerm,
        type: 'phrase_prefix',
        fields: fields
      }
    };
  }
  let queryBody = {
    _source: {
      include: [ 'doc.title', 'doc.processed']
    },
    from: 0,
    size: size,
    query: query,
    filter: {
      term: {'doc.published': true}
    }
  };

  if (highlights) {
    let fields = highlights.map((highlight) => {
      let field = {};
      field[highlight] = {};
      return field;
    });

    queryBody.highlight = {
      pre_tags : ['<b>'],
      post_tags : ['</b>'],
      fields: fields
    };
  }

  return queryBody;
}
