# 🐱🐟 git-contribution-cat-graph

> Turn your GitHub contribution graph into an animated cat eating fish!

A cat 🐱 roams your GitHub contribution grid one cell at a time, eating fish-shaped contribution dots. Two rats 🐹 wander the grid like Pac-Man ghosts — get too close and the cat goes 🙀. When all fish are eaten, the grid resets!

![Example](https://raw.githubusercontent.com/zenzen26/zenzen26/output/cat-contribution-graph.svg)

---

## Features

- 🐱 **Animated cat** — walks the grid eating fish, strictly one cell at a time (up/down/left/right)
- 🐟 **Fish-shaped contribution dots** — SVG fish replace the usual squares, colored by contribution level
- 🐹 **Two wandering rats** — random walkers on the grid like Pac-Man ghosts
- 🙀 **Scared cat** — switches to 🙀 when a rat lands on the same cell
- 🔁 **Auto-reset** — grid resets when all fish are eaten
- 🌙 **Light & dark theme** support
- ✅ **No install needed** — precompiled, just reference this repo in your workflow

---

## Usage

### Step 1 — Add the workflow to your profile repo (`USERNAME/USERNAME`)

Create `.github/workflows/cat-graph.yml`:

```yaml
name: Generate Cat Contribution Graph

on:
  schedule:
    - cron: "0 0 * * *"   # daily at midnight UTC
  workflow_dispatch:
  push:
    branches:
      - main

jobs:
  generate:
    permissions:
      contents: write
    runs-on: ubuntu-latest
    timeout-minutes: 5

    steps:
      - name: Generate cat-contribution-graph SVG
        uses: zenzen26/git-contribution-cat-graph@main
        with:
          github_user_name: ${{ github.repository_owner }}
          github_token: ${{ secrets.GITHUB_TOKEN }}

      - name: Push SVGs to output branch
        uses: crazy-max/ghaction-github-pages@v3.1.0
        with:
          target_branch: output
          build_dir: dist
        env:
          GITHUB_TOKEN: ${{ secrets.GITHUB_TOKEN }}
```

### Step 2 — Add to your profile `README.md`

Replace `[USERNAME]` with your GitHub username:

```html
<picture>
  <source media="(prefers-color-scheme: dark)"
    srcset="https://raw.githubusercontent.com/[USERNAME]/[USERNAME]/output/cat-contribution-graph-dark.svg">
  <source media="(prefers-color-scheme: light)"
    srcset="https://raw.githubusercontent.com/[USERNAME]/[USERNAME]/output/cat-contribution-graph.svg">
  <img alt="Cat contribution graph"
    src="https://raw.githubusercontent.com/[USERNAME]/[USERNAME]/output/cat-contribution-graph.svg">
</picture>
```

### Step 3 — Run the workflow

Go to **Actions → Generate Cat Contribution Graph → Run workflow** to trigger it manually the first time.

---

## Options

| Input | Description | Default |
|---|---|---|
| `github_user_name` | GitHub username | required |
| `github_token` | GitHub API token | `${{ github.token }}` |

---

## Development

```bash
# Requirements: Node.js 24+
npm install
npm run build        # compiles TypeScript + bundles to dist/index.js
node preview.js      # generates preview.html for local testing
```

The precompiled `dist/index.js` is committed so users don't need to install anything.

---

## Inspired by

- [abozanona/pacman-contribution-graph](https://github.com/abozanona/pacman-contribution-graph) 🟡👻
- [Platane/snk](https://github.com/Platane/snk) 🐍

---

_Made with 🐱 by [zenzen26](https://github.com/zenzen26)_
