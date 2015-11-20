import path from 'path'
import Router from './Router'
import express from 'express'

export default app => {

  app.use(express.static(path.resolve(__dirname, 'dist')));
  app.get('*', Router);

}
