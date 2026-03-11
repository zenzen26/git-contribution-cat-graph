"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.fetchContributionGraph = fetchContributionGraph;
async function fetchContributionGraph(username, token) {
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
    const data = await response.json();
    const calendar = data.data.user.contributionsCollection.contributionCalendar;
    const levelMap = {
        NONE: 0,
        FIRST_QUARTILE: 1,
        SECOND_QUARTILE: 2,
        THIRD_QUARTILE: 3,
        FOURTH_QUARTILE: 4,
    };
    return {
        totalContributions: calendar.totalContributions,
        weeks: calendar.weeks.map((week) => ({
            days: week.contributionDays.map((day) => ({
                date: day.date,
                count: day.contributionCount,
                level: levelMap[day.contributionLevel] ?? 0,
            })),
        })),
    };
}
//# sourceMappingURL=contribution-graph.js.map