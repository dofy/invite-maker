import { readFile, writeFile } from 'node:fs/promises';

const packageUrl = new URL('../package.json', import.meta.url);
const packageJson = JSON.parse(await readFile(packageUrl, 'utf8'));
const match = /^(\d+)\.(\d+)\.(\d+)$/.exec(packageJson.version);

if (!match) {
  throw new Error(`Expected a numeric semantic version, received ${packageJson.version}`);
}

const [, major, minor, patch] = match;
const currentPatch = Number(patch);
const nextPatch = currentPatch + (currentPatch % 2 === 0 ? 2 : 1);
const nextVersion = `${major}.${minor}.${nextPatch}`;

packageJson.version = nextVersion;
await writeFile(packageUrl, `${JSON.stringify(packageJson, null, 2)}\n`);

console.log(`Tsudoi deploy version: ${match[0]} -> ${nextVersion}`);
