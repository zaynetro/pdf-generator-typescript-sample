import * as express from 'express';
import { Request, Response, NextFunction } from 'express';
import * as bodyParser from 'body-parser';
import * as logger from 'morgan';
import * as path from 'path';
import * as mustacheExpress from 'mustache-express';
import * as SwaggerParser from 'swagger-parser';

import { ClientError } from './models/Errors';

// Controllers (route handlers)
import TemplateController from './controllers/template';

async function createApp() {
  // Create Express server
  const app = express();

  // Register mustache extension
  app.engine('mustache', mustacheExpress());

  // Express configuration
  app.set('port', process.env.PORT || 3000);
  app.set('views', path.join(__dirname, '../templates'));
  app.set('view engine', 'mustache');
  app.disable('x-powered-by');

  app.use(logger('common'));
  app.use(bodyParser.json());

  const schemaFile = path.join(__dirname, 'public/swagger.yaml');
  console.log('Loading swagger schema from', schemaFile);
  const schema = await SwaggerParser.dereference(schemaFile);

  const templates = new TemplateController(schema);

  /**
   * Routes
   */
  app.post('/html', templates.renderHTML.bind(templates));
  app.post('/pdf/phantom', templates.renderPDFPhantom.bind(templates));
  app.post('/pdf/puppeteer', templates.renderPDFPuppeteer.bind(templates));

  // Error handling
  app.use((err: any, req: Request, res: Response, next: NextFunction) => {
    const status = (err instanceof ClientError) ? 400 : 500;
    console.error(err.toString());

    res.status(status).send({
      message: err.toString()
    });
  });


  return app;
}

export default createApp;
