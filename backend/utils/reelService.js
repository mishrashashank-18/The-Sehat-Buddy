import path from 'path';
import os from 'os';
import fs from 'fs';
import { exec } from 'child_process';
import { promisify } from 'util';
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
    `yt-dlp --no-warnings --no-check-certificates -f "1/best" -o "${tempFilePath}" "${cleanUrl}"`,
    `python3 -m yt_dlp --no-warnings --no-check-certificates -f "1/best" -o "${tempFilePath}" "${cleanUrl}"`,
    `python -m yt_dlp --no-warnings --no-check-certificates -f "1/best" -o "${tempFilePath}" "${cleanUrl}"`,
    `py -m yt_dlp --no-warnings --no-check-certificates -f "1/best" -o "${tempFilePath}" "${cleanUrl}"`
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
 * Cloudinary reel conversion has been completely turned off per user request.
 * All Instagram reels are streamed directly from Instagram's official embed player.
 * Result: 0 MB Cloudinary storage used, 0 MB Cloudinary bandwidth used.
 */
export async function processDoctorReelsInBackground(doctorId, reels) {
  // Disabled: 0 MB Cloudinary storage & bandwidth mode
  return;
}

/**
 * Automatically converts hospital reels in the background (Disabled).
 */
export async function processHospitalReelsInBackground(hospitalId, reels) {
  // Disabled: 0 MB Cloudinary storage & bandwidth mode
  return;
}
