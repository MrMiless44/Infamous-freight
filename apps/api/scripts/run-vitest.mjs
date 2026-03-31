#!/usr/bin/env node
import { spawnSync } from 'node:child_process';

const forwardedArgs = process.argv.slice(2);
const sanitizedArgs = [];
let forceSingleWorker = false;

for (const arg of forwardedArgs) {
  if (arg === '--runInBand') {
    forceSingleWorker = true;
    continue;
  }

  sanitizedArgs.push(arg);
}

const vitestArgs = ['run'];

if (forceSingleWorker && !sanitizedArgs.some((arg) => arg.startsWith('--maxWorkers'))) {
  vitestArgs.push('--maxWorkers=1');
}

vitestArgs.push(...sanitizedArgs);

const result = spawnSync('vitest', vitestArgs, { stdio: 'inherit', shell: true });

if (result.error) {
  console.error('Failed to run vitest:', result.error.message || result.error);
  if ('code' in result.error && result.error.code) {
    console.error('Error code:', result.error.code);
  }
  process.exit(1);
}

if (result.signal) {
  console.error(`Vitest process was terminated by signal: ${result.signal}`);
  process.exit(1);
}

if (typeof result.status === 'number') {
  process.exit(result.status);
}

console.error('Vitest process exited with unknown status; defaulting to exit code 1.');
process.exit(1);
