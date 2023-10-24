import { Employee } from "../../model/employee.interface";
import { TimeOff } from "../../model/timeoff.interface";

export interface TimeOffIntegration {
    GetEmployeesTimeOff(employees: Employee[], startDate: Date, endDate: Date): Promise<Employee[]>;
}