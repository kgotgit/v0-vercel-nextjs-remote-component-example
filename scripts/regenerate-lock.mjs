import { execSync } from 'child_process';

console.log('Running pnpm install to regenerate lock file...');

try {
  execSync('pnpm install --lockfile-only', { 
    stdio: 'inherit',
    cwd: '/vercel/share/v0-project'
  });
  console.log('Lock file regenerated successfully!');
} catch (error) {
  console.error('Error regenerating lock file:', error.message);
  process.exit(1);
}
