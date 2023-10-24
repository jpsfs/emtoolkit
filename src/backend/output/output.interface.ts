import { WorkBucketStats } from "../model/workBucket.interface";

/**
 * Interface for Outputs
 */
export interface Output {
    /**
     * Outputs the statistics of a Work Bucket.
     * Output media depends on the concrete implementation of this interface.
     * 
     * @param workBucketStats Work bucket statitics
     * @returns A Promise indicating when the output is complete.
     */
    WorkBucketStats(workBucketStats: WorkBucketStats): Promise<void>;
}