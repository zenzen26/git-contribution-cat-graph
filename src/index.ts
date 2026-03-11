#!/usr/bin/env node

import * as fs from "fs";
import * as path from "path";
import { fetchContributionGraph } from "../contribution-graph";
import { generateCatSVG, Theme } from "../cat-animator";

async function main() {
  const args = process.argv.slice(2);
  const getArg = (flag: string, defaultVal?: string): string | undefined => {
    const idx = args.indexOf(flag);
    if (idx !== -1 && args[idx + 1]) return args[idx + 1];
    return defaultVal;
  };

  const username = getArg("--username") ?? getArg("-u") ?? process.env.GITHUB_USER_NAME;
  const token = getArg("--token") ?? process.env.GITHUB_TOKEN;
  const theme = (getArg("--theme") ?? "github") as Theme;
  const output = getArg("--output") ?? "dist/cat-contribution-graph.svg";

  if (!username) {
    console.error("Error: --username is required (or set GITHUB_USER_NAME env var)");
    process.exit(1);
  }

  if (!token) {
    console.error("Error: --token is required (or set GITHUB_TOKEN env var)");
    process.exit(1);
  }

  console.log(`🐱 Fetching contribution data for ${username}...`);

  const graph = await fetchContributionGraph(username, token);

  console.log(`📊 Found ${graph.totalContributions} contributions across ${graph.weeks.length} weeks`);
  console.log(`🎨 Generating ${theme} themed SVG...`);

  const svg = generateCatSVG(graph, username, theme);

  const outDir = path.dirname(output);
  if (!fs.existsSync(outDir)) {
    fs.mkdirSync(outDir, { recursive: true });
  }

  fs.writeFileSync(output, svg, "utf-8");
  console.log(`✅ Saved to ${output}`);
}

main().catch(err => {
  console.error("Fatal error:", err);
  process.exit(1);
});
