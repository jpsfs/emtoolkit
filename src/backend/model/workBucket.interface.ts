import { EmployeeStats } from "./employee.interface";
import { Stats } from "./stats.interface";
import { Task } from "./task.interface";

/**
 * Representation of a set of work.
 * Can be a sprint/cycle, a project, milestone or ad-hoc.
 */
export interface WorkBucket {
    /**
     * Work bucket identifier
     */
    id: string;
    /**
     * Name of the work bucket
     */
    name: string;
    /**
     * Array of tasks included in the work bucket.
     */
    tasks: Task[];
}

/**
 * Work Bucket Statistics representation
 */
export interface WorkBucketStats extends Stats {
    /**
     * Work Bucket
     */
    workBucket: WorkBucket;

    /**
     * Array of employee statistics
     */
    employeeStats: EmployeeStats[];
}