/** @format
 * Uwazi routes that start and inspect tasks.
 */

import { needsAuthorization } from 'api/auth';
import { validation } from 'api/utils';
import { Application, Request, Response } from 'express';
import Joi from 'joi';
import { TaskProvider } from 'shared/tasks/tasks';

export const TASKS_ENDPOINT = 'tasks';
const tasksPrefix = `/api/${TASKS_ENDPOINT}`;

export default (app: Application) => {
  app.get(
    tasksPrefix,
    // needsAuthorization(),
    validation.validateRequest(
      Joi.object()
        .keys({ name: Joi.string() })
        .required(),
      'query'
    ),

    async (req: Request, res: Response) => {
      if (req.query?.name) {
        const task = TaskProvider.getByName(req.query?.name);
        return res.json(task?.status ?? { state: 'undefined' });
      }
      return res.json(TaskProvider.taskInstances);
    }
  );

  app.post(
    tasksPrefix,
    needsAuthorization(),
    validation.validateRequest(
      Joi.object()
        .keys({
          name: Joi.string().required(),
          type: Joi.string().required(),
          args: Joi.any(),
        })
        .required(),
      'query'
    ),

    async (req: Request, res: Response) => {
      const task = TaskProvider.getOrCreate(req.query?.name, req.query?.type);
      if (task.status.state === 'created') {
        task.start(req.query?.args);
      }
      return res.json(task?.status ?? { state: 'undefined' });
    }
  );
};
