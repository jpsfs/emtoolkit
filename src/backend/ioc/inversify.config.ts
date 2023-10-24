import "reflect-metadata";
import * as dotenv from "dotenv";

import {Container} from "inversify";
import { TYPES } from "./symbols";
import { HolidaysIntegration } from "../integrations/interfaces/holidays.interface";
import { DateHolidays } from "../integrations/dateHolidays";
import { WorkIntegration } from "../integrations/interfaces/workIntegration.interface";
import { Linear } from "../integrations/linear";
import { TimeOffIntegration } from "../integrations/interfaces/timeoffIntegration.interface";
import { BambooHR } from "../integrations/bamboohr";
import { Logger, ILogObj } from "tslog";
import { EffortLogic } from "../logic/effort.logic";
import { EmailMatcher, IgnoreDomain } from "../logic/email.logic";
import { EmployeeInformationIntegration as EmployeeInformationIntegration } from "../integrations/interfaces/employeeIntegration.interface";
import { Output } from "../output/output.interface";
import { CSV } from "../output/csv.output";
import { Progress } from "../utils/interfaces/progress";
import { TaskTerminal } from "../utils/taskTerminal";

const result = dotenv.config();
if (process.env.NODE_ENV !== "production" && result.error) {
  throw result.error;
}

const inversifyContainer = new Container();

// Constants
inversifyContainer.bind<string | undefined>(TYPES.Integrations.Linear.API_KEY).toConstantValue(process.env.LINEAR_APIKEY);
inversifyContainer.bind<string | undefined>(TYPES.Integrations.BambooHR.API_KEY).toConstantValue(process.env.BAMBOOHR_APIKEY);
inversifyContainer.bind<string | undefined>(TYPES.Integrations.BambooHR.COMPANY_DOMAIN).toConstantValue(process.env.BAMBOOHR_COMPANYDOMAIN);
inversifyContainer.bind<EmailMatcher>(TYPES.EmailMatcher).toConstantValue(IgnoreDomain);
inversifyContainer.bind<string | undefined>(TYPES.Output.BasePath).toConstantValue(process.env.OUTPUT_BASEPATH);

inversifyContainer.bind<Logger<ILogObj>>(TYPES.Logger).toConstantValue(new Logger());
inversifyContainer.bind<HolidaysIntegration>(TYPES.Integrations.Holidays).to(DateHolidays).inSingletonScope();
inversifyContainer.bind<WorkIntegration>(TYPES.Integrations.Work).to(Linear).inSingletonScope();
inversifyContainer.bind<TimeOffIntegration>(TYPES.Integrations.TimeOff).to(BambooHR).inSingletonScope();
inversifyContainer.bind<EmployeeInformationIntegration>(TYPES.Integrations.EmployeeInformation).to(BambooHR).inSingletonScope();

inversifyContainer.bind<Progress>(TYPES.Utils.Progress).to(TaskTerminal).inSingletonScope();
inversifyContainer.bind<EffortLogic>(TYPES.Logic.Effort).to(EffortLogic).inTransientScope();
inversifyContainer.bind<Output>(TYPES.Output.self).to(CSV).whenTargetIsDefault();

export default inversifyContainer;