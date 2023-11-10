import { inject, injectable } from "inversify";
import { WorkIntegration } from "../integrations/interfaces/workIntegration.interface";
import { WorkBucket, WorkBucketStats } from "../model/workBucket.interface";
import { TYPES } from "../ioc/symbols";
import { TimeOffIntegration } from "../integrations/interfaces/timeoffIntegration.interface";
import { HolidaysIntegration } from "../integrations/interfaces/holidays.interface";
import { Employee, EmployeeStats } from "../model/employee.interface";
import { EmailMap, EmailMatcher, IgnoreDomain } from "./email.logic";
import { Country } from "../model/country.enum";
import { Holiday } from "../model/holiday.interface";
import { EmployeeInformationIntegration } from "../integrations/interfaces/employeeIntegration.interface";
import { Progress } from "../utils/interfaces/progress";

/**
 * Contains all relevant logic to make calculations regarding Work Buckets
 */
@injectable()
export class EffortLogic {

    private emailMatcher: EmailMatcher = IgnoreDomain;

    constructor(
        @inject(TYPES.Integrations.Work) private workIntegration: WorkIntegration,
        @inject(TYPES.Integrations.TimeOff) private timeOffIntegration: TimeOffIntegration,
        @inject(TYPES.Integrations.Holidays) private holidaysIntegration: HolidaysIntegration,
        @inject(TYPES.Integrations.EmployeeInformation) private employeeInformationIntegration: EmployeeInformationIntegration,
        @inject(TYPES.Utils.Progress) private progress: Progress
    ) {

    }

    /**
     * Sums all the points used as estimation on every task of a Work Bucket
     * @param workBucket 
     * @param [noEstimationValue] 
     * @returns points 
     */
    private calculatePoints(workBucket: WorkBucket, noEstimationValue?: number): number {
        if (!workBucket) {
            throw new Error("Argument 'workBucket' is mandatory");
        }

        if (!workBucket.tasks || !workBucket.tasks.length) {
            return 0;
        }

        let points = 0;
        for (const task of workBucket.tasks) {
            points += (task.estimation || noEstimationValue || 0);
        }

        return points;
    }
    /**
     * Compares dates without time.
     * @param date1 
     * @param date2 
     * @returns true if dates are the same, false otherwise
     */
    private compareDateWithoutTime(date1: Date, date2: Date): boolean {
        return date1.getUTCFullYear() === date2.getUTCFullYear() &&
            date1.getUTCMonth() === date2.getUTCMonth() &&
            date1.getUTCDate() === date2.getUTCDate();
    }

    /**
     * Calculates the working days of an employee.
     * Assumes employee has already information about time off.
     * @param employee Employee
     * @param countryHolidays Array of country holidays
     * @param startDate Start Date of the period to analyze
     * @param endDate End Date of the period to analyze
     * @returns Number of working days for the employee on the given timeframe
     */
    private calculateEmployeeWorkingDays(employee: Employee, countryHolidays: Holiday[], startDate: Date, endDate: Date): number {
        
        let workingDays = 0;

        // "Clone" the data object so that everytime we change it we're not affecting the reference given by input.
        for (let dayToAnalyze = new Date(startDate); dayToAnalyze <= endDate; dayToAnalyze.setUTCDate(dayToAnalyze.getUTCDate() + 1)) {
            const dayOfTheWeek = dayToAnalyze.getUTCDay();

            // In Javascript 0 is Sunday, 6 is Saturday
            if (dayOfTheWeek == 0 || dayOfTheWeek == 6) continue;

            // Check if this is a country holiday
            let isHoliday = false;
            for (const countryHoliday of countryHolidays) {
                if (this.compareDateWithoutTime(countryHoliday.startDate, dayToAnalyze)) {
                    isHoliday = true;
                    break;
                }
            }

            if (isHoliday) continue;

            // Check if the person was on TimeOff
            let isTimeOff = false;
            for (const pto of employee.timeOff || []) {
                if (this.compareDateWithoutTime(pto.date, dayToAnalyze)) {
                    isTimeOff = true;
                    break;
                }
            }

            if (isTimeOff) continue;

            // If it reached here, it was a working day
            workingDays++;
        }

        return workingDays;
    }

    /**
     * Calculates stats
     * @param workbucketURI  
     * @param [startDate] 
     * @param [endDate] 
     */
    public async CalculateStats(workbucketURI: string, startDate?: Date, endDate?: Date): Promise<WorkBucketStats> {
        this.progress.LevelUp();

        // Get WorkBucket based on WorkBucketURI
        const workBucket = await this.progress.Activity("Fetching Workbucket information", () => this.workIntegration.GetWorkBucket(workbucketURI, startDate, endDate));

        // Now that we have all the work done with the specified conditions, let's fetch PTO for those involved
        
        let minWorkBucketDate = 8640000000000000, maxWorkBucketDate = -8640000000000000;

        // Let's get everyone that was involved in the work specified
        const employees: EmailMap<Employee> = new EmailMap(this.emailMatcher);
        const employeesPoints: EmailMap<number> = new EmailMap(this.emailMatcher);

        for (const task of workBucket.tasks) {

            if (task.startedAt) {
                minWorkBucketDate = Math.min(minWorkBucketDate, task.startedAt.getTime());
            }

            if (task.doneAt) {
                maxWorkBucketDate = Math.max(maxWorkBucketDate, task.doneAt.getTime());
            }

            // If the task is not assigned to anyone, just continue
            if (!task.assignedTo) {
                continue;
            }

            // Check if the employee is already on the map we created before
            let employee = employees.get(task.assignedTo.email);
            if (!employee) {
                employee = task.assignedTo;
                employees.set(task.assignedTo.email, task.assignedTo);
            }

            // Store the points done for an employee
            let employeePoints = employeesPoints.get(task.assignedTo.email);
            if (employeePoints == undefined) {
                employeePoints = 0;
            }
            employeePoints += task.estimation == undefined ? 0: task.estimation;
            employeesPoints.set(task.assignedTo.email, employeePoints);

            // Associate the task with the employee
            if (!employee.tasks) {
                employee.tasks = [];
            }
            employee.tasks.push(task);
        }

        
        const effectiveStartDate = startDate || new Date(minWorkBucketDate);
        const effectiveEndDate = endDate || new Date(maxWorkBucketDate);
        const employeesList = Array.from(employees.values());
        const employeesEmailList = Array.from(employees.keys());

        const dateRange = {
            start: effectiveStartDate,
            end: effectiveEndDate
        };

        // Fetch Information about Employee
        const employeesInfo = await this.progress.Activity("Fetching Employee Information", () => this.employeeInformationIntegration.GetEmployeesByEmail(employeesEmailList));

        // Assemble information about the people involved in the project
        employeesInfo.forEach(ei => {
            const baseEmployee = employees.get(ei.email);

            if (!baseEmployee) throw new Error("All employees must match existing ones");

            baseEmployee.name = ei.name;
            baseEmployee.country = ei.country;
            baseEmployee.id = ei.id;
        });

        // Fetch timeoff for those people. Sometimes we will not have access to the timeoff of everyone, but that's OK.
        // If timeoff time doesn't exist for the employee, consider that employee did not have timeoff during this period.
        
        const timeOffPerEmployee = await this.progress.Activity("Fetching employees Time Off", () => this.timeOffIntegration.GetEmployeesTimeOff(
            employeesList,
            effectiveStartDate,
            effectiveEndDate
        ));

        // Get distinct countries where the people are in
        const countries = new Set<Country>();
        employeesList.forEach(e => countries.add(e.country || Country.Undefined));

        // Fetch Holidays for the countries where we had people involved
        const holidaysPerCountry = new Map<Country, Holiday[]>();
        for (const country of countries) {
            if (country == Country.Undefined) continue;
            
            const countryHolidays = await this.progress.Activity(`Fetching known holidays for ${country}`, () => this.holidaysIntegration.GetHolidays(country, effectiveStartDate, effectiveEndDate));
            holidaysPerCountry.set(country, countryHolidays);   
        }

        // Start calculating stats based on the information collected
        const totalPoints = this.calculatePoints(workBucket, 1);
        let totalWorkingDays = 0;
        
        // Calculate stats for each employee
        const employeeStats: EmployeeStats[] = [];
        for (const employee of employeesList) {
            const eCH = holidaysPerCountry.get(employee.country || Country.Undefined) || [];
            const eWD = this.calculateEmployeeWorkingDays(employee, eCH, effectiveStartDate, effectiveEndDate);

            const ePoints = employeesPoints.get(employee.email) || 0;

            employeeStats.push({
                employee: employee,
                workingDays: eWD,
                dateRange: dateRange,
                points: ePoints,
                avgPointsPerWorkingDays: ePoints / eWD
            });

            totalWorkingDays += eWD;
        }

        const wbStats: WorkBucketStats = {
            workBucket: workBucket,
            points: totalPoints,
            workingDays: totalWorkingDays,
            employeeStats: employeeStats,
            avgPointsPerWorkingDays: totalPoints / totalWorkingDays,
            dateRange: dateRange
        }

        this.progress.LevelDown();

        return wbStats;
    }
}