import iocContainer from "./ioc/inversify.config";
import { Commands } from './commands';

const commands = new Commands(iocContainer);
commands.Run().then((result) => {
  if (!result) {
    // No command was run, boot server

  } else {
    // Nothing do to, let the program finish
  }
});