/**
 * Utility functions for Hospital public reviews and dynamic rating calculations.
 * Ensures ratings are strictly derived from verified public reviews.
 * If a hospital has 0 reviews, its rating is strictly 0.
 */

export const getHospitalVerifiedReviews = (hospital, liveReviews) => {
  if (!hospital) return [];
  const hospId = String(hospital.id || hospital._id || '').toLowerCase().trim();
  const hospMongoId = hospital._id ? String(hospital._id).toLowerCase().trim() : '';
  const hospName = String(hospital.name || '').toLowerCase().trim();

  const seenIds = new Set();
  const filtered = [];

  for (const r of (liveReviews || [])) {
    if (!r || r.status === 'rejected') continue;
    if (r.targetType && r.targetType !== 'hospital') continue;
    const tId = String(r.targetId || '').toLowerCase().trim();
    const tName = String(r.targetName || '').toLowerCase().trim();

    let isMatch = false;
    if (tId) {
      isMatch = (tId === hospId || (hospMongoId && tId === hospMongoId));
    }
    if (!isMatch && tName && hospName) {
      isMatch = (
        tName === hospName ||
        (tName.length > 5 && hospName.includes(tName)) ||
        (hospName.length > 5 && tName.includes(hospName))
      );
    }

    if (isMatch) {
      const uniqueKey = String(r.id || r._id || `${r.patientName}_${r.comment}`);
      if (!seenIds.has(uniqueKey)) {
        seenIds.add(uniqueKey);
        filtered.push(r);
      }
    }
  }
  return filtered;
};

export const getHospitalRatingStats = (hospital, liveReviews) => {
  const verifiedReviews = getHospitalVerifiedReviews(hospital, liveReviews);
  const total = verifiedReviews.length;

  if (total === 0) {
    return {
      total: 0,
      rating: 0,
      ratingDisplay: '0',
      avg: '0',
      fiveStars: 0,
      verifiedCount: 0,
      reviewsText: '0 Reviews',
      reviews: verifiedReviews
    };
  }

  const sum = verifiedReviews.reduce((acc, r) => acc + (Number(r?.rating) || 5), 0);
  const avgNum = parseFloat((sum / total).toFixed(1));
  const avgStr = avgNum.toFixed(1);
  const fiveStars = verifiedReviews.filter(r => Number(r?.rating) === 5).length;
  const verifiedCount = verifiedReviews.filter(r => r?.isVerified).length;

  return {
    total,
    rating: avgNum,
    ratingDisplay: avgStr,
    avg: avgStr,
    fiveStars,
    verifiedCount,
    reviewsText: `${total} Review${total === 1 ? '' : 's'}`,
    reviews: verifiedReviews
  };
};
