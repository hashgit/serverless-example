import express from 'express';

import { SERVICE_NAME } from './configs/constants';
import customerController from './controllers/customer-controller';
import LogService from './services/log-service';

express()
  .use(LogService.middleware())
  .use(express.json())
  .use([`/${SERVICE_NAME}`, '/'], customerController)
  .listen(3000, () => console.log('App listening on port 3000!')); // eslint-disable-line no-console
