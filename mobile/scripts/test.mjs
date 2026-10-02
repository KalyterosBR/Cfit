import { mkdtempSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { spawnSync } from 'node:child_process';
const root = fileURLToPath(new URL('../', import.meta.url));
const output = mkdtempSync(join(tmpdir(), 'cfit-client-tests-'));
const compilation = spawnSync(process.execPath, [join(root, 'node_modules/typescript/bin/tsc'), 'src/services/client.ts', 'src/features/workouts/session.ts', '--outDir', output, '--module', 'commonjs', '--target', 'ES2022', '--skipLibCheck', '--ignoreConfig'], { cwd: root, stdio: 'inherit' });
if (compilation.status !== 0) process.exit(compilation.status || 1);
process.env.CFIT_TEST_CLIENT = pathToFileURL(join(output, 'services/client.js')).href;
await import('../tests/client.test.mjs');

process.env.CFIT_TEST_SESSION = pathToFileURL(join(output, 'features/workouts/session.js')).href;
await import('../tests/session.test.mjs');
