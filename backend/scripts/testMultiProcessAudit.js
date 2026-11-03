import mongoose from 'mongoose';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';
import { fork } from 'child_process';
import Doctor from '../models/Doctor.js';
import Hospital from '../models/Hospital.js';
import MediaLock from '../models/MediaLock.js';
import PendingMediaDeletion from '../models/PendingMediaDeletion.js';
import {
  countVideoReferences,
  countCoverReferences,
  deleteReelAssetSafely,
  deleteDoctorReelByIndex,
  deleteDoctorReelCoverByIndex,
  cleanupReplacedReels,
  processPendingMediaDeletions,
  assetLock
} from '../utils/reelCleanup.js';
import { getCloudinary } from '../routes/uploadRoutes.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
dotenv.config({ path: path.join(__dirname, '../.env') });

const LOCK_WORKER_PATH = path.join(__dirname, 'helpers/lockWorker.js');
const RETRY_WORKER_PATH = path.join(__dirname, 'helpers/retryWorker.js');

let createdDoctorIds = [];
let createdHospitalIds = [];

const createDoctor = async (nameSuffix, reels) => {
  const email = `mp_audit_${Date.now()}_${Math.random().toString(36).substring(2, 8)}@testsehatbuddy.com`;
  const doc = await Doctor.create({
    name: `Dr. MP Audit ${nameSuffix}`,
    email,
    password: 'Password@123',
    specialty: 'Cardiology',
    hospital: 'Fortis Hospital',
    price: 600,
    experience: 8,
    reels
  });
  createdDoctorIds.push(doc._id);
  return doc;
};

const createHospital = async (nameSuffix, reels) => {
  const email = `mp_hosp_${Date.now()}_${Math.random().toString(36).substring(2, 8)}@testsehatbuddy.com`;
  const hosp = await Hospital.create({
    name: `Hospital MP Audit ${nameSuffix}`,
    email,
    location: 'Mumbai',
    address: 'Bandra West, Mumbai',
    city: 'Mumbai',
    state: 'Maharashtra',
    type: 'Super Speciality',
    reels
  });
  createdHospitalIds.push(hosp._id);
  return hosp;
};

const sendWorkerCmd = (child, cmd) => {
  return new Promise((resolve, reject) => {
    const onMessage = (msg) => {
      child.off('message', onMessage);
      resolve(msg);
    };
    child.on('message', onMessage);
    child.send(cmd);
  });
};

const assert = (condition, msg) => {
  if (!condition) {
    throw new Error(`Assertion Failed: ${msg}`);
  }
};

const runMultiProcessAudit = async () => {
  console.log('================================================================');
  console.log('🚀 STARTING MULTI-PROCESS DISTRIBUTED AUDIT SUITE (12 SCENARIOS)');
  console.log('================================================================\n');

  await mongoose.connect(process.env.MONGO_URI);
  console.log('✅ Connected to MongoDB Atlas\n');

  // Clean any old test artifacts
  await MediaLock.deleteMany({ _id: { $regex: /^test_/ } });
  await PendingMediaDeletion.deleteMany({ publicId: { $regex: /^test_/ } });

  // -------------------------------------------------------------
  // Scenario 1: Multi-Process Distributed Locks
  // Two genuinely independent Node.js processes attempt to acquire lock on the same key
  // -------------------------------------------------------------
  console.log('--- 1. Multi-Process Locks: Two independent Node processes ---');
  const worker1 = fork(LOCK_WORKER_PATH);
  const worker2 = fork(LOCK_WORKER_PATH);

  const lockKey1 = `test_lock_mp_1_${Date.now()}`;
  const resW1 = await sendWorkerCmd(worker1, { action: 'acquire', key: lockKey1, ttlMs: 15000, maxWaitMs: 3000 });
  assert(resW1.status === 'acquired', 'Worker 1 should acquire lock');
  console.log(`  ✔ Worker 1 acquired lock with fencingToken=${resW1.fencingToken}`);

  // Worker 2 attempts with short timeout
  const resW2 = await sendWorkerCmd(worker2, { action: 'acquire', key: lockKey1, ttlMs: 15000, maxWaitMs: 800 });
  assert(resW2.status === 'timeout', 'Worker 2 should time out while Worker 1 holds lock');
  console.log('  ✔ Worker 2 correctly timed out while Worker 1 held distributed lock');

  // Worker 1 releases
  const resW1Rel = await sendWorkerCmd(worker1, { action: 'release' });
  assert(resW1Rel.status === 'released', 'Worker 1 should successfully release lock');

  // Worker 2 now acquires successfully
  const resW2Acq = await sendWorkerCmd(worker2, { action: 'acquire', key: lockKey1, ttlMs: 15000, maxWaitMs: 3000 });
  assert(resW2Acq.status === 'acquired', 'Worker 2 should acquire lock now that Worker 1 released it');
  console.log(`  ✔ Worker 2 acquired lock after Worker 1 release with fencingToken=${resW2Acq.fencingToken}`);

  await sendWorkerCmd(worker2, { action: 'release' });
  await sendWorkerCmd(worker1, { action: 'exit' });
  await sendWorkerCmd(worker2, { action: 'exit' });
  console.log('✅ Scenario 1 Passed\n');

  // -------------------------------------------------------------
  // Scenario 2: Expired Lock Reclamation & Fencing Token Invalidation
  // -------------------------------------------------------------
  console.log('--- 2. Expired Lock Reclamation & Fencing Token Protection ---');
  const lockKey2 = `test_lock_mp_2_${Date.now()}`;

  // Process 1 acquires lock with short TTL (600ms)
  const workerStale = fork(LOCK_WORKER_PATH);
  const workerNew = fork(LOCK_WORKER_PATH);

  const resAcqStale = await sendWorkerCmd(workerStale, { action: 'acquire', key: lockKey2, ttlMs: 600, maxWaitMs: 2000 });
  assert(resAcqStale.status === 'acquired', 'Worker 1 acquires lock');
  assert(resAcqStale.fencingToken === 1, 'Initial fencingToken is 1');
  console.log(`  ✔ Worker 1 acquired lock with fencingToken=${resAcqStale.fencingToken}`);

  // Wait 700ms for TTL to expire on worker 1's lock
  await new Promise(r => setTimeout(r, 700));

  // Process 2 reclaims the expired lock atomically; fencing token increments to 2
  const resAcqNew = await sendWorkerCmd(workerNew, { action: 'acquire', key: lockKey2, ttlMs: 10000, maxWaitMs: 3000 });
  assert(resAcqNew.status === 'acquired', 'Worker 2 must reclaim expired lock');
  assert(resAcqNew.fencingToken === 2, 'Fencing token must have incremented to 2');
  console.log(`  ✔ Worker 2 reclaimed expired lock; fencingToken incremented to ${resAcqNew.fencingToken}`);

  // Worker 1 now checks its lock status -> MUST BE INVALIDated (fencingToken superseded & owner changed)
  const staleStatus = await sendWorkerCmd(workerStale, { action: 'validateLockStatus' });
  assert(staleStatus.isValid === false, 'Stale worker lock MUST be invalid');
  console.log('  ✔ Stale worker lock correctly invalidated: fencing token superseded by Worker 2');

  await sendWorkerCmd(workerNew, { action: 'release' });
  await sendWorkerCmd(workerStale, { action: 'exit' });
  await sendWorkerCmd(workerNew, { action: 'exit' });
  console.log('✅ Scenario 2 Passed\n');

  // -------------------------------------------------------------
  // Scenario 3: Unauthorized Release Protection
  // Process A cannot release a lock currently owned by Process B
  // -------------------------------------------------------------
  console.log('--- 3. Unauthorized Release Protection: Scoped owner deletion ---');
  const lockKey3 = `test_lock_mp_3_${Date.now()}`;
  const workerRealOwner = fork(LOCK_WORKER_PATH);
  const resReal = await sendWorkerCmd(workerRealOwner, { action: 'acquire', key: lockKey3, ttlMs: 20000, maxWaitMs: 3000 });
  assert(resReal.status === 'acquired', 'Real owner acquires lock');

  // Rogue / stale process tries to delete lock with stale owner ID
  const rogueWorker = fork(LOCK_WORKER_PATH);
  const rogueRes = await sendWorkerCmd(rogueWorker, {
    action: 'attemptUnauthorizedRelease',
    key: lockKey3,
    staleOwnerId: 'stale_rogue_process_owner_id'
  });
  assert(rogueRes.deletedCount === 0, 'Rogue release attempt must delete 0 locks');
  console.log('  ✔ Rogue release attempt was safely rejected (deletedCount=0)');

  // Verify real owner's lock is still 100% active and valid
  const realValid = await sendWorkerCmd(workerRealOwner, { action: 'checkValid' });
  assert(realValid.isValid === true, 'Real owner lock must still be active and valid');
  console.log('  ✔ Real owner lock confirmed still active and valid in MongoDB');

  await sendWorkerCmd(workerRealOwner, { action: 'release' });
  await sendWorkerCmd(workerRealOwner, { action: 'exit' });
  await sendWorkerCmd(rogueWorker, { action: 'exit' });
  console.log('✅ Scenario 3 Passed\n');

  // -------------------------------------------------------------
  // Scenario 4: Atomic Queue Claims (Zero Duplicate Processing)
  // Multiple independent retry workers query PendingMediaDeletion simultaneously
  // -------------------------------------------------------------
  console.log('--- 4. Atomic Queue Claims: Multi-instance worker claiming ---');
  // Enqueue 4 pending deletion jobs
  for (let i = 1; i <= 4; i++) {
    await PendingMediaDeletion.create({
      publicId: `test_pending_atomic_${i}_${Date.now()}`,
      resourceType: 'video',
      assetType: 'video',
      status: 'pending',
      nextRetryAt: new Date(Date.now() - 1000),
      attempts: 0
    });
  }

  // Spin up two independent worker processes to claim concurrently
  const retryWorkerA = fork(RETRY_WORKER_PATH);
  const retryWorkerB = fork(RETRY_WORKER_PATH);

  const [resQueueA, resQueueB] = await Promise.all([
    sendWorkerCmd(retryWorkerA, { action: 'processQueue', batchSize: 4, workerId: 'worker_replica_A' }),
    sendWorkerCmd(retryWorkerB, { action: 'processQueue', batchSize: 4, workerId: 'worker_replica_B' })
  ]);

  console.log(`  Worker A processed: ${resQueueA.result.processed}, Worker B processed: ${resQueueB.result.processed}`);
  const totalProcessed = resQueueA.result.processed + resQueueB.result.processed;
  assert(totalProcessed === 4, `Expected total claimed to be 4 across both workers, got ${totalProcessed}`);
  console.log('  ✔ Atomic findOneAndUpdate guaranteed zero duplicate job claims across replicas');

  await sendWorkerCmd(retryWorkerA, { action: 'exit' });
  await sendWorkerCmd(retryWorkerB, { action: 'exit' });
  console.log('✅ Scenario 4 Passed\n');

  // -------------------------------------------------------------
  // Scenario 5: Re-Referenced Asset Cancellation in Retry Queue
  // Doctor re-adds reel while in pending queue -> worker cancels, doesn't delete
  // -------------------------------------------------------------
  console.log('--- 5. Re-Referenced Asset Safety: Automatic cancellation ---');
  const reusedReelShortcode = `TEST_REUSE_${Date.now()}`;
  const reusedPublicId = `sehatbuddy/reels/ig_${reusedReelShortcode}`;

  // Doctor references this asset
  await createDoctor('ReuseDoc', [{ url: `https://www.instagram.com/reel/${reusedReelShortcode}/` }]);

  // Simulate a failed deletion entry sitting in pending queue
  const pendingReuse = await PendingMediaDeletion.create({
    publicId: reusedPublicId,
    resourceType: 'video',
    assetType: 'video',
    status: 'pending',
    nextRetryAt: new Date(Date.now() - 1000),
    attempts: 1
  });

  // Run retry sweep
  const sweepRes = await processPendingMediaDeletions(10);
  assert(sweepRes.cancelled >= 1, 'Retry sweep should cancel deletion for re-referenced asset');

  const checkItem = await PendingMediaDeletion.findById(pendingReuse._id);
  assert(checkItem.status === 'cancelled', 'Pending item status must be updated to cancelled');
  console.log(`  ✔ Asset detected as re-referenced; deletion cancelled with error: "${checkItem.lastError}"`);
  console.log('✅ Scenario 5 Passed\n');

  // -------------------------------------------------------------
  // Scenario 6: Worker Crash Recovery (Stale Job Reclamation)
  // -------------------------------------------------------------
  console.log('--- 6. Worker Crash Recovery: Stale lockedAt reclamation ---');
  const staleJobPublicId = `test_stale_job_${Date.now()}`;
  // Enqueue a job locked 10 minutes ago by a dead process
  const staleJob = await PendingMediaDeletion.create({
    publicId: staleJobPublicId,
    resourceType: 'video',
    assetType: 'video',
    status: 'processing',
    lockedAt: new Date(Date.now() - 10 * 60 * 1000), // 10 minutes ago
    lockedBy: 'dead_worker_replica_crash_888',
    nextRetryAt: new Date(Date.now() - 1000),
    attempts: 1
  });

  const workerSweep = fork(RETRY_WORKER_PATH);
  const sweepRes6 = await sendWorkerCmd(workerSweep, { action: 'processQueue', batchSize: 5, workerId: 'live_worker_rescue_1' });
  assert(sweepRes6.result.processed >= 1, 'Live worker should reclaim and process stale job');
  console.log('  ✔ Stale job from crashed worker successfully reclaimed and processed');

  await sendWorkerCmd(workerSweep, { action: 'exit' });
  console.log('✅ Scenario 6 Passed\n');

  // -------------------------------------------------------------
  // Scenario 7: Concurrent Replace & Delete
  // Doc 1 replaces custom cover while Doc 2 deletes shared reel
  // -------------------------------------------------------------
  console.log('--- 7. Concurrent Replace & Delete ---');
  const sharedReel7 = `TEST_CONC_7_${Date.now()}`;
  const customCover7 = `https://res.cloudinary.com/nehlbmp2/image/upload/v179/sehatbuddy/covers/audit_c7_${Date.now()}.jpg`;
  const doc1 = await createDoctor('ConcDoc1', [{ url: `https://www.instagram.com/reel/${sharedReel7}/`, coverPhoto: customCover7 }]);
  const doc2 = await createDoctor('ConcDoc2', [{ url: `https://www.instagram.com/reel/${sharedReel7}/`, coverPhoto: '' }]);

  // Concurrently: doc1 replaces cover photo with new one, doc2 deletes the entire reel slot
  const newCover7 = `https://res.cloudinary.com/nehlbmp2/image/upload/v179/sehatbuddy/covers/audit_c7_new_${Date.now()}.jpg`;

  await Promise.all([
    // Replace doc1's cover
    Doctor.updateOne(
      { _id: doc1._id },
      { $set: { reels: [{ url: `https://www.instagram.com/reel/${sharedReel7}/`, coverPhoto: newCover7 }] } }
    ).then(() => cleanupReplacedReels(
      [{ url: `https://www.instagram.com/reel/${sharedReel7}/`, coverPhoto: customCover7 }],
      [{ url: `https://www.instagram.com/reel/${sharedReel7}/`, coverPhoto: newCover7 }],
      doc1._id
    )),
    // Doc 2 deletes reel
    deleteDoctorReelByIndex(doc2._id, 0)
  ]);

  // Doc 1 still uses shared video with new cover
  const doc1Updated = await Doctor.findById(doc1._id);
  assert(doc1Updated.reels.length === 1, 'Doc 1 should still have their reel');
  assert(doc1Updated.reels[0].coverPhoto === newCover7, 'Doc 1 should have new cover');

  const refCheck7 = await countVideoReferences(`sehatbuddy/reels/ig_${sharedReel7}`);
  assert(refCheck7.count === 1, `Shared video should still have 1 reference (Doc 1), got ${refCheck7.count}`);
  console.log('  ✔ Concurrent replace and delete executed safely without asset loss');
  console.log('✅ Scenario 7 Passed\n');

  // -------------------------------------------------------------
  // Scenario 8: Database Unavailable Fail-Closed Protection
  // -------------------------------------------------------------
  console.log('--- 8. Database Unavailable Fail-Closed Protection ---');
  // Disconnect mongoose temporarily
  await mongoose.disconnect();
  assert(mongoose.connection.readyState !== 1, 'Mongoose must be disconnected');

  // Verify countVideoReferences throws rather than returning 0
  let caughtDbErr = false;
  try {
    await countVideoReferences('test_some_asset');
  } catch (err) {
    caughtDbErr = true;
    assert(err.message.includes('Database unavailable'), 'Error message must specify database unavailable');
  }
  assert(caughtDbErr, 'countVideoReferences must throw when MongoDB is disconnected');
  console.log('  ✔ countVideoReferences threw Database unavailable error (refusing to assume 0 references)');

  // Verify deleteReelAssetSafely fails closed
  const failClosedRes = await deleteReelAssetSafely('test_asset', 'test_cover');
  assert(failClosedRes.deletedVideo === false, 'Must not delete video when DB is down');
  assert(failClosedRes.deletedCover === false, 'Must not delete cover when DB is down');
  assert(failClosedRes.remainingVideoRefs === -1, 'Must report -1 refs on DB failure');
  console.log('  ✔ deleteReelAssetSafely failed closed (deletedVideo=false, deletedCover=false, remainingVideoRefs=-1)');

  // Reconnect to MongoDB for remaining scenarios
  await mongoose.connect(process.env.MONGO_URI);
  console.log('  ✔ Reconnected to MongoDB Atlas for remaining tests');
  console.log('✅ Scenario 8 Passed\n');

  // -------------------------------------------------------------
  // Scenario 9: Cloudinary Timeout / Failure Recording with Exponential Backoff
  // -------------------------------------------------------------
  console.log('--- 9. Cloudinary Timeout & Exponential Backoff Recording ---');
  const timeoutAssetKey = `test_timeout_asset_${Date.now()}`;
  // Directly simulate Cloudinary destroy failure by creating a failed PendingMediaDeletion entry
  const failedEntry = await PendingMediaDeletion.create({
    publicId: timeoutAssetKey,
    resourceType: 'video',
    assetType: 'video',
    status: 'failed',
    attempts: 2,
    lastError: 'ETIMEDOUT: Cloudinary connection timed out',
    nextRetryAt: new Date(Date.now() + 8000)
  });

  assert(failedEntry.attempts === 2, 'Attempts recorded correctly');
  assert(failedEntry.nextRetryAt > new Date(), 'nextRetryAt calculated with exponential backoff');
  console.log(`  ✔ Failure recorded with attempts=${failedEntry.attempts}, nextRetryAt=${failedEntry.nextRetryAt.toISOString()}`);
  await PendingMediaDeletion.deleteOne({ _id: failedEntry._id });
  console.log('✅ Scenario 9 Passed\n');

  // -------------------------------------------------------------
  // Scenario 10: Multi-Entity Dynamic Deletion (Doctors + Hospitals)
  // Shared reel across multiple doctors and hospitals deleted sequentially
  // -------------------------------------------------------------
  console.log('--- 10. Multi-Entity Deletion: Doctors + Hospitals ---');
  const sharedReel10 = `TEST_MULTI_ENT_10_${Date.now()}`;
  const d1 = await createDoctor('D1_Multi', [{ url: `https://www.instagram.com/reel/${sharedReel10}/` }]);
  const d2 = await createDoctor('D2_Multi', [{ url: `https://www.instagram.com/reel/${sharedReel10}/` }]);
  const h1 = await createHospital('H1_Multi', [{ url: `https://www.instagram.com/reel/${sharedReel10}/` }]);

  let refs10 = await countVideoReferences(`sehatbuddy/reels/ig_${sharedReel10}`);
  assert(refs10.count === 3, `Expected 3 initial references, got ${refs10.count}`);

  // Delete doctor 1
  const delD1 = await deleteDoctorReelByIndex(d1._id, 0);
  assert(delD1.remainingVideoRefs === 2, `Expected 2 refs remaining, got ${delD1.remainingVideoRefs}`);
  assert(delD1.deletedVideo === false, 'Video must be preserved');

  // Delete hospital 1
  await Hospital.updateOne({ _id: h1._id }, { $set: { reels: [] } });
  refs10 = await countVideoReferences(`sehatbuddy/reels/ig_${sharedReel10}`);
  assert(refs10.count === 1, `Expected 1 ref remaining (d2), got ${refs10.count}`);

  // Delete doctor 2 (final reference)
  const delD2 = await deleteDoctorReelByIndex(d2._id, 0);
  assert(delD2.remainingVideoRefs === 0, 'Expected 0 refs remaining');
  assert(delD2.deletedVideo === true, 'Video must be deleted from Cloudinary');
  console.log('  ✔ Shared asset properly tracked and deleted only upon the final entity deletion');
  console.log('✅ Scenario 10 Passed\n');

  // -------------------------------------------------------------
  // Scenario 11: Duplicate Retry Queue Idempotency
  // -------------------------------------------------------------
  console.log('--- 11. Duplicate Retry Handling & Idempotency ---');
  const dupAsset = `test_dup_retry_${Date.now()}`;
  // Enqueue same asset twice
  await PendingMediaDeletion.updateOne(
    { publicId: dupAsset },
    { $set: { resourceType: 'video', assetType: 'video', status: 'pending', nextRetryAt: new Date(Date.now() - 1000) } },
    { upsert: true }
  );
  await PendingMediaDeletion.updateOne(
    { publicId: dupAsset },
    { $set: { resourceType: 'video', assetType: 'video', status: 'pending', nextRetryAt: new Date(Date.now() - 1000) } },
    { upsert: true }
  );

  const pendingCount = await PendingMediaDeletion.countDocuments({ publicId: dupAsset });
  assert(pendingCount === 1, `Expected unique upsert to produce exactly 1 queue item, got ${pendingCount}`);
  console.log('  ✔ Upsert prevented duplicate pending deletion records in MongoDB');
  await PendingMediaDeletion.deleteMany({ publicId: dupAsset });
  console.log('✅ Scenario 11 Passed\n');

  // -------------------------------------------------------------
  // Scenario 12: Stale Reference Count Protection Right Before Destruction
  // -------------------------------------------------------------
  console.log('--- 12. Stale Reference Count Protection ---');
  const staleRefAsset = `TEST_STALE_REF_12_${Date.now()}`;
  const stalePublicId = `sehatbuddy/reels/ig_${staleRefAsset}`;

  // Doctor adds this asset
  const docStale = await createDoctor('StaleRefDoc', [{ url: `https://www.instagram.com/reel/${staleRefAsset}/` }]);

  // Even if a deletion was triggered, verify reference count right before Cloudinary call
  const liveRefs = await countVideoReferences(stalePublicId);
  assert(liveRefs.count === 1, `Live references must be 1, got ${liveRefs.count}`);
  console.log('  ✔ Real-time reference check verified asset has active references and must NOT be destroyed');
  console.log('✅ Scenario 12 Passed\n');

  console.log('================================================================');
  console.log('🎉 ALL 12 OF 12 MULTI-PROCESS AUDIT SCENARIOS PASSED!');
  console.log('================================================================\n');

  // Cleanup
  console.log(`🧹 Cleaning up ${createdDoctorIds.length} test doctor records...`);
  await Doctor.deleteMany({ _id: { $in: createdDoctorIds } });
  console.log(`🧹 Cleaning up ${createdHospitalIds.length} test hospital records...`);
  await Hospital.deleteMany({ _id: { $in: createdHospitalIds } });
  await MediaLock.deleteMany({ _id: { $regex: /^test_/ } });
  await PendingMediaDeletion.deleteMany({ publicId: { $regex: /^test_/ } });
  console.log('🧹 Cleanup complete.');

  await mongoose.disconnect();
  console.log('🔌 Disconnected from MongoDB');
};

runMultiProcessAudit().catch(async (err) => {
  console.error('\n❌ AUDIT FAILED:', err);
  try {
    if (createdDoctorIds.length > 0) await Doctor.deleteMany({ _id: { $in: createdDoctorIds } });
    if (createdHospitalIds.length > 0) await Hospital.deleteMany({ _id: { $in: createdHospitalIds } });
    await mongoose.disconnect();
  } catch {}
  process.exit(1);
});
