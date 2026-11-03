/**
 * backend/utils/doctorMigration.js
 *
 * Safe, idempotent initialization and synchronization of doctor profile completion
 * and listing eligibility in MongoDB. Broadcasts real-time events on update.
 */

import Doctor from '../models/Doctor.js';
import { calculateDoctorProfileCompletion } from './doctorProfileCompletion.js';
import { broadcastDbChange } from '../services/storageMonitor.js';

let migrationExecuted = false;

export const initDoctorProfileCompletion = async () => {
  if (migrationExecuted) return;
  migrationExecuted = true;

  try {
    const doctors = await Doctor.find({});
    let updatedCount = 0;

    for (const doc of doctors) {
      const correctPct = calculateDoctorProfileCompletion(doc);
      const isComplete = correctPct >= 80;

      if (doc.profileCompletion !== correctPct || doc.isProfileComplete !== isComplete) {
        doc.profileCompletion = correctPct;
        doc.isProfileComplete = isComplete;
        await Doctor.updateOne(
          { _id: doc._id },
          {
            $set: {
              profileCompletion: correctPct,
              isProfileComplete: isComplete
            }
          }
        );
        broadcastDbChange('doctors', 'update', doc._id, doc.toObject());
        updatedCount++;
      }
    }

    if (updatedCount > 0) {
      console.log(`✅ [Doctor Sync] Synchronized profile completion for ${updatedCount} doctor(s) to match client calculation in real-time.`);
    }
  } catch (err) {
    console.warn('⚠️ [Doctor Sync] Failed to synchronize doctor profile completion:', err.message);
  }
};
