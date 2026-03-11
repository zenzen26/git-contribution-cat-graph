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

export async function fetchContributionGraph(
  username: string,
  token: string
): Promise<ContributionGraph> {
  const query = `
    query($login: String!) {
      user(login: $login) {
        contributionsCollection {
          contributionCalendar {
            totalContributions
            weeks {
              contributionDays {
                date
                contributionCount
                contributionLevel
              }
            }
          }
        }
      }
    }
  `;

  const response = await fetch("https://api.github.com/graphql", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ query, variables: { login: username } }),
  });

  if (!response.ok) {
    throw new Error(`GitHub API error: ${response.statusText}`);
  }

  const data = await response.json() as any;
  const calendar =
    data.data.user.contributionsCollection.contributionCalendar;

  const levelMap: Record<string, 0 | 1 | 2 | 3 | 4> = {
    NONE: 0,
    FIRST_QUARTILE: 1,
    SECOND_QUARTILE: 2,
    THIRD_QUARTILE: 3,
    FOURTH_QUARTILE: 4,
  };

  return {
    totalContributions: calendar.totalContributions,
    weeks: calendar.weeks.map((week: any) => ({
      days: week.contributionDays.map((day: any) => ({
        date: day.date,
        count: day.contributionCount,
        level: levelMap[day.contributionLevel] ?? 0,
      })),
    })),
  };
}