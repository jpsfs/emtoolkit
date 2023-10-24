import { interfaces } from "inversify";
import { CommandModule, Options } from "yargs"
import { TYPES } from "../ioc/symbols";
import { EffortLogic } from "../logic/effort.logic";
import { Output } from "../output/output.interface";
import { Progress } from "../utils/interfaces/progress";

export const statsCommandBuilder = (iocContainer: interfaces.Container) => {

    const command: CommandModule<Options> = {
        command: "stats",
        builder: (y) => {
            return y.option("workBucketURI", {
                type: "string",
                describe:
                    `Unique Identifier that depends on the source.
                    For Linear: (milestone is optional)
                        - team/[teamName]/project/[projectName]{/milestone/[milestoneName]}
                        - team/[teamName]/cycle/[cycleName]
                    `,
                requiresArg: true
            }).option("startDate", {
                type: "string",
                describe: "Start date to be used on the calculations",
                coerce: Date.parse
            }).option("endDate", {
                type: "string",
                describe: "End date to be used on the calculations",
                coerce: Date.parse
            });
        },
        describe: "Calculates statistics for the Work Bucket definition provided",
        handler: async (args) => {
            // Validate arguments
            if (Number.isNaN(args.startDate)) {
                throw new Error("Invalid 'startDate' format");
            }

            if (Number.isNaN(args.endDate)) {
                throw new Error("Invalid 'endDate' format");
            }

            if (!args.workBucketURI) {
                throw new Error("Argument 'workBucketURI' is mandatory");
            }

            const workBucketURI = args.workBucketURI as string;
            const startDate = args.startDate ? new Date(args.startDate as number) : undefined;
            const endDate = args.endDate ? new Date(args.endDate as number) : undefined;

            const childContainer = iocContainer.createChild();
            const progress = childContainer.get<Progress>(TYPES.Utils.Progress);
            await progress.Setup();

            const effortLogic = childContainer.get<EffortLogic>(TYPES.Logic.Effort);
            const wbStats = await progress.Activity("Calculating statistics", () => effortLogic.CalculateStats(workBucketURI, startDate, endDate));
   
            // Depending on the output, export data
            const output = iocContainer.get<Output>(TYPES.Output.self);
            await progress.Activity("Outputting statistics", () => output.WorkBucketStats(wbStats));
            
            progress.Dispose();
        }
    };

    return command;
};