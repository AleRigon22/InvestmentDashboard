import { execSync } from 'child_process';
import os from 'os';

const isWindows = os.platform() === 'win32';

try {
  if (isWindows) {
    execSync('xcopy shared dist\\shared /E /I /Y', { stdio: 'inherit' });
    execSync('xcopy dist\\public dist_public /E /I /Y', { stdio: 'inherit' });
  } else {
    execSync('cp -R shared dist/shared', { stdio: 'inherit' });
    execSync('cp -R dist/public dist_public', { stdio: 'inherit' });
  }
} catch (e) {
  console.error('Errore nel postbuild:', e);
  process.exit(1);
}
