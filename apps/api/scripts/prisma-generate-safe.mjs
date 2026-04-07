import { spawnSync } from 'node:child_process';

const args = ['generate', '--schema=prisma/schema.prisma', '--no-hints'];
const env = {
  ...process.env,
  PRISMA_ENGINES_CHECKSUM_IGNORE_MISSING:
    process.env.PRISMA_ENGINES_CHECKSUM_IGNORE_MISSING ?? '1',
};

const result = spawnSync('prisma', args, {
  stdio: 'pipe',
  encoding: 'utf8',
  env,
  shell: true,
});

if (result.stdout) {
  process.stdout.write(result.stdout);
}
if (result.stderr) {
  process.stderr.write(result.stderr);
}

const output = `${result.stdout ?? ''}\n${result.stderr ?? ''}`;
const isEngineDownloadIssue =
  output.includes('Failed to fetch the engine file') ||
  output.includes('Unable to download the query engine library') ||
  output.includes('ENOTFOUND') ||
  output.includes('EAI_AGAIN') ||
  output.includes('ECONNRESET') ||
  output.includes('403 Forbidden');

if (isEngineDownloadIssue) {
  console.warn(
    '[api prisma:generate] Prisma engine download unavailable. Skipping generate for offline compatibility.',
  );
  process.exit(0);
}

if (typeof result.status === 'number') {
  process.exit(result.status);
}

if (result.error) {
  throw result.error;
}

process.exit(1);
