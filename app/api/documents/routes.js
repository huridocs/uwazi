import request from '../../shared/JSONRequest.js'
import {db_url} from '../config/database.js'
import elastic from './elastic'
import sanitizeResponse from '../utils/sanitizeResponse'

export default app => {

  app.post('/api/documents', (req, res) => {

    if(!req.user){
      res.status(401);
      res.json({error: 'Unauthorized'});
      return;
    }

    let document = req.body;
    document.type = 'document';
    document.user = req.user;

    let url = db_url;
    if(document._id){
      url = db_url + '/_design/documents/_update/partialUpdate/'+document._id;
    }

    request.post(url, document)
    .then((response) => {
      res.json(response.json);
    })
    .catch(console.log);

  });

  app.get('/api/documents/search', (req, res) => {

    let searchTerm = req.query.searchTerm || '';

    let query = {
      "multi_match" : {
        "query":      searchTerm,
        "type":       "phrase_prefix",
        "fields":     [ "doc.fullText", "doc.metadata.*", "doc.title" ]
      }
    };

    if(!searchTerm){
      query = {match_all:{}};
    }

    let elasticQuery = {
      "_source": {
        "include": [ "doc.title", "doc.processed"]
      },
      "from" : 0,
      "size" : 100,
      "query": query,
      "filter": {
        "term":  { "doc.published": true }
      }
    }

    elastic.search({index:'uwazi', body:elasticQuery})
    .then(response => {

      let results = response.hits.hits.map((hit) => {
        let result = hit._source.doc;
        result._id = hit._id;
        return result;
      });

      res.json(results);
    })
    .catch(console.log);
  });

  app.get('/api/documents', (req, res) => {
    let id = '';
    let url = db_url+'/_design/documents/_view/list';

    if(req.query && req.query._id){
      id = '?key="'+req.query._id+'"';
      url = db_url+'/_design/documents/_view/all'+id;
    }

    request.get(url)
    .then(response => {
      response.json.rows = response.json.rows.map(row => row.value);
      if (response.json.rows.length === 1 && response.json.rows[0].css) {
        response.json.rows[0].css.splice(1, 1);
      }
      res.json(response.json);
    })
    .catch(console.log);
  });

  app.get('/api/documents/newest', (req, res) => {
    request.get(db_url+'/_design/documents/_view/list')
    .then(response => {
      res.json(sanitizeResponse(response.json));
    })
    .catch(console.log);
  });

  app.get('/api/documents/relevant', (req, res) => {
    request.get(db_url+'/_design/documents/_view/list')
    .then(response => {
      res.json(sanitizeResponse(response.json));
    })
    .catch(console.log);
  });

  app.get('/api/uploads', (req, res) => {

    if(!req.user){
      res.status(401);
      res.json({error: 'Unauthorized'});
      return;
    }

    let url = db_url+'/_design/documents/_view/uploads?key="'+req.user._id+'"';

    request.get(url)
    .then(response => {
      res.json(response.json);
    })
    .catch(console.log);
  });

  app.delete('/api/documents', (req, res) => {

    let url = db_url+'/'+req.body._id+'?rev='+req.body._rev;

    request.delete(url)
    .then((response) => {
      res.json(response.json)
    })
    .catch((error) => {
      res.json({error: error.json});
    });

  });
}
