import path from 'path';
import os from 'os';
import fs from 'fs';
import { exec } from 'child_process';
import { promisify } from 'util';
import mongoose from 'mongoose';
import Doctor from '../models/Doctor.js';
import Hospital from '../models/Hospital.js';
import { getCloudinary } from '../routes/uploadRoutes.js';
import { broadcastDbChange } from '../services/storageMonitor.js';

const execPromise = promisify(exec);

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
 */
export async function uploadVideoFileToCloudinary(filePath, folder = 'sehatbuddy/reels') {
  const cld = getCloudinary();
  const cldRes = await cld.uploader.upload(filePath, {
    resource_type: 'video',
    folder,
    quality: 'auto',
    eager_async: true
  });

  if (!cldRes || !cldRes.secure_url) {
    throw new Error('Cloudinary did not return a valid video URL');
  }

  const rawUrl = cldRes.secure_url;
  const autoPlayUrl = rawUrl.includes('/video/upload/') && !rawUrl.includes('/video/upload/q_auto')
    ? rawUrl.replace('/video/upload/', '/video/upload/q_auto,f_auto/')
    : rawUrl;
  const coverPhoto = autoPlayUrl.replace(/\.[^/.]+$/, '.jpg');

  return { url: autoPlayUrl, coverPhoto };
}

/**
 * Automatically converts doctor Instagram reels to Cloudinary direct video in the background.
 */
export async function processDoctorReelsInBackground(doctorId, reels) {
  if (!doctorId || !Array.isArray(reels) || reels.length === 0) return;

  (async () => {
    try {
      let changed = false;
      const updatedReels = reels.map(r => (typeof r === 'object' && r !== null ? { ...r } : r));

      for (let i = 0; i < updatedReels.length; i++) {
        const r = updatedReels[i];
        const rUrl = typeof r === 'string' ? r : r?.url;

        if (rUrl && rUrl.includes('instagram.com') && !rUrl.includes('cloudinary.com')) {
          const tempFile = await downloadReelToTemp(rUrl);
          if (tempFile && fs.existsSync(tempFile)) {
            try {
              const cldRes = await uploadVideoFileToCloudinary(tempFile, 'sehatbuddy/reels');
              if (cldRes && cldRes.url) {
                const existingCover = typeof r === 'object' && r?.coverPhoto ? r.coverPhoto : '';
                updatedReels[i] = {
                  url: cldRes.url,
                  coverPhoto: existingCover && !existingCover.includes('instagram.com')
                    ? existingCover
                    : cldRes.coverPhoto
                };
                changed = true;
              }
            } catch (upErr) {
              console.warn(`[ReelService] Cloudinary upload error for doctor reel ${rUrl}:`, upErr.message);
            } finally {
              try {
                if (fs.existsSync(tempFile)) fs.unlinkSync(tempFile);
              } catch {}
            }
          }
        }
      }

      if (changed) {
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
    }
  })().catch(() => {});
}

/**
 * Automatically converts hospital reels in the background.
 */
export async function processHospitalReelsInBackground(hospitalId, reels) {
  if (!hospitalId || !Array.isArray(reels) || reels.length === 0) return;

  (async () => {
    try {
      let changed = false;
      const updatedReels = reels.map(r => (typeof r === 'object' && r !== null ? { ...r } : r));

      for (let i = 0; i < updatedReels.length; i++) {
        const r = updatedReels[i];
        const rUrl = typeof r === 'string' ? r : r?.url;

        if (rUrl && rUrl.includes('instagram.com') && !rUrl.includes('cloudinary.com')) {
          const tempFile = await downloadReelToTemp(rUrl);
          if (tempFile && fs.existsSync(tempFile)) {
            try {
              const cldRes = await uploadVideoFileToCloudinary(tempFile, 'sehatbuddy/reels');
              if (cldRes && cldRes.url) {
                const existingCover = typeof r === 'object' && r?.coverPhoto ? r.coverPhoto : '';
                updatedReels[i] = {
                  url: cldRes.url,
                  coverPhoto: existingCover && !existingCover.includes('instagram.com')
                    ? existingCover
                    : cldRes.coverPhoto
                };
                changed = true;
              }
            } catch (upErr) {
              console.warn(`[ReelService] Cloudinary upload error for hospital reel ${rUrl}:`, upErr.message);
            } finally {
              try {
                if (fs.existsSync(tempFile)) fs.unlinkSync(tempFile);
              } catch {}
            }
          }
        }
      }

      if (changed) {
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
    }
  })().catch(() => {});
}
