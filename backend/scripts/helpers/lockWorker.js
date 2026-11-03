import mongoose from 'mongoose';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';
import MediaLock from '../../models/MediaLock.js';
import { assetLock } from '../../utils/reelCleanup.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
dotenv.config({ path: path.join(__dirname, '../../.env') });

let activeReleaseCallback = null;

const initDb = async () => {
  if (mongoose.connection.readyState !== 1) {
    await mongoose.connect(process.env.MONGO_URI);
  }
};

process.on('message', async (msg) => {
  try {
    await initDb();

    if (msg.action === 'acquire') {
      try {
        const releaseCallback = await assetLock.acquire(msg.key, msg.ttlMs || 20000, msg.maxWaitMs || 10000);
        activeReleaseCallback = releaseCallback;
        const valid = await releaseCallback.isValid();
        process.send({
          status: 'acquired',
          fencingToken: releaseCallback.fencingToken,
          ownerId: releaseCallback.ownerId,
          isValid: valid
        });
      } catch (err) {
        process.send({
          status: err.code === 'LOCK_TIMEOUT' ? 'timeout' : 'error',
          error: err.message
        });
      }
    } else if (msg.action === 'release') {
      if (activeReleaseCallback) {
        await activeReleaseCallback();
        activeReleaseCallback = null;
        process.send({ status: 'released' });
      } else {
        process.send({ status: 'error', error: 'No active lock to release' });
      }
    } else if (msg.action === 'checkValid') {
      if (activeReleaseCallback) {
        const valid = await activeReleaseCallback.isValid();
        process.send({ status: 'validCheck', isValid: valid });
      } else {
        process.send({ status: 'validCheck', isValid: false });
      }
    } else if (msg.action === 'attemptUnauthorizedRelease') {
      // Simulate a stale process attempting to delete a lock it does not own
      const deleteResult = await MediaLock.deleteOne({ _id: msg.key, owner: msg.staleOwnerId });
      process.send({
        status: 'unauthorizedReleaseAttempted',
        deletedCount: deleteResult.deletedCount
      });
    } else if (msg.action === 'validateLockStatus') {
      const isStillValid = activeReleaseCallback ? await activeReleaseCallback.isValid() : false;
      process.send({
        status: 'lockStatus',
        isValid: isStillValid,
        fencingToken: activeReleaseCallback?.fencingToken
      });
    } else if (msg.action === 'stopHeartbeat') {
      if (activeReleaseCallback?.stopHeartbeat) {
        activeReleaseCallback.stopHeartbeat();
      }
      process.send({ status: 'heartbeatStopped' });
    } else if (msg.action === 'ensureSafetyMargin') {
      const marginResult = activeReleaseCallback?.ensureSafetyMargin
        ? await activeReleaseCallback.ensureSafetyMargin(msg.minMarginMs || 5000)
        : false;
      process.send({ status: 'safetyMarginResult', isSafe: marginResult });
    } else if (msg.action === 'exit') {
      try {
        if (mongoose.connection.readyState === 1) {
          await mongoose.disconnect();
        }
      } catch {}
      process.send({ status: 'exited' });
      setTimeout(() => process.exit(0), 50);
    }
  } catch (globalErr) {
    process.send({ status: 'error', error: globalErr.message });
  }
});
