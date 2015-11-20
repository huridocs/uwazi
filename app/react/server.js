import Router from './Router'

export default app => {
  app.get('*', Router);

}
