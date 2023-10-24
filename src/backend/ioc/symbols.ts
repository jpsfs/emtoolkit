const TYPES = {
    Logger: Symbol.for("Logger"),
    EmailMatcher: Symbol.for("EmailMatcher"),
    Integrations: {
        Holidays: Symbol.for("Integration.Holidays"),
        Work: Symbol.for("Integration.Work"),
        TimeOff: Symbol.for("Integration.TimeOff"),
        BambooHR: {
            self: Symbol.for("Integration.BambooHR"),
            COMPANY_DOMAIN: Symbol.for("Integration.BambooHR.Args.CompanyDomain"),
            API_KEY: Symbol.for("Integration.BambooHR.Args.ApiKey")
        },
        Linear: {
            self: Symbol.for("Integration.Linear"),
            API_KEY: Symbol.for("Integration.Linear.Args.ApiKey")
        },
        EmployeeInformation: Symbol.for("Integration.EmployeeInformation")
    },
    Logic: {
        Effort: Symbol.for("Logic.Effort")
    },
    Output: {
        self: Symbol.for("Output"),
        CSV: Symbol.for("Output.CSV"),
        BasePath: Symbol.for("Output.BasePath")
    },
    Utils: {
        Progress: Symbol.for("Progress")
    }
};

export {TYPES};