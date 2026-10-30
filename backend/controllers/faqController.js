import Faq from '../models/Faq.js';
import { broadcastDbChange } from '../services/storageMonitor.js';

const DEFAULT_FAQS = [
  {
    question: 'How does Cashless Insurance work for surgeries and hospital admissions?',
    answer: 'Cashless insurance allows you to undergo planned or emergency surgeries without paying upfront hospital bills. Our dedicated hospital insurance desk handles the pre-authorization directly with your insurance provider or TPA within 30 minutes. Once approved, the insurer settles the hospital charges directly.',
    category: 'Insurance & Cashless',
    icon: 'credit-card',
    order: 1,
    isActive: true
  },
  {
    question: 'Which insurance providers and TPAs are accepted at partner hospitals?',
    answer: 'All our accredited partner hospitals accept all major health insurance companies and TPAs including Star Health, HDFC ERGO, ICICI Lombard, Niva Bupa, Care Health, Bajaj Allianz, Tata AIG, SBI General, Medi Assist, and Paramount TPA. Both individual and corporate mediclaim policies are honored.',
    category: 'Insurance & Cashless',
    icon: 'shield',
    order: 2,
    isActive: true
  },
  {
    question: 'Are modern robotic and laparoscopic surgeries covered under health insurance?',
    answer: 'Yes! Per IRDAI healthcare guidelines, modern and minimally invasive procedures such as Robotic Surgery, Laparoscopic Gallbladder/Hernia surgeries, and Laser treatments are eligible for insurance coverage. Pre-approval typically takes under 45 minutes.',
    category: 'Surgeries & Procedures',
    icon: 'document',
    order: 3,
    isActive: true
  },
  {
    question: 'What documents are required to initiate a cashless surgery claim?',
    answer: 'To initiate cashless claims, you need: 1) Health Insurance Card / Policy Document, 2) Patient Government Photo ID (Aadhaar / PAN), 3) Doctor Consultation Sheet and Diagnosis Reports, and 4) TPA Cashless Pre-Auth Request form provided by our desk.',
    category: 'Insurance & Cashless',
    icon: 'document',
    order: 4,
    isActive: true
  },
  {
    question: 'Can I get 0% No-Cost EMI if my insurance only covers partial treatment cost?',
    answer: 'Yes! The Sehat Buddy offers 0% No-Cost EMI options (3, 6, 9, or 12 months) for non-covered hospital expenses, co-payments, and elective procedures. Approvals are instant with minimal documentation.',
    category: 'Surgeries & Procedures',
    icon: 'credit-card',
    order: 5,
    isActive: true
  },
  {
    question: 'How do I choose the best specialist doctor or hospital for my treatment?',
    answer: 'You can browse board-certified doctors and verified hospitals by department, procedure experience, patient reviews, and cashless insurance tie-ups on The Sehat Buddy. Our medical coordinators also provide free personalized recommendations.',
    category: 'Doctors & Consultations',
    icon: 'doctor',
    order: 6,
    isActive: true
  },
  {
    question: 'How quickly can I book an emergency hospital bed or surgery slot?',
    answer: 'Partner hospitals have 24x7 trauma and emergency admission desks. Emergency admissions are processed immediately, and planned surgeries can be scheduled within 24 to 48 hours following clinical consultation.',
    category: 'Hospitals & Admissions',
    icon: 'emergency',
    order: 7,
    isActive: true
  },
  {
    question: 'How do public reviews work, and are patient reviews verified?',
    answer: 'All public reviews on The Sehat Buddy come from patients and families who consulted verified doctors or underwent procedures in our network hospitals. Reviews are moderated to ensure genuine, unbiased feedback on clinical care and insurance support.',
    category: 'General',
    icon: 'shield',
    order: 8,
    isActive: true
  }
];

export const getFaqs = async (req, res) => {
  try {
    const count = await Faq.countDocuments();
    if (count === 0) {
      await Faq.insertMany(DEFAULT_FAQS);
    }

    const { category, activeOnly } = req.query;
    const filter = {};
    if (category && category !== 'All') {
      filter.category = category;
    }
    if (activeOnly === 'true') {
      filter.isActive = true;
    }
    const faqs = await Faq.find(filter).sort({ order: 1, createdAt: -1 });
    res.json({ success: true, data: faqs });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export const createFaq = async (req, res) => {
  try {
    if (!req.user || (req.user.role !== 'admin' && req.user.role !== 'hospital')) {
      return res.status(403).json({
        success: false,
        message: 'Forbidden: Only website administrators and hospital managers can create FAQs'
      });
    }

    const { question, answer, category, targetType, targetId, targetName, icon, image, note, steps, order, isActive } = req.body;
    if (!question || !answer) {
      return res.status(400).json({ success: false, message: 'Question and answer are required' });
    }
    const finalIcon = icon || (image ? image : 'calendar');
    const finalImage = image || (icon && (icon.startsWith('http') || icon.startsWith('data:image')) ? icon : '');

    const resolvedTargetType = targetType || (req.user.role === 'hospital' ? 'hospital' : 'general');
    const resolvedTargetId = targetId || (req.user.role === 'hospital' ? String(req.user.id || req.user._id) : '');
    const resolvedTargetName = targetName || (req.user.role === 'hospital' ? (req.user.name || '') : '');

    const faq = await Faq.create({
      question,
      answer,
      category: category || (resolvedTargetType === 'doctor' ? 'Doctors & Consultations' : resolvedTargetType === 'hospital' ? 'Hospitals & Admissions' : 'General'),
      targetType: resolvedTargetType,
      targetId: resolvedTargetId,
      targetName: resolvedTargetName,
      icon: finalIcon,
      image: finalImage,
      note: note || '',
      steps: Array.isArray(steps) ? steps : (steps ? [steps] : []),
      order: order !== undefined ? Number(order) : 0,
      isActive: isActive !== undefined ? Boolean(isActive) : true
    });
    broadcastDbChange('faqs', 'insert', faq._id, faq);
    res.status(201).json({ success: true, message: 'FAQ created successfully', data: faq });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export const reorderFaqs = async (req, res) => {
  try {
    if (!req.user || (req.user.role !== 'admin' && req.user.role !== 'hospital')) {
      return res.status(403).json({
        success: false,
        message: 'Forbidden: Only website administrators and hospital managers can reorder FAQs'
      });
    }

    const { items } = req.body;
    if (!Array.isArray(items) || items.length === 0) {
      return res.status(400).json({ success: false, message: 'Invalid or empty items array' });
    }

    const bulkOps = items
      .filter(item => item && (item.id || item._id))
      .map(item => ({
        updateOne: {
          filter: { _id: item.id || item._id },
          update: { $set: { order: Number(item.order) || 0 } }
        }
      }));

    if (bulkOps.length > 0) {
      await Faq.bulkWrite(bulkOps);
      broadcastDbChange('faqs', 'reorder', null, items);
    }

    res.json({ success: true, message: 'FAQ order updated successfully' });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export const updateFaq = async (req, res) => {
  try {
    if (!req.user || (req.user.role !== 'admin' && req.user.role !== 'hospital')) {
      return res.status(403).json({
        success: false,
        message: 'Forbidden: Only website administrators and hospital managers can update FAQs'
      });
    }

    const faq = await Faq.findById(req.params.id);
    if (!faq) {
      return res.status(404).json({ success: false, message: 'FAQ not found' });
    }

    if (req.user.role === 'hospital') {
      const userHospId = String(req.user.id || req.user._id || '').toLowerCase();
      const userHospName = (req.user.name || '').toLowerCase();
      const fTargetId = String(faq.targetId || '').toLowerCase();
      const fTargetName = (faq.targetName || '').toLowerCase();
      const isOwner = (fTargetId && fTargetId === userHospId) ||
                      (fTargetName && userHospName && (fTargetName.includes(userHospName) || userHospName.includes(fTargetName)));
      if (!isOwner) {
        return res.status(403).json({ success: false, message: 'Forbidden: You can only update FAQs for your own hospital' });
      }
    }

    Object.assign(faq, req.body);
    const updated = await faq.save();
    broadcastDbChange('faqs', 'update', updated._id, updated);
    res.json({ success: true, message: 'FAQ updated successfully', data: updated });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export const deleteFaq = async (req, res) => {
  try {
    if (!req.user || (req.user.role !== 'admin' && req.user.role !== 'hospital')) {
      return res.status(403).json({
        success: false,
        message: 'Forbidden: Only website administrators and hospital managers can delete FAQs'
      });
    }

    const faq = await Faq.findById(req.params.id);
    if (!faq) {
      return res.status(404).json({ success: false, message: 'FAQ not found' });
    }

    if (req.user.role === 'hospital') {
      const userHospId = String(req.user.id || req.user._id || '').toLowerCase();
      const userHospName = (req.user.name || '').toLowerCase();
      const fTargetId = String(faq.targetId || '').toLowerCase();
      const fTargetName = (faq.targetName || '').toLowerCase();
      const isOwner = (fTargetId && fTargetId === userHospId) ||
                      (fTargetName && userHospName && (fTargetName.includes(userHospName) || userHospName.includes(fTargetName)));
      if (!isOwner) {
        return res.status(403).json({ success: false, message: 'Forbidden: You can only delete FAQs for your own hospital' });
      }
    }

    const faqId = faq._id;
    await faq.deleteOne();
    broadcastDbChange('faqs', 'delete', faqId);
    res.json({ success: true, message: 'FAQ deleted successfully' });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};
