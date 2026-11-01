import { extractCloudinaryPublicId, getCloudinary } from '../routes/uploadRoutes.js';
import { notifyStorageChanged } from '../services/storageMonitor.js';

/**
 * Automatically detects and permanently destroys old Cloudinary reel videos
 * and cover photos that have been replaced or removed during doctor or hospital profile updates.
 */
export const cleanupReplacedReels = async (oldReels = [], newReels = []) => {
  try {
    const extractUrls = (reelsList) => {
      const videoUrls = new Set();
      const coverUrls = new Set();
      if (!Array.isArray(reelsList)) return { videoUrls, coverUrls };

      reelsList.forEach((item) => {
        if (!item) return;
        if (typeof item === 'string') {
          const u = item.trim();
          if (u.includes('cloudinary.com')) {
            if (u.includes('/video/upload/') || u.match(/\.(mp4|webm|mov)(\?.*)?$/i)) {
              videoUrls.add(u);
            } else if (u.includes('/image/upload/')) {
              coverUrls.add(u);
            } else {
              videoUrls.add(u);
            }
          }
        } else if (typeof item === 'object') {
          const v = (item.url || item.link || '').trim();
          const c = (item.coverPhoto || '').trim();
          if (v && v.includes('cloudinary.com')) {
            videoUrls.add(v);
          }
          if (c && c.includes('cloudinary.com')) {
            coverUrls.add(c);
          }
        }
      });

      return { videoUrls, coverUrls };
    };

    const oldAssets = extractUrls(oldReels);
    const newAssets = extractUrls(newReels);

    const cld = getCloudinary();
    if (!cld) return;

    let deletedAny = false;

    // Destroy replaced or removed video assets
    for (const oldVid of oldAssets.videoUrls) {
      if (!newAssets.videoUrls.has(oldVid)) {
        const pubId = extractCloudinaryPublicId(oldVid);
        if (pubId) {
          try {
            await cld.uploader.destroy(pubId, { resource_type: 'video', invalidate: true });
            console.log(`[Cloudinary Reel Cleanup] Deleted replaced reel video: ${pubId}`);
            deletedAny = true;
          } catch (err) {
            console.warn(`[Cloudinary Reel Cleanup] Warning deleting reel video ${pubId}:`, err.message);
          }
        }
      }
    }

    // Destroy replaced or removed custom cover photos
    for (const oldCover of oldAssets.coverUrls) {
      if (!newAssets.coverUrls.has(oldCover)) {
        // Do not destroy if it is an auto-generated thumbnail of a retained video
        const isRetainedThumb = Array.from(newAssets.videoUrls).some(v => {
          const vPubId = extractCloudinaryPublicId(v);
          return vPubId && oldCover.includes(vPubId);
        });

        if (!isRetainedThumb) {
          const pubId = extractCloudinaryPublicId(oldCover);
          if (pubId) {
            const resType = oldCover.includes('/video/upload/') ? 'video' : 'image';
            try {
              await cld.uploader.destroy(pubId, { resource_type: resType, invalidate: true });
              console.log(`[Cloudinary Reel Cleanup] Deleted replaced reel cover: ${pubId}`);
              deletedAny = true;
            } catch (err) {
              console.warn(`[Cloudinary Reel Cleanup] Warning deleting reel cover ${pubId}:`, err.message);
            }
          }
        }
      }
    }

    if (deletedAny) {
      notifyStorageChanged('cloudinary:reel_replace');
    }
  } catch (err) {
    console.warn('[Cloudinary Reel Cleanup] Error cleaning up replaced reels:', err.message);
  }
};
