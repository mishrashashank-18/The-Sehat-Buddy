/**
 * backend/utils/hospitalMigration.js
 *
 * Safe, idempotent initialization of hospital profile completion and publication statuses
 * on server startup. Preserves all existing records while ensuring authoritative data.
 */

import Hospital from '../models/Hospital.js';
import { calculateHospitalProfileCompletion, MIN_PROFILE_COMPLETION_THRESHOLD } from './hospitalProfileCompletion.js';

let migrationExecuted = false;

export const initHospitalPublicationAndCompletion = async () => {
  if (migrationExecuted) return;
  migrationExecuted = true;

  try {
    const hospitals = await Hospital.find({});
    let updatedCount = 0;

    for (const hospital of hospitals) {
      let needsSave = false;
      const completion = calculateHospitalProfileCompletion(hospital);

      if (hospital.profileCompletion !== completion.percentage) {
        hospital.profileCompletion = completion.percentage;
        needsSave = true;
      }

      if (!hospital.publicationStatus) {
        hospital.publicationStatus = 'published';
        needsSave = true;
      }

      if (!hospital.status) {
        hospital.status = 'active';
        needsSave = true;
      }

      if (needsSave) {
        await Hospital.updateOne(
          { _id: hospital._id },
          {
            $set: {
              profileCompletion: hospital.profileCompletion,
              publicationStatus: hospital.publicationStatus,
              status: hospital.status
            }
          }
        );
        updatedCount++;
      }
    }

    if (updatedCount > 0) {
      console.log(`✓ Hospital Profile Completion migration: updated ${updatedCount} hospital record(s)`);
    }
  } catch (err) {
    console.warn('Hospital Profile Completion migration warning:', err.message);
  }
};
