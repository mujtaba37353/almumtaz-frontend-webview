/**
 * Smoke-check that critical Expo Router admin screens exist on disk.
 * Run: node scripts/uiRouteSmoke.js
 */
const fs = require('fs');
const path = require('path');

const adminDir = path.join(__dirname, '..', 'app', 'admin');
const required = [
  'accounts.tsx',
  'create-account.tsx',
  'stores.tsx',
  'products.tsx',
  'purchases.tsx',
  'warehouses.tsx',
  'finance.tsx',
  'vouchers.tsx',
  'sales.tsx',
  'business-settings.tsx',
  'zatca.tsx',
  '_layout.tsx',
  'main.tsx',
  'login.tsx', // not under admin — checked separately
];

const fails = [];

for (const file of required) {
  if (file === 'login.tsx') {
    const p = path.join(__dirname, '..', 'app', 'login.tsx');
    if (!fs.existsSync(p)) fails.push('app/login.tsx missing');
    continue;
  }
  const p = path.join(adminDir, file);
  if (!fs.existsSync(p)) fails.push(`app/admin/${file} missing`);
}

const layout = fs.readFileSync(path.join(adminDir, '_layout.tsx'), 'utf8');
if (!layout.includes('handleLogout') || !layout.includes('multiRemove')) {
  fails.push('admin/_layout.tsx logout does not clear AsyncStorage');
}
if (!layout.includes("router.replace('/login')")) {
  fails.push('admin/_layout.tsx logout should navigate to /login');
}

if (fails.length) {
  console.error('❌ UI route smoke FAILED');
  fails.forEach((f) => console.error(' -', f));
  process.exit(1);
}

console.log('✅ UI route smoke PASS');
console.log(`Checked ${required.length} routes + logout behavior`);
process.exit(0);
