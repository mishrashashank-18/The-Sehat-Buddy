import mongoose from 'mongoose';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';
import Doctor from '../models/Doctor.js';
import Hospital from '../models/Hospital.js';
import Admin from '../models/Admin.js';
import {
  deleteDoctorReel,
  deleteDoctorReelCover,
  updateDoctorProfile
} from '../controllers/doctorController.js';
import {
  deleteDoctorReel as adminDeleteDoctorReel,
  deleteDoctorReelCover as adminDeleteDoctorReelCover,
  deleteHospitalReel as adminDeleteHospitalReel,
  deleteHospitalReelCover as adminDeleteHospitalReelCover,
  updateDoctor as adminUpdateDoctor
} from '../controllers/adminController.js';
import { updateHospital } from '../controllers/hospitalController.js';
import { countVideoReferences } from '../utils/reelCleanup.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
dotenv.config({ path: path.join(__dirname, '../.env') });

let createdDoctorIds = [];
let createdHospitalIds = [];
let createdAdminIds = [];

const mockResponse = () => {
  const res = {};
  res.statusCode = 200;
  res.status = (code) => {
    res.statusCode = code;
    return res;
  };
  res.json = (data) => {
    res.data = data;
    return res;
  };
  return res;
};

const assert = (condition, msg) => {
  if (!condition) {
    throw new Error(`Assertion Failed: ${msg}`);
  }
};

const runAdminOnlySecurityAudit = async () => {
  console.log('================================================================');
  console.log('🔒 STARTING ADMIN-ONLY REEL SECURITY & RBAC VERIFICATION SUITE');
  console.log('================================================================\n');

  await mongoose.connect(process.env.MONGO_URI);
  console.log('✅ Connected to MongoDB Atlas\n');

  // Create test entities
  const adminDoc = await Admin.create({
    name: 'Platform Super Admin',
    email: `admin_sec_${Date.now()}@sehatbuddy.com`,
    password: 'Password@123',
    role: 'admin'
  });
  createdAdminIds.push(adminDoc._id);

  const initialReel = { url: 'https://www.instagram.com/reel/INITIAL_ADMIN_REEL/', coverPhoto: '' };
  const doctorDoc = await Doctor.create({
    name: 'Dr. Test Consumer',
    email: `doc_consumer_${Date.now()}@sehatbuddy.com`,
    password: 'Password@123',
    role: 'doctor',
    specialty: 'Cardiology',
    hospital: 'Fortis Hospital',
    price: 500,
    experience: 5,
    reels: [initialReel]
  });
  createdDoctorIds.push(doctorDoc._id);

  const hospitalDoc = await Hospital.create({
    name: 'Fortis Consumer Hospital',
    email: `hosp_consumer_${Date.now()}@sehatbuddy.com`,
    location: 'Delhi',
    address: 'Vasant Kunj, New Delhi',
    city: 'New Delhi',
    state: 'Delhi',
    type: 'Super Speciality',
    reels: [initialReel]
  });
  createdHospitalIds.push(hospitalDoc._id);

  // -------------------------------------------------------------
  // Test 1: Doctor attempts to update their reels via updateDoctorProfile -> 403 Forbidden
  // -------------------------------------------------------------
  console.log('--- 1. Doctor Attempting Reel Modification (API Block) ---');
  const docReq = {
    params: { id: doctorDoc._id.toString() },
    user: { id: doctorDoc._id.toString(), role: 'doctor', email: doctorDoc.email },
    body: {
      name: 'Dr. Test Consumer',
      reels: [
        { url: 'https://www.instagram.com/reel/UNAUTHORIZED_DOCTOR_REEL/', coverPhoto: '' }
      ]
    }
  };
  const docRes = mockResponse();
  await updateDoctorProfile(docReq, docRes);
  assert(docRes.statusCode === 403, `Expected 403 Forbidden for doctor reel update, got ${docRes.statusCode}`);
  assert(docRes.data.message.includes('managed exclusively by platform administrators'), 'Message must explain admin-only policy');
  console.log(`  ✔ Doctor direct reel modification rejected with 403 Forbidden: "${docRes.data.message}"`);
  console.log('✅ Test 1 Passed\n');

  // -------------------------------------------------------------
  // Test 2: Doctor attempts to delete reel via deleteDoctorReel -> 403 Forbidden
  // -------------------------------------------------------------
  console.log('--- 2. Doctor Attempting Reel Deletion (API Block) ---');
  const docDelReq = {
    params: { id: doctorDoc._id.toString(), index: '0' },
    user: { id: doctorDoc._id.toString(), role: 'doctor', email: doctorDoc.email }
  };
  const docDelRes = mockResponse();
  await deleteDoctorReel(docDelReq, docDelRes);
  assert(docDelRes.statusCode === 403, `Expected 403 Forbidden for doctor reel deletion, got ${docDelRes.statusCode}`);
  console.log(`  ✔ Doctor reel deletion rejected with 403 Forbidden: "${docDelRes.data.message}"`);
  console.log('✅ Test 2 Passed\n');

  // -------------------------------------------------------------
  // Test 3: Doctor attempts to delete cover photo via deleteDoctorReelCover -> 403 Forbidden
  // -------------------------------------------------------------
  console.log('--- 3. Doctor Attempting Cover Photo Deletion (API Block) ---');
  const docCoverDelReq = {
    params: { id: doctorDoc._id.toString(), index: '0' },
    user: { id: doctorDoc._id.toString(), role: 'doctor', email: doctorDoc.email }
  };
  const docCoverDelRes = mockResponse();
  await deleteDoctorReelCover(docCoverDelReq, docCoverDelRes);
  assert(docCoverDelRes.statusCode === 403, `Expected 403 Forbidden for doctor cover deletion, got ${docCoverDelRes.statusCode}`);
  console.log(`  ✔ Doctor cover deletion rejected with 403 Forbidden: "${docCoverDelRes.data.message}"`);
  console.log('✅ Test 3 Passed\n');

  // -------------------------------------------------------------
  // Test 4: Hospital attempts to update hospital reels via updateHospital -> 403 Forbidden
  // -------------------------------------------------------------
  console.log('--- 4. Hospital Attempting Reel Modification (API Block) ---');
  const hospReq = {
    headers: {},
    params: { id: hospitalDoc._id.toString() },
    user: { id: hospitalDoc._id.toString(), role: 'hospital', email: hospitalDoc.email },
    body: {
      name: hospitalDoc.name,
      reels: [
        { url: 'https://www.instagram.com/reel/UNAUTHORIZED_HOSPITAL_REEL/', coverPhoto: '' }
      ]
    }
  };
  const hospRes = mockResponse();
  await updateHospital(hospReq, hospRes);
  assert(hospRes.statusCode === 403, `Expected 403 Forbidden for hospital reel update, got ${hospRes.statusCode}`);
  console.log(`  ✔ Hospital direct reel modification rejected with 403 Forbidden: "${hospRes.data.message}"`);
  console.log('✅ Test 4 Passed\n');

  // -------------------------------------------------------------
  // Test 5: Admin modifies reels on doctor profile -> 200 OK Succeeded
  // -------------------------------------------------------------
  console.log('--- 5. Admin Managing Doctor Reels (Authorized Operation) ---');
  const newAdminReel = { url: 'https://www.instagram.com/reel/ADMIN_APPROVED_REEL/', coverPhoto: '' };
  const adminDocReq = {
    params: { id: doctorDoc._id.toString() },
    user: { id: adminDoc._id.toString(), role: 'admin', email: adminDoc.email },
    body: {
      reels: [newAdminReel]
    }
  };
  const adminDocRes = mockResponse();
  await adminUpdateDoctor(adminDocReq, adminDocRes);
  assert(adminDocRes.statusCode === 200, `Expected 200 OK for admin doctor update, got ${adminDocRes.statusCode}`);

  const updatedDoc = await Doctor.findById(doctorDoc._id);
  assert(updatedDoc.reels.length === 1 && updatedDoc.reels[0].url.includes('ADMIN_APPROVED_REEL'), 'Admin reel was saved to doctor profile');
  console.log('  ✔ Admin successfully updated doctor reels');
  console.log('✅ Test 5 Passed\n');

  // -------------------------------------------------------------
  // Test 6: Admin deletes doctor reel -> 200 OK Succeeded
  // -------------------------------------------------------------
  console.log('--- 6. Admin Deleting Doctor Reel (Authorized Operation) ---');
  const adminDelReq = {
    params: { id: doctorDoc._id.toString(), index: '0' },
    user: { id: adminDoc._id.toString(), role: 'admin', email: adminDoc.email }
  };
  const adminDelRes = mockResponse();
  await adminDeleteDoctorReel(adminDelReq, adminDelRes);
  assert(adminDelRes.statusCode === 200, `Expected 200 OK for admin doctor reel deletion, got ${adminDelRes.statusCode}`);

  const afterDelDoc = await Doctor.findById(doctorDoc._id);
  assert(afterDelDoc.reels.length === 0, 'Reel was removed from doctor profile');
  console.log('  ✔ Admin successfully deleted reel from doctor profile');
  console.log('✅ Test 6 Passed\n');

  // -------------------------------------------------------------
  // Test 7: Admin deletes hospital reel -> 200 OK Succeeded
  // -------------------------------------------------------------
  console.log('--- 7. Admin Deleting Hospital Reel (Authorized Operation) ---');
  const adminHospDelReq = {
    params: { id: hospitalDoc._id.toString(), index: '0' },
    user: { id: adminDoc._id.toString(), role: 'admin', email: adminDoc.email }
  };
  const adminHospDelRes = mockResponse();
  await adminDeleteHospitalReel(adminHospDelReq, adminHospDelRes);
  assert(adminHospDelRes.statusCode === 200, `Expected 200 OK for admin hospital reel deletion, got ${adminHospDelRes.statusCode}`);

  const afterDelHosp = await Hospital.findById(hospitalDoc._id);
  assert(afterDelHosp.reels.length === 0, 'Reel was removed from hospital profile');
  console.log('  ✔ Admin successfully deleted reel from hospital profile');
  console.log('✅ Test 7 Passed\n');

  // -------------------------------------------------------------
  // Test 8: Shared reel across Doctor and Hospital managed by Admin
  // -------------------------------------------------------------
  console.log('--- 8. Shared Reel Reference Safety Managed by Admin ---');
  const sharedReel8 = { url: 'https://www.instagram.com/reel/ADMIN_SHARED_8/', coverPhoto: '' };
  const sharedPubId8 = 'sehatbuddy/reels/ig_ADMIN_SHARED_8';

  // Admin assigns shared reel to both doctor and hospital
  await Doctor.updateOne({ _id: doctorDoc._id }, { $set: { reels: [sharedReel8] } });
  await Hospital.updateOne({ _id: hospitalDoc._id }, { $set: { reels: [sharedReel8] } });

  let refs8 = await countVideoReferences(sharedPubId8);
  assert(refs8.count === 2, `Expected 2 initial references, got ${refs8.count}`);

  // Admin deletes from doctor: must preserve because hospital still references it
  const delDoc8 = mockResponse();
  await adminDeleteDoctorReel({ params: { id: doctorDoc._id.toString(), index: '0' }, user: { id: adminDoc._id.toString(), role: 'admin' } }, delDoc8);
  assert(delDoc8.data.deletedVideo === false, 'Video must be preserved while hospital still references it');
  assert(delDoc8.data.remainingVideoRefs === 1, 'Remaining video refs must be 1');
  console.log('  ✔ Admin deletion from doctor preserved shared video for hospital (remaining refs=1)');

  // Admin deletes from hospital: 0 refs remain -> deleted from Cloudinary
  const delHosp8 = mockResponse();
  await adminDeleteHospitalReel({ params: { id: hospitalDoc._id.toString(), index: '0' }, user: { id: adminDoc._id.toString(), role: 'admin' } }, delHosp8);
  assert(delHosp8.data.deletedVideo === true, 'Video must be destroyed from Cloudinary on 0 references');
  assert(delHosp8.data.remainingVideoRefs === 0, 'Remaining video refs must be 0');
  console.log('  ✔ Admin deletion from hospital permanently deleted video upon 0 remaining references');
  console.log('✅ Test 8 Passed\n');

  console.log('================================================================');
  console.log('🎉 ALL 8 OF 8 ADMIN-ONLY REEL SECURITY TESTS PASSED!');
  console.log('================================================================\n');

  // Cleanup
  console.log('🧹 Cleaning up security test records...');
  await Doctor.deleteMany({ _id: { $in: createdDoctorIds } });
  await Hospital.deleteMany({ _id: { $in: createdHospitalIds } });
  await Admin.deleteMany({ _id: { $in: createdAdminIds } });
  console.log('🧹 Cleanup complete.');

  await mongoose.disconnect();
  console.log('🔌 Disconnected from MongoDB');
  process.exit(0);
};

runAdminOnlySecurityAudit().catch(async (err) => {
  console.error('\n❌ SECURITY AUDIT FAILED:', err);
  try {
    if (createdDoctorIds.length > 0) await Doctor.deleteMany({ _id: { $in: createdDoctorIds } });
    if (createdHospitalIds.length > 0) await Hospital.deleteMany({ _id: { $in: createdHospitalIds } });
    if (createdAdminIds.length > 0) await Admin.deleteMany({ _id: { $in: createdAdminIds } });
    await mongoose.disconnect();
  } catch {}
  process.exit(1);
});
