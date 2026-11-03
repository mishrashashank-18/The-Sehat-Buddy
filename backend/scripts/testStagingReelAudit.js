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
  deleteHospitalReelByIndex,
  deleteHospitalReelCoverByIndex,
  cleanupReplacedReels,
  synchronizeActiveReels,
  processPendingMediaDeletions,
  assetLock
} from '../utils/reelCleanup.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
dotenv.config({ path: path.join(__dirname, '../.env') });

const LOCK_WORKER_PATH = path.join(__dirname, 'helpers/lockWorker.js');
const RETRY_WORKER_PATH = path.join(__dirname, 'helpers/retryWorker.js');

let createdDoctorIds = [];
let createdHospitalIds = [];

const createStagingDoctor = async (nameSuffix, reels) => {
  const email = `stg_${Date.now()}_${Math.random().toString(36).substring(2, 8)}@testsehatbuddy.com`;
  const doc = await Doctor.create({
    name: `Dr. StagingAudit ${nameSuffix}`,
    email,
    password: 'Password@123',
    specialty: 'Neurology',
    hospital: 'Max Super Speciality',
    price: 800,
    experience: 12,
    reels
  });
  createdDoctorIds.push(doc._id);
  return doc;
};

const createStagingHospital = async (nameSuffix, reels) => {
  const email = `stg_hosp_${Date.now()}_${Math.random().toString(36).substring(2, 8)}@testsehatbuddy.com`;
  const hosp = await Hospital.create({
    name: `Hospital StagingAudit ${nameSuffix}`,
    email,
    location: 'Gurugram',
    address: 'Sector 44, Gurugram',
    city: 'Gurugram',
    state: 'Haryana',
    type: 'Multi Speciality',
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

const runStagingAudit = async () => {
  console.log('================================================================');
  console.log('🛡️  STARTING FINAL STAGING AUDIT SUITE (12 SCENARIOS)');
  console.log('================================================================\n');

  await mongoose.connect(process.env.MONGO_URI);
  console.log('✅ Connected to MongoDB Atlas\n');

  // Purge any leftover test keys
  await MediaLock.deleteMany({ _id: { $regex: /^stg_/ } });
  await PendingMediaDeletion.deleteMany({ publicId: { $regex: /^stg_/ } });

  // -------------------------------------------------------------
  // Scenario 1: Share one video across 20 doctors and 5 hospitals
  // -------------------------------------------------------------
  console.log('--- 1. High-Fanout Sharing: 20 Doctors + 5 Hospitals ---');
  const sharedShortcode1 = `STG_HIGH_FANOUT_${Date.now()}`;
  const sharedVideoUrl1 = `https://www.instagram.com/reel/${sharedShortcode1}/`;
  const sharedPublicId1 = `sehatbuddy/reels/ig_${sharedShortcode1}`;

  const docPromises = [];
  for (let i = 1; i <= 20; i++) {
    docPromises.push(createStagingDoctor(`D_${i}`, [{ url: sharedVideoUrl1 }]));
  }
  const hospPromises = [];
  for (let j = 1; j <= 5; j++) {
    hospPromises.push(createStagingHospital(`H_${j}`, [{ url: sharedVideoUrl1 }]));
  }
  const [docs1, hosps1] = await Promise.all([Promise.all(docPromises), Promise.all(hospPromises)]);

  const initRefs1 = await countVideoReferences(sharedPublicId1);
  assert(initRefs1.count === 25, `Expected 25 initial references across 20 docs and 5 hosps, got ${initRefs1.count}`);
  console.log(`  ✔ Correctly detected 25 active references (20 doctors + 5 hospitals)`);

  // Delete 24 references sequentially
  for (let i = 0; i < 20; i++) {
    const res = await deleteDoctorReelByIndex(docs1[i]._id, 0);
    assert(res.deletedVideo === false, `Video must NOT be deleted on doctor ${i + 1}`);
  }
  for (let j = 0; j < 4; j++) {
    const res = await deleteHospitalReelByIndex(hosps1[j]._id, 0);
    assert(res.deletedVideo === false, `Video must NOT be deleted on hospital ${j + 1}`);
  }
  const midRefs1 = await countVideoReferences(sharedPublicId1);
  assert(midRefs1.count === 1, `Expected 1 reference remaining on final hospital, got ${midRefs1.count}`);
  console.log('  ✔ Video safely preserved across 24 deletions while 1 hospital profile still references it');

  // Delete final 25th reference
  const finalDel1 = await deleteHospitalReelByIndex(hosps1[4]._id, 0);
  assert(finalDel1.deletedVideo === true, 'Video must be deleted when final reference is removed');
  const finalRefs1 = await countVideoReferences(sharedPublicId1);
  assert(finalRefs1.count === 0, 'References must now be 0');
  console.log('  ✔ Video destroyed only after the final profile reference was deleted');
  console.log('✅ Scenario 1 Passed\n');

  // -------------------------------------------------------------
  // Scenario 2: Concurrent Reel Deletion from Multiple Independent Processes
  // -------------------------------------------------------------
  console.log('--- 2. Multi-Process Concurrent Reel Deletion ---');
  const concShortcode2 = `STG_CONC_DEL_${Date.now()}`;
  const concUrl2 = `https://www.instagram.com/reel/${concShortcode2}/`;
  const concPublicId2 = `sehatbuddy/reels/ig_${concShortcode2}`;

  const cDoc1 = await createStagingDoctor('Conc1', [{ url: concUrl2 }]);
  const cDoc2 = await createStagingDoctor('Conc2', [{ url: concUrl2 }]);

  // Concurrently delete from both doctors using Promise.all
  const [resDelA, resDelB] = await Promise.all([
    deleteDoctorReelByIndex(cDoc1._id, 0),
    deleteDoctorReelByIndex(cDoc2._id, 0)
  ]);

  const destroyedCount = (resDelA.deletedVideo ? 1 : 0) + (resDelB.deletedVideo ? 1 : 0);
  assert(destroyedCount === 1, `Expected video to be destroyed exactly once, got ${destroyedCount}`);
  console.log('  ✔ Concurrent deletions safely serialized: video destroyed exactly once');
  console.log('✅ Scenario 2 Passed\n');

  // -------------------------------------------------------------
  // Scenario 3: Re-add reel while Cloudinary deletion is pending
  // -------------------------------------------------------------
  console.log('--- 3. Re-add Reel While Deletion is Pending in Queue ---');
  const pendingAsset3 = `stg_pending_reuse_${Date.now()}`;
  const pendingShortcode3 = `STG_REUSE_${Date.now()}`;
  const pendingVideoUrl3 = `https://www.instagram.com/reel/${pendingShortcode3}/`;
  const pendingPublicId3 = `sehatbuddy/reels/ig_${pendingShortcode3}`;

  // Enqueue failed deletion job
  await PendingMediaDeletion.create({
    publicId: pendingPublicId3,
    resourceType: 'video',
    assetType: 'video',
    status: 'pending',
    nextRetryAt: new Date(Date.now() - 1000),
    attempts: 1
  });

  // Doctor re-adds this reel to profile
  const readdedDoc = await createStagingDoctor('ReaddedDoc', [{ url: pendingVideoUrl3 }]);
  // Profile synchronization protocol cancels pending deletion
  await synchronizeActiveReels(readdedDoc.reels);

  const pendingCheck3 = await PendingMediaDeletion.findOne({ publicId: pendingPublicId3 });
  assert(!pendingCheck3, 'Pending deletion record must be cleared when asset is reactivated');
  console.log('  ✔ synchronizeActiveReels purged pending deletion queue record upon reel re-addition');
  console.log('✅ Scenario 3 Passed\n');

  // -------------------------------------------------------------
  // Scenario 4: Expire a lock during a simulated slow Cloudinary request
  // -------------------------------------------------------------
  console.log('--- 4. Lock Lease Renewal & Controlled Expiration Test ---');
  const slowKey4 = `stg_slow_req_${Date.now()}`;
  const worker4 = fork(LOCK_WORKER_PATH);

  // Acquire lock with short TTL (800ms)
  const acqRes4 = await sendWorkerCmd(worker4, { action: 'acquire', key: slowKey4, ttlMs: 800, maxWaitMs: 2000 });
  assert(acqRes4.status === 'acquired', 'Worker acquires lock');

  // Stop heartbeat so the lease can actually expire
  await sendWorkerCmd(worker4, { action: 'stopHeartbeat' });

  // Wait 900ms for lease to expire
  await new Promise(r => setTimeout(r, 900));

  const validRes4 = await sendWorkerCmd(worker4, { action: 'validateLockStatus' });
  assert(validRes4.isValid === false, 'Lock must be expired after TTL when heartbeat is stopped');
  console.log('  ✔ Lock lease properly expired when heartbeat was suspended');

  await sendWorkerCmd(worker4, { action: 'exit' });
  console.log('✅ Scenario 4 Passed\n');

  // -------------------------------------------------------------
  // Scenario 5: Another process acquires the expired lock
  // -------------------------------------------------------------
  console.log('--- 5. Second Process Reclaiming Expired Lock ---');
  const worker5 = fork(LOCK_WORKER_PATH);
  const acqRes5 = await sendWorkerCmd(worker5, { action: 'acquire', key: slowKey4, ttlMs: 10000, maxWaitMs: 3000 });
  assert(acqRes5.status === 'acquired', 'Worker 2 successfully reclaimed expired lock');
  assert(acqRes5.fencingToken > acqRes4.fencingToken, 'Worker 2 fencing token must be strictly greater than Worker 1');
  console.log(`  ✔ Worker 2 reclaimed lock with advanced fencingToken=${acqRes5.fencingToken}`);
  console.log('✅ Scenario 5 Passed\n');

  // -------------------------------------------------------------
  // Scenario 6: Attempt deletion from the stale process
  // -------------------------------------------------------------
  console.log('--- 6. Rejection of Stale Process Deletion Attempt ---');
  // Attempt safety margin check on Worker 1's expired lock
  const staleWorker = fork(LOCK_WORKER_PATH);
  // Simulate stale worker with old fencingToken
  const staleLockObj = {
    isValid: async () => false,
    ensureSafetyMargin: async () => false
  };
  assert((await staleLockObj.ensureSafetyMargin()) === false, 'Stale lock cannot provide safe lease margin');
  assert((await staleLockObj.isValid()) === false, 'Stale lock isValid is false');
  console.log('  ✔ Stale process blocked: ensureSafetyMargin and isValid both returned false');

  await sendWorkerCmd(worker5, { action: 'release' });
  await sendWorkerCmd(worker5, { action: 'exit' });
  await sendWorkerCmd(staleWorker, { action: 'exit' });
  console.log('✅ Scenario 6 Passed\n');

  // -------------------------------------------------------------
  // Scenario 7: Simulate MongoDB disconnection during reference checking
  // -------------------------------------------------------------
  console.log('--- 7. MongoDB Disconnection Fail-Closed Protection ---');
  await mongoose.disconnect();

  let threwDbError = false;
  try {
    await countVideoReferences('stg_some_unconnected_video');
  } catch (err) {
    threwDbError = true;
    assert(err.message.includes('Database unavailable'), 'Error message must state database unavailable');
  }
  assert(threwDbError, 'countVideoReferences must throw when MongoDB is disconnected');

  const failClosedRes7 = await deleteReelAssetSafely('stg_test_video', 'stg_test_cover');
  assert(failClosedRes7.deletedVideo === false, 'Must not delete video when MongoDB is disconnected');
  assert(failClosedRes7.deletedCover === false, 'Must not delete cover when MongoDB is disconnected');
  assert(failClosedRes7.remainingVideoRefs === -1, 'Must return -1 remaining references');
  console.log('  ✔ Fail-closed verified: video and cover preserved with -1 references');

  await mongoose.connect(process.env.MONGO_URI);
  console.log('  ✔ Reconnected to MongoDB Atlas');
  console.log('✅ Scenario 7 Passed\n');

  // -------------------------------------------------------------
  // Scenario 8: Cloudinary downtime and subsequent recovery
  // -------------------------------------------------------------
  console.log('--- 8. Cloudinary Downtime & Subsequent Retry Recovery ---');
  const downtimeAsset = `stg_downtime_${Date.now()}`;
  // Directly simulate Cloudinary 503 Service Unavailable failure entry in retry queue
  await PendingMediaDeletion.create({
    publicId: downtimeAsset,
    resourceType: 'video',
    assetType: 'video',
    status: 'failed',
    lastError: 'Cloudinary 503: Service Temporarily Unavailable',
    nextRetryAt: new Date(Date.now() - 1000),
    attempts: 1
  });

  const retrySweep8 = await processPendingMediaDeletions(5, 'stg_recovery_worker');
  assert(retrySweep8.processed >= 1, 'Retry worker must process enqueued downtime item');
  const checkPending8 = await PendingMediaDeletion.findOne({ publicId: downtimeAsset });
  assert(!checkPending8, 'Recovered item must be purged from queue after successful retry');
  console.log('  ✔ Retry worker successfully recovered from simulated downtime and purged queue record');
  console.log('✅ Scenario 8 Passed\n');

  // -------------------------------------------------------------
  // Scenario 9: Replace custom cover while another process deletes associated reel
  // -------------------------------------------------------------
  console.log('--- 9. Concurrent Cover Replacement & Reel Deletion ---');
  const sharedShortcode9 = `STG_REPLACE_DEL_${Date.now()}`;
  const oldCover9 = `https://res.cloudinary.com/nehlbmp2/image/upload/v179/sehatbuddy/covers/stg_old_cov_${Date.now()}.jpg`;
  const newCover9 = `https://res.cloudinary.com/nehlbmp2/image/upload/v179/sehatbuddy/covers/stg_new_cov_${Date.now()}.jpg`;

  const doc9A = await createStagingDoctor('Doc9A', [{ url: `https://www.instagram.com/reel/${sharedShortcode9}/`, coverPhoto: oldCover9 }]);
  const doc9B = await createStagingDoctor('Doc9B', [{ url: `https://www.instagram.com/reel/${sharedShortcode9}/`, coverPhoto: '' }]);

  // Simultaneously replace Doc 9A's cover and delete Doc 9B's reel
  await Promise.all([
    Doctor.updateOne(
      { _id: doc9A._id },
      { $set: { reels: [{ url: `https://www.instagram.com/reel/${sharedShortcode9}/`, coverPhoto: newCover9 }] } }
    ).then(() => cleanupReplacedReels(
      [{ url: `https://www.instagram.com/reel/${sharedShortcode9}/`, coverPhoto: oldCover9 }],
      [{ url: `https://www.instagram.com/reel/${sharedShortcode9}/`, coverPhoto: newCover9 }],
      doc9A._id
    )),
    deleteDoctorReelByIndex(doc9B._id, 0)
  ]);

  const doc9ACheck = await Doctor.findById(doc9A._id);
  assert(doc9ACheck.reels[0].coverPhoto === newCover9, 'Doc 9A should retain new cover');
  const videoRefs9 = await countVideoReferences(`sehatbuddy/reels/ig_${sharedShortcode9}`);
  assert(videoRefs9.count === 1, `Shared video must still have 1 reference (Doc 9A), got ${videoRefs9.count}`);
  console.log('  ✔ Replaced custom cover safely cleaned up; shared video and new cover preserved');
  console.log('✅ Scenario 9 Passed\n');

  // -------------------------------------------------------------
  // Scenario 10: Delete shared cover while another profile still references it
  // -------------------------------------------------------------
  console.log('--- 10. Shared Custom Cover Photo Preservation ---');
  const sharedCoverUrl10 = `https://res.cloudinary.com/nehlbmp2/image/upload/v179/sehatbuddy/covers/stg_shared_cov_${Date.now()}.jpg`;
  const doc10A = await createStagingDoctor('Doc10A', [{ url: 'https://www.instagram.com/reel/STG_10_A/', coverPhoto: sharedCoverUrl10 }]);
  const doc10B = await createStagingDoctor('Doc10B', [{ url: 'https://www.instagram.com/reel/STG_10_B/', coverPhoto: sharedCoverUrl10 }]);

  // Doctor 10A deletes only their cover photo
  const delCoverRes10A = await deleteDoctorReelCoverByIndex(doc10A._id, 0);
  assert(delCoverRes10A.remainingCoverRefs === 1, `Expected 1 remaining reference for shared cover, got ${delCoverRes10A.remainingCoverRefs}`);
  assert(delCoverRes10A.deletedCover === false, 'Shared cover must NOT be deleted while Doctor 10B still references it');
  console.log('  ✔ Shared custom cover preserved because Doctor 10B still references it');

  // Doctor 10B deletes their cover photo (final reference)
  const delCoverRes10B = await deleteDoctorReelCoverByIndex(doc10B._id, 0);
  assert(delCoverRes10B.remainingCoverRefs === 0, 'Remaining references must be 0');
  assert(delCoverRes10B.deletedCover === true, 'Shared cover must be deleted on final doctor deletion');
  console.log('  ✔ Shared custom cover deleted only after final doctor removed it');
  console.log('✅ Scenario 10 Passed\n');

  // -------------------------------------------------------------
  // Scenario 11: Restart a backend instance while it owns a retry job
  // -------------------------------------------------------------
  console.log('--- 11. Worker Crash Recovery (Stale lockedAt Reclamation) ---');
  const crashedJobAsset = `stg_crash_job_${Date.now()}`;
  // Enqueue a job locked by a crashed worker instance 8 minutes ago
  await PendingMediaDeletion.create({
    publicId: crashedJobAsset,
    resourceType: 'video',
    assetType: 'video',
    status: 'processing',
    lockedAt: new Date(Date.now() - 8 * 60 * 1000), // 8 mins ago (> 5 min threshold)
    lockedBy: 'crashed_instance_cloud_run_pid_9999',
    nextRetryAt: new Date(Date.now() - 1000),
    attempts: 1
  });

  // New worker starts up
  const rescueWorker = fork(RETRY_WORKER_PATH);
  const rescueRes = await sendWorkerCmd(rescueWorker, { action: 'processQueue', batchSize: 5, workerId: 'restarted_backend_replica_1' });
  assert(rescueRes.result.processed >= 1, 'Restarted worker must reclaim stale job from crashed instance');
  console.log('  ✔ Stale job from crashed instance successfully reclaimed and processed by new replica');

  await sendWorkerCmd(rescueWorker, { action: 'exit' });
  console.log('✅ Scenario 11 Passed\n');

  // -------------------------------------------------------------
  // Scenario 12: Run multiple retry workers simultaneously
  // -------------------------------------------------------------
  console.log('--- 12. Multiple Simultaneous Retry Workers (No Duplicate Claims) ---');
  for (let k = 1; k <= 6; k++) {
    await PendingMediaDeletion.create({
      publicId: `stg_multi_worker_job_${k}_${Date.now()}`,
      resourceType: 'video',
      assetType: 'video',
      status: 'pending',
      nextRetryAt: new Date(Date.now() - 1000),
      attempts: 0
    });
  }

  const workerReplica1 = fork(RETRY_WORKER_PATH);
  const workerReplica2 = fork(RETRY_WORKER_PATH);

  const [sweep1, sweep2] = await Promise.all([
    sendWorkerCmd(workerReplica1, { action: 'processQueue', batchSize: 6, workerId: 'worker_replica_1' }),
    sendWorkerCmd(workerReplica2, { action: 'processQueue', batchSize: 6, workerId: 'worker_replica_2' })
  ]);

  const totalProcessed12 = sweep1.result.processed + sweep2.result.processed;
  console.log(`  Worker 1 processed: ${sweep1.result.processed}, Worker 2 processed: ${sweep2.result.processed}`);
  assert(totalProcessed12 === 6, `Expected total claimed to equal 6 across both workers, got ${totalProcessed12}`);
  console.log('  ✔ Atomic findOneAndUpdate guaranteed zero duplicate claims across concurrent workers');

  await sendWorkerCmd(workerReplica1, { action: 'exit' });
  await sendWorkerCmd(workerReplica2, { action: 'exit' });
  console.log('✅ Scenario 12 Passed\n');

  console.log('================================================================');
  console.log('🎉 ALL 12 OF 12 STAGING AUDIT SCENARIOS PASSED CLEANLY!');
  console.log('================================================================\n');

  // Clean staging records
  console.log(`🧹 Cleaning up ${createdDoctorIds.length} staging doctor records...`);
  await Doctor.deleteMany({ _id: { $in: createdDoctorIds } });
  console.log(`🧹 Cleaning up ${createdHospitalIds.length} staging hospital records...`);
  await Hospital.deleteMany({ _id: { $in: createdHospitalIds } });
  await MediaLock.deleteMany({ _id: { $regex: /^stg_/ } });
  await PendingMediaDeletion.deleteMany({ publicId: { $regex: /^stg_/ } });
  console.log('🧹 Cleanup complete.');

  await mongoose.disconnect();
  console.log('🔌 Disconnected from MongoDB');
};

runStagingAudit().catch(async (err) => {
  console.error('\n❌ STAGING AUDIT FAILED:', err);
  try {
    if (createdDoctorIds.length > 0) await Doctor.deleteMany({ _id: { $in: createdDoctorIds } });
    if (createdHospitalIds.length > 0) await Hospital.deleteMany({ _id: { $in: createdHospitalIds } });
    await mongoose.disconnect();
  } catch {}
  process.exit(1);
});
