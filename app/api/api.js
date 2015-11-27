import bodyParser from 'body-parser'

export default app => {

  //common middlewares
  app.use(bodyParser.json());

  //module routes
  require('./auth/routes.js')(app);

}
