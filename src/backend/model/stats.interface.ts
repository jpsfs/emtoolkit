/**
 * Base statistics interface.
 * Represents basic statistics that are usually collected, either by @see WorkBucket or @see Employee
 */
export interface Stats {

    /**
     * Points executed
     */
    points: number;
    /**
     * Number of working days taken into consideration while evalutating these statistics.
     */
    workingDays: number;

    /**
     * Average points per working day (@see Stats.Points / @see Stats)
     */
    avgPointsPerWorkingDays: number;

    /**
     * Time period considered on these stats
     */
    dateRange: {
        start: Date;
        end: Date;
    }
}