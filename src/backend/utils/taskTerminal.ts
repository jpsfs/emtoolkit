import { inject, injectable } from "inversify";
import { Progress, ProgressActivity } from "./interfaces/progress";
import { ILogObj, Logger } from "tslog";
import * as emoji from "node-emoji";
import { TYPES } from "../ioc/symbols";

@injectable()
export class TaskTerminal implements Progress {

    private _loggers: Logger<ILogObj>[] = [];

    private get logger() {
        return this._loggers[this._loggers.length - 1];
    }

    constructor(@inject(TYPES.Logger) logger: Logger<ILogObj>) {
       this._loggers.push(logger);
    }

    /**
     * Setup
     */
    async Setup(): Promise<void> {

    }

    /**
     * Disposes task tree cli
     */
    Dispose(): void {

    }

    LevelUp(): void {
        this._loggers.push(this.logger.getSubLogger({
            prefix: ["\t"]
        }));
    }

    LevelDown(): void {
        if (this._loggers.length > 1) {
            this._loggers.pop();
        }
    }

    /**
     * Creates a Progress Tree Activity
     * @template T 
     * @param description Activity description
     * @param activity Work that needs to be executed
     * @returns activity 
     */
    Activity<T>(description: string, activity: () => Promise<T>): Promise<T> {
        // Create a task in TaskTree Cli
        this.logger.info(emoji.emojify(`:hourglass: ${description}`));

        return activity().then(x => {
            this.logger.info(emoji.emojify(`:white_check_mark: ${description}`));
            return x;
        }).catch(e => {
            this.logger.info(emoji.emojify(`:x: Error: ${description}`));
            throw e;
        });
    }
}