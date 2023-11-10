import { ILogObj, Logger } from "tslog";
import iocContainer from "./ioc/inversify.config";
import { TYPES } from "./ioc/symbols";
import * as emoji from "node-emoji";

const logger = iocContainer.get<Logger<ILogObj>>(TYPES.Logger);

if (process.env.SERVER) {
  logger.info(emoji.emojify(":information_source: Booting in :spider_web: Server mode"));

  import("./server");

} else {
  logger.info(emoji.emojify(":information_source: Booting in :beetle: CLI mode"));

  import('./commands').then(async (commandsModule) => {
      const commands = new commandsModule.Commands(iocContainer);

      await commands.Run()
  });
}

