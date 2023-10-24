import express, { Express, Request, Response } from 'express';
import { interfaces } from 'inversify';
import { CommandModule, Options } from 'yargs';

export const serverCommandBuilder = (iocContainer: interfaces.Container) => {
  const command: CommandModule<Options> = {
    command: "server",
    describe: "Starts a REST API server",
    handler: async (args) => {

      const app: Express = express();
      const port = process.env.PORT || 3000;

      app.get('/', async (req: Request, res: Response) => {
        res.send('EM Toolkit Server - Maintenance');
      });

      app.listen(port, () => {
        console.log(`⚡️[server]: Server is running at http://localhost:${port}`);
      });
    }
  };

  return command;
};

