import express from 'express';
import swaggerJSDoc from 'swagger-jsdoc';

import path from 'path';

export default (app) => {
  const swaggerDefinition = {
    info: {
      title: 'Uwazi API',
      version: '1.0.0',
      description: `Uwazi is an open-source solution for building and sharing document collections.
      <br>Remember that using the "Try it out" functionality will execute the requests over your local instalation!`
    },
    host: 'localhost:3000',
    basePath: '/api',
    tags: [
      { name: 'attachments' },
      { name: 'entities' }
    ],
    definitions: {
      Error: {
        properties: {
          error: { type: 'string' }
        }
      }
    }
  };

  const options = {
    swaggerDefinition,
    apis: [`${__dirname}/../**/*.js`]
  };

  const swaggerSpec = swaggerJSDoc(options);
  app.get('/api/swagger.json', (req, res) => {
    res.setHeader('Content-Type', 'application/json');
    res.send(swaggerSpec);
  });

  app.use('/api', express.static(path.resolve(__dirname, '../../../public/swaggerUI')));
};
