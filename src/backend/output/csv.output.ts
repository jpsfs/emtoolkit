import { createWriteStream, promises as fspromises } from "fs";
import { WorkBucketStats } from "../model/workBucket.interface";
import { Output } from "./output.interface";
import { stringify, transform } from "csv"
import path from "path";
import { inject, injectable } from "inversify";
import { EmployeeStats } from "../model/employee.interface";
import { Task } from "../model/task.interface";
import { TYPES } from "../ioc/symbols";
import { Progress } from "../utils/interfaces/progress";

@injectable()
export class CSV implements Output {
    @inject(TYPES.Utils.Progress)
    private readonly progress!: Progress;

    private readonly basePath: string | undefined;
    private readonly folder: string;

    constructor(
        @inject(TYPES.Output.BasePath) basePath: string | undefined,
        folder: string = "csv"
    ) {
        if (basePath) {
            this.basePath = basePath;
        }
        else {
            this.basePath = process.cwd();
        }

        this.folder = path.join(this.basePath, folder);
    }
    
    /**
     * Writes a set of EmployeeStats into a CSV
     * @param employeeStats The EmployeeStats to write
     * @param destinationFolder The folder where to create the file
     * @param [filename] The file name, otherwise default is "employees.csv"
     */
    private async EmployeesStats(employeeStats: EmployeeStats[], destinationFolder: string, filename?: string): Promise<void> {

        // EmployeeStats Format
        // | ID | Name | Email | Country | Start Date | End Date| Working Days | Points | AvgPointsPerWorkingDays |
        
        // Prepare Data
        const data = employeeStats.map(eS => {
            return [
                eS.employee.id,
                eS.employee.name,
                eS.employee.email,
                eS.employee.country,
                eS.dateRange.start,
                eS.dateRange.end,
                eS.workingDays,
                eS.points,
                eS.avgPointsPerWorkingDays
            ];
        });

        return new Promise((resolve, reject) => {
            transform(data, function(record) {
                return record;
            })
            .pipe(stringify({
                header: true,
                columns: ["ID", "Name", "Email", "Country", "Start Date", "End Date", "Working Days", "Points", "AvgPointsPerWorkingDays"]
            }))
            .pipe(createWriteStream(path.join(destinationFolder, filename || "employees.csv"), {
                flags: "w+", 
            }))
            .on("finish", resolve)
            .on("error", reject);
        });
    }

    /**
     * Writes an array of Tasks into a CSV
     * @param tasks Array of tasks to write
     * @param destinationFolder Destination folder of the file
     * @param [filename] Optionally specificy the filename, otherwise the default will be "tasks.csv"
     */
    private async Tasks(tasks: Task[], destinationFolder: string, filename?: string): Promise<void> {
        // TasksStats Format
        // | ID | Title | Email | Estimate | CreatedAt | StartedAt | DoneAt |

        const tasksData = tasks.map(t => {
            return [
                t.id,
                t.title,
                t.assignedTo ? t.assignedTo.email : "",
                t.estimation,
                t.createdAt,
                t.startedAt,
                t.doneAt
            ];
        });

        return new Promise((resolve, reject) => {
            transform(tasksData, function(record) {
                return record;
            })
            .pipe(stringify({
                header: true,
                columns: ["ID", "Title", "Email", "Estimate", "CreatedAt", "StartedAt", "DoneAt"]
            }))
            .pipe(createWriteStream(path.join(destinationFolder, filename || "tasks.csv"), {
                flags: "w+", 
            }))
            .on("finish", resolve)
            .on("error", reject);
        });
    }
    
    /**
     * Outputs Work Bucket Statics in CSV format.
     * Since a Work Bucket is a complex structure, this output will be compose of multiple files.
     * @param workBucketStats Calculated Work Bucket Statitics
     */
    async WorkBucketStats(workBucketStats: WorkBucketStats): Promise<void> {
        const destinationFolder = path.join(this.folder, workBucketStats.workBucket.id);
        
        this.progress.LevelUp();

        // Make sure the path exists
        await this.progress.Activity(`Ensuring folder '${destinationFolder}' exists to store CSV's...`, () => fspromises.mkdir(destinationFolder, {recursive: true}));        

        // Trigger the writing in parallel, wait for all promises at once.
        const employeeStatsWriting = this.progress.Activity("Writing Employee Stats...", () => this.EmployeesStats(workBucketStats.employeeStats, destinationFolder));
        const tasksWriting = this.progress.Activity("Writing Tasks...", () => this.Tasks(workBucketStats.workBucket.tasks, destinationFolder));

        return Promise.all([employeeStatsWriting, tasksWriting]).then(() => this.progress.LevelDown());
    }

}