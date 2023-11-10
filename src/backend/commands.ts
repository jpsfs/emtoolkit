import {interfaces} from "inversify";
import yargs from "yargs";
import {hideBin} from "yargs/helpers";

export class Commands {

    private readonly container: interfaces.Container;

    constructor(container: interfaces.Container) {
        this.container = container;
    }

    public async RunProjectStats(identifier: string, startDate: Date, endDate: Date): Promise<void> {

    }

    public async Run(): Promise<boolean> {

        const commandsModule = await import("./cmds/index");
        const commands = await commandsModule.commandsBuilder(this.container);

        await yargs(hideBin(process.argv))
            .command(commands)
            .option("export", {
                describe: "Output format",
                choices: ["csv", "console"]
            })
            .option("outDir", {
                describe: "Output directory",
                type: "string"
            })
            .scriptName("emtoolkit-cli")
            .demandCommand()
            .help()
            .parse();
        
        return true;
    }
}