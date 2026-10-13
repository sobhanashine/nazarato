import { execFileSync } from "node:child_process";

// Cloudflare Builds should track dev; never use this command on main.
const git = (...args) => execFileSync("git", args, { encoding: "utf8" }).trim();
const sha = git("rev-parse", "HEAD");
const branch = process.env.WORKERS_CI_BRANCH ?? git("branch", "--show-current");
if (branch !== "dev" || git("status", "--porcelain")) {
  throw new Error("Staging deployment requires a clean checkout of dev");
}
execFileSync("npm", ["run", "build:staging"], { stdio: "inherit" });
execFileSync("npx", [
  "wrangler", "deploy", "--env", "staging", "--var", `RELEASE_SHA:${sha}`,
], { stdio: "inherit" });
