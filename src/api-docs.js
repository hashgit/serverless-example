import awsServerlessExpress from 'aws-serverless-express';
import awsServerlessExpressMiddleware from 'aws-serverless-express/middleware';
import express from 'express';
import swaggerUi from 'swagger-ui-dist';
import swaggerJSDoc from 'swagger-jsdoc';
import { SERVICE_NAME } from './configs/constants';

const app = express();
const server = awsServerlessExpress.createServer(app);

// Include the modules that contains the documentation for it to be bundled by webpack
require.resolve('../static/swagger-ui/index.html');
require.resolve('./api.js');

const swaggerSpec = {
  swaggerDefinition: {
    info: {
      version: '1.0.0',
      title: 'Customer API',
    },
    schemes: ['https'],
    securityDefinitions: {
      apiKeyAuthorization: {
        type: 'apiKey',
        in: 'header',
        name: 'x-api-key',
      },
    },
    security: [{
      apiKeyAuthorization: [],
    }],
  },
  apis: ['src/api-docs.js'],
};
const swaggerDoc = swaggerJSDoc(swaggerSpec);
const serviceName = SERVICE_NAME;
const docs = '/docs';
const apiDocs = `${docs}/api-docs.json`;

app.use(awsServerlessExpressMiddleware.eventContext());

// Serve the swagger json definition
app.get([`/${serviceName}${apiDocs}`, apiDocs], (req, res) => {
  swaggerDoc.host = req.get('host');
  // Use the base path, i.e /dev
  swaggerDoc.basePath = req.path.replace(apiDocs, '') || `/${req.apiGateway.event.requestContext.stage}`;
  res.json(swaggerDoc);
});

// Serve the swagger-ui static files
app.use(
  [`/${serviceName}${docs}`, docs],
  express.static('static/swagger-ui'),
  express.static(swaggerUi.getAbsoluteFSPath()),
);

exports.handler = (event, context) => awsServerlessExpress.proxy(server, event, context);
