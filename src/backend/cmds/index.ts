import { interfaces } from "inversify";

export const commandsBuilder = async (iocContainer: interfaces.Container) => {
    const statsCommandModule = await import("./stats");
    const serverCommandModule = await import("./server");
    
    return [statsCommandModule.statsCommandBuilder(iocContainer), serverCommandModule.serverCommandBuilder(iocContainer)];
};