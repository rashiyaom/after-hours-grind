import dotenv from "dotenv";
import path from "node:path";
import { spawnSync } from "node:child_process";
import { fileURLToPath } from "node:url";

const scriptDir = path.dirname(fileURLToPath(import.meta.url));
const backendRoot = path.resolve(scriptDir, "..");

dotenv.config({ path: path.resolve(backendRoot, ".env") });

const prismaBin = process.platform === "win32"
  ? path.resolve(backendRoot, "node_modules", ".bin", "prisma.cmd")
  : path.resolve(backendRoot, "node_modules", ".bin", "prisma");

const result = spawnSync(prismaBin, process.argv.slice(2), {
  cwd: backendRoot,
  stdio: "inherit",
  env: process.env,
});

if (result.error) {
  throw result.error;
}

process.exit(result.status ?? 1);