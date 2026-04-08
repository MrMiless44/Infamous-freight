#!/usr/bin/env node
import { spawnSync } from 'node:child_process';

const forwardedArgs = process.argv.slice(2);
const sanitizedArgs = [];
let forceSingleWorker = false;

for (const arg of forwardedArgs) {
  if (arg === '--') {
    continue;
  }

  if (arg === '--runInBand') {
    forceSingleWorker = true;
    continue;
  }

  sanitizedArgs.push(arg);
}

const defaultPatterns = [
  'src/**/*.test.ts',
  'src/**/*.spec.ts',
  'src/**/__tests__/**/*.test.ts',
];

const hasExplicitFileFilter = sanitizedArgs.some((arg) => !arg.startsWith('-'));
const vitestArgs = ['run', '--passWithNoTests'];

if (!hasExplicitFileFilter) {
  vitestArgs.push(...defaultPatterns);
}

if (forceSingleWorker && !sanitizedArgs.some((arg) => arg.startsWith('--maxWorkers'))) {
  vitestArgs.push('--maxWorkers=1');
}

vitestArgs.push(...sanitizedArgs);

const result = spawnSync('vitest', vitestArgs, { stdio: 'inherit', shell: true });

if (typeof result.status === 'number') {
  process.exit(result.status);
}

process.exit(1);
