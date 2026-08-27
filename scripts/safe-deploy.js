const fs = require('fs');
const path = require('path');
const { spawnSync } = require('child_process');

const VERIFIED_PROJECT_ID = 'carbon-web-1265b';
const VERIFIED_HOSTING_SITE = 'belgin';
const projectId = String(process.env.FIREBASE_PROJECT_ID || '').trim();
const only = process.argv[2];

if (projectId !== VERIFIED_PROJECT_ID) {
  console.error(`❌ DEPLOY DURDURULDU: FIREBASE_PROJECT_ID yalnızca doğrulanmış proje olmalıdır: ${VERIFIED_PROJECT_ID}`);
  process.exit(1);
}

if (!only || !['hosting', 'functions'].includes(only)) {
  console.error('❌ DEPLOY DURDURULDU: Hedef açıkça hosting veya functions olmalıdır. Tam proje deployu yasaktır.');
  process.exit(1);
}

const firebasePath = path.join(__dirname, '..', 'firebase.json');
const firebaseConfig = JSON.parse(fs.readFileSync(firebasePath, 'utf8'));
if (firebaseConfig.hosting?.site !== VERIFIED_HOSTING_SITE) {
  console.error(`❌ DEPLOY DURDURULDU: firebase.json hosting.site "${VERIFIED_HOSTING_SITE}" olmalıdır.`);
  process.exit(1);
}

let result = spawnSync('npm', ['run', 'ci'], {
  stdio: 'inherit',
  shell: process.platform === 'win32',
});
if (result.status !== 0) process.exit(result.status || 1);

const args = ['deploy', '--project', projectId, '--only', only, '--force'];
result = spawnSync('firebase', args, {
  stdio: 'inherit',
  shell: process.platform === 'win32',
});

if (result.error) {
  console.error('❌ Firebase CLI çalıştırılamadı. Önce firebase-tools kurulumunu doğrulayın.');
  console.error(result.error.message);
  process.exit(1);
}

process.exit(result.status || 0);
