import assert from 'assert';
import { calculateStorageStats } from '../backend/services/storageMonitor.js';

async function testQuotaRefresh() {
  console.log('Testing Quota Refresh System...');

  // 1. Initial calculation
  const stats1 = await calculateStorageStats(false);
  assert(stats1.timestamp, 'Stats must contain a timestamp');
  assert(stats1.mongodb, 'Stats must contain mongodb data');
  assert(stats1.cloudinary, 'Stats must contain cloudinary data');
  assert(stats1.brevo, 'Stats must contain brevo data');

  // 2. Unforced calculation within 30s should return cached stats with exact same timestamp
  await new Promise(r => setTimeout(r, 60));
  const stats2 = await calculateStorageStats(false);
  assert.strictEqual(stats2.timestamp, stats1.timestamp, 'Unforced calculation must return cached stats within 30s');

  // 3. Forced calculation must bypass cache and produce a fresh, newer timestamp
  await new Promise(r => setTimeout(r, 60));
  const stats3 = await calculateStorageStats(true);
  assert.notStrictEqual(stats3.timestamp, stats1.timestamp, 'Forced calculation must bypass cache and generate a new timestamp');
  assert(new Date(stats3.timestamp).getTime() > new Date(stats1.timestamp).getTime(), 'Forced timestamp must be newer than cached timestamp');

  console.log('✅ All Quota Refresh tests passed successfully!');
}

testQuotaRefresh().catch(err => {
  console.error('❌ Test failed:', err);
  process.exit(1);
});
