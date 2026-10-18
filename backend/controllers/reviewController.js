import Review from '../models/Review.js';
import { broadcastDbChange } from '../services/storageMonitor.js';

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
      targetType: targetType || 'hospital',
      targetId: targetId || '',
      targetName,
      rating: Number(rating),
      title: title || '',
      comment,
      treatment: treatment || '',
      insuranceUsed: insuranceUsed || 'None',
      isVerified: isVerified !== undefined ? Boolean(isVerified) : true,
      status: 'approved' // auto-approve for seamless public experience, admin can moderate anytime
    });

    broadcastDbChange('reviews', 'insert', review._id, review);
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
    Object.assign(review, req.body);
    const updated = await review.save();
    broadcastDbChange('reviews', 'update', updated._id, updated);
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
    const revId = review._id;
    await review.deleteOne();
    broadcastDbChange('reviews', 'delete', revId);
    res.json({ success: true, message: 'Review deleted successfully' });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};
