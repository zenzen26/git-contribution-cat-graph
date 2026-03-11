export interface ContributionDay {
    date: string;
    count: number;
    level: 0 | 1 | 2 | 3 | 4;
}
export interface ContributionWeek {
    days: ContributionDay[];
}
export interface ContributionGraph {
    weeks: ContributionWeek[];
    totalContributions: number;
}
export declare function fetchContributionGraph(username: string, token: string): Promise<ContributionGraph>;
//# sourceMappingURL=contribution-graph.d.ts.map