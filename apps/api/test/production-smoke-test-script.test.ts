import fs from 'node:fs';
import path from 'node:path';

describe('production-smoke-test.sh', () => {
  const scriptPath = path.resolve(__dirname, '..', '..', '..', 'scripts', 'production-smoke-test.sh');

  it('uses bounded timeout checks for direct Fly health endpoints', () => {
    const script = fs.readFileSync(scriptPath, 'utf8');

    expect(script).toContain('curl --fail --show-error --silent --max-time 15 "${FLY_API_URL}/health"');
    expect(script).toContain('curl --fail --show-error --silent --max-time 15 "${FLY_API_URL}/api/health"');
  });
});
