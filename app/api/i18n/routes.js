import translations from './translations';
import needsAuthorization from '../auth/authMiddleware';

export default app => {
  app.get('/api/translations', (req, res) => {
    translations.get()
    .then(response => res.json({rows: response}))
    .catch(error => res.json({error}));
  });

  app.post('/api/translations', needsAuthorization(), (req, res) => {
    translations.save(req.body)
    .then(response => {
      response.contexts = translations.prepareContexts(response.contexts);
      req.io.sockets.emit('translationsChange', response);
      res.json(response);
    })
    .catch(error => res.json({error}));
  });

  app.post('/api/translations/addentry', needsAuthorization(), (req, res) => {
    translations.addEntry(req.body.context, req.body.key, req.body.value)
    .then(response => res.json(response))
    .catch(error => res.json({error}));
  });
};
