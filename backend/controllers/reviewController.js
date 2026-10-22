import Review from '../models/Review.js';
import Hospital from '../models/Hospital.js';
import mongoose from 'mongoose';
import { broadcastDbChange } from '../services/storageMonitor.js';

// Helper to keep Hospital aggregate rating & review count synced with verified reviews
export const syncHospitalRating = async (targetId, targetName) => {
  try {
    let hospital = null;
    if (targetId && mongoose.Types.ObjectId.isValid(targetId)) {
      hospital = await Hospital.findById(targetId);
    }
    if (!hospital && targetName) {
      hospital = await Hospital.findOne({ name: new RegExp(targetName.trim(), 'i') });
    }
    if (!hospital) return;

    const hospReviews = await Review.find({
      status: { $ne: 'rejected' },
      $or: [
        { targetId: String(hospital._id) },
        { targetName: new RegExp(hospital.name, 'i') }
      ]
    });

    if (hospReviews.length > 0) {
      const avg = hospReviews.reduce((sum, r) => sum + (Number(r.rating) || 5), 0) / hospReviews.length;
      const newRating = parseFloat(avg.toFixed(1));
      const newReviews = `${hospReviews.length} Review${hospReviews.length === 1 ? '' : 's'}`;
      await Hospital.updateOne(
        { _id: hospital._id },
        { $set: { rating: newRating, reviews: newReviews } }
      );
      hospital.rating = newRating;
      hospital.reviews = newReviews;
      broadcastDbChange('hospitals', 'update', hospital._id, hospital);
    }
  } catch (err) {
    console.error('Error syncing hospital rating:', err);
  }
};

const DEFAULT_REVIEWS = [
  {
    patientName: 'Rajesh Verma',
    patientCity: 'Bengaluru',
    targetType: 'hospital',
    targetName: 'Apollo Hospitals Bannerghatta',
    rating: 5,
    title: 'Hassle-free 100% Cashless Knee Replacement',
    comment: 'Underwent Robotic Knee Replacement for my mother. The Sehat Buddy team coordinated with Star Health TPA desk and got pre-auth approval in just 30 minutes! Zero out-of-pocket stress and outstanding doctors.',
    isVerified: true,
    status: 'approved',
    treatment: 'Robotic Knee Replacement',
    insuranceUsed: 'Star Health'
  },
  {
    patientName: 'Priya Sundaram',
    patientCity: 'Bengaluru',
    targetType: 'surgery',
    targetName: 'Laparoscopic Gallbladder Removal',
    rating: 5,
    title: 'Discharged in 24 hours with full insurance coverage',
    comment: 'I was nervous about surgery costs, but HDFC ERGO covered the entire laparoscopic cholecystectomy. The cashless desk handled everything from admission to discharge smoothly.',
    isVerified: true,
    status: 'approved',
    treatment: 'Laparoscopic Gallbladder Surgery',
    insuranceUsed: 'HDFC ERGO'
  },
  {
    patientName: 'Dr. Amitav Mukherjee',
    patientCity: 'Bengaluru',
    targetType: 'hospital',
    targetName: 'Manipal Hospital HAL Airport Road',
    rating: 5,
    title: 'World-class Cardiac Care & Immediate TPA Approval',
    comment: 'My father needed urgent coronary stenting. The 24x7 emergency response and ICICI Lombard cashless pre-authorization desk were phenomenal. Genuine 5-star clinical excellence.',
    isVerified: true,
    status: 'approved',
    treatment: 'Cardiac Sciences / Angioplasty',
    insuranceUsed: 'ICICI Lombard'
  },
  {
    patientName: 'Sneha Kulkarni',
    patientCity: 'Bengaluru',
    targetType: 'surgery',
    targetName: 'Cataract Surgery',
    rating: 5,
    title: 'Blade-free Robotic Cataract with 100% cashless settlement',
    comment: 'Both eyes treated in daycare. Care Health settled the cashless claim within 40 minutes. No hidden fees or paperwork hassles.',
    isVerified: true,
    status: 'approved',
    treatment: 'Robotic Cataract Surgery',
    insuranceUsed: 'Care Health'
  },
  {
    patientName: 'Anand Nair',
    patientCity: 'Bengaluru',
    targetType: 'doctor',
    targetName: 'Dr. Vivek Jawali',
    rating: 5,
    title: 'Exceptional surgeon with compassionate guidance',
    comment: 'Dr. Vivek explained the entire procedure calmly and guided us through the insurance coverage options. We are deeply grateful for his skill and empathy.',
    isVerified: true,
    status: 'approved',
    treatment: 'Cardiothoracic Surgery',
    insuranceUsed: 'Niva Bupa'
  }
];

export const getReviews = async (req, res) => {
  try {
    const count = await Review.countDocuments();
    if (count === 0) {
      await Review.insertMany(DEFAULT_REVIEWS);
    }

    const { targetType, targetName, targetId, status } = req.query;
    const filter = {};
    if (targetType) filter.targetType = targetType;
    if (targetName) filter.targetName = new RegExp(targetName, 'i');
    if (targetId) filter.targetId = targetId;
    if (status) {
      filter.status = status;
    }
    // Return newest reviews first
    const reviews = await Review.find(filter).sort({ createdAt: -1 });
    res.json({ success: true, data: reviews });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export const createReview = async (req, res) => {
  try {
    const {
      patientName,
      patientCity,
      targetType,
      targetId,
      targetName,
      doctorId,
      doctorName,
      rating,
      title,
      comment,
      treatment,
      insuranceUsed,
      isVerified
    } = req.body;

    if (!patientName || !comment || !rating || !targetName) {
      return res.status(400).json({
        success: false,
        message: 'Patient name, target name, rating, and review comment are required'
      });
    }

    const review = await Review.create({
      patientName,
      patientCity: patientCity || 'Bengaluru',
      userId: req.user?._id || req.user?.id || '',
      userEmail: req.user?.email || '',
      targetType: targetType || 'hospital',
      targetId: targetId || '',
      targetName,
      doctorId: doctorId || '',
      doctorName: doctorName || '',
      rating: Number(rating),
      title: title || '',
      comment,
      treatment: treatment || '',
      insuranceUsed: insuranceUsed || 'None',
      isVerified: isVerified !== undefined ? Boolean(isVerified) : true,
      status: 'approved' // auto-approve for seamless public experience, admin can moderate anytime
    });

    broadcastDbChange('reviews', 'insert', review._id, review);
    if (review.targetType === 'hospital') {
      syncHospitalRating(review.targetId, review.targetName).catch(() => {});
    }
    res.status(201).json({ success: true, message: 'Review submitted successfully', data: review });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export const updateReview = async (req, res) => {
  try {
    const review = await Review.findById(req.params.id);
    if (!review) {
      return res.status(404).json({ success: false, message: 'Review not found' });
    }

    if (req.user && req.user.role === 'hospital') {
      const userHospId = String(req.user.id || req.user.doc?._id || '').toLowerCase();
      const userHospName = (req.user.name || '').toLowerCase();
      const rTargetId = String(review.targetId || '').toLowerCase();
      const rTargetName = (review.targetName || '').toLowerCase();
      const isOwner = (rTargetId && rTargetId === userHospId) ||
                      (rTargetName && userHospName && (rTargetName.includes(userHospName) || userHospName.includes(rTargetName)));
      if (!isOwner) {
        return res.status(403).json({ success: false, message: 'Forbidden: You can only update reviews for your own hospital' });
      }
    }

    Object.assign(review, req.body);
    const updated = await review.save();
    broadcastDbChange('reviews', 'update', updated._id, updated);
    if (updated.targetType === 'hospital') {
      syncHospitalRating(updated.targetId, updated.targetName).catch(() => {});
    }
    res.json({ success: true, message: 'Review updated successfully', data: updated });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export const deleteReview = async (req, res) => {
  try {
    const review = await Review.findById(req.params.id);
    if (!review) {
      return res.status(404).json({ success: false, message: 'Review not found' });
    }

    if (req.user && req.user.role === 'hospital') {
      const userHospId = String(req.user.id || req.user.doc?._id || '').toLowerCase();
      const userHospName = (req.user.name || '').toLowerCase();
      const rTargetId = String(review.targetId || '').toLowerCase();
      const rTargetName = (review.targetName || '').toLowerCase();
      const isOwner = (rTargetId && rTargetId === userHospId) ||
                      (rTargetName && userHospName && (rTargetName.includes(userHospName) || userHospName.includes(rTargetName)));
      if (!isOwner) {
        return res.status(403).json({ success: false, message: 'Forbidden: You can only delete reviews for your own hospital' });
      }
    }

    const revId = review._id;
    const tType = review.targetType;
    const tId = review.targetId;
    const tName = review.targetName;
    await review.deleteOne();
    broadcastDbChange('reviews', 'delete', revId);
    if (tType === 'hospital') {
      syncHospitalRating(tId, tName).catch(() => {});
    }
    res.json({ success: true, message: 'Review deleted successfully' });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};
