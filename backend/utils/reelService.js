import path from 'path';
import os from 'os';
import fs from 'fs';
import { exec } from 'child_process';
import { promisify } from 'util';
import mongoose from 'mongoose';
import Doctor from '../models/Doctor.js';
import Hospital from '../models/Hospital.js';
import { getCloudinary, extractCloudinaryPublicId } from '../routes/uploadRoutes.js';
import { broadcastDbChange } from '../services/storageMonitor.js';
import { cleanupReplacedReels } from './reelCleanup.js';

const execPromise = promisify(exec);

// In-flight mutex locks to prevent parallel duplicate background conversions
const inFlightDoctorReelJobs = new Set();
const inFlightHospitalReelJobs = new Set();
const inFlightReelUrls = new Map();

/**
 * Extracts clean Instagram shortcode from reel / post / share URL or Cloudinary asset name
 */
export function extractInstagramShortcode(url) {
  if (!url) return null;
  const match = String(url).match(/(?:instagram\.com\/(?:reel|reels|p|tv|share\/reel)\/|ig_)([^/?#&.]+)/i);
  return match && match[1] ? match[1].replace(/[^a-zA-Z0-9_-]/g, '') : null;
}

/**
 * Downloads an Instagram reel or video to a temporary local MP4 file.
 */
export async function downloadReelToTemp(rawUrl) {
  const cleanUrl = String(rawUrl).trim().split('?')[0];
  const tempFilePath = path.join(
    os.tmpdir(),
    `sehat_reel_${Date.now()}_${Math.random().toString(36).slice(2, 8)}.mp4`
  );

  const commands = [
    `yt-dlp --no-warnings --no-check-certificates -o "${tempFilePath}" "${cleanUrl}"`,
    `python3 -m yt_dlp --no-warnings --no-check-certificates -o "${tempFilePath}" "${cleanUrl}"`,
    `python -m yt_dlp --no-warnings --no-check-certificates -o "${tempFilePath}" "${cleanUrl}"`,
    `py -m yt_dlp --no-warnings --no-check-certificates -o "${tempFilePath}" "${cleanUrl}"`
  ];

  for (const cmd of commands) {
    try {
      await execPromise(cmd, { timeout: 35000 });
      if (fs.existsSync(tempFilePath) && fs.statSync(tempFilePath).size > 1000) {
        return tempFilePath;
      }
    } catch {
      // try next fallback
    }
  }

  // Cleanup if empty file created
  if (fs.existsSync(tempFilePath)) {
    try { fs.unlinkSync(tempFilePath); } catch {}
  }
  return null;
}

/**
 * Uploads a local MP4 file to Cloudinary and returns permanent URLs.
 * Supports deterministic public_id and overwrite to guarantee no duplicate assets.
 */
export async function uploadVideoFileToCloudinary(filePath, folder = 'sehatbuddy/reels', customPublicId = null) {
  const cld = getCloudinary();
  const uploadOptions = {
    resource_type: 'video',
    folder,
    quality: 'auto',
    eager_async: true
  };

  if (customPublicId) {
    uploadOptions.public_id = customPublicId;
    uploadOptions.overwrite = true;
    uploadOptions.unique_filename = false;
  }

  const cldRes = await cld.uploader.upload(filePath, uploadOptions);

  if (!cldRes || !cldRes.secure_url) {
    throw new Error('Cloudinary did not return a valid video URL');
  }

  const rawUrl = cldRes.secure_url;
  const autoPlayUrl = rawUrl.includes('/video/upload/') && !rawUrl.includes('/video/upload/q_auto')
    ? rawUrl.replace('/video/upload/', '/video/upload/q_auto,f_auto/')
    : rawUrl;
  const coverPhoto = autoPlayUrl.replace(/\.[^/.]+$/, '.jpg');

  return { url: autoPlayUrl, coverPhoto, public_id: cldRes.public_id };
}

/**
 * Deduplicated reel converter:
 * 1. Checks if Cloudinary already has the video under the deterministic shortcode ID (fast, 0-cost).
 * 2. Deduplicates concurrent downloads of the same URL across the entire system.
 * 3. Uploads with deterministic public_id and overwrite to prevent any duplicate assets.
 */
export async function convertOrFetchInstagramReel(rUrl) {
  if (!rUrl) return null;
  const cleanUrl = String(rUrl).trim().split('?')[0];
  const shortcode = extractInstagramShortcode(cleanUrl);
  const lockKey = shortcode ? `ig_${shortcode}` : cleanUrl;

  // If another process is currently downloading/converting this exact reel, await the same promise
  if (inFlightReelUrls.has(lockKey)) {
    return await inFlightReelUrls.get(lockKey);
  }

  const conversionPromise = (async () => {
    const cld = getCloudinary();

    // 1. Check if Cloudinary already stores this video under deterministic public_id
    if (cld && shortcode) {
      try {
        const existingPublicId = `sehatbuddy/reels/ig_${shortcode}`;
        const existingAsset = await cld.api.resource(existingPublicId, { resource_type: 'video' });
        if (existingAsset && existingAsset.secure_url) {
          const rawUrl = existingAsset.secure_url;
          const autoPlayUrl = rawUrl.includes('/video/upload/') && !rawUrl.includes('/video/upload/q_auto')
            ? rawUrl.replace('/video/upload/', '/video/upload/q_auto,f_auto/')
            : rawUrl;
          const coverPhoto = autoPlayUrl.replace(/\.[^/.]+$/, '.jpg');
          return { url: autoPlayUrl, coverPhoto, public_id: existingPublicId };
        }
      } catch {
        // Asset does not exist in Cloudinary yet, proceed to download and upload
      }
    }

    // 2. Download reel to temp MP4
    const tempFile = await downloadReelToTemp(cleanUrl);
    if (!tempFile || !fs.existsSync(tempFile)) {
      return null;
    }

    // 3. Upload to Cloudinary with deterministic public_id
    try {
      const customPublicId = shortcode ? `ig_${shortcode}` : null;
      return await uploadVideoFileToCloudinary(tempFile, 'sehatbuddy/reels', customPublicId);
    } finally {
      try {
        if (fs.existsSync(tempFile)) fs.unlinkSync(tempFile);
      } catch {}
    }
  })();

  inFlightReelUrls.set(lockKey, conversionPromise);
  try {
    return await conversionPromise;
  } finally {
    inFlightReelUrls.delete(lockKey);
  }
}

/**
 * Automatically converts doctor Instagram reels to Cloudinary direct video in the background.
 * Protected with per-doctor concurrency lock and reel deduplication.
 */
export async function processDoctorReelsInBackground(doctorId, reels) {
  if (!doctorId || !Array.isArray(reels) || reels.length === 0) return;

  const docKey = String(doctorId);
  if (inFlightDoctorReelJobs.has(docKey)) {
    console.log(`[ReelService] Already processing reels for doctor ${docKey}, skipping duplicate run.`);
    return;
  }
  inFlightDoctorReelJobs.add(docKey);

  (async () => {
    try {
      let changed = false;
      const updatedReels = reels.map(r => (typeof r === 'object' && r !== null ? { ...r } : r));

      for (let i = 0; i < updatedReels.length; i++) {
        const r = updatedReels[i];
        const rUrl = typeof r === 'string' ? r : r?.url;
        const currentCover = (typeof r === 'object' && r !== null) ? r.coverPhoto : undefined;

        if (rUrl && rUrl.includes('instagram.com') && !rUrl.includes('cloudinary.com')) {
          try {
            const cldRes = await convertOrFetchInstagramReel(rUrl);
            if (cldRes && cldRes.url) {
              updatedReels[i] = {
                url: cldRes.url,
                // CRUCIAL: If coverPhoto was explicitly deleted (set to ''), DO NOT resurrect it!
                coverPhoto: (currentCover === '' ? '' : (currentCover || cldRes.coverPhoto || ''))
              };
              changed = true;
            }
          } catch (upErr) {
            console.warn(`[ReelService] Cloudinary upload error for doctor reel ${rUrl}:`, upErr.message);
          }
        }
      }

      if (changed) {
        // Automatically cleanup any previous Cloudinary reel video and cover that got replaced
        try {
          let currentDoc = null;
          if (mongoose.isValidObjectId(doctorId)) {
            currentDoc = await Doctor.findById(doctorId).select('reels');
          } else {
            currentDoc = await Doctor.findOne({ id: doctorId }).select('reels');
          }
          if (currentDoc && Array.isArray(currentDoc.reels)) {
            await cleanupReplacedReels(currentDoc.reels, updatedReels);
          }
        } catch (cleanErr) {
          console.warn('[ReelService] Cleanup replaced doctor reels note:', cleanErr.message);
        }

        let updatedDoctor = null;
        if (mongoose.isValidObjectId(doctorId)) {
          updatedDoctor = await Doctor.findByIdAndUpdate(
            doctorId,
            { $set: { reels: updatedReels } },
            { new: true }
          );
        }
        if (!updatedDoctor) {
          updatedDoctor = await Doctor.findOneAndUpdate(
            { id: doctorId },
            { $set: { reels: updatedReels } },
            { new: true }
          );
        }
        if (updatedDoctor) {
          broadcastDbChange('doctors', 'update', updatedDoctor._id, updatedDoctor);
        }
      }
    } catch (err) {
      console.warn('[ReelService] processDoctorReelsInBackground warning:', err.message);
    } finally {
      inFlightDoctorReelJobs.delete(docKey);
    }
  })().catch(() => {
    inFlightDoctorReelJobs.delete(docKey);
  });
}

/**
 * Automatically converts hospital reels in the background.
 * Protected with per-hospital concurrency lock and reel deduplication.
 */
export async function processHospitalReelsInBackground(hospitalId, reels) {
  if (!hospitalId || !Array.isArray(reels) || reels.length === 0) return;

  const hospKey = String(hospitalId);
  if (inFlightHospitalReelJobs.has(hospKey)) {
    console.log(`[ReelService] Already processing reels for hospital ${hospKey}, skipping duplicate run.`);
    return;
  }
  inFlightHospitalReelJobs.add(hospKey);

  (async () => {
    try {
      let changed = false;
      const updatedReels = reels.map(r => (typeof r === 'object' && r !== null ? { ...r } : r));

      for (let i = 0; i < updatedReels.length; i++) {
        const r = updatedReels[i];
        const rUrl = typeof r === 'string' ? r : r?.url;
        const currentCover = (typeof r === 'object' && r !== null) ? r.coverPhoto : undefined;

        if (rUrl && rUrl.includes('instagram.com') && !rUrl.includes('cloudinary.com')) {
          try {
            const cldRes = await convertOrFetchInstagramReel(rUrl);
            if (cldRes && cldRes.url) {
              updatedReels[i] = {
                url: cldRes.url,
                // CRUCIAL: If coverPhoto was explicitly deleted (set to ''), DO NOT resurrect it!
                coverPhoto: (currentCover === '' ? '' : (currentCover || cldRes.coverPhoto || ''))
              };
              changed = true;
            }
          } catch (upErr) {
            console.warn(`[ReelService] Cloudinary upload error for hospital reel ${rUrl}:`, upErr.message);
          }
        }
      }

      if (changed) {
        // Automatically cleanup any previous Cloudinary reel video and cover that got replaced
        try {
          let currentHosp = null;
          if (mongoose.isValidObjectId(hospitalId)) {
            currentHosp = await Hospital.findById(hospitalId).select('reels');
          } else {
            currentHosp = await Hospital.findOne({ id: hospitalId }).select('reels');
          }
          if (currentHosp && Array.isArray(currentHosp.reels)) {
            await cleanupReplacedReels(currentHosp.reels, updatedReels);
          }
        } catch (cleanErr) {
          console.warn('[ReelService] Cleanup replaced hospital reels note:', cleanErr.message);
        }

        let updatedHospital = null;
        if (mongoose.isValidObjectId(hospitalId)) {
          updatedHospital = await Hospital.findByIdAndUpdate(
            hospitalId,
            { $set: { reels: updatedReels } },
            { new: true }
          );
        }
        if (!updatedHospital) {
          updatedHospital = await Hospital.findOneAndUpdate(
            { id: hospitalId },
            { $set: { reels: updatedReels } },
            { new: true }
          );
        }
        if (updatedHospital) {
          broadcastDbChange('hospitals', 'update', updatedHospital._id, updatedHospital);
        }
      }
    } catch (err) {
      console.warn('[ReelService] processHospitalReelsInBackground warning:', err.message);
    } finally {
      inFlightHospitalReelJobs.delete(hospKey);
    }
  })().catch(() => {
    inFlightHospitalReelJobs.delete(hospKey);
  });
}
