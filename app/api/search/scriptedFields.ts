export interface WriteAccessFieldParams {
  ids?: string[];
}
export const writeAccessField = (params: WriteAccessFieldParams) => ({
  script: {
    lang: 'painless',
    source: `
      if ( params['_source']['permissions'] == null ) {
        return false;
      }
      
      for (int i = 0; i < params['_source']['permissions'].length; ++i) {
        if ( 
          params.ids.contains(params['_source']['permissions'][i]['_id'])
          && params['_source']['permissions'][i]['level'] == 'write'
        ) {
          return true;
        }
      }

      return false;
    `,
    params,
  },
});
