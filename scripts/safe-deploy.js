const { spawnSync } = require('child_process');

const projectId = String(process.env.FIREBASE_PROJECT_ID || '').trim();
const forbidden = new Set(['carbon-web-1265b', 'YOUR_FIREBASE_PROJECT_ID', '']);

if (forbidden.has(projectId)) {
  console.error('❌ DEPLOY DURDURULDU: FIREBASE_PROJECT_ID Belgin projesine ait doğrulanmış proje kimliği olmalıdır.');
  process.exit(1);
}

const only = process.argv[2];
if (only && !['hosting', 'functions'].includes(only)) {
  console.error(`❌ Geçersiz deploy hedefi: ${only}`);
  process.exit(1);
}

let result = spawnSync('npm', ['run', 'ci'], { stdio: 'inherit', shell: process.platform === 'win32' });
if (result.status !== 0) process.exit(result.status || 1);

const args = ['deploy', '--project', projectId];
if (only) args.push('--only', only);

result = spawnSync('firebase', args, { stdio: 'inherit', shell: process.platform === 'win32' });
if (result.error) {
  console.error('❌ Firebase CLI çalıştırılamadı. Önce firebase-tools kurulumunu doğrulayın.');
  console.error(result.error.message);
  process.exit(1);
}
process.exit(result.status || 0);
