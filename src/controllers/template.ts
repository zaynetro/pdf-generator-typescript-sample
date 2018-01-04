import { Response, Request, NextFunction } from 'express';
import * as phantom from 'phantom';
import { IWebPageResponse } from 'phantom';
import * as os from 'os';
import * as crypto from 'crypto';
import * as path from 'path';
import * as Ajv from 'ajv';

import { ClientError, ServerError } from '../models/Errors';

import TemplateParameters = Definitions.TemplateParameters;

export default class TemplateController {

  schema: any;

  constructor(schema: any) {
    this.schema = schema;
  }

  /**
   * POST /html
   * Render template as HTML
   */
  async renderHTML(req: Request, res: Response, next: NextFunction) {
    // Validate payload: Uses swagger model definition
    const ajv = new Ajv();
    const valid = ajv.validate(this.schema.definitions.TemplateParameters, req.body);
    if (!valid) {
      return next(new ClientError('Invalid request payload: ' + ajv.errorsText()));
    }

    // Render template
    const params = <TemplateParameters> req.body;
    res.render('sample.html.mustache', params);
  }

  /**
   * POST /pdf
   * Render template as PDF
   */
  async renderPDF(req: Request, res: Response, next: NextFunction) {
    const instance = await phantom.create();
    const page = await instance.createPage();

    await page.property('viewportSize', {
      // Ratio of A4 paper
      width: 1050,
      height: 1485,
    });

    // We need this hook to receive page status code
    const pageOpened = new Promise<IWebPageResponse>((resolve, reject) => {
      page.on('onResourceReceived', resolve);
    });

    const settings = {
      operation: 'POST',
      encoding: 'utf8',
      headers: {
        'Content-Type': 'application/json'
      },
      data: JSON.stringify(req.body)
    };

    // No matter the Host we know that our app will be running locally.
    // This URL is accessed by a phantom process locally that's why
    // we are using localhost.
    const uri = `http://localhost:${req.socket.localPort}/html`;
    console.log('Opening', uri, 'with settings', settings);

    const [status, pageRes] = await Promise.all([
      page.open(uri, settings),
      pageOpened
    ]);

    const content = await page.property<string>('plainText');

    if (status === 'success' && pageRes.status === 200) {
      // Everything is fine -> return PDF
      const dir = os.tmpdir();
      const name = crypto.randomBytes(12).toString('hex') + '.pdf';
      const pdfPath = path.join(dir, name);

      console.log('Saving file to', pdfPath);
      await page.render(pdfPath);

      res.sendFile(pdfPath);
    } else if (pageRes.status >= 400 && pageRes.status < 500) {
      // There was a client error
      next(new ClientError(content));
    } else if (pageRes.status >= 500) {
      // There was a server error
      next(new ServerError(content));
    } else {
      // PhantomJS failed to open the page
      next(new ServerError('HTML rendering failed'));
    }

    // We always need to terminate phantom process
    instance.exit();
  }
}
