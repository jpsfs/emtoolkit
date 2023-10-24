import { Employee } from "./employee.interface";
/**
 * Task interface representation.
 * A task represents works that needs to be done.
 */
export interface Task {

    /**
     * Task identifier
     */
    id: string;

    /**
     * Title of the task
     */
    title: string;

    /**
     * Task estimation. Usually represented in the form of points.
     * Some tasks may not have been estimated, thus estimation can be "undefined".
     */
    estimation: number | undefined;

    /**
     * When was the task created
     */
    createdAt: Date;

    /**
     * When someone started to work on the task
     */
    startedAt: Date | undefined;

    /**
     * When the task was completed
     */
    doneAt: Date | undefined;

    /**
     * To who the task is assigned to.
     */
    assignedTo: Employee | undefined
}