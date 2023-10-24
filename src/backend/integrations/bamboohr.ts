import axios, { Axios, AxiosError, AxiosResponse } from "axios";
import { Employee } from "../model/employee.interface";
import { TimeOff } from "../model/timeoff.interface";
import { Country } from "../model/country.enum";
import { inject, injectable } from "inversify";
import { EmailMatcher, EmailSet } from "../logic/email.logic";
import { TYPES } from "../ioc/symbols";
import { EmployeeInformationIntegration } from "./interfaces/employeeIntegration.interface";
import { TimeOffIntegration } from "./interfaces/timeoffIntegration.interface";
import assert from "assert";

type BambooHRTimeOffEntry = {
    id: string,
    employeeId: string,
    name: string,
    start: string,
    end: string,
    created: string,
    type: {
        id: string,
        name: string,
        icon: string
    },
    amount: {
        unit: string,
        amount: string
    },
    dates: any
};

type BambooHREmployee = {
    id: string,
    firstName: string,
    lastName: string,
    workEmail: string,
    country: string
};

type BambooHRField = {
    id: string,
    name: string,
    type: string,
    alias: string
};

type BambooHRUser = {
    id: string,
    firstName: string,
    lastName: string,
    email: string
    status: string
    employeeId: number
};

@injectable()
export class BambooHR implements TimeOffIntegration, EmployeeInformationIntegration {

    private readonly api_key: string;
    private readonly company_domain: string;

    private readonly axiosInstance: Axios;
    private readonly emailMatcher: EmailMatcher;

    constructor(
        @inject(TYPES.Integrations.BambooHR.COMPANY_DOMAIN) companyDomain: string,
        @inject(TYPES.Integrations.BambooHR.API_KEY) apiKey: string,
        @inject(TYPES.EmailMatcher) emailMatcher: EmailMatcher
    ) {

        this.company_domain = companyDomain;
        this.api_key = apiKey;
        this.emailMatcher = emailMatcher;

        this.axiosInstance = axios.create({
            baseURL: `https://api.bamboohr.com/api/gateway.php/${companyDomain}/v1/`,
            timeout: 30 * 1000,
            auth: {
                username: this.api_key,
                password: "EMToolkit"
            },
            headers: {
                "Accept": "application/json"
            }
        });
    }

    private convertDateToString(date: Date): string {
        return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(date.getDate()).padStart(2, "0")}`;
    }

    private convertCountryNameToCountry(country: string): Country {

        if (!country) {
            // This can happen if the API Key doesn't have access to this information for a given employee on BambooHR
            return Country.Undefined;
        }

        const lowerCaseName = country.toLowerCase();
        let code: Country;

        switch(lowerCaseName) {
            case "portugal":
                code = Country.Portugal;
                break;
            case "united states":
                code = Country.UnitedStates;
                break;
            default:
                code = Country.Undefined;
                break;
        }

        return code;
    }

    async GetFields(): Promise<BambooHRField[]> {
        const response: AxiosResponse = await this.axiosInstance.get("meta/fields");
        const data: BambooHRField[] = response.data;

        const emailFields = data.filter(x => x.type == "email");

        return response.data;
    }

    async GetEmployeeById(employeeId: string): Promise<BambooHREmployee> {
        const response: AxiosResponse = await this.axiosInstance.get(`employees/${employeeId}`, {
            params: {
                fields: "firstName,lastName,workEmail,country"
            }
        });

        return response.data;
    }

    async GetEmployeesTimeOff(employees: Employee[], startDate: Date, endDate: Date): Promise<Employee[]> {
        
        const employeesIdSet = new Set<string>(employees.map(e => e.id));
        const employeesMap = new Map<string, Employee>(employees.map(e => [e.id, e]));

        // Populate the map struct

        const response: AxiosResponse = await this.axiosInstance.get("time_off/requests", {
            params: {
                start: this.convertDateToString(startDate),
                end: this.convertDateToString(endDate),
                status: "approved"
            }
        });

        const data: BambooHRTimeOffEntry[] = response.data;

        for (const element of data) {

            // Check if the employee is one of the ones we are looking for
            // If not, skip
            if (!employeesIdSet.has(element.employeeId)) {
                continue;
            }

            const timeOffs: TimeOff[] = [];
            for (const index in element.dates) {
                const timeLine = new Date(index);
                const qtd = Number.parseFloat(element.dates[index]);

                if (qtd > 0) {
                    const timeOff: TimeOff = {
                        date: timeLine,
                        quantity: qtd
                    };

                    timeOffs.push(timeOff);
                }
            }

            if (timeOffs.length > 0) {
                // Get employee from Map struct
                let employee = employeesMap.get(element.employeeId);
                assert(employee, "Employee must always be found");     

                if (!employee.timeOff) {
                    employee.timeOff = [];
                }

                employee.timeOff.push(...timeOffs);
            }

        }

        return Array.from(employeesMap.values());
    }

    async GetEmployeesByEmail(employeeEmails: string[]): Promise<Employee[]> {
        // Haven't found a great way to query this on Bamboo.
        // Assuming all employees have a user associated with it - may not be the case but let's hope so.

        const response: AxiosResponse = await this.axiosInstance.get("meta/users");

        // Go through all users, compare their emails using the emailMatcher
        const data: {[key: string]: BambooHRUser} = response.data;

        const employeesEmailsSet = new EmailSet(this.emailMatcher);
        employeeEmails.forEach(e => employeesEmailsSet.add(e));

        const employees: Employee[] = [];
        for (let userId in data) {
            const user = data[userId];

            // Some users may not have email - eg: test users 
            if (!user || !user.email) continue;

            if (employeesEmailsSet.has(user.email)) {

                const bambooHREmployee = await this.GetEmployeeById(`${user.employeeId}`);

                employees.push({
                    name: `${bambooHREmployee.firstName} ${bambooHREmployee.lastName}`,
                    email: bambooHREmployee.workEmail,
                    country: this.convertCountryNameToCountry(bambooHREmployee.country),
                    id: bambooHREmployee.id
                });
            }
        }

        return employees;
    }
}