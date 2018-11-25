import express from 'express';
import awsServerlessExpress from 'aws-serverless-express';

import { SERVICE_NAME } from './configs/constants';
import customerController from './controllers/customer-controller';
import LogService from './services/log-service';
import TraceService from './services/trace-service';

const app = express();
const server = awsServerlessExpress.createServer(app);

app
  .use(express.json())
  .use(TraceService.middleware())
  .use(LogService.middleware())
  .use((req, res, next) => {
    req.log.debug('Processing request', {
      host: req.get('host'),
      path: req.path,
      query: req.query,
      headers: req.headers,
      body: req.body,
    });
    next();
  })
  .use([`/${SERVICE_NAME}`, '/'], customerController)
  .use((err, req, res, next) => {
    req.log.error('Request processing error', err);
    next(err);
  });

exports.handler = (event, context) => awsServerlessExpress.proxy(server, event, context);
