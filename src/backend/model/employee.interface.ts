import { Country } from "./country.enum";
import { Stats } from "./stats.interface";
import { Task } from "./task.interface";
import { TimeOff } from "./timeoff.interface"

export interface Employee {
    /**
    * Unique Identifier. Depending on the source this property may mean different things.
    * See @see Employee.email if you are looking for cross-source identifier.
    */
    id: string

    /**
     * Employee Unique Identifier 
     */
    email: string

    /**
     * Employee Name
     */
    name?: string

    /**
     * Time off
     */
    timeOff?: TimeOff[];

    /**
     * Country
     */
    country?: Country;

    /**
     * Tasks
     */
    tasks?: Task[];

    /**
     * First date a task was started
     */
    tasksStartDate?: Date;

    /**
     * Last date a task was completed
     */
    tasksEndDate?: Date;
}

export interface EmployeeStats extends Stats{
    employee: Employee;
}