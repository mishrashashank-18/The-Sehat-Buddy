import mongoose from 'mongoose';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';
import Doctor from '../models/Doctor.js';
import Hospital from '../models/Hospital.js';
import {
  countVideoReferences,
  countCoverReferences,
  deleteReelAssetSafely,
  deleteDoctorReelByIndex,
  deleteDoctorReelCoverByIndex,
  cleanupReplacedReels,
  assetLock
} from '../utils/reelCleanup.js';
import { getCloudinary } from '../routes/uploadRoutes.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
dotenv.config({ path: path.join(__dirname, '../.env') });

const TEST_PREFIX = 'TEST_SUITE_REEL_';
let createdDoctorIds = [];

const createTestDoctor = async (nameSuffix, reels) => {
  const email = `test_${Date.now()}_${Math.random().toString(36).substring(2, 8)}@testsehatbuddy.com`;
  const doc = await Doctor.create({
    name: `Dr. ReelTest ${nameSuffix}`,
    email,
    password: 'Password@123',
    specialty: 'Cardiology',
    hospital: 'Test Hospital',
    price: 500,
    experience: 5,
    reels
  });
  createdDoctorIds.push(doc._id);
  return doc;
};

// Mock Cloudinary uploader to record destroys without destroying real production assets during unit test
const setupCloudinaryMock = () => {
  const cld = getCloudinary();
  if (!cld) {
    throw new Error('Cloudinary not configured');
  }
  const originalDestroy = cld.uploader.destroy;
  const destroyCalls = [];

  cld.uploader.destroy = async (publicId, options = {}) => {
    destroyCalls.push({ publicId, options, time: Date.now() });
    if (publicId.includes('simulated_failure')) {
      throw new Error('Simulated Cloudinary API connection timeout');
    }
    if (publicId.includes('missing_asset')) {
      return { result: 'not found' };
    }
    return { result: 'ok' };
  };

  return {
    destroyCalls,
    restore: () => {
      cld.uploader.destroy = originalDestroy;
    }
  };
};

const runAllTests = async () => {
  console.log('================================================================');
  console.log('🚀 RUNNING 12 DYNAMIC SHARED REEL & COVER DELETION TEST SCENARIOS');
  console.log('================================================================\n');

  await mongoose.connect(process.env.MONGO_URI);
  console.log('✅ Connected to MongoDB\n');

  const { destroyCalls, restore } = setupCloudinaryMock();
  let passedCount = 0;

  try {
    // -------------------------------------------------------------------------
    // Scenario 1: Two doctors sharing the same reel
    // -------------------------------------------------------------------------
    {
      console.log('--- Scenario 1: Two doctors sharing the same reel ---');
      destroyCalls.length = 0;
      const sharedVideo = 'https://www.instagram.com/reel/TEST_SCENARIO_1/';
      const d1 = await createTestDoctor('S1_Doc1', [{ url: sharedVideo, coverPhoto: '' }]);
      const d2 = await createTestDoctor('S1_Doc2', [{ url: sharedVideo, coverPhoto: '' }]);

      // Doctor 1 deletes the reel
      const res1 = await deleteDoctorReelByIndex(d1._id, 0);
      console.log(`  Doctor 1 deleted reel. Remaining video refs: ${res1.remainingVideoRefs}, deletedVideo: ${res1.deletedVideo}`);
      if (res1.deletedVideo === false && res1.remainingVideoRefs === 1) {
        console.log('  ✔ Doctor 1 deletion preserved shared video (1 doctor still using it)');
      } else {
        throw new Error('Scenario 1 failed: Video was prematurely deleted!');
      }

      // Doctor 2 deletes the reel
      const res2 = await deleteDoctorReelByIndex(d2._id, 0);
      console.log(`  Doctor 2 deleted reel. Remaining video refs: ${res2.remainingVideoRefs}, deletedVideo: ${res2.deletedVideo}`);
      if (res2.deletedVideo === true && res2.remainingVideoRefs === 0) {
        console.log('  ✔ Doctor 2 deletion permanently deleted video (0 doctors remaining)');
      } else {
        throw new Error('Scenario 1 failed: Video was not deleted when last doctor removed it!');
      }

      console.log('✅ Scenario 1 Passed\n');
      passedCount++;
    }

    // -------------------------------------------------------------------------
    // Scenario 2: Three doctors sharing the same reel
    // -------------------------------------------------------------------------
    {
      console.log('--- Scenario 2: Three doctors sharing the same reel ---');
      destroyCalls.length = 0;
      const sharedVideo = 'https://res.cloudinary.com/demo/video/upload/v1/sehatbuddy/reels/ig_TEST_SCENARIO_2.mp4';
      const d1 = await createTestDoctor('S2_Doc1', [{ url: sharedVideo, coverPhoto: '' }]);
      const d2 = await createTestDoctor('S2_Doc2', [{ url: sharedVideo, coverPhoto: '' }]);
      const d3 = await createTestDoctor('S2_Doc3', [{ url: sharedVideo, coverPhoto: '' }]);

      const res1 = await deleteDoctorReelByIndex(d1._id, 0);
      if (res1.deletedVideo || res1.remainingVideoRefs !== 2) throw new Error('Scenario 2: D1 failed');
      console.log('  ✔ Doc 1 deleted: preserved (2 refs remaining)');

      const res2 = await deleteDoctorReelByIndex(d2._id, 0);
      if (res2.deletedVideo || res2.remainingVideoRefs !== 1) throw new Error('Scenario 2: D2 failed');
      console.log('  ✔ Doc 2 deleted: preserved (1 ref remaining)');

      const res3 = await deleteDoctorReelByIndex(d3._id, 0);
      if (!res3.deletedVideo || res3.remainingVideoRefs !== 0) throw new Error('Scenario 2: D3 failed');
      console.log('  ✔ Doc 3 deleted: permanently deleted video (0 refs remaining)');

      console.log('✅ Scenario 2 Passed\n');
      passedCount++;
    }

    // -------------------------------------------------------------------------
    // Scenario 3: More than ten doctors sharing the same reel (11 doctors)
    // -------------------------------------------------------------------------
    {
      console.log('--- Scenario 3: More than ten doctors sharing the same reel (11 doctors) ---');
      destroyCalls.length = 0;
      const sharedVideo = 'https://www.instagram.com/reel/TEST_SCENARIO_3/';
      const docs = [];
      for (let i = 0; i < 11; i++) {
        docs.push(await createTestDoctor(`S3_Doc_${i}`, [{ url: sharedVideo, coverPhoto: '' }]));
      }

      // Delete first 10 doctors
      for (let i = 0; i < 10; i++) {
        const res = await deleteDoctorReelByIndex(docs[i]._id, 0);
        if (res.deletedVideo) throw new Error(`Scenario 3: Video prematurely deleted at doctor ${i}`);
      }
      console.log('  ✔ Successfully deleted from 10 doctors sequentially; shared video preserved');

      // Delete 11th doctor
      const resLast = await deleteDoctorReelByIndex(docs[10]._id, 0);
      if (!resLast.deletedVideo || resLast.remainingVideoRefs !== 0) {
        throw new Error('Scenario 3: Video was not deleted on 11th doctor removal');
      }
      console.log('  ✔ 11th doctor deleted: permanently deleted video');

      console.log('✅ Scenario 3 Passed\n');
      passedCount++;
    }

    // -------------------------------------------------------------------------
    // Scenario 4: A large number of doctors sharing the same reel (25 doctors)
    // -------------------------------------------------------------------------
    {
      console.log('--- Scenario 4: Large number of doctors sharing the same reel (25 doctors) ---');
      destroyCalls.length = 0;
      const sharedVideo = 'https://www.instagram.com/reel/TEST_SCENARIO_4/';
      const docs = [];
      for (let i = 0; i < 25; i++) {
        docs.push(await createTestDoctor(`S4_Doc_${i}`, [{ url: sharedVideo, coverPhoto: '' }]));
      }

      // Verify countVideoReferences sees all 25 doctors dynamically without limits
      const initialCount = await countVideoReferences(sharedVideo);
      if (initialCount.count !== 25) {
        throw new Error(`Scenario 4: Expected 25 initial references, found ${initialCount.count}`);
      }
      console.log(`  ✔ Dynamic reference counter accurately detected ${initialCount.count} doctors sharing the reel`);

      // Delete 24 doctors
      for (let i = 0; i < 24; i++) {
        const res = await deleteDoctorReelByIndex(docs[i]._id, 0);
        if (res.deletedVideo) throw new Error(`Scenario 4: Video deleted at index ${i}`);
      }
      console.log('  ✔ 24 doctors deleted: video preserved');

      // Final deletion
      const resLast = await deleteDoctorReelByIndex(docs[24]._id, 0);
      if (!resLast.deletedVideo || resLast.remainingVideoRefs !== 0) {
        throw new Error('Scenario 4: Video not deleted after 25th doctor removal');
      }
      console.log('  ✔ 25th doctor deleted: video permanently deleted from Cloudinary');

      console.log('✅ Scenario 4 Passed\n');
      passedCount++;
    }

    // -------------------------------------------------------------------------
    // Scenario 5: A doctor deleting a reel that nobody else uses
    // -------------------------------------------------------------------------
    {
      console.log('--- Scenario 5: A doctor deleting a reel that nobody else uses ---');
      destroyCalls.length = 0;
      const uniqueVideo = 'https://www.instagram.com/reel/TEST_SCENARIO_5_UNIQUE/';
      const uniqueCover = 'https://res.cloudinary.com/demo/image/upload/v1/sehatbuddy/covers/unique_cover_5.jpg';
      const d1 = await createTestDoctor('S5_Solo', [{ url: uniqueVideo, coverPhoto: uniqueCover }]);

      const res = await deleteDoctorReelByIndex(d1._id, 0);
      if (!res.deletedVideo || !res.deletedCover) {
        throw new Error(`Scenario 5 failed: expected both video and cover to be deleted. Got video=${res.deletedVideo}, cover=${res.deletedCover}`);
      }
      console.log('  ✔ Exclusive video and exclusive custom cover both deleted immediately');

      console.log('✅ Scenario 5 Passed\n');
      passedCount++;
    }

    // -------------------------------------------------------------------------
    // Scenario 6: Multiple doctors sharing 1 video with different custom covers
    // -------------------------------------------------------------------------
    {
      console.log('--- Scenario 6: Multiple doctors sharing 1 video with different custom covers ---');
      destroyCalls.length = 0;
      const sharedVideo = 'https://www.instagram.com/reel/TEST_SCENARIO_6_SHARED/';
      const coverDoc1 = 'https://res.cloudinary.com/demo/image/upload/v1/sehatbuddy/covers/custom_cover_s6_d1.jpg';
      const coverDoc2 = 'https://res.cloudinary.com/demo/image/upload/v1/sehatbuddy/covers/custom_cover_s6_d2.jpg';
      const coverDoc3 = 'https://res.cloudinary.com/demo/image/upload/v1/sehatbuddy/covers/custom_cover_s6_d3.jpg';

      const d1 = await createTestDoctor('S6_Doc1', [{ url: sharedVideo, coverPhoto: coverDoc1 }]);
      const d2 = await createTestDoctor('S6_Doc2', [{ url: sharedVideo, coverPhoto: coverDoc2 }]);
      const d3 = await createTestDoctor('S6_Doc3', [{ url: sharedVideo, coverPhoto: coverDoc3 }]);

      // Doctor 1 deletes the reel
      const res1 = await deleteDoctorReelByIndex(d1._id, 0);
      if (res1.deletedVideo === true) {
        throw new Error('Scenario 6 failed: Shared video was deleted prematurely!');
      }
      if (res1.deletedCover === false) {
        throw new Error("Scenario 6 failed: Doctor 1's exclusive custom cover was NOT deleted!");
      }
      console.log('  ✔ Doctor 1 deleted reel: shared video PRESERVED, Doctor 1 custom cover DELETED');

      // Verify Doctor 2 & Doctor 3 covers are still untouched in MongoDB
      const checkDoc2 = await Doctor.findById(d2._id);
      const checkDoc3 = await Doctor.findById(d3._id);
      if (checkDoc2.reels[0].coverPhoto !== coverDoc2 || checkDoc3.reels[0].coverPhoto !== coverDoc3) {
        throw new Error("Scenario 6 failed: Doctor 2 or Doctor 3 cover was corrupted!");
      }
      console.log("  ✔ Doctor 2 and Doctor 3 custom covers remain intact");

      // Clean up d2 and d3
      await deleteDoctorReelByIndex(d2._id, 0);
      const res3 = await deleteDoctorReelByIndex(d3._id, 0);
      if (!res3.deletedVideo || !res3.deletedCover) {
        throw new Error('Scenario 6: Final video and cover cleanup failed');
      }

      console.log('✅ Scenario 6 Passed\n');
      passedCount++;
    }

    // -------------------------------------------------------------------------
    // Scenario 7: Multiple doctors sharing both the same video and cover image
    // -------------------------------------------------------------------------
    {
      console.log('--- Scenario 7: Multiple doctors sharing both the same video and cover image ---');
      destroyCalls.length = 0;
      const sharedVideo = 'https://www.instagram.com/reel/TEST_SCENARIO_7_SHARED/';
      const sharedCover = 'https://res.cloudinary.com/demo/image/upload/v1/sehatbuddy/covers/shared_cover_s7.jpg';

      const d1 = await createTestDoctor('S7_Doc1', [{ url: sharedVideo, coverPhoto: sharedCover }]);
      const d2 = await createTestDoctor('S7_Doc2', [{ url: sharedVideo, coverPhoto: sharedCover }]);

      // Doctor 1 deletes reel
      const res1 = await deleteDoctorReelByIndex(d1._id, 0);
      if (res1.deletedVideo || res1.deletedCover) {
        throw new Error(`Scenario 7 failed: Asset deleted while Doctor 2 is still using both! video=${res1.deletedVideo}, cover=${res1.deletedCover}`);
      }
      console.log('  ✔ Doctor 1 deleted: both shared video and shared cover PRESERVED');

      // Doctor 2 deletes reel
      const res2 = await deleteDoctorReelByIndex(d2._id, 0);
      if (!res2.deletedVideo || !res2.deletedCover) {
        throw new Error('Scenario 7 failed: Both assets should be permanently deleted when last doctor removes them');
      }
      console.log('  ✔ Doctor 2 deleted: both shared video and shared cover PERMANENTLY DELETED');

      console.log('✅ Scenario 7 Passed\n');
      passedCount++;
    }

    // -------------------------------------------------------------------------
    // Scenario 8: Doctor deleting reel with exclusive custom cover while others use video
    // -------------------------------------------------------------------------
    {
      console.log('--- Scenario 8: Doctor deleting reel with exclusive custom cover while others use video ---');
      destroyCalls.length = 0;
      const sharedVideo = 'https://www.instagram.com/reel/TEST_SCENARIO_8/';
      const exclusiveCover = 'https://res.cloudinary.com/demo/image/upload/v1/sehatbuddy/covers/exclusive_cover_s8.jpg';

      const d1 = await createTestDoctor('S8_Doc1', [{ url: sharedVideo, coverPhoto: exclusiveCover }]);
      const d2 = await createTestDoctor('S8_Doc2', [{ url: sharedVideo, coverPhoto: '' }]); // Uses default video thumbnail

      // Doctor 1 deletes
      const res1 = await deleteDoctorReelByIndex(d1._id, 0);
      if (res1.deletedVideo === true) throw new Error('Scenario 8 failed: Video was deleted');
      if (res1.deletedCover === false) throw new Error('Scenario 8 failed: Exclusive cover was not deleted');
      console.log('  ✔ Exclusive custom cover deleted immediately; shared video preserved for Doctor 2');

      await deleteDoctorReelByIndex(d2._id, 0);
      console.log('✅ Scenario 8 Passed\n');
      passedCount++;
    }

    // -------------------------------------------------------------------------
    // Scenario 9: A doctor replacing an existing custom cover image
    // -------------------------------------------------------------------------
    {
      console.log('--- Scenario 9: A doctor replacing an existing custom cover image ---');
      destroyCalls.length = 0;
      const video = 'https://www.instagram.com/reel/TEST_SCENARIO_9/';
      const oldCustomCover = 'https://res.cloudinary.com/demo/image/upload/v1/sehatbuddy/covers/old_custom_cover_s9.jpg';
      const newCustomCover = 'https://res.cloudinary.com/demo/image/upload/v1/sehatbuddy/covers/new_custom_cover_s9.jpg';

      const d1 = await createTestDoctor('S9_Doc', [{ url: video, coverPhoto: oldCustomCover }]);

      // Doctor replaces the cover photo
      const oldReels = d1.reels;
      const newReels = [{ url: video, coverPhoto: newCustomCover }];

      await Doctor.updateOne({ _id: d1._id }, { $set: { reels: newReels } });
      await cleanupReplacedReels(oldReels, newReels, d1._id);

      const oldCoverDestroyed = destroyCalls.some(c => c.publicId.includes('old_custom_cover_s9'));
      const newCoverDestroyed = destroyCalls.some(c => c.publicId.includes('new_custom_cover_s9'));

      if (!oldCoverDestroyed || newCoverDestroyed) {
        throw new Error(`Scenario 9 failed: oldCoverDestroyed=${oldCoverDestroyed}, newCoverDestroyed=${newCoverDestroyed}`);
      }
      console.log('  ✔ Replaced custom cover was deleted from Cloudinary; new custom cover preserved');

      await deleteDoctorReelByIndex(d1._id, 0);
      console.log('✅ Scenario 9 Passed\n');
      passedCount++;
    }

    // -------------------------------------------------------------------------
    // Scenario 10: Multiple doctors deleting the same shared reel simultaneously (Concurrency)
    // -------------------------------------------------------------------------
    {
      console.log('--- Scenario 10: Concurrency - Multiple doctors deleting same reel simultaneously ---');
      destroyCalls.length = 0;
      const sharedVideo = 'https://www.instagram.com/reel/TEST_SCENARIO_10_CONCURRENT/';
      const d1 = await createTestDoctor('S10_Doc1', [{ url: sharedVideo, coverPhoto: '' }]);
      const d2 = await createTestDoctor('S10_Doc2', [{ url: sharedVideo, coverPhoto: '' }]);
      const d3 = await createTestDoctor('S10_Doc3', [{ url: sharedVideo, coverPhoto: '' }]);

      // Fire all 3 deletion requests simultaneously via Promise.all
      const results = await Promise.all([
        deleteDoctorReelByIndex(d1._id, 0),
        deleteDoctorReelByIndex(d2._id, 0),
        deleteDoctorReelByIndex(d3._id, 0)
      ]);

      const deletedCount = results.filter(r => r.deletedVideo).length;
      console.log(`  Deletion results: deletedVideo counts across requests = ${deletedCount}`);
      if (deletedCount !== 1) {
        throw new Error(`Scenario 10 failed: Exactly 1 request should have triggered Cloudinary video deletion, but got ${deletedCount}`);
      }
      console.log('  ✔ Mutex lock serialized concurrent requests; video was destroyed exactly ONCE without race condition');

      console.log('✅ Scenario 10 Passed\n');
      passedCount++;
    }

    // -------------------------------------------------------------------------
    // Scenario 11: A video or cover image already missing from Cloudinary
    // -------------------------------------------------------------------------
    {
      console.log('--- Scenario 11: Asset already missing from Cloudinary ---');
      destroyCalls.length = 0;
      const missingVideo = 'https://res.cloudinary.com/demo/video/upload/v1/sehatbuddy/reels/missing_asset_s11.mp4';
      const d1 = await createTestDoctor('S11_Doc', [{ url: missingVideo, coverPhoto: '' }]);

      // Should handle { result: 'not found' } gracefully without throwing an uncaught error
      const res = await deleteDoctorReelByIndex(d1._id, 0);
      if (res.success !== true) {
        throw new Error('Scenario 11 failed: Deletion returned failure for missing Cloudinary asset');
      }
      console.log('  ✔ Missing Cloudinary asset handled gracefully with success: true');

      console.log('✅ Scenario 11 Passed\n');
      passedCount++;
    }

    // -------------------------------------------------------------------------
    // Scenario 12: MongoDB updates succeeding while Cloudinary deletion fails
    // -------------------------------------------------------------------------
    {
      console.log('--- Scenario 12: Resiliency - DB updates succeeding while Cloudinary deletion fails ---');
      destroyCalls.length = 0;
      const failingVideo = 'https://res.cloudinary.com/demo/video/upload/v1/sehatbuddy/reels/simulated_failure_s12.mp4';
      const d1 = await createTestDoctor('S12_Doc', [{ url: failingVideo, coverPhoto: '' }]);

      // deleteDoctorReelByIndex should catch Cloudinary network timeout, keep MongoDB clean, and return safely
      const res = await deleteDoctorReelByIndex(d1._id, 0);
      const updatedDoctor = await Doctor.findById(d1._id);

      if (updatedDoctor.reels.length !== 0) {
        throw new Error('Scenario 12 failed: MongoDB profile reel was not removed!');
      }
      if (res.success !== true) {
        throw new Error('Scenario 12 failed: Response did not complete gracefully');
      }
      console.log('  ✔ MongoDB successfully cleared reel; Cloudinary exception caught and logged without crashing application');

      console.log('✅ Scenario 12 Passed\n');
      passedCount++;
    }

    console.log('================================================================');
    console.log(`🎉 ALL ${passedCount} OF 12 TEST SCENARIOS PASSED SUCCESSFULLY!`);
    console.log('================================================================');
  } finally {
    restore();

    // Clean up all temporary test doctors from MongoDB
    if (createdDoctorIds.length > 0) {
      console.log(`\n🧹 Cleaning up ${createdDoctorIds.length} test doctor records from MongoDB...`);
      await Doctor.deleteMany({ _id: { $in: createdDoctorIds } });
      console.log('🧹 Cleanup complete.');
    }

    await mongoose.disconnect();
    console.log('🔌 Disconnected from MongoDB');
  }
};

runAllTests().catch((err) => {
  console.error('\n❌ TEST SUITE FAILED WITH ERROR:', err);
  process.exit(1);
});
