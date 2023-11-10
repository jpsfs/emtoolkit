import { interfaces } from "inversify";

export const commandsBuilder = async (iocContainer: interfaces.Container) => {
    const statsCommandModule = await import("./stats");
    
    return [statsCommandModule.statsCommandBuilder(iocContainer)];
};