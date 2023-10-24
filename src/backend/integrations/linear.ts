import { IssueConnection, LinearClient, Project, ProjectMilestone, User } from "@linear/sdk";
import { v4 as uuidv4 } from 'uuid';

import { WorkIntegration } from "./interfaces/workIntegration.interface";
import { WorkBucket } from "../model/workBucket.interface";
import { IssueFilter } from "@linear/sdk/dist/_generated_documents";
import { Task } from "../model/task.interface";
import { Employee } from "../model/employee.interface";
import { inject, injectable } from "inversify";
import { TYPES } from "../ioc/symbols";

export type LinearWorkBucketFilter = {
    teamName: string;
    projectMilestoneName?: string;
    cycleName?: string;
    projectName?: string;
    time?: {
        from?: Date;
        to?: Date;
    };
}

const REGEX_WORKBUCKETURI = /^team\/(?<teamName>[^\/]+)(\/cycle\/(?<cycleName>[^\/]+))?(\/project\/(?<projectName>[^\/]+)(\/milestone\/(?<milestoneName>[^\/]+))?)?$/gmi;

@injectable()
export class Linear implements WorkIntegration {

    private readonly client: LinearClient;

    constructor(@inject(TYPES.Integrations.Linear.API_KEY) apiKey: string) {
        this.client = new LinearClient({
            apiKey: apiKey
        });
    }

    private parseWorkBucketURI(workBucketURI: string): LinearWorkBucketFilter {

        // Examples of URIs:
        // - team/[teamName]/project/[projectName]{/milestone/[milestoneName]}
        // - team/[teamName]/cycle/[cycleName]

        const regexMatch = REGEX_WORKBUCKETURI.exec(workBucketURI);

        if (!regexMatch || !regexMatch.groups) {
            throw new Error("Invalid 'workBucketURI' provided");
        }

        const regexMatchGroups = regexMatch.groups;

        const filter: LinearWorkBucketFilter = {
            teamName: regexMatchGroups.teamName,
            projectName: regexMatchGroups.projectName,
            cycleName: regexMatchGroups.cycleName,
            projectMilestoneName: regexMatchGroups.milestoneName
        };

        return filter;
    }

    private buildFilter(config: LinearWorkBucketFilter): IssueFilter {
        let filter: IssueFilter = {};

        filter.team = {
            name: {
                eqIgnoreCase: config.teamName
            }
        };

        if (config.projectName) {
            filter.project = {
                name: {
                    eq: config.projectName
                }
            };

            if (config.projectMilestoneName) {
                filter.projectMilestone = {
                    name: {
                        eq: config.projectMilestoneName
                    }
                }
            }
        }

        if (config.cycleName) {
            filter.cycle = {
                name: {
                    eq: config.cycleName
                }
            }
        }

        if (config.time) {
            if (config.time.from) {
                filter.startedAt = {
                    gte: config.time.from
                };
            }

            if (config.time.to) {
                filter.completedAt = {
                    lte: config.time.to
                }
            }
        }


        return filter;
    }

    async GetProjects(teamId: string): Promise<Project[]> {

        const team = await this.client.team(teamId);
        let linearProjects = await team.projects();

        let projects: Project[] = [];

        while (true) {
            for (const node of linearProjects.nodes) {
                projects.push(node);
            }

            if (linearProjects.pageInfo.hasNextPage) {
                linearProjects = await linearProjects.fetchNext();
            } else {
                break;
            }
        }

        return projects;
    }

    async GetProjectMilestones(projectId: string): Promise<ProjectMilestone[]> {
        const project = await this.client.project(projectId);

        let projectMilestones = await project.projectMilestones();

        const milestones: ProjectMilestone[] = [];

        while (true) {

            for (const node of projectMilestones.nodes) {
                milestones.push(node);
            }

            if (projectMilestones.pageInfo.hasNextPage) {
                projectMilestones = await projectMilestones.fetchNext();
            } else {
                break;
            }
        }

        return milestones;
    }

    async GetWorkBucket(workBucketURI: string, startDate?: Date, endDate?: Date): Promise<WorkBucket> {
        if (!workBucketURI) {
            throw new Error("Argument 'workBucketURI' is mandatory");
        }


        const classFilter = this.parseWorkBucketURI(workBucketURI);
        if (startDate || endDate) {
            classFilter.time = {
                from: startDate,
                to: endDate
            }
        }

        const linearFilter = await this.buildFilter(classFilter);

        const workBucket: WorkBucket = {
            id: uuidv4(),
            name: "",
            tasks: []
        };

        let issues: IssueConnection = await this.client.issues({
            filter: linearFilter,
            
        });

        const userEmployeeMap: Map<string, Employee> = new Map<string, Employee>();

        while(true) {

            for (const node of issues.nodes) {

                const userId = node["_assignee"]?.id;

                let employee: Employee | undefined;

                if (userId) {
                    employee = userEmployeeMap.get(userId);

                    if (!employee) {
                        employee = {
                            id: userId,
                            email: ""
                        };

                        userEmployeeMap.set(userId, employee);
                    }
                }

                const task: Task = {
                    id: node.id,
                    title: node.title,
                    estimation: node.estimate,
                    createdAt: node.createdAt,
                    startedAt: node.startedAt,
                    doneAt: node.completedAt,
                    assignedTo: employee
                };

                workBucket.tasks.push(task);
            }

            if (issues.pageInfo.hasNextPage) {
                issues = await issues.fetchNext();
            } else {
                break;
            }
        };

        // Fetch Users from the collected Ids
        let linearUsers = await this.client.users({
            filter: {
                id: {
                    in: Array.from(userEmployeeMap.keys())
                }
            }
        });

        while (true) {

            for (const user of linearUsers.nodes) {
                const employee = userEmployeeMap.get(user.id);

                if (employee) {
                    employee.email = user.email;
                    employee.name = user.name;
                }
            }

            if (linearUsers.pageInfo.hasNextPage) {
                linearUsers = await linearUsers.fetchNext();
            } else {
                break;
            }
        }

        return workBucket;
    }
}