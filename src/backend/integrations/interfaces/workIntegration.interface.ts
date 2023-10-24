import { WorkBucket } from "../../model/workBucket.interface";

export interface WorkIntegration {
    GetWorkBucket(workBucketURI: string, startDate?: Date, endDate?: Date): Promise<WorkBucket>; 
}