import { Employee } from "../../model/employee.interface";

export interface EmployeeInformationIntegration {
    GetEmployeesByEmail(employeeEmails: string[]): Promise<Employee[]>;
}