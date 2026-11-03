import mongoose from 'mongoose';
import { extractCloudinaryPublicId, getCloudinary } from '../routes/uploadRoutes.js';
import { extractInstagramShortcode } from './reelService.js';
import { broadcastDbChange, notifyStorageChanged } from '../services/storageMonitor.js';
import Doctor from '../models/Doctor.js';
import Hospital from '../models/Hospital.js';
import MediaLock from '../models/MediaLock.js';
import PendingMediaDeletion from '../models/PendingMediaDeletion.js';

/**
 * Production-Grade Distributed Lock Manager.
 * Combines an in-process Promise queue with atomic MongoDB TTL locks.
 * Safe across single-instance processes, PM2 clusters, and multi-replica Cloud Run deployments.
 */
class DistributedLockManager {
  constructor() {
    this.inMemoryLocks = new Map();
  }

  async acquire(key, ttlMs = 20000, maxWaitMs = 12000) {
    if (!key) {
      const dummyRelease = () => {};
      dummyRelease.release = dummyRelease;
      dummyRelease.isValid = () => true;
      dummyRelease.fencingToken = 0;
      dummyRelease.ownerId = 'none';
      return dummyRelease;
    }

    // 1. Process-local serialization to prevent local thread contention
    while (this.inMemoryLocks.has(key)) {
      await this.inMemoryLocks.get(key);
    }
    let resolveLocalLock;
    const localLockPromise = new Promise(resolve => {
      resolveLocalLock = resolve;
    });
    this.inMemoryLocks.set(key, localLockPromise);

    // 2. Distributed MongoDB lock across instances/replicas
    const ownerId = `${process.pid}_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
    const startTime = Date.now();
    let acquiredMongoLock = false;
    let currentFencingToken = 1;

    try {
      while (Date.now() - startTime < maxWaitMs) {
        const now = new Date();
        const expiresAt = new Date(Date.now() + ttlMs);

        try {
          // Attempt atomic takeover of expired lock or re-entrant acquire by same owner
          const updated = await MediaLock.findOneAndUpdate(
            {
              _id: key,
              $or: [{ expiresAt: { $lte: now } }, { owner: ownerId }]
            },
            {
              $set: { owner: ownerId, expiresAt },
              $inc: { fencingToken: 1 }
            },
            { upsert: false, returnDocument: 'after' }
          );

          if (updated) {
            acquiredMongoLock = true;
            currentFencingToken = updated.fencingToken || 1;
            break;
          }

          // If no lock record exists, attempt to insert atomically
          await MediaLock.create({
            _id: key,
            owner: ownerId,
            expiresAt,
            fencingToken: 1
          });
          acquiredMongoLock = true;
          currentFencingToken = 1;
          break;
        } catch (mongoErr) {
          // E11000 duplicate key means another instance currently holds the active lock
          if (mongoErr.code === 11000 || mongoErr.message?.includes('duplicate key')) {
            const jitter = Math.floor(Math.random() * 80) + 70; // 70-150ms jittered poll
            await new Promise(r => setTimeout(r, jitter));
          } else {
            console.warn(`[DistributedLock] MongoDB lock warning for "${key}": ${mongoErr.message}. Relying on local lock.`);
            break;
          }
        }
      }
    } catch (outerErr) {
      console.warn(`[DistributedLock] Lock acquire error for "${key}": ${outerErr.message}`);
    }

    if (!acquiredMongoLock && (Date.now() - startTime >= maxWaitMs)) {
      this.inMemoryLocks.delete(key);
      if (typeof resolveLocalLock === 'function') resolveLocalLock();
      const err = new Error(`Lock acquisition timed out for key "${key}" after ${maxWaitMs}ms`);
      err.code = 'LOCK_TIMEOUT';
      throw err;
    }

    let heartbeatTimer = null;
    let heartbeatLost = false;

    const renew = async (additionalMs = ttlMs) => {
      if (!acquiredMongoLock || heartbeatLost) return false;
      try {
        const now = new Date();
        const newExpiresAt = new Date(Date.now() + additionalMs);
        const updated = await MediaLock.findOneAndUpdate(
          {
            _id: key,
            owner: ownerId,
            fencingToken: currentFencingToken,
            expiresAt: { $gt: now }
          },
          { $set: { expiresAt: newExpiresAt } },
          { returnDocument: 'after' }
        );

        if (!updated) {
          heartbeatLost = true;
          return false;
        }
        return true;
      } catch (err) {
        console.warn(`[DistributedLock] Lease renewal failed for "${key}": ${err.message}`);
        heartbeatLost = true;
        return false;
      }
    };

    const ensureSafetyMargin = async (minMarginMs = 8000, extensionMs = ttlMs) => {
      if (!acquiredMongoLock || heartbeatLost) return false;
      try {
        const doc = await MediaLock.findById(key);
        if (!doc || doc.owner !== ownerId || doc.fencingToken !== currentFencingToken) {
          heartbeatLost = true;
          return false;
        }
        const remainingMs = new Date(doc.expiresAt).getTime() - Date.now();
        if (remainingMs < minMarginMs) {
          return await renew(extensionMs);
        }
        return true;
      } catch {
        heartbeatLost = true;
        return false;
      }
    };

    const isValid = async () => {
      if (!acquiredMongoLock || heartbeatLost) return false;
      try {
        const doc = await MediaLock.findById(key);
        return Boolean(
          doc &&
          doc.owner === ownerId &&
          doc.fencingToken === currentFencingToken &&
          new Date(doc.expiresAt) > new Date()
        );
      } catch {
        return false;
      }
    };

    // Automatic lease renewal heartbeat to protect long-running Cloudinary calls
    if (acquiredMongoLock && ttlMs >= 3000) {
      const intervalMs = Math.max(1500, Math.floor(ttlMs / 3));
      heartbeatTimer = setInterval(async () => {
        const ok = await renew(ttlMs);
        if (!ok && heartbeatTimer) {
          clearInterval(heartbeatTimer);
          heartbeatTimer = null;
        }
      }, intervalMs);
      if (heartbeatTimer.unref) heartbeatTimer.unref();
    }

    // Return callable release callback with metadata attached
    const releaseCallback = async () => {
      if (heartbeatTimer) {
        clearInterval(heartbeatTimer);
        heartbeatTimer = null;
      }
      if (acquiredMongoLock) {
        try {
          await MediaLock.deleteOne({ _id: key, owner: ownerId, fencingToken: currentFencingToken });
        } catch (delErr) {
          console.warn(`[DistributedLock] Release error for "${key}": ${delErr.message}`);
        }
      }
      this.inMemoryLocks.delete(key);
      if (typeof resolveLocalLock === 'function') {
        resolveLocalLock();
      }
    };

    releaseCallback.release = releaseCallback;
    releaseCallback.isValid = isValid;
    releaseCallback.renew = renew;
    releaseCallback.ensureSafetyMargin = ensureSafetyMargin;
    releaseCallback.stopHeartbeat = () => {
      if (heartbeatTimer) {
        clearInterval(heartbeatTimer);
        heartbeatTimer = null;
      }
    };
    releaseCallback.fencingToken = currentFencingToken;
    releaseCallback.ownerId = ownerId;

    return releaseCallback;
  }
}

export const assetLock = new DistributedLockManager();

/**
 * Safely escapes regex characters for MongoDB queries
 */
const escapeRegex = (s) => String(s).replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

/**
 * Normalizes video identifier from any reel string or object.
 * Returns: { publicId, shortcode, rawUrl }
 */
export const extractVideoIdentifier = (reelOrUrl) => {
  if (!reelOrUrl) return { publicId: null, shortcode: null, rawUrl: '' };
  const rawUrl = typeof reelOrUrl === 'string'
    ? reelOrUrl.trim()
    : (reelOrUrl.url || reelOrUrl.link || '').trim();
  if (!rawUrl) return { publicId: null, shortcode: null, rawUrl: '' };

  const shortcode = extractInstagramShortcode(rawUrl);
  let publicId = null;

  if (rawUrl.includes('cloudinary.com')) {
    publicId = extractCloudinaryPublicId(rawUrl);
  } else if (shortcode) {
    publicId = `sehatbuddy/reels/ig_${shortcode}`;
  }

  return { publicId, shortcode, rawUrl };
};

/**
 * Normalizes cover photo identifier from a reel item or cover URL.
 * Distinguishes between default generated thumbnails (ig_<shortcode>) and exclusive custom covers.
 * Returns: { publicId, shortcode, isDefaultThumbnail, rawUrl }
 */
export const extractCoverIdentifier = (reelOrCoverUrl, associatedVideoUrl = null) => {
  if (!reelOrCoverUrl && !associatedVideoUrl) {
    return { publicId: null, shortcode: null, isDefaultThumbnail: false, rawUrl: '' };
  }

  let rawCover = '';
  if (typeof reelOrCoverUrl === 'string') {
    rawCover = reelOrCoverUrl.trim();
  } else if (reelOrCoverUrl && typeof reelOrCoverUrl === 'object') {
    rawCover = (reelOrCoverUrl.coverPhoto || reelOrCoverUrl.cover || '').trim();
  }

  // Filter out internal API proxy endpoints
  if (rawCover && (rawCover.includes('reel-cover') || rawCover.startsWith('api/') || rawCover.startsWith('/api/'))) {
    rawCover = '';
  }

  const videoUrl = associatedVideoUrl || (typeof reelOrCoverUrl === 'object' ? (reelOrCoverUrl.url || reelOrCoverUrl.link || '') : '');
  const videoShortcode = extractInstagramShortcode(videoUrl);

  if (!rawCover) {
    if (videoShortcode) {
      return {
        publicId: `sehatbuddy/covers/ig_${videoShortcode}`,
        shortcode: videoShortcode,
        isDefaultThumbnail: true,
        rawUrl: ''
      };
    }
    return { publicId: null, shortcode: null, isDefaultThumbnail: false, rawUrl: '' };
  }

  const coverShortcode = extractInstagramShortcode(rawCover);
  let publicId = null;

  if (rawCover.includes('cloudinary.com')) {
    publicId = extractCloudinaryPublicId(rawCover);
  } else if (coverShortcode) {
    publicId = `sehatbuddy/covers/ig_${coverShortcode}`;
  }

  const isDefaultThumbnail = Boolean(
    (coverShortcode && coverShortcode === videoShortcode) ||
    (publicId && (publicId.startsWith('sehatbuddy/covers/ig_') || publicId.startsWith('sehatbuddy/reels/ig_')))
  );

  return {
    publicId: publicId || (coverShortcode ? `sehatbuddy/covers/ig_${coverShortcode}` : null),
    shortcode: coverShortcode || (isDefaultThumbnail ? videoShortcode : null),
    isDefaultThumbnail,
    rawUrl: rawCover
  };
};

/**
 * Checks whether an individual reel item matches a given video public ID or shortcode
 */
const matchesVideoAsset = (item, targetPublicId, targetShortcode) => {
  if (!item) return false;
  const v = extractVideoIdentifier(item);
  if (targetPublicId && v.publicId && v.publicId === targetPublicId) return true;
  if (targetShortcode && v.shortcode && v.shortcode === targetShortcode) return true;
  return false;
};

/**
 * Checks whether an individual reel item matches a given cover public ID or shortcode
 */
const matchesCoverAsset = (item, targetPublicId, targetShortcode) => {
  if (!item) return false;
  const c = extractCoverIdentifier(item);
  if (targetPublicId && c.publicId && c.publicId === targetPublicId) return true;
  if (targetShortcode && c.shortcode && c.shortcode === targetShortcode) return true;
  return false;
};

/**
 * Dynamically counts how many valid references exist across ALL doctors and hospitals in MongoDB
 * for a specific reel VIDEO asset (excluding the specified doctor/hospital).
 */
export const countVideoReferences = async (videoAsset, excludeDocId = null, excludeHospId = null) => {
  if (mongoose.connection.readyState !== 1) {
    throw new Error('Database unavailable: MongoDB is not connected');
  }

  const v = typeof videoAsset === 'object' && videoAsset !== null ? videoAsset : extractVideoIdentifier(videoAsset);
  const searchTerms = Array.from(new Set([v.publicId, v.shortcode].filter(Boolean)));
  if (searchTerms.length === 0) {
    return { count: 0, referencingDoctorIds: [], referencingHospitalIds: [], doctors: [], hospitals: [] };
  }

  const orConditions = searchTerms.map(term => ({
    $or: [
      { 'reels.url': { $regex: escapeRegex(term), $options: 'i' } },
      { 'reels.link': { $regex: escapeRegex(term), $options: 'i' } },
      { reels: { $regex: escapeRegex(term), $options: 'i' } }
    ]
  }));

  const docFilter = { $or: orConditions };
  if (excludeDocId) {
    const excludeIds = [excludeDocId, String(excludeDocId)];
    if (mongoose.Types.ObjectId.isValid(excludeDocId)) {
      excludeIds.push(new mongoose.Types.ObjectId(excludeDocId));
    }
    docFilter._id = { $nin: excludeIds };
    docFilter.id = { $nin: [String(excludeDocId)] };
  }

  const hospFilter = { $or: orConditions };
  if (excludeHospId) {
    const excludeHospIds = [excludeHospId, String(excludeHospId)];
    if (mongoose.Types.ObjectId.isValid(excludeHospId)) {
      excludeHospIds.push(new mongoose.Types.ObjectId(excludeHospId));
    }
    hospFilter._id = { $nin: excludeHospIds };
    hospFilter.id = { $nin: [String(excludeHospId)] };
  }

  const [rawDoctors, rawHospitals] = await Promise.all([
    Doctor.find(docFilter).select('_id name email reels').lean(),
    Hospital.find(hospFilter).select('_id name email reels').lean()
  ]);

  // Post-filter to eliminate false-positive substring matches
  const referencingDoctors = rawDoctors.filter(d =>
    Array.isArray(d.reels) && d.reels.some(r => matchesVideoAsset(r, v.publicId, v.shortcode))
  );
  const referencingHospitals = rawHospitals.filter(h =>
    Array.isArray(h.reels) && h.reels.some(r => matchesVideoAsset(r, v.publicId, v.shortcode))
  );

  const docIds = referencingDoctors.map(d => String(d._id));
  const hospIds = referencingHospitals.map(h => String(h._id));

  return {
    count: docIds.length + hospIds.length,
    referencingDoctorIds: docIds,
    referencingHospitalIds: hospIds,
    doctors: referencingDoctors,
    hospitals: referencingHospitals
  };
};

/**
 * Dynamically counts how many valid references exist across ALL doctors and hospitals in MongoDB
 * for a specific reel COVER IMAGE asset (excluding the specified doctor/hospital).
 */
export const countCoverReferences = async (coverAsset, excludeDocId = null, excludeHospId = null) => {
  if (mongoose.connection.readyState !== 1) {
    throw new Error('Database unavailable: MongoDB is not connected');
  }

  const c = typeof coverAsset === 'object' && coverAsset !== null ? coverAsset : extractCoverIdentifier(coverAsset);
  const searchTerms = Array.from(new Set([c.publicId, c.shortcode].filter(Boolean)));
  if (searchTerms.length === 0) {
    return { count: 0, referencingDoctorIds: [], referencingHospitalIds: [], doctors: [], hospitals: [] };
  }

  const orConditions = searchTerms.map(term => ({
    $or: [
      { 'reels.coverPhoto': { $regex: escapeRegex(term), $options: 'i' } },
      { 'reels.cover': { $regex: escapeRegex(term), $options: 'i' } }
    ]
  }));

  const docFilter = { $or: orConditions };
  if (excludeDocId) {
    const excludeIds = [excludeDocId, String(excludeDocId)];
    if (mongoose.Types.ObjectId.isValid(excludeDocId)) {
      excludeIds.push(new mongoose.Types.ObjectId(excludeDocId));
    }
    docFilter._id = { $nin: excludeIds };
    docFilter.id = { $nin: [String(excludeDocId)] };
  }

  const hospFilter = { $or: orConditions };
  if (excludeHospId) {
    const excludeHospIds = [excludeHospId, String(excludeHospId)];
    if (mongoose.Types.ObjectId.isValid(excludeHospId)) {
      excludeHospIds.push(new mongoose.Types.ObjectId(excludeHospId));
    }
    hospFilter._id = { $nin: excludeHospIds };
    hospFilter.id = { $nin: [String(excludeHospId)] };
  }

  const [rawDoctors, rawHospitals] = await Promise.all([
    Doctor.find(docFilter).select('_id name email reels').lean(),
    Hospital.find(hospFilter).select('_id name email reels').lean()
  ]);

  // Post-filter to eliminate false-positive substring matches
  const referencingDoctors = rawDoctors.filter(d =>
    Array.isArray(d.reels) && d.reels.some(r => matchesCoverAsset(r, c.publicId, c.shortcode))
  );
  const referencingHospitals = rawHospitals.filter(h =>
    Array.isArray(h.reels) && h.reels.some(r => matchesCoverAsset(r, c.publicId, c.shortcode))
  );

  const docIds = referencingDoctors.map(d => String(d._id));
  const hospIds = referencingHospitals.map(h => String(h._id));

  return {
    count: docIds.length + hospIds.length,
    referencingDoctorIds: docIds,
    referencingHospitalIds: hospIds,
    doctors: referencingDoctors,
    hospitals: referencingHospitals
  };
};

/**
 * Short-lived LRU cache of recently destroyed Cloudinary public IDs (60s TTL)
 * Eliminates redundant network calls when concurrent operations remove the same asset.
 */
const recentlyDestroyedCache = new Map();

const isRecentlyDestroyed = (publicId) => {
  if (!publicId) return false;
  const ts = recentlyDestroyedCache.get(publicId);
  if (!ts) return false;
  if (Date.now() - ts > 60000) {
    recentlyDestroyedCache.delete(publicId);
    return false;
  }
  return true;
};

const markRecentlyDestroyed = (publicId) => {
  if (!publicId) return;
  recentlyDestroyedCache.set(publicId, Date.now());
  if (recentlyDestroyedCache.size > 2000) {
    const oldestKey = recentlyDestroyedCache.keys().next().value;
    recentlyDestroyedCache.delete(oldestKey);
  }
};

/**
 * Safely destroys a Cloudinary asset with idempotency, lease renewal protection, and persistent failure recovery.
 * Validates fencing token/lock lease with safety margin and fails closed if MongoDB is disconnected.
 * If Cloudinary fails (e.g. network timeout or API error), persists to PendingMediaDeletion retry queue.
 */
const destroyCloudinaryAsset = async (cld, publicId, resourceType, assetType = 'video', lockCallback = null) => {
  if (!cld || !publicId) return { result: 'skipped' };

  // Fail closed if MongoDB is disconnected
  if (mongoose.connection.readyState !== 1) {
    console.error(`[ReelCleanup] Database unavailable. Refusing to destroy "${publicId}".`);
    return { result: 'db_unavailable', error: 'Database unavailable' };
  }

  // 1. Validate lock ownership, fencing token, and ensure safe lease window before destructive call
  if (lockCallback) {
    if (typeof lockCallback.ensureSafetyMargin === 'function') {
      const isSafeLease = await lockCallback.ensureSafetyMargin(5000);
      if (!isSafeLease) {
        console.warn(`[ReelCleanup] Lock lease expired or superseded for "${publicId}". Aborting Cloudinary destroy.`);
        return { result: 'lock_invalid', error: 'Lock lease expired or superseded' };
      }
    } else if (typeof lockCallback.isValid === 'function') {
      const isLockValid = await lockCallback.isValid();
      if (!isLockValid) {
        console.warn(`[ReelCleanup] Fencing token or lock expired/invalid for "${publicId}". Aborting Cloudinary destroy.`);
        return { result: 'lock_invalid', error: 'Fencing token or lock expired/invalid' };
      }
    }
  }

  // 2. Immediate double-check of live database references within the verified lease window
  try {
    const liveRefs = (assetType === 'video' || resourceType === 'video')
      ? await countVideoReferences(publicId)
      : await countCoverReferences(publicId);

    if (liveRefs.count > 0) {
      console.log(`[ReelCleanup] Live references detected (${liveRefs.count}) right before destroy for "${publicId}". Aborting Cloudinary deletion.`);
      return { result: 'aborted_referenced', remainingRefs: liveRefs.count };
    }
  } catch (refErr) {
    console.error(`[ReelCleanup] Reference check error before destroy for "${publicId}":`, refErr.message);
    return { result: 'ref_check_failed', error: refErr.message };
  }

  if (isRecentlyDestroyed(publicId)) {
    console.log(`[ReelCleanup] Asset "${publicId}" was already destroyed recently. Skipping duplicate Cloudinary destroy.`);
    return { result: 'not found', alreadyDestroyed: true };
  }

  try {
    const res = await cld.uploader.destroy(publicId, {
      resource_type: resourceType,
      invalidate: true
    });

    if (res?.result === 'ok' || res?.result === 'not found') {
      markRecentlyDestroyed(publicId);
      // Successfully deleted or verified absent from Cloudinary; clear from pending queue if present
      await PendingMediaDeletion.deleteOne({ publicId }).catch(() => {});
      return res;
    }

    // Cloudinary returned non-ok error status; record in retry queue
    await PendingMediaDeletion.findOneAndUpdate(
      { publicId },
      {
        $set: {
          resourceType,
          assetType,
          status: 'failed',
          lastError: res?.result || 'Cloudinary destroy failed',
          nextRetryAt: new Date(Date.now() + 60 * 1000)
        },
        $inc: { attempts: 1 }
      },
      { upsert: true, returnDocument: 'after' }
    ).catch(() => {});

    return res;
  } catch (err) {
    console.warn(`[ReelCleanup] Cloudinary destroy error for "${publicId}" (${resourceType}):`, err.message);

    // Persist failure to MongoDB retry queue
    await PendingMediaDeletion.findOneAndUpdate(
      { publicId },
      {
        $set: {
          resourceType,
          assetType,
          status: 'failed',
          lastError: err.message,
          nextRetryAt: new Date(Date.now() + 60 * 1000)
        },
        $inc: { attempts: 1 }
      },
      { upsert: true, returnDocument: 'after' }
    ).catch(() => {});

    return { result: 'error', error: err.message };
  }
};

/**
 * Processes queued Cloudinary deletions that failed during earlier operations.
 * Called automatically by periodic background workers or administrative sweeps.
 */
export const processPendingMediaDeletions = async (batchSize = 25, workerId = `worker_${process.pid}_${Date.now()}`) => {
  const cld = getCloudinary();
  if (!cld) return { processed: 0, succeeded: 0, cancelled: 0, failed: 0 };

  const claimedJobs = [];
  const staleThreshold = new Date(Date.now() - 5 * 60 * 1000); // 5 minutes stale lock recovery

  // Atomically claim eligible jobs one-by-one to prevent duplicate processing across multi-instance Cloud Run replicas
  for (let i = 0; i < batchSize; i++) {
    const now = new Date();
    try {
      const job = await PendingMediaDeletion.findOneAndUpdate(
        {
          $or: [
            {
              status: { $in: ['pending', 'failed'] },
              nextRetryAt: { $lte: now },
              attempts: { $lt: 5 }
            },
            {
              status: 'processing',
              lockedAt: { $lt: staleThreshold } // Reclaim crashed/stale worker jobs
            }
          ]
        },
        {
          $set: {
            status: 'processing',
            lockedAt: now,
            lockedBy: workerId
          }
        },
        { returnDocument: 'after' }
      );

      if (!job) break; // No more eligible jobs to claim
      claimedJobs.push(job);
    } catch (claimErr) {
      console.warn(`[ReelCleanup Retry] Error claiming job: ${claimErr.message}`);
      break;
    }
  }

  let succeeded = 0;
  let cancelled = 0;
  let failed = 0;

  for (const item of claimedJobs) {
    const releaseLock = await assetLock.acquire(item.publicId);
    try {
      // Re-verify that no doctor or hospital has re-added this asset in the meantime
      const isVideo = item.assetType === 'video' || item.resourceType === 'video';
      const refCheck = isVideo
        ? await countVideoReferences(item.publicId)
        : await countCoverReferences(item.publicId);

      if (refCheck.count > 0) {
        console.log(`[ReelCleanup Retry] Asset "${item.publicId}" was re-referenced by ${refCheck.count} profile(s). Cancelling deletion.`);
        await PendingMediaDeletion.updateOne(
          { _id: item._id },
          {
            $set: {
              status: 'cancelled',
              lastError: `Re-referenced by ${refCheck.count} profile(s)`,
              lockedAt: null,
              lockedBy: null
            }
          }
        );
        cancelled++;
        continue;
      }

      // Validate fencing token and lock lease with safety margin immediately before Cloudinary destroy
      if (releaseLock) {
        if (typeof releaseLock.ensureSafetyMargin === 'function') {
          const isSafeLease = await releaseLock.ensureSafetyMargin(5000);
          if (!isSafeLease) {
            console.warn(`[ReelCleanup Retry] Lock lease expired or superseded for "${item.publicId}". Skipping retry.`);
            failed++;
            continue;
          }
        } else if (typeof releaseLock.isValid === 'function') {
          const isLockValid = await releaseLock.isValid();
          if (!isLockValid) {
            console.warn(`[ReelCleanup Retry] Lock or fencing token invalid/expired for "${item.publicId}". Skipping retry.`);
            failed++;
            continue;
          }
        }
      }

      // References confirmed zero, attempt Cloudinary deletion
      const resourceType = item.resourceType || (item.assetType === 'video' ? 'video' : 'image');
      const res = await cld.uploader.destroy(item.publicId, {
        resource_type: resourceType,
        invalidate: true
      });

      if (res?.result === 'ok' || res?.result === 'not found') {
        await PendingMediaDeletion.deleteOne({ _id: item._id });
        succeeded++;
      } else {
        const nextDelay = Math.min(3600000, 1000 * Math.pow(2, item.attempts + 1));
        await PendingMediaDeletion.updateOne(
          { _id: item._id },
          {
            $set: {
              status: 'failed',
              lastError: res?.result || 'Cloudinary retry failed',
              nextRetryAt: new Date(Date.now() + nextDelay),
              lockedAt: null,
              lockedBy: null
            },
            $inc: { attempts: 1 }
          }
        );
        failed++;
      }
    } catch (err) {
      const nextDelay = Math.min(3600000, 1000 * Math.pow(2, item.attempts + 1));
      await PendingMediaDeletion.updateOne(
        { _id: item._id },
        {
          $set: {
            status: 'failed',
            lastError: err.message,
            nextRetryAt: new Date(Date.now() + nextDelay),
            lockedAt: null,
            lockedBy: null
          },
          $inc: { attempts: 1 }
        }
      ).catch(() => {});
      failed++;
    } finally {
      await releaseLock();
    }
  }

  return { processed: claimedJobs.length, succeeded, cancelled, failed };
};

/**
 * Core reference-based deletion orchestrator for a removed reel item.
 * Independent lifecycle for video and cover photo:
 * 1. Video is preserved if count >= 1; permanently destroyed from Cloudinary if count === 0.
 * 2. Exclusive custom cover is permanently destroyed immediately if its own reference count === 0.
 * 3. Default thumbnail is preserved while the shared video is in use; destroyed when video is unreferenced and no other profile references the thumbnail.
 */
export const deleteReelAssetSafely = async (videoAssetInput, coverAssetInput, excludeDocId = null, excludeHospId = null, skipLock = false) => {
  // Fail closed if MongoDB is unavailable to prevent accidental media destruction
  if (mongoose.connection.readyState !== 1) {
    console.error('[ReelCleanup] MongoDB is unavailable. Failing closed to prevent accidental media deletion.');
    return {
      deletedVideo: false,
      deletedCover: false,
      remainingVideoRefs: -1,
      remainingCoverRefs: -1,
      error: 'Database unavailable: MongoDB is not connected'
    };
  }

  const videoAsset = typeof videoAssetInput === 'object' && videoAssetInput !== null ? videoAssetInput : extractVideoIdentifier(videoAssetInput);
  const coverAsset = typeof coverAssetInput === 'object' && coverAssetInput !== null ? coverAssetInput : extractCoverIdentifier(coverAssetInput, videoAsset.rawUrl);

  const videoLockKey = (!skipLock && (videoAsset.publicId || videoAsset.shortcode)) || '';
  const coverLockKey = (!skipLock && (coverAsset.publicId || coverAsset.shortcode)) || '';

  const releaseVideoLock = videoLockKey ? await assetLock.acquire(videoLockKey) : () => {};
  const releaseCoverLock = coverLockKey ? await assetLock.acquire(coverLockKey) : () => {};

  let deletedVideo = false;
  let deletedCover = false;
  let remainingVideoRefs = 0;
  let remainingCoverRefs = 0;

  try {
    const cld = getCloudinary();

    // 1. Check and handle Video asset
    if (videoAsset.publicId || videoAsset.shortcode) {
      const videoRefs = await countVideoReferences(videoAsset, excludeDocId, excludeHospId);
      remainingVideoRefs = videoRefs.count;

      if (remainingVideoRefs > 0) {
        console.log(`[ReelCleanup] Shared video "${videoAsset.publicId}" preserved. Still referenced by ${remainingVideoRefs} doctor/hospital profile(s).`);
      } else if (videoAsset.publicId && cld) {
        console.log(`[ReelCleanup] Reel video "${videoAsset.publicId}" has 0 remaining references. Permanently destroying from Cloudinary.`);
        const destroyRes = await destroyCloudinaryAsset(cld, videoAsset.publicId, 'video', 'video', releaseVideoLock);
        if (destroyRes.result === 'ok' || destroyRes.result === 'not found') {
          deletedVideo = true;
        }
      }
    }

    // 2. Check and handle Cover Photo asset independently
    if (coverAsset.publicId) {
      if (coverAsset.isDefaultThumbnail) {
        // Default / Instagram generated thumbnail tied to the reel shortcode
        // Rule: Preserve while shared video is still in use by ANY doctor/hospital
        if (remainingVideoRefs > 0) {
          console.log(`[ReelCleanup] Default cover "${coverAsset.publicId}" preserved because shared video is still in use by ${remainingVideoRefs} profile(s).`);
        } else {
          // Shared video has 0 references. Check if any profile has an independent reference to this cover
          const coverRefs = await countCoverReferences(coverAsset, excludeDocId, excludeHospId);
          remainingCoverRefs = coverRefs.count;
          if (remainingCoverRefs === 0 && cld) {
            console.log(`[ReelCleanup] Default cover "${coverAsset.publicId}" has 0 remaining references. Permanently destroying from Cloudinary.`);
            const destroyRes = await destroyCloudinaryAsset(cld, coverAsset.publicId, 'image', 'cover', releaseCoverLock);
            if (destroyRes.result === 'ok' || destroyRes.result === 'not found') {
              deletedCover = true;
            }
          } else {
            console.log(`[ReelCleanup] Default cover "${coverAsset.publicId}" preserved. Referenced by ${remainingCoverRefs} profile(s).`);
          }
        }
      } else {
        // Exclusive custom uploaded cover image
        // Rule: Delete immediately if its own reference count is 0, completely independent of video sharing
        const coverRefs = await countCoverReferences(coverAsset, excludeDocId, excludeHospId);
        remainingCoverRefs = coverRefs.count;

        if (remainingCoverRefs === 0 && cld) {
          console.log(`[ReelCleanup] Exclusive custom cover "${coverAsset.publicId}" has 0 remaining references. Permanently destroying from Cloudinary.`);
          const destroyRes = await destroyCloudinaryAsset(cld, coverAsset.publicId, 'image', 'cover', releaseCoverLock);
          if (destroyRes.result === 'ok' || destroyRes.result === 'not found') {
            deletedCover = true;
          }
        } else {
          console.log(`[ReelCleanup] Custom cover "${coverAsset.publicId}" preserved. Shared by ${remainingCoverRefs} profile(s).`);
        }
      }
    }

    if (deletedVideo || deletedCover) {
      notifyStorageChanged('cloudinary:cleanup');
    }
  } catch (err) {
    console.error('[ReelCleanup] deleteReelAssetSafely error:', err.message);
  } finally {
    await releaseCoverLock();
    await releaseVideoLock();
  }

  return {
    deletedVideo,
    deletedCover,
    remainingVideoRefs,
    remainingCoverRefs
  };
};

/**
 * Atomically deletes a reel at reelIndex from a Doctor profile in MongoDB,
 * and performs dynamic reference-based deletion of its Cloudinary video and custom cover.
 */
export const deleteDoctorReelByIndex = async (doctorId, reelIndex) => {
  if (!doctorId || reelIndex === undefined || isNaN(Number(reelIndex))) {
    throw new Error('Valid doctorId and reelIndex are required');
  }

  const idx = Number(reelIndex);
  let doctor = null;
  if (mongoose.Types.ObjectId.isValid(doctorId)) {
    doctor = await Doctor.findById(doctorId);
  }
  if (!doctor) {
    doctor = await Doctor.findOne({ id: String(doctorId) });
  }
  if (!doctor) {
    throw new Error(`Doctor not found with ID: ${doctorId}`);
  }

  const currentReels = Array.isArray(doctor.reels) ? [...doctor.reels] : [];
  if (idx < 0 || idx >= currentReels.length || !currentReels[idx]) {
    return {
      success: true,
      message: 'Reel slot is already empty',
      remainingVideoRefs: 0,
      remainingCoverRefs: 0,
      deletedVideo: false,
      deletedCover: false
    };
  }

  const targetReel = currentReels[idx];
  const videoAsset = extractVideoIdentifier(targetReel);
  const coverAsset = extractCoverIdentifier(targetReel, videoAsset.rawUrl);

  const lockKey = videoAsset.publicId || videoAsset.shortcode || coverAsset.publicId || coverAsset.shortcode;
  const releaseLock = await assetLock.acquire(lockKey);

  try {
    currentReels[idx] = { url: '', coverPhoto: '' };
    const cleanedReels = currentReels.map(r => {
      if (typeof r === 'string') return r.trim() ? { url: r.trim(), coverPhoto: '' } : null;
      if (r && typeof r === 'object') {
        const u = (r.url || r.link || '').trim();
        const c = (r.coverPhoto || r.cover || '').trim();
        if (u || c) return { url: u, coverPhoto: c };
      }
      return null;
    }).filter(Boolean);

    await Doctor.updateOne(
      { _id: doctor._id },
      { $set: { reels: cleanedReels } }
    );
    broadcastDbChange('doctors', 'update', doctor._id, { ...doctor.toObject(), reels: cleanedReels });

    // Dynamic reference-based Cloudinary cleanup
    const cleanupResult = await deleteReelAssetSafely(videoAsset, coverAsset, doctor._id, null, true);

    return {
      success: true,
      message: 'Reel removed from doctor profile successfully',
      doctor: { _id: doctor._id, name: doctor.name, reels: cleanedReels },
      ...cleanupResult
    };
  } finally {
    await releaseLock();
  }
};

/**
 * Atomically removes only the custom cover photo of a reel at reelIndex from a Doctor profile in MongoDB,
 * and performs dynamic reference-based deletion of that custom cover from Cloudinary.
 */
export const deleteDoctorReelCoverByIndex = async (doctorId, reelIndex) => {
  if (!doctorId || reelIndex === undefined || isNaN(Number(reelIndex))) {
    throw new Error('Valid doctorId and reelIndex are required');
  }

  const idx = Number(reelIndex);
  let doctor = null;
  if (mongoose.Types.ObjectId.isValid(doctorId)) {
    doctor = await Doctor.findById(doctorId);
  }
  if (!doctor) {
    doctor = await Doctor.findOne({ id: String(doctorId) });
  }
  if (!doctor) {
    throw new Error(`Doctor not found with ID: ${doctorId}`);
  }

  const currentReels = Array.isArray(doctor.reels) ? [...doctor.reels] : [];
  if (idx < 0 || idx >= currentReels.length || !currentReels[idx]) {
    return {
      success: true,
      message: 'Reel slot is empty',
      deletedCover: false,
      remainingCoverRefs: 0
    };
  }

  const targetReel = currentReels[idx];
  const videoAsset = extractVideoIdentifier(targetReel);
  const coverAsset = extractCoverIdentifier(targetReel, videoAsset.rawUrl);

  const lockKey = coverAsset.publicId || coverAsset.shortcode;
  const releaseLock = await assetLock.acquire(lockKey);

  try {
    if (typeof targetReel === 'object') {
      currentReels[idx] = {
        ...targetReel,
        coverPhoto: ''
      };
    } else {
      currentReels[idx] = {
        url: targetReel,
        coverPhoto: ''
      };
    }

    await Doctor.updateOne(
      { _id: doctor._id },
      { $set: { reels: currentReels } }
    );
    broadcastDbChange('doctors', 'update', doctor._id, { ...doctor.toObject(), reels: currentReels });

    let cleanupResult = { deletedCover: false, remainingCoverRefs: 0 };
    if (coverAsset && coverAsset.publicId && !coverAsset.isDefaultThumbnail) {
      cleanupResult = await deleteReelAssetSafely(null, coverAsset, doctor._id, null, true);
    }

    return {
      success: true,
      message: 'Cover photo removed from doctor reel successfully',
      doctor: { _id: doctor._id, name: doctor.name, reels: currentReels },
      ...cleanupResult
    };
  } finally {
    await releaseLock();
  }
};

/**
 * Atomically removes only the custom cover photo of a reel at reelIndex from a Hospital profile in MongoDB,
 * and performs dynamic reference-based deletion of that custom cover from Cloudinary.
 */
export const deleteHospitalReelCoverByIndex = async (hospitalId, reelIndex) => {
  if (!hospitalId || reelIndex === undefined || isNaN(Number(reelIndex))) {
    throw new Error('Valid hospitalId and reelIndex are required');
  }

  const idx = Number(reelIndex);
  let hospital = null;
  if (mongoose.Types.ObjectId.isValid(hospitalId)) {
    hospital = await Hospital.findById(hospitalId);
  }
  if (!hospital) {
    hospital = await Hospital.findOne({ id: String(hospitalId) });
  }
  if (!hospital) {
    throw new Error(`Hospital not found with ID: ${hospitalId}`);
  }

  const currentReels = Array.isArray(hospital.reels) ? [...hospital.reels] : [];
  if (idx < 0 || idx >= currentReels.length || !currentReels[idx]) {
    return {
      success: true,
      message: 'Reel slot is empty',
      deletedCover: false,
      remainingCoverRefs: 0
    };
  }

  const targetReel = currentReels[idx];
  const videoAsset = extractVideoIdentifier(targetReel);
  const coverAsset = extractCoverIdentifier(targetReel, videoAsset.rawUrl);

  const lockKey = coverAsset.publicId || coverAsset.shortcode;
  const releaseLock = await assetLock.acquire(lockKey);

  try {
    if (typeof targetReel === 'object') {
      currentReels[idx] = {
        ...targetReel,
        coverPhoto: ''
      };
    } else {
      currentReels[idx] = {
        url: targetReel,
        coverPhoto: ''
      };
    }

    await Hospital.updateOne(
      { _id: hospital._id },
      { $set: { reels: currentReels } }
    );
    broadcastDbChange('hospitals', 'update', hospital._id, { ...hospital.toObject(), reels: currentReels });

    let cleanupResult = { deletedCover: false, remainingCoverRefs: 0 };
    if (coverAsset && coverAsset.publicId && !coverAsset.isDefaultThumbnail) {
      cleanupResult = await deleteReelAssetSafely(null, coverAsset, null, hospital._id, true);
    }

    return {
      success: true,
      message: 'Cover photo removed from hospital reel successfully',
      hospital: { _id: hospital._id, name: hospital.name, reels: currentReels },
      ...cleanupResult
    };
  } finally {
    await releaseLock();
  }
};

/**
 * Atomically deletes a reel at reelIndex from a Hospital profile in MongoDB,
 * and performs dynamic reference-based deletion of its Cloudinary video and custom cover.
 */
export const deleteHospitalReelByIndex = async (hospitalId, reelIndex) => {
  if (!hospitalId || reelIndex === undefined || isNaN(Number(reelIndex))) {
    throw new Error('Valid hospitalId and reelIndex are required');
  }

  const idx = Number(reelIndex);
  let hospital = null;
  if (mongoose.Types.ObjectId.isValid(hospitalId)) {
    hospital = await Hospital.findById(hospitalId);
  }
  if (!hospital) {
    hospital = await Hospital.findOne({ id: String(hospitalId) });
  }
  if (!hospital) {
    throw new Error(`Hospital not found with ID: ${hospitalId}`);
  }

  const currentReels = Array.isArray(hospital.reels) ? [...hospital.reels] : [];
  if (idx < 0 || idx >= currentReels.length || !currentReels[idx]) {
    return {
      success: true,
      message: 'Reel slot is already empty',
      remainingVideoRefs: 0,
      remainingCoverRefs: 0,
      deletedVideo: false,
      deletedCover: false
    };
  }

  const targetReel = currentReels[idx];
  const videoAsset = extractVideoIdentifier(targetReel);
  const coverAsset = extractCoverIdentifier(targetReel, videoAsset.rawUrl);

  const lockKey = videoAsset.publicId || videoAsset.shortcode || coverAsset.publicId || coverAsset.shortcode;
  const releaseLock = await assetLock.acquire(lockKey);

  try {
    currentReels[idx] = { url: '', coverPhoto: '' };
    const cleanedReels = currentReels.map(r => {
      if (typeof r === 'string') return r.trim() ? { url: r.trim(), coverPhoto: '' } : null;
      if (r && typeof r === 'object') {
        const u = (r.url || r.link || '').trim();
        const c = (r.coverPhoto || r.cover || '').trim();
        if (u || c) return { url: u, coverPhoto: c };
      }
      return null;
    }).filter(Boolean);

    await Hospital.updateOne(
      { _id: hospital._id },
      { $set: { reels: cleanedReels } }
    );
    broadcastDbChange('hospitals', 'update', hospital._id, { ...hospital.toObject(), reels: cleanedReels });

    const cleanupResult = await deleteReelAssetSafely(videoAsset, coverAsset, null, hospital._id, true);

    return {
      success: true,
      message: 'Reel removed from hospital profile successfully',
      hospital: { _id: hospital._id, name: hospital.name, reels: cleanedReels },
      ...cleanupResult
    };
  } finally {
    await releaseLock();
  }
};

/**
 * Synchronizes active reels being added or updated in a doctor or hospital profile.
 * Acquires a distributed lock on each incoming reel/cover to prevent race conditions with deletion workers,
 * and purges/cancels any pending deletion records in PendingMediaDeletion for reactivated assets.
 */
export const synchronizeActiveReels = async (reels = []) => {
  if (!Array.isArray(reels) || reels.length === 0) return;

  for (const item of reels) {
    if (!item) continue;
    const v = extractVideoIdentifier(item);
    const c = extractCoverIdentifier(item, v.rawUrl);

    const keys = [v.publicId, c.publicId].filter(Boolean);
    for (const key of keys) {
      let releaseLock = () => {};
      try {
        releaseLock = await assetLock.acquire(key, 10000, 5000);
        // Cancel any queued/pending deletions for this newly active asset
        await PendingMediaDeletion.deleteMany({ publicId: key });
      } catch (err) {
        console.warn(`[ReelCleanup] synchronizeActiveReels warning for "${key}": ${err.message}`);
      } finally {
        await releaseLock();
      }
    }
  }
};

/**
 * Automatically detects and cleans up old Cloudinary reel videos and cover photos
 * that have been replaced, edited, or removed during doctor or hospital profile updates.
 */
export const cleanupReplacedReels = async (oldReels = [], newReels = [], excludeDocId = null, excludeHospId = null) => {
  // First, synchronize and protect all active/incoming reels against concurrent deletion
  if (Array.isArray(newReels) && newReels.length > 0) {
    await synchronizeActiveReels(newReels);
  }

  if (!Array.isArray(oldReels) || oldReels.length === 0) return;

  const getReelVideoKey = (r) => {
    const v = extractVideoIdentifier(r);
    return v.publicId || v.shortcode || v.rawUrl;
  };

  const getReelCoverKey = (r) => {
    const c = extractCoverIdentifier(r);
    return c.publicId || c.shortcode || c.rawUrl;
  };

  const newVideoKeys = new Set((newReels || []).map(getReelVideoKey).filter(Boolean));
  const newCoverKeys = new Set((newReels || []).map(getReelCoverKey).filter(Boolean));

  for (const oldItem of oldReels) {
    if (!oldItem) continue;
    const vAsset = extractVideoIdentifier(oldItem);
    const cAsset = extractCoverIdentifier(oldItem, vAsset.rawUrl);

    const vKey = getReelVideoKey(oldItem);
    const cKey = getReelCoverKey(oldItem);

    const videoRemoved = vKey && !newVideoKeys.has(vKey);
    const coverRemoved = cKey && !newCoverKeys.has(cKey);

    if (videoRemoved || coverRemoved) {
      await deleteReelAssetSafely(
        videoRemoved ? vAsset : null,
        coverRemoved ? cAsset : null,
        excludeDocId,
        excludeHospId,
        false // Acquires distributed lock for safe serialization
      );
    }
  }
};

/**
 * Checks whether a given reel asset (video or cover) is still referenced
 * by any other doctor or hospital in the database. Maintained for backwards compatibility.
 */
export const isReelAssetStillInUse = async (publicIdOrUrl, excludeDocId = null, excludeHospId = null) => {
  if (!publicIdOrUrl) return false;
  const isCover = String(publicIdOrUrl).includes('/covers/') || String(publicIdOrUrl).startsWith('sehatbuddy/covers/');
  if (isCover) {
    const res = await countCoverReferences(publicIdOrUrl, excludeDocId, excludeHospId);
    return res.count > 0;
  }
  const res = await countVideoReferences(publicIdOrUrl, excludeDocId, excludeHospId);
  return res.count > 0;
};

/**
 * Extracts all Cloudinary public IDs (both video and cover) from a reels array.
 */
export const extractReelPublicIds = (reelsList) => {
  const videoPublicIds = new Set();
  const coverPublicIds = new Set();
  if (!Array.isArray(reelsList)) return { videoPublicIds, coverPublicIds };

  reelsList.forEach((item) => {
    if (!item) return;
    const v = extractVideoIdentifier(item);
    if (v.publicId) videoPublicIds.add(v.publicId);
    const c = extractCoverIdentifier(item, v.rawUrl);
    if (c.publicId) coverPublicIds.add(c.publicId);
  });

  return { videoPublicIds, coverPublicIds };
};

/**
 * Sweeps all Cloudinary assets in sehatbuddy/reels and sehatbuddy/covers,
 * permanently deleting any assets that have ZERO valid references across all MongoDB profiles.
 */
export const cleanupAllOrphanedReelAssets = async () => {
  const cld = getCloudinary();
  if (!cld) return { deletedVideos: 0, deletedCovers: 0 };
  let deletedVideos = 0;
  let deletedCovers = 0;

  try {
    // 1. Scan Cloudinary video reels
    const videoRes = await cld.api.resources({
      type: 'upload',
      prefix: 'sehatbuddy/reels',
      resource_type: 'video',
      max_results: 100
    });

    for (const res of (videoRes.resources || [])) {
      const pubId = res.public_id;
      const refs = await countVideoReferences(pubId);
      if (refs.count === 0) {
        console.log(`[ReelCleanup] Purging unreferenced video "${pubId}" from Cloudinary`);
        const destroyRes = await destroyCloudinaryAsset(cld, pubId, 'video', 'video');
        if (destroyRes.result === 'ok' || destroyRes.result === 'not found') {
          deletedVideos++;
        }
      }
    }

    // 2. Scan Cloudinary cover photos
    for (const prefix of ['sehatbuddy/covers', 'sehatbuddy/reels']) {
      try {
        const imgRes = await cld.api.resources({
          type: 'upload',
          prefix,
          resource_type: 'image',
          max_results: 100
        });

        for (const res of (imgRes.resources || [])) {
          const pubId = res.public_id;
          const isDefault = pubId.includes('ig_');
          if (isDefault) {
            const shortcode = extractInstagramShortcode(pubId);
            const videoRefs = shortcode ? await countVideoReferences(`sehatbuddy/reels/ig_${shortcode}`) : { count: 0 };
            const coverRefs = await countCoverReferences(pubId);
            if (videoRefs.count === 0 && coverRefs.count === 0) {
              console.log(`[ReelCleanup] Purging unreferenced default cover "${pubId}" from Cloudinary`);
              const destroyRes = await destroyCloudinaryAsset(cld, pubId, 'image', 'cover');
              if (destroyRes.result === 'ok' || destroyRes.result === 'not found') {
                deletedCovers++;
              }
            }
          } else {
            const coverRefs = await countCoverReferences(pubId);
            if (coverRefs.count === 0) {
              console.log(`[ReelCleanup] Purging unreferenced custom cover "${pubId}" from Cloudinary`);
              const destroyRes = await destroyCloudinaryAsset(cld, pubId, 'image', 'cover');
              if (destroyRes.result === 'ok' || destroyRes.result === 'not found') {
                deletedCovers++;
              }
            }
          }
        }
      } catch (err) {
        console.warn(`[ReelCleanup] Scan prefix ${prefix} warning:`, err.message);
      }
    }

    if (deletedVideos > 0 || deletedCovers > 0) {
      notifyStorageChanged('cloudinary:cleanup');
    }
  } catch (err) {
    console.warn('[ReelCleanup] cleanupAllOrphanedReelAssets error:', err.message);
  }

  return { deletedVideos, deletedCovers };
};
