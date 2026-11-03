import React, { useState, useEffect, useRef } from 'react';
import { 
  X, Upload, Stethoscope, Building2, AlertCircle, HelpCircle, 
  Plus, Trash2, Edit2, Star, Loader2, Award, GraduationCap, 
  Users, User, Briefcase, ArrowUp, ArrowDown, Check, CheckCircle2, Video, Tag,
  Phone, Clock, GripVertical, Sparkles, Camera 
} from 'lucide-react';
import { useData } from '../../context/useData';
import { DEFAULT_DOCTOR_AVATARS } from '../../constants/doctorAvatars';
import { api, API_BASE } from '../../services/api';
import FaqSymbolSelector from './FaqSymbolSelector';
import { parseAvailableDaysAndHours } from '../../utils/doctorScheduleUtils';
import styles from './DoctorFormModal.module.css';

const DEFAULT_RAHUL_AWARDS = [
  { title: 'Best Cardiologist of the Year', subtitle: 'National Healthcare Summit', recognition: 'National Healthcare Summit', year: '2023' },
  { title: 'Excellence in Interventional Cardiology', subtitle: 'Cardiological Society of India', recognition: 'Cardiological Society of India', year: '2020' },
  { title: 'Distinguished Clinical Researcher Award', subtitle: 'Indian Council of Medical Research', recognition: 'Indian Council of Medical Research', year: '2018' },
  { title: 'Excellence in Patient Care & Clinical Service', subtitle: 'Apollo Healthcare', recognition: 'Apollo Healthcare', year: '2022' }
];

const DEFAULT_RAHUL_CERTS = [
  { title: 'Fellow of the American College of Cardiology', subtitle: 'American College of Cardiology', board: 'American College of Cardiology', tag: 'FACC' },
  { title: 'Fellow of Society for Cardiovascular Angiography & Interventions', subtitle: 'Society for Cardiovascular Angiography', board: 'Society for Cardiovascular Angiography', tag: 'FSCAI' },
  { title: 'Advanced Cardiac Life Support Provider', subtitle: 'American Heart Association', board: 'American Heart Association', tag: 'ACLS' },
  { title: 'Post-Doctoral Fellowship in Complex Coronary Angioplasty', subtitle: 'National Board of Examinations', board: 'National Board of Examinations', tag: 'P-DF' }
];

const DEFAULT_RAHUL_MEMS = [
  { title: 'Cardiological Society of India', council: 'Cardiological Society of India', status: 'Life Member', showStatus: true },
  { title: 'Indian Medical Association', council: 'Indian Medical Association', status: 'Senior Member', showStatus: true },
  { title: 'European Society of Cardiology', council: 'European Society of Cardiology', status: 'Fellow Member', showStatus: true },
  { title: 'Association of Physicians of India', council: 'Association of Physicians of India', status: 'Registered Member', showStatus: true }
];

const DEFAULT_RAHUL_TIMELINE = [
  { role: 'Senior Consultant Interventional Cardiologist', hospital: 'Apollo Hospital', startYear: '2018', endYear: '', isPresent: true },
  { role: 'Associate Consultant Cardiology', hospital: 'Fortis Healthcare', startYear: '2014', endYear: '2018', isPresent: false },
  { role: 'Chief Resident in Cardiology', hospital: 'All India Institute of Medical Sciences', startYear: '2011', endYear: '2014', isPresent: false },
  { role: 'Clinical Fellow in Interventional Cardiology', hospital: 'AIIMS New Delhi', startYear: '2009', endYear: '2011', isPresent: false }
];

const getDefaultDoctorTags = (doc) => {
  const defaultList = [];
  if (doc?.degree || doc?.qualifications) {
    const parts = (doc.degree || doc.qualifications).split(/[,/]+/).map(s => s.trim()).filter(Boolean);
    defaultList.push(...parts);
  }
  const spec = (doc?.specialty || doc?.specialization || '').toLowerCase();
  if (spec.includes('dent') || spec.includes('paedo')) {
    defaultList.push('BDS', 'MDS - Paedodontics', 'Implantologist', 'Pediatric Dentist', 'Cosmetic/Aesthetic Dentist', 'Preventive Dentistry', 'Dental Surgeon');
  } else if (spec.includes('cardio')) {
    defaultList.push('Interventional Cardiologist', 'Angioplasty Specialist', 'Echocardiography', 'Heart Failure Care', 'Preventive Cardiology', 'Chest Pain Specialist');
  } else if (spec.includes('derma')) {
    defaultList.push('Clinical Dermatology', 'Cosmetic/Aesthetic Specialist', 'Laser Therapeutics', 'Trichology', 'Cutaneous Surgeon', 'Acne & Skin Care');
  } else if (spec.includes('ortho')) {
    defaultList.push('Joint Replacement', 'Arthroscopy Specialist', 'Robotic Knee Surgery', 'Sports Medicine', 'Trauma Surgeon', 'Spine Rehabilitation');
  } else if (spec.includes('pedia')) {
    defaultList.push('Pediatric Intensive Care', 'Neonatology', 'Child Growth & Development', 'Vaccination Specialist', 'Pediatric Allergy Care');
  } else if (spec.includes('gyne') || spec.includes('obs')) {
    defaultList.push('High-Risk Obstetrics', 'Laparoscopic Surgeon', 'Infertility Specialist', 'Women Hormonal Health', 'Maternal Fetal Care');
  } else if (spec.includes('neuro')) {
    defaultList.push('Stroke Rehabilitation', 'Neurocritical Care', 'Electrophysiology', 'Headache & Migraine Specialist', 'Epilepsy Care');
  } else if (spec.includes('uro')) {
    defaultList.push('Robotic Urological Surgery', 'Kidney Stone Specialist', 'Endourology', 'Renal Transplant', 'Prostate Care');
  } else {
    defaultList.push('Consultant Physician', 'Clinical Diagnostics', 'Preventive Healthcare', 'Chronic Disease Management', 'Health Wellness');
  }
  return Array.from(new Set(defaultList));
};

const getSpecialtySuggestions = (specialty = '') => {
  const spec = (specialty || '').toLowerCase();
  if (spec.includes('dent') || spec.includes('paedo')) {
    return ['BDS', 'MDS - Paedodontics', 'Implantologist', 'Pediatric Dentist', 'Cosmetic Dentist', 'Root Canal Specialist', 'Preventive Dentistry', 'Dental Surgeon', 'Oral & Maxillofacial'];
  } else if (spec.includes('cardio')) {
    return ['Interventional Cardiologist', 'Angioplasty Specialist', 'Echocardiography', 'Heart Failure Care', 'Preventive Cardiology', 'Chest Pain Specialist', 'Coronary Angiography', 'Arrhythmia Care', 'Cardiac Rehab'];
  } else if (spec.includes('derma')) {
    return ['Clinical Dermatology', 'Cosmetic Specialist', 'Laser Therapeutics', 'Trichology', 'Cutaneous Surgeon', 'Acne & Skin Care', 'Hair Loss Treatment', 'Skin Rejuvenation'];
  } else if (spec.includes('ortho')) {
    return ['Joint Replacement', 'Arthroscopy Specialist', 'Robotic Knee Surgery', 'Sports Medicine', 'Trauma Surgeon', 'Spine Rehabilitation', 'Hip Replacement', 'Fracture Care'];
  } else if (spec.includes('pedia')) {
    return ['Pediatric Intensive Care', 'Neonatology', 'Child Growth & Development', 'Vaccination Specialist', 'Pediatric Allergy Care', 'Newborn Care', 'Adolescent Medicine'];
  } else if (spec.includes('gyne') || spec.includes('obs')) {
    return ['High-Risk Obstetrics', 'Laparoscopic Surgeon', 'Infertility Specialist', 'Women Hormonal Health', 'Maternal Fetal Care', 'PCOS Management', 'Normal Delivery Care'];
  } else if (spec.includes('neuro')) {
    return ['Stroke Rehabilitation', 'Neurocritical Care', 'Electrophysiology', 'Headache & Migraine Specialist', 'Epilepsy Care', 'Brain Health', 'Neuropathy Treatment'];
  } else if (spec.includes('uro')) {
    return ['Robotic Urological Surgery', 'Kidney Stone Specialist', 'Endourology', 'Renal Transplant', 'Prostate Care', 'Urinary Incontinence', 'Andrology'];
  } else if (spec.includes('general') || spec.includes('physician')) {
    return ['Consultant Physician', 'Clinical Diagnostics', 'Preventive Healthcare', 'Chronic Disease Management', 'Health Wellness', 'Fever & Infection Care', 'Diabetes Care'];
  }
  return ['Consultant Specialist', 'Clinical Diagnostics', 'Preventive Healthcare', 'Chronic Disease Management', 'Patient Care Specialist'];
};

const DOC1_URL = 'https://res.cloudinary.com/nehlbmp2/image/upload/v1793190466/sehatbuddy/doctors/doctor-1.jpg';
const DOC2_URL = 'https://res.cloudinary.com/nehlbmp2/image/upload/v1793190467/sehatbuddy/doctors/doctor-2.jpg';

const PRESET_AVATARS = [
  { label: 'Male Doctor Avatar 1', src: DEFAULT_DOCTOR_AVATARS[0].url, preview: DEFAULT_DOCTOR_AVATARS[0].url, key: 'male_doctor' },
  { label: 'Female Doctor Avatar 1', src: DEFAULT_DOCTOR_AVATARS[1].url, preview: DEFAULT_DOCTOR_AVATARS[1].url, key: 'female_doctor' },
  { label: 'Male Doctor Photo 2', src: DOC1_URL, preview: DOC1_URL, key: 'doc1' },
  { label: 'Female Doctor Photo 2', src: DOC2_URL, preview: DOC2_URL, key: 'doc2' },
];

const SPECIALTY_OPTIONS = [
  'Cardiologist',
  'Gynecologist',
  'Orthopedic',
  'Pediatrician',
  'Neurologist',
  'Dermatologist',
  'General Physician',
  'Oncologist',
  'ENT Specialist',
  'Dentist',
  'Psychiatrist',
  'Pulmonologist'
];

const DoctorFormContent = ({ doctorToEdit, onClose, onSuccess }) => {
  const { hospitals, addDoctor, updateDoctor } = useData();

  const [formData, setFormData] = useState(() => {
    if (doctorToEdit) {
      const expNum = parseInt(doctorToEdit.experience ?? doctorToEdit.experienceYears, 10) || 5;
      const spec = doctorToEdit.specialty || doctorToEdit.specialization || 'Cardiologist';
      const rawPhone = String(doctorToEdit.phone || doctorToEdit.contact_number || '').replace(/\D/g, '');
      const cleanPhone = rawPhone.length > 10 ? rawPhone.slice(-10) : rawPhone;
      const initialAwards = Array.isArray(doctorToEdit.awards) ? doctorToEdit.awards : [];
      const initialCerts = Array.isArray(doctorToEdit.certifications) ? doctorToEdit.certifications : [];
      const initialMems = Array.isArray(doctorToEdit.memberships) ? doctorToEdit.memberships : [];
      const initialTimeline = Array.isArray(doctorToEdit.careerExperience) ? doctorToEdit.careerExperience : [];

      return {
        name: doctorToEdit.name || '',
        specialty: SPECIALTY_OPTIONS.includes(spec) ? spec : 'Other',
        customSpecialty: SPECIALTY_OPTIONS.includes(spec) ? '' : spec,
        hospital: doctorToEdit.hospital || '',
        experienceYears: expNum,
        price: doctorToEdit.price ?? doctorToEdit.fees ?? 500,
        rating: doctorToEdit.rating !== undefined ? doctorToEdit.rating : 0,
        reviews: doctorToEdit.reviews !== undefined ? doctorToEdit.reviews : '0',
        degree: doctorToEdit.degree || doctorToEdit.qualifications || '',
        jobTitle: doctorToEdit.jobTitle || '',
        licenseNumber: doctorToEdit.licenseNumber || '',
        phone: cleanPhone,
        email: doctorToEdit.email || '',
        availableDays: doctorToEdit.availableDays || '',
        helplineNumber: doctorToEdit.helplineNumber || '',
        helplineDays: doctorToEdit.helplineDays || '',
        helplineTime: doctorToEdit.helplineTime || '',
        about: doctorToEdit.about || '',
        available: doctorToEdit.available !== undefined ? doctorToEdit.available : true,
        isStarDoctor: Boolean(doctorToEdit.isStarDoctor),
        image: doctorToEdit.image || '',
        instagram: doctorToEdit.instagram || '',
        facebook: doctorToEdit.facebook || '',
        linkedin: doctorToEdit.linkedin || '',
        twitter: doctorToEdit.twitter || '',
        reels: Array.isArray(doctorToEdit.reels) ? [...doctorToEdit.reels, '', '', '', '', ''].slice(0, 5) : ['', '', '', '', ''],
        youtube_videos: Array.isArray(doctorToEdit.youtube_videos) ? [...doctorToEdit.youtube_videos, '', ''].slice(0, 2) : ['', ''],
        faqs: Array.isArray(doctorToEdit.faqs) ? doctorToEdit.faqs : [],
        awards: initialAwards,
        certifications: initialCerts,
        memberships: initialMems,
        careerExperience: initialTimeline,
        tags: Array.isArray(doctorToEdit.tags) ? doctorToEdit.tags.filter(Boolean) : []
      };
    }
    return {
      name: '',
      specialty: 'Cardiologist',
      customSpecialty: '',
      hospital: hospitals[0]?.name || '',
      experienceYears: 5,
      price: 500,
      rating: 0,
      reviews: '0',
      degree: '',
      jobTitle: '',
      licenseNumber: '',
      phone: '',
      email: '',
      availableDays: '',
      helplineNumber: '',
      helplineDays: '',
      helplineTime: '',
      about: '',
      available: true,
      isStarDoctor: false,
      image: '',
      instagram: '',
      facebook: '',
      linkedin: '',
      twitter: '',
      reels: ['', '', '', '', ''],
      youtube_videos: ['', ''],
      faqs: [],
      awards: [],
      certifications: [],
      memberships: [],
      careerExperience: [],
      tags: []
    };
  });

  const lastSyncedDocRef = useRef(doctorToEdit);
  const isSubmittingRef = useRef(false);
  const dirtyFieldsRef = useRef(new Set());

  // Realtime synchronization: If doctor updates their profile from Doctor Dashboard, reflect in Admin Form
  useEffect(() => {
    if (!doctorToEdit || isSubmittingRef.current) return;
    const prevDoc = lastSyncedDocRef.current;
    lastSyncedDocRef.current = doctorToEdit;

    // If initial mount or no previous doc to compare against, useState initializer already set up formData
    if (!prevDoc) return;

    const rawIncomingPhone = String(doctorToEdit.phone || doctorToEdit.contact_number || '').replace(/\D/g, '');
    const cleanIncomingPhone = rawIncomingPhone.length > 10 ? rawIncomingPhone.slice(-10) : rawIncomingPhone;
    const rawPrevPhone = String(prevDoc.phone || prevDoc.contact_number || '').replace(/\D/g, '');
    const cleanPrevPhone = rawPrevPhone.length > 10 ? rawPrevPhone.slice(-10) : rawPrevPhone;

    const remotePhoneChanged = cleanIncomingPhone !== cleanPrevPhone && cleanIncomingPhone !== '' && !dirtyFieldsRef.current.has('phone');
    const remoteEmailChanged = doctorToEdit.email !== prevDoc.email && doctorToEdit.email !== undefined && !dirtyFieldsRef.current.has('email');
    const remoteHospitalChanged = doctorToEdit.hospital !== prevDoc.hospital && doctorToEdit.hospital !== undefined && !dirtyFieldsRef.current.has('hospital');
    const remoteSpec = doctorToEdit.specialty || doctorToEdit.specialization || '';
    const prevSpec = prevDoc.specialty || prevDoc.specialization || '';
    const remoteSpecChanged = remoteSpec !== prevSpec && remoteSpec !== '' && !dirtyFieldsRef.current.has('specialty');
    const remoteNameChanged = doctorToEdit.name !== prevDoc.name && doctorToEdit.name !== undefined && !dirtyFieldsRef.current.has('name');
    const remoteStarChanged = doctorToEdit.isStarDoctor !== prevDoc.isStarDoctor && doctorToEdit.isStarDoctor !== undefined && !dirtyFieldsRef.current.has('isStarDoctor');
    const remoteAwardsChanged = doctorToEdit.awards && JSON.stringify(doctorToEdit.awards) !== JSON.stringify(prevDoc.awards) && !dirtyFieldsRef.current.has('awards');
    const remoteCertsChanged = doctorToEdit.certifications && JSON.stringify(doctorToEdit.certifications) !== JSON.stringify(prevDoc.certifications) && !dirtyFieldsRef.current.has('certifications');
    const remoteMemsChanged = doctorToEdit.memberships && JSON.stringify(doctorToEdit.memberships) !== JSON.stringify(prevDoc.memberships) && !dirtyFieldsRef.current.has('memberships');
    const remoteExpChanged = doctorToEdit.careerExperience && JSON.stringify(doctorToEdit.careerExperience) !== JSON.stringify(prevDoc.careerExperience) && !dirtyFieldsRef.current.has('careerExperience');
    const remoteTagsChanged = doctorToEdit.tags && JSON.stringify(doctorToEdit.tags) !== JSON.stringify(prevDoc.tags) && !dirtyFieldsRef.current.has('tags');
    const remoteHelplineNumberChanged = doctorToEdit.helplineNumber !== prevDoc.helplineNumber && doctorToEdit.helplineNumber !== undefined && !dirtyFieldsRef.current.has('helplineNumber');
    const remoteHelplineDaysChanged = doctorToEdit.helplineDays !== prevDoc.helplineDays && doctorToEdit.helplineDays !== undefined && !dirtyFieldsRef.current.has('helplineDays');
    const remoteHelplineTimeChanged = doctorToEdit.helplineTime !== prevDoc.helplineTime && doctorToEdit.helplineTime !== undefined && !dirtyFieldsRef.current.has('helplineTime');
    const remoteJobTitleChanged = doctorToEdit.jobTitle !== prevDoc.jobTitle && doctorToEdit.jobTitle !== undefined && !dirtyFieldsRef.current.has('jobTitle');
    const remoteLicenseChanged = doctorToEdit.licenseNumber !== prevDoc.licenseNumber && doctorToEdit.licenseNumber !== undefined && !dirtyFieldsRef.current.has('licenseNumber');
    const remoteInstagramChanged = doctorToEdit.instagram !== prevDoc.instagram && doctorToEdit.instagram !== undefined && !dirtyFieldsRef.current.has('instagram');
    const remoteFacebookChanged = doctorToEdit.facebook !== prevDoc.facebook && doctorToEdit.facebook !== undefined && !dirtyFieldsRef.current.has('facebook');
    const remoteLinkedinChanged = doctorToEdit.linkedin !== prevDoc.linkedin && doctorToEdit.linkedin !== undefined && !dirtyFieldsRef.current.has('linkedin');
    const remoteTwitterChanged = doctorToEdit.twitter !== prevDoc.twitter && doctorToEdit.twitter !== undefined && !dirtyFieldsRef.current.has('twitter');
    const remoteReelsChanged = doctorToEdit.reels && JSON.stringify(doctorToEdit.reels) !== JSON.stringify(prevDoc.reels) && !dirtyFieldsRef.current.has('reels');

    if (
      !remotePhoneChanged &&
      !remoteEmailChanged &&
      !remoteHospitalChanged &&
      !remoteSpecChanged &&
      !remoteNameChanged &&
      !remoteStarChanged &&
      !remoteAwardsChanged &&
      !remoteCertsChanged &&
      !remoteMemsChanged &&
      !remoteExpChanged &&
      !remoteTagsChanged &&
      !remoteHelplineNumberChanged &&
      !remoteHelplineDaysChanged &&
      !remoteHelplineTimeChanged &&
      !remoteJobTitleChanged &&
      !remoteLicenseChanged &&
      !remoteInstagramChanged &&
      !remoteFacebookChanged &&
      !remoteLinkedinChanged &&
      !remoteTwitterChanged &&
      !remoteReelsChanged
    ) {
      return;
    }

    const isSpecialtyInOptions = SPECIALTY_OPTIONS.includes(remoteSpec);

    setFormData(prev => {
      const next = { ...prev };
      if (remotePhoneChanged) next.phone = cleanIncomingPhone;
      if (remoteEmailChanged) next.email = doctorToEdit.email;
      if (remoteHospitalChanged) next.hospital = doctorToEdit.hospital;
      if (remoteSpecChanged) {
        next.specialty = isSpecialtyInOptions ? remoteSpec : 'Other';
        next.customSpecialty = isSpecialtyInOptions ? '' : remoteSpec;
      }
      if (remoteNameChanged) next.name = doctorToEdit.name;
      if (remoteStarChanged) next.isStarDoctor = Boolean(doctorToEdit.isStarDoctor);
      if (remoteAwardsChanged) next.awards = doctorToEdit.awards;
      if (remoteCertsChanged) next.certifications = doctorToEdit.certifications;
      if (remoteMemsChanged) next.memberships = doctorToEdit.memberships;
      if (remoteExpChanged) next.careerExperience = doctorToEdit.careerExperience;
      if (remoteTagsChanged) next.tags = Array.isArray(doctorToEdit.tags) ? doctorToEdit.tags : [];
      if (doctorToEdit.jobTitle !== undefined && !dirtyFieldsRef.current.has('jobTitle')) next.jobTitle = doctorToEdit.jobTitle || '';
      if (doctorToEdit.licenseNumber !== undefined && !dirtyFieldsRef.current.has('licenseNumber')) next.licenseNumber = doctorToEdit.licenseNumber || '';
      if (doctorToEdit.helplineNumber !== undefined && !dirtyFieldsRef.current.has('helplineNumber')) next.helplineNumber = doctorToEdit.helplineNumber || '';
      if (doctorToEdit.helplineDays !== undefined && !dirtyFieldsRef.current.has('helplineDays')) next.helplineDays = doctorToEdit.helplineDays || '';
      if (doctorToEdit.helplineTime !== undefined && !dirtyFieldsRef.current.has('helplineTime')) next.helplineTime = doctorToEdit.helplineTime || '';
      if (remoteInstagramChanged) next.instagram = doctorToEdit.instagram || '';
      if (remoteFacebookChanged) next.facebook = doctorToEdit.facebook || '';
      if (remoteLinkedinChanged) next.linkedin = doctorToEdit.linkedin || '';
      if (remoteTwitterChanged) next.twitter = doctorToEdit.twitter || '';
      if (remoteReelsChanged) {
        next.reels = Array.isArray(doctorToEdit.reels)
          ? [...doctorToEdit.reels, '', '', '', '', ''].slice(0, 5)
          : ['', '', '', '', ''];
      }
      return next;
    });

    if (doctorToEdit.image && typeof doctorToEdit.image === 'string' && doctorToEdit.image.startsWith('http') && doctorToEdit.image !== prevDoc.image) {
      setImageType('url');
      setCustomImageUrl(doctorToEdit.image);
    }
  }, [
    doctorToEdit?._id,
    doctorToEdit?.id,
    doctorToEdit?.name,
    doctorToEdit?.specialty,
    doctorToEdit?.specialization,
    doctorToEdit?.phone,
    doctorToEdit?.contact_number,
    doctorToEdit?.email,
    doctorToEdit?.hospital,
    doctorToEdit?.image,
    doctorToEdit?.jobTitle,
    doctorToEdit?.licenseNumber,
    doctorToEdit?.isStarDoctor,
    doctorToEdit?.helplineNumber,
    doctorToEdit?.helplineDays,
    doctorToEdit?.helplineTime,
    doctorToEdit?.instagram,
    doctorToEdit?.facebook,
    doctorToEdit?.linkedin,
    doctorToEdit?.twitter,
    JSON.stringify(doctorToEdit?.awards || []),
    JSON.stringify(doctorToEdit?.certifications || []),
    JSON.stringify(doctorToEdit?.memberships || []),
    JSON.stringify(doctorToEdit?.careerExperience || []),
    JSON.stringify(doctorToEdit?.tags || [])
  ]);

  // Realtime instant listener: sync doctor phone & helpline details immediately when updated in Doctor Portal
  useEffect(() => {
    if (!doctorToEdit) return;
    const targetId = doctorToEdit._id || doctorToEdit.id;

    const handleRealtimeDocChange = (e) => {
      const payload = e.detail;
      if (!payload || payload.collection !== 'doctors') return;
      if (payload.docId && String(payload.docId) === String(targetId)) {
        const fresh = payload.fullDocument;
        if (fresh) {
          setFormData(prev => ({
            ...prev,
            helplineNumber: (!dirtyFieldsRef.current.has('helplineNumber') && fresh.helplineNumber !== undefined) ? fresh.helplineNumber : prev.helplineNumber,
            helplineDays: (!dirtyFieldsRef.current.has('helplineDays') && fresh.helplineDays !== undefined) ? fresh.helplineDays : prev.helplineDays,
            helplineTime: (!dirtyFieldsRef.current.has('helplineTime') && fresh.helplineTime !== undefined) ? fresh.helplineTime : prev.helplineTime,
            phone: (!dirtyFieldsRef.current.has('phone') && (fresh.phone || fresh.contact_number)) ? String(fresh.phone || fresh.contact_number).replace(/\D/g, '').slice(-10) : prev.phone,
            jobTitle: (!dirtyFieldsRef.current.has('jobTitle') && fresh.jobTitle !== undefined) ? fresh.jobTitle : prev.jobTitle,
            licenseNumber: (!dirtyFieldsRef.current.has('licenseNumber') && fresh.licenseNumber !== undefined) ? fresh.licenseNumber : prev.licenseNumber,
            instagram: (!dirtyFieldsRef.current.has('instagram') && fresh.instagram !== undefined) ? fresh.instagram : prev.instagram,
            facebook: (!dirtyFieldsRef.current.has('facebook') && fresh.facebook !== undefined) ? fresh.facebook : prev.facebook,
            linkedin: (!dirtyFieldsRef.current.has('linkedin') && fresh.linkedin !== undefined) ? fresh.linkedin : prev.linkedin,
            twitter: (!dirtyFieldsRef.current.has('twitter') && fresh.twitter !== undefined) ? fresh.twitter : prev.twitter
          }));
        }
      }
    };

    window.addEventListener('sehat_db_change', handleRealtimeDocChange);
    return () => window.removeEventListener('sehat_db_change', handleRealtimeDocChange);
  }, [doctorToEdit?._id, doctorToEdit?.id]);

  // Credentials sub-tab navigation
  const [activeCredTab, setActiveCredTab] = useState('awards');

  // Awards state & handlers
  const [newAwardTitle, setNewAwardTitle] = useState('');
  const [newAwardSubtitle, setNewAwardSubtitle] = useState('');
  const [newAwardYear, setNewAwardYear] = useState('');
  const [editingAwardIdx, setEditingAwardIdx] = useState(null);
  const [editingAwardData, setEditingAwardData] = useState({ title: '', subtitle: '', year: '' });

  const parseAward = (item) => {
    if (typeof item === 'object' && item !== null) {
      return {
        title: item.title || item.name || '',
        subtitle: item.subtitle || item.recognition || item.organization || 'National Healthcare Recognition',
        year: item.year || item.tag || ''
      };
    }
    let str = String(item || '').trim();
    let title = str;
    let subtitle = '';
    let year = '';
    if (str.includes(' - ')) {
      const parts = str.split(' - ');
      title = parts[0].trim();
      subtitle = parts.slice(1).join(' - ').trim();
    }
    if (subtitle.includes('(') && subtitle.includes(')')) {
      const match = subtitle.match(/\((.*?)\)/);
      if (match) {
        year = match[1].trim();
        subtitle = subtitle.replace(/\(.*?\)/, '').trim();
      }
    } else if (title.includes('(') && title.includes(')')) {
      const match = title.match(/\((.*?)\)/);
      if (match) {
        year = match[1].trim();
        title = title.replace(/\(.*?\)/, '').trim();
      }
    }
    return { title, subtitle: subtitle || 'National Healthcare Recognition', year };
  };

  const handleAddAward = () => {
    if (!newAwardTitle.trim()) return;
    const newAward = {
      title: newAwardTitle.trim(),
      subtitle: newAwardSubtitle.trim() || 'National Healthcare Recognition',
      recognition: newAwardSubtitle.trim() || 'National Healthcare Recognition',
      year: newAwardYear.trim()
    };
    setFormData(prev => ({ ...prev, awards: [...(prev.awards || []), newAward] }));
    setNewAwardTitle('');
    setNewAwardSubtitle('');
    setNewAwardYear('');
  };

  const handleSaveEditAward = (idx) => {
    if (!editingAwardData.title.trim()) return;
    const updated = [...(formData.awards || [])];
    updated[idx] = {
      title: editingAwardData.title.trim(),
      subtitle: editingAwardData.subtitle.trim() || 'National Healthcare Recognition',
      recognition: editingAwardData.subtitle.trim() || 'National Healthcare Recognition',
      year: editingAwardData.year.trim()
    };
    setFormData(prev => ({ ...prev, awards: updated }));
    setEditingAwardIdx(null);
  };

  const handleRemoveAward = (idx) => {
    setFormData(prev => ({ ...prev, awards: (prev.awards || []).filter((_, i) => i !== idx) }));
  };

  // Certifications state & handlers
  const [newCertTitle, setNewCertTitle] = useState('');
  const [newCertSubtitle, setNewCertSubtitle] = useState('');
  const [newCertTag, setNewCertTag] = useState('');
  const [editingCertIdx, setEditingCertIdx] = useState(null);
  const [editingCertData, setEditingCertData] = useState({ title: '', subtitle: '', tag: '' });

  const parseCert = (item) => {
    if (typeof item === 'object' && item !== null) {
      return {
        title: item.title || item.name || '',
        subtitle: item.subtitle || item.board || item.authority || 'Accredited Medical Board',
        tag: item.tag || item.status || 'Certified'
      };
    }
    let str = String(item || '').trim();
    let title = str;
    let subtitle = 'Accredited Medical Board';
    let tag = 'Certified';
    if (str.includes(' - ')) {
      const parts = str.split(' - ');
      title = parts[0].trim();
      subtitle = parts.slice(1).join(' - ').trim();
    }
    if (subtitle.includes('(') && subtitle.includes(')')) {
      const match = subtitle.match(/\((.*?)\)/);
      if (match) {
        tag = match[1].trim();
        subtitle = subtitle.replace(/\(.*?\)/, '').trim();
      }
    } else if (title.includes('(') && title.includes(')')) {
      const match = title.match(/\((.*?)\)/);
      if (match) {
        tag = match[1].trim();
        title = title.replace(/\(.*?\)/, '').trim();
      }
    }
    return { title, subtitle: subtitle || 'Accredited Medical Board', tag };
  };

  const handleAddCert = () => {
    if (!newCertTitle.trim()) return;
    const newCert = {
      title: newCertTitle.trim(),
      subtitle: newCertSubtitle.trim() || 'Accredited Medical Board',
      board: newCertSubtitle.trim() || 'Accredited Medical Board',
      authority: newCertSubtitle.trim() || 'Accredited Medical Board',
      tag: newCertTag.trim() || 'Certified'
    };
    setFormData(prev => ({ ...prev, certifications: [...(prev.certifications || []), newCert] }));
    setNewCertTitle('');
    setNewCertSubtitle('');
    setNewCertTag('');
  };

  const handleSaveEditCert = (idx) => {
    if (!editingCertData.title.trim()) return;
    const updated = [...(formData.certifications || [])];
    updated[idx] = {
      title: editingCertData.title.trim(),
      subtitle: editingCertData.subtitle.trim() || 'Accredited Medical Board',
      board: editingCertData.subtitle.trim() || 'Accredited Medical Board',
      authority: editingCertData.subtitle.trim() || 'Accredited Medical Board',
      tag: editingCertData.tag.trim() || 'Certified'
    };
    setFormData(prev => ({ ...prev, certifications: updated }));
    setEditingCertIdx(null);
  };

  const handleRemoveCert = (idx) => {
    setFormData(prev => ({ ...prev, certifications: (prev.certifications || []).filter((_, i) => i !== idx) }));
  };

  // Memberships state & handlers
  const [newMemTitle, setNewMemTitle] = useState('');
  const [newMemCouncil, setNewMemCouncil] = useState('');
  const [newMemStatus, setNewMemStatus] = useState('Life Member');
  const [newMemShowStatus, setNewMemShowStatus] = useState(true);
  const [editingMemIdx, setEditingMemIdx] = useState(null);
  const [editingMemData, setEditingMemData] = useState({ title: '', council: '', status: 'Life Member', showStatus: true });

  const parseMembership = (item) => {
    if (typeof item === 'object' && item !== null) {
      return {
        title: item.title || item.name || '',
        council: item.council || item.subtitle || 'Official Medical Council',
        status: item.status !== undefined ? item.status : (item.tag || 'Active Member'),
        showStatus: item.showStatus !== undefined ? Boolean(item.showStatus) : true
      };
    }
    const str = String(item || '').trim();
    let title = str;
    let status = 'Life Member';
    if (str.includes(' - ')) {
      const parts = str.split(' - ');
      title = parts[0].trim();
      status = parts.slice(1).join(' - ').trim();
    }
    return { title, council: 'Official Medical Council', status, showStatus: true };
  };

  const handleAddMembership = () => {
    if (!newMemTitle.trim()) return;
    const newMem = {
      title: newMemTitle.trim(),
      council: newMemCouncil.trim() || 'Official Medical Council',
      subtitle: newMemCouncil.trim() || 'Official Medical Council',
      status: newMemStatus.trim() || 'Life Member',
      showStatus: Boolean(newMemShowStatus)
    };
    setFormData(prev => ({ ...prev, memberships: [...(prev.memberships || []), newMem] }));
    setNewMemTitle('');
    setNewMemCouncil('');
    setNewMemStatus('Life Member');
    setNewMemShowStatus(true);
  };

  const handleSaveEditMembership = (idx) => {
    if (!editingMemData.title.trim()) return;
    const updated = [...(formData.memberships || [])];
    updated[idx] = {
      title: editingMemData.title.trim(),
      council: editingMemData.council.trim() || 'Official Medical Council',
      subtitle: editingMemData.council.trim() || 'Official Medical Council',
      status: editingMemData.status.trim() || 'Life Member',
      showStatus: Boolean(editingMemData.showStatus)
    };
    setFormData(prev => ({ ...prev, memberships: updated }));
    setEditingMemIdx(null);
  };

  const handleRemoveMembership = (idx) => {
    setFormData(prev => ({ ...prev, memberships: (prev.memberships || []).filter((_, i) => i !== idx) }));
  };

  // Career Experience state & handlers
  const [newRole, setNewRole] = useState('');
  const [newRoleHospital, setNewRoleHospital] = useState('');
  const [newRoleStartYear, setNewRoleStartYear] = useState('');
  const [newRoleEndYear, setNewRoleEndYear] = useState('');
  const [newRoleIsPresent, setNewRoleIsPresent] = useState(false);
  const [editingExpIdx, setEditingExpIdx] = useState(null);
  const [editingExpData, setEditingExpData] = useState({ role: '', hospital: '', startYear: '', endYear: '', isPresent: false });

  const parseCareerExp = (item, defaultHosp = '') => {
    if (typeof item === 'object' && item !== null) {
      const role = (item.role || item.title || '').trim();
      const hospital = (item.hospital !== undefined ? item.hospital : defaultHosp || '').trim();
      const startYear = (item.startYear || '').toString().trim();
      const isPresent = Boolean(item.isPresent || (typeof item.endYear === 'string' && item.endYear.toLowerCase().includes('present')));
      const endYear = isPresent ? '' : (item.endYear || '').toString().trim();
      return { role, hospital, startYear, endYear, isPresent };
    }
    const str = String(item || '').trim();
    let text = str;
    let startYear = '';
    let endYear = '';
    let isPresent = false;
    if (str.includes('(') && str.includes(')')) {
      const match = str.match(/\((.*?)\)/);
      if (match) {
        const yearPart = match[1].trim();
        text = str.replace(/\(.*?\)/, '').trim();
        if (yearPart.toLowerCase().includes('present')) {
          isPresent = true;
          const yMatch = yearPart.match(/(\d{4})/);
          if (yMatch) startYear = yMatch[1];
        } else if (yearPart.includes('-') || yearPart.includes('–')) {
          const yParts = yearPart.split(/[-–]/).map(s => s.trim());
          startYear = yParts[0] || '';
          endYear = yParts[1] || '';
        } else {
          startYear = yearPart;
        }
      }
    } else if (str.toLowerCase().includes('present')) {
      isPresent = true;
      text = str.replace(/present/i, '').replace(/[-–()]/g, '').trim();
    }
    let role = text;
    let hospital = defaultHosp || '';
    if (text.includes(' - ')) {
      const parts = text.split(' - ');
      role = parts[0].trim();
      hospital = parts.slice(1).join(' - ').trim();
    }
    return { role, hospital, startYear, endYear, isPresent };
  };

  const handleAddCareerExp = () => {
    if (!newRole.trim()) return;
    const newExp = {
      role: newRole.trim(),
      hospital: newRoleHospital.trim() || formData.hospital || 'Apollo Hospital',
      startYear: newRoleStartYear.trim(),
      endYear: newRoleIsPresent ? '' : newRoleEndYear.trim(),
      isPresent: Boolean(newRoleIsPresent)
    };
    setFormData(prev => ({ ...prev, careerExperience: [...(prev.careerExperience || []), newExp] }));
    setNewRole('');
    setNewRoleHospital('');
    setNewRoleStartYear('');
    setNewRoleEndYear('');
    setNewRoleIsPresent(false);
  };

  const handleSaveEditCareerExp = (idx) => {
    if (!editingExpData.role.trim()) return;
    const updated = [...(formData.careerExperience || [])];
    updated[idx] = {
      role: editingExpData.role.trim(),
      hospital: editingExpData.hospital.trim() || formData.hospital || 'Apollo Hospital',
      startYear: editingExpData.startYear.trim(),
      endYear: editingExpData.isPresent ? '' : editingExpData.endYear.trim(),
      isPresent: Boolean(editingExpData.isPresent)
    };
    setFormData(prev => ({ ...prev, careerExperience: updated }));
    setEditingExpIdx(null);
  };

  const handleRemoveCareerExp = (idx) => {
    setFormData(prev => ({ ...prev, careerExperience: (prev.careerExperience || []).filter((_, i) => i !== idx) }));
  };

  // Reorder helper
  const moveItem = (listKey, index, direction) => {
    const list = [...(formData[listKey] || [])];
    const targetIdx = index + direction;
    if (targetIdx < 0 || targetIdx >= list.length) return;
    const temp = list[index];
    list[index] = list[targetIdx];
    list[targetIdx] = temp;
    setFormData(prev => ({ ...prev, [listKey]: list }));
  };

  // Helper to load sample defaults
  const handleLoadSamples = (key) => {
    if (key === 'awards') {
      setFormData(prev => ({ ...prev, awards: DEFAULT_RAHUL_AWARDS }));
    } else if (key === 'certifications') {
      setFormData(prev => ({ ...prev, certifications: DEFAULT_RAHUL_CERTS }));
    } else if (key === 'memberships') {
      setFormData(prev => ({ ...prev, memberships: DEFAULT_RAHUL_MEMS }));
    } else if (key === 'careerExperience') {
      const hosp = formData.hospital || 'Apollo Hospital';
      setFormData(prev => ({
        ...prev,
        careerExperience: [
          { role: `Senior Consultant ${formData.specialty || 'Specialist'}`, hospital: hosp, startYear: '2018', endYear: '', isPresent: true },
          { role: `Associate Consultant ${formData.specialty || 'Specialist'}`, hospital: 'Fortis Healthcare', startYear: '2014', endYear: '2018', isPresent: false },
          { role: 'Chief Resident Specialist', hospital: 'All India Institute of Medical Sciences', startYear: '2011', endYear: '2014', isPresent: false }
        ]
      }));
    } else if (key === 'tags') {
      handleResetDefaultTags();
    }
  };

  // Helper to clear list
  const handleClearList = (key, name) => {
    if (key === 'tags') {
      if (window.confirm('Are you sure you want to clear all tags?')) {
        handleClearAllTags();
      }
      return;
    }
    if (window.confirm(`Are you sure you want to clear all ${name}?`)) {
      setFormData(prev => ({ ...prev, [key]: [] }));
    }
  };

  // Tags State & Handlers
  const [newTagInput, setNewTagInput] = useState('');

  const handleAddTag = (tagText) => {
    const text = (tagText || newTagInput || '').trim();
    if (!text) return;
    const current = Array.isArray(formData.tags) ? formData.tags : [];
    if (current.includes(text)) {
      setNewTagInput('');
      return;
    }
    const updated = [...current, text];
    setFormData(prev => ({ ...prev, tags: updated }));
    setNewTagInput('');
    const docId = doctorToEdit?._id || doctorToEdit?.id;
    if (docId) {
      updateDoctor(docId, { tags: updated });
    }
  };

  const handleRemoveTag = (tagToRemove) => {
    const current = Array.isArray(formData.tags) ? formData.tags : [];
    const updated = current.filter(t => t !== tagToRemove);
    setFormData(prev => ({ ...prev, tags: updated }));
    const docId = doctorToEdit?._id || doctorToEdit?.id;
    if (docId) {
      updateDoctor(docId, { tags: updated });
    }
  };

  const handleResetDefaultTags = () => {
    const defaults = getDefaultDoctorTags(formData);
    setFormData(prev => ({ ...prev, tags: defaults }));
    const docId = doctorToEdit?._id || doctorToEdit?.id;
    if (docId) {
      updateDoctor(docId, { tags: defaults });
    }
  };

  const handleClearAllTags = () => {
    setFormData(prev => ({ ...prev, tags: [] }));
    const docId = doctorToEdit?._id || doctorToEdit?.id;
    if (docId) {
      updateDoctor(docId, { tags: [] });
    }
  };

  const renderTagsManager = () => (
    <div className={styles.tagsContainer}>
      {/* Current Tags Chips */}
      <div className={styles.tagsChipList}>
        {Array.isArray(formData.tags) && formData.tags.length > 0 ? (
          formData.tags.map((tag, tIdx) => (
            <div key={`tag-${tIdx}-${tag}`} className={styles.tagChip}>
              <span>{tag}</span>
              <button
                type="button"
                onClick={() => handleRemoveTag(tag)}
                title={`Remove tag "${tag}"`}
                className={styles.tagRemoveBtn}
              >
                <X size={11} />
              </button>
            </div>
          ))
        ) : (
          <div style={{ color: '#94a3b8', fontSize: '0.84rem', fontStyle: 'italic', padding: '6px 0' }}>
            No procedure or focus tags added yet. Type a tag below or click suggestions to add.
          </div>
        )}
      </div>

      {/* Add Custom Tag Form Row */}
      <div className={styles.tagInputRow}>
        <input
          type="text"
          value={newTagInput}
          onChange={(e) => setNewTagInput(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === 'Enter') {
              e.preventDefault();
              handleAddTag();
            }
          }}
          placeholder="Type procedure/focus tag (e.g. Angioplasty Specialist, Echocardiography)..."
          className={styles.tagInput}
        />
        <button
          type="button"
          onClick={() => handleAddTag()}
          className={styles.tagAddBtn}
        >
          <Plus size={15} />
          Add Tag
        </button>
      </div>

      {/* Quick Suggestions */}
      <div className={styles.tagSuggestionsWrap}>
        <span style={{ fontSize: '0.78rem', fontWeight: 600, color: '#64748b', marginRight: '4px' }}>
          Recommended for {formData.specialty}:
        </span>
        {getSpecialtySuggestions(formData.specialty)
          .filter(sug => !Array.isArray(formData.tags) || !formData.tags.includes(sug))
          .slice(0, 7)
          .map((sug, sIdx) => (
            <button
              key={sIdx}
              type="button"
              onClick={() => handleAddTag(sug)}
              className={styles.tagSuggestionPill}
              title={`Add "${sug}"`}
            >
              <Plus size={11} />
              {sug}
            </button>
          ))}
      </div>
    </div>
  );

  const [newFaqQ, setNewFaqQ] = useState('');
  const [newFaqA, setNewFaqA] = useState('');
  const [newFaqCategory, setNewFaqCategory] = useState('Booking & Schedule');
  const [newFaqIcon, setNewFaqIcon] = useState('calendar');
  const [newFaqImage, setNewFaqImage] = useState('');
  const [editingFaqIdx, setEditingFaqIdx] = useState(null);
  const [editingFaqData, setEditingFaqData] = useState({ q: '', a: '', category: 'Booking & Schedule', icon: 'calendar', image: '' });
  const [draggedFaqIndex, setDraggedFaqIndex] = useState(null);

  const handleMoveFaq = (index, direction) => {
    const targetIndex = index + direction;
    if (!formData.faqs || targetIndex < 0 || targetIndex >= formData.faqs.length) return;
    const updated = [...formData.faqs];
    const [moved] = updated.splice(index, 1);
    updated.splice(targetIndex, 0, moved);
    dirtyFieldsRef.current.add('faqs');
    setFormData(prev => ({ ...prev, faqs: updated }));
  };

  const handleFaqDragStart = (e, index) => {
    setDraggedFaqIndex(index);
    e.dataTransfer.effectAllowed = 'move';
    try {
      e.dataTransfer.setData('text/plain', String(index));
    } catch {}
  };

  const handleFaqDragOver = (e, index) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
  };

  const handleFaqDrop = (e, targetIndex) => {
    e.preventDefault();
    if (draggedFaqIndex === null || draggedFaqIndex === targetIndex) {
      setDraggedFaqIndex(null);
      return;
    }
    const updated = [...formData.faqs];
    const [moved] = updated.splice(draggedFaqIndex, 1);
    updated.splice(targetIndex, 0, moved);
    dirtyFieldsRef.current.add('faqs');
    setFormData(prev => ({ ...prev, faqs: updated }));
    setDraggedFaqIndex(null);
  };

  const [imageType, setImageType] = useState(() => {
    if (doctorToEdit && typeof doctorToEdit.image === 'string' && doctorToEdit.image.startsWith('http')) {
      if (DEFAULT_DOCTOR_AVATARS.some(a => a.url === doctorToEdit.image || doctorToEdit.image.includes(a.key))) {
        return 'preset';
      }
      return 'url';
    }
    return 'preset';
  });

  const [customImageUrl, setCustomImageUrl] = useState(() => {
    if (doctorToEdit && typeof doctorToEdit.image === 'string' && doctorToEdit.image.startsWith('http')) {
      return doctorToEdit.image;
    }
    return '';
  });

  const [errors, setErrors] = useState({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState('');

  const validate = () => {
    const newErrors = {};
    if (!doctorToEdit && (!formData.name || !formData.name.trim())) newErrors.name = 'Doctor name is required';
    if (!formData.email || !formData.email.trim()) {
      newErrors.email = 'Doctor email address is required (for login credentials)';
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email.trim())) {
      newErrors.email = 'Please enter a valid email address';
    }
    if (formData.specialty === 'Other' && !doctorToEdit && (!formData.customSpecialty || !formData.customSpecialty.trim())) {
      newErrors.customSpecialty = 'Please specify specialty';
    }
    if (formData.price === '' || formData.price === undefined || isNaN(Number(formData.price)) || Number(formData.price) < 0) {
      newErrors.price = 'Valid consultation fee is required';
    }
    if (formData.experienceYears === '' || formData.experienceYears === undefined || isNaN(Number(formData.experienceYears)) || Number(formData.experienceYears) < 0) {
      newErrors.experienceYears = 'Experience is required (0 or greater)';
    }
    setErrors(newErrors);
    if (Object.keys(newErrors).length > 0) {
      setSubmitError('Please fix the required fields marked in red above before submitting.');
      return false;
    }
    return true;
  };

  const [isUploading, setIsUploading] = useState(false);
  const [deletingPhoto, setDeletingPhoto] = useState(false);

  const handleDeleteDoctorPhoto = async (skipConfirm = false) => {
    const curImage = (formData.image || doctorToEdit?.image || '').trim();
    if (!curImage) {
      setFormData(prev => ({ ...prev, image: '' }));
      setCustomImageUrl('');
      return;
    }

    if (!skipConfirm) {
      if (!window.confirm('Are you sure you want to permanently delete this doctor profile photo?')) {
        return;
      }
    }

    setDeletingPhoto(true);
    try {
      // 1. Delete from Cloudinary if hosted there
      if (curImage.includes('cloudinary.com') || curImage.includes('res.cloudinary.com')) {
        await api.deleteImage(curImage).catch((err) => {
          console.warn('Failed to delete doctor photo from Cloudinary:', err);
        });
      }

      // 2. Clear image from state
      setFormData(prev => ({ ...prev, image: '' }));
      setCustomImageUrl('');

      // 3. Persist immediately if editing an existing doctor
      const targetId = doctorToEdit?.id || doctorToEdit?._id;
      if (targetId) {
        await updateDoctor(targetId, { image: '' });
      }
    } catch (err) {
      console.error('Failed to permanently delete doctor photo:', err);
      alert('Error deleting photo: ' + (err.message || 'Please try again.'));
    } finally {
      setDeletingPhoto(false);
    }
  };

  const handleFileUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsUploading(true);
    try {
      // If previous photo was on Cloudinary, delete it to prevent orphaned files
      const oldImg = formData.image || doctorToEdit?.image;
      if (oldImg && (oldImg.includes('cloudinary.com') || oldImg.includes('res.cloudinary.com'))) {
        api.deleteImage(oldImg).catch(err => console.warn('Failed to delete old photo from Cloudinary:', err));
      }

      const url = await api.uploadImage(file, 'sehatbuddy/doctors');
      setFormData(prev => ({ ...prev, image: url }));
      setCustomImageUrl(url);
    } catch (err) {
      console.error('Failed to upload to Cloudinary:', err);
      const reader = new FileReader();
      reader.onloadend = () => {
        setFormData(prev => ({ ...prev, image: reader.result }));
      };
      reader.readAsDataURL(file);
    } finally {
      setIsUploading(false);
      e.target.value = '';
    }
  };

  const [uploadingReelIdx, setUploadingReelIdx] = useState(null);
  const [uploadingReelVideoIdx, setUploadingReelVideoIdx] = useState(null);
  const [deletingCoverIdx, setDeletingCoverIdx] = useState(null);
  const [deletingReelIdx, setDeletingReelIdx] = useState(null);
  const [fetchingCoverIdx, setFetchingCoverIdx] = useState(null);

  const handleDeleteReel = async (index) => {
    const newReels = [...formData.reels];
    const cur = (typeof newReels[index] === 'object' && newReels[index]) ? newReels[index] : {};
    const reelUrl = (typeof newReels[index] === 'string' ? newReels[index] : (cur.url || cur.link || '')).trim();
    const coverUrl = (cur.coverPhoto || '').trim();

    if (!reelUrl && !coverUrl) return;

    if (!window.confirm(`Are you sure you want to permanently delete Reel ${index + 1}? This will remove it from this doctor's profile and delete the video and cover photo from Cloudinary if no other profile is using it.`)) {
      return;
    }

    setDeletingReelIdx(index);
    try {
      // 1. Clear reel slot in state (both url and coverPhoto)
      newReels[index] = { url: '', coverPhoto: '' };
      setFormData(prev => ({ ...prev, reels: newReels }));

      // 2. Call backend atomic delete reel endpoint
      const targetId = doctorToEdit?.id || doctorToEdit?._id;
      if (targetId) {
        await api.deleteDoctorReel(targetId, index);
      }
    } catch (err) {
      console.error('Failed to permanently delete reel:', err);
      alert('Failed to delete reel: ' + (err.message || 'Please try again.'));
    } finally {
      setDeletingReelIdx(null);
    }
  };

  const handleReelVideoUpload = async (index, file) => {
    if (!file) return;
    setUploadingReelVideoIdx(index);
    try {
      const cur = (typeof formData.reels[index] === 'object' && formData.reels[index]) ? formData.reels[index] : {};
      const oldReelUrl = (typeof formData.reels[index] === 'string' ? formData.reels[index] : (cur.url || cur.link || '')).trim();
      const oldCoverUrl = (cur.coverPhoto || '').trim();

      const res = await api.uploadVideo(file, 'sehatbuddy/reels');
      const videoUrl = typeof res === 'string' ? res : (res?.url || '');
      if (videoUrl) {
        const autoCover = videoUrl.replace(/\.[^/.]+$/, '.jpg');

        const newReels = [...formData.reels];
        newReels[index] = { ...cur, url: videoUrl, coverPhoto: autoCover };
        setFormData(prev => ({ ...prev, reels: newReels }));

        const targetId = doctorToEdit?.id || doctorToEdit?._id;
        if (targetId) {
          await updateDoctor(targetId, { reels: newReels });
        }
      }
    } catch (err) {
      console.error('Failed to upload video to Cloudinary:', err);
      alert('Failed to upload video: ' + (err.message || 'Please check file format and size.'));
    } finally {
      setUploadingReelVideoIdx(null);
    }
  };

  const handleDeleteCoverPhoto = async (index) => {
    const newReels = [...formData.reels];
    const cur = (typeof newReels[index] === 'object' && newReels[index]) ? newReels[index] : {};
    const coverUrl = (cur.coverPhoto || '').trim();
    const currentUrl = (typeof newReels[index] === 'string' ? newReels[index] : (cur.url || cur.link || '')).trim();

    if (!coverUrl && !currentUrl) return;

    if (!window.confirm('Are you sure you want to permanently delete this cover photo? It will be removed from this doctor\'s profile and deleted from Cloudinary if no other profile is using it.')) {
      return;
    }

    setDeletingCoverIdx(index);
    try {
      // 1. Clear coverPhoto from form data completely
      newReels[index] = { ...cur, url: currentUrl, coverPhoto: '' };
      setFormData(prev => ({ ...prev, reels: newReels }));

      // 2. Call backend atomic delete cover endpoint
      const targetId = doctorToEdit?.id || doctorToEdit?._id;
      if (targetId) {
        await api.deleteDoctorReelCover(targetId, index);
      }
    } catch (err) {
      console.error('Failed to permanently delete cover photo:', err);
    } finally {
      setDeletingCoverIdx(null);
    }
  };

  const handleReelCoverUpload = async (index, file) => {
    if (!file) return;
    setUploadingReelIdx(index);
    try {
      const cur = (typeof formData.reels[index] === 'object' && formData.reels[index]) ? formData.reels[index] : {};
      const currentUrl = (typeof formData.reels[index] === 'string' ? formData.reels[index] : (cur.url || cur.link || '')).trim();
      const oldCoverUrl = (cur.coverPhoto || '').trim();

      const url = await api.uploadImage(file, 'sehatbuddy/reels');
      if (url) {
        const newReels = [...formData.reels];
        newReels[index] = { ...cur, url: currentUrl, coverPhoto: url };
        setFormData(prev => ({ ...prev, reels: newReels }));

        // Automatically persist to MongoDB Atlas & DataContext in real-time
        const targetId = doctorToEdit?.id || doctorToEdit?._id;
        if (targetId) {
          await updateDoctor(targetId, { reels: newReels });
        }
      }
    } catch (err) {
      console.error('Failed to upload reel cover to Cloudinary:', err);
      const reader = new FileReader();
      reader.onloadend = async () => {
        const newReels = [...formData.reels];
        const cur = (typeof newReels[index] === 'object' && newReels[index]) ? newReels[index] : {};
        const currentUrl = (typeof newReels[index] === 'string' ? newReels[index] : (cur.url || cur.link || '')).trim();
        newReels[index] = { ...cur, url: currentUrl, coverPhoto: reader.result };
        setFormData(prev => ({ ...prev, reels: newReels }));
        const targetId = doctorToEdit?.id || doctorToEdit?._id;
        if (targetId) {
          await updateDoctor(targetId, { reels: newReels });
        }
      };
      reader.readAsDataURL(file);
    } finally {
      setUploadingReelIdx(null);
    }
  };

  const handleCommitReels = async (reelsOverride = null) => {
    if (fetchingCoverIdx !== null && !reelsOverride) return;
    dirtyFieldsRef.current.delete('reels');
    const targetId = doctorToEdit?.id || doctorToEdit?._id;
    if (!targetId) return;
    const reelsToSave = reelsOverride || formData.reels;
    try {
      const cleaned = (reelsToSave || []).map(r => {
        if (typeof r === 'string') return r.trim() ? { url: r.trim(), coverPhoto: '' } : null;
        if (r && typeof r === 'object') {
          const u = (r.url || '').trim();
          let c = (r.coverPhoto || '').trim();
          // Never persist internal fallback proxy URLs as a custom cover
          if (c && (c.includes('reel-cover') || c.startsWith('api/'))) {
            c = '';
          }
          if (u || c) return { url: u, coverPhoto: c };
        }
        return null;
      }).filter(Boolean);
      await updateDoctor(targetId, { reels: cleaned });
    } catch (err) {
      console.warn('Failed to commit reels update:', err);
    }
  };

  const getCloudinaryVideoPoster = (url) => {
    if (!url || typeof url !== 'string' || !url.includes('cloudinary.com')) return '';
    const idx = url.indexOf('/video/upload/');
    if (idx === -1) return '';
    const prefix = url.substring(0, idx + '/video/upload/'.length);
    const remainder = url.substring(idx + '/video/upload/'.length);
    const versionMatch = remainder.match(/(v\d+\/.+?)\.(mp4|webm|mov|m4v)(\?.*)?$/i);
    if (versionMatch) {
      return prefix + 'so_0/' + versionMatch[1] + '.jpg';
    }
    const pathMatch = remainder.replace(/^[^/]+\//, '').replace(/\.(mp4|webm|mov|m4v)(\?.*)?$/i, '.jpg');
    return prefix + 'so_0/' + pathMatch;
  };

  const handleAutoFetchReelCover = async (index) => {
    const cur = (typeof formData.reels[index] === 'object' && formData.reels[index]) ? formData.reels[index] : {};
    const itemUrl = (typeof formData.reels[index] === 'string' ? formData.reels[index] : (cur.url || cur.link || '')).trim();
    if (!itemUrl) return;

    let shortcode = '';
    const igMatch = itemUrl.match(/instagram\.com\/(?:reel|reels|p|tv|share\/reel)\/([^/?#&]+)/i);
    if (igMatch && igMatch[1]) {
      shortcode = igMatch[1];
    } else {
      const cldMatch = itemUrl.match(/\/ig_([a-zA-Z0-9_-]+)(?:\.[a-zA-Z0-9]+|\?|$)/i);
      if (cldMatch && cldMatch[1]) {
        shortcode = cldMatch[1];
      }
    }
    if (!shortcode) return;

    setFetchingCoverIdx(index);
    try {
      const res = await api.getInstagramReelCover(`https://www.instagram.com/reel/${shortcode}/`);
      if (res && res.coverPhoto && res.coverPhoto.startsWith('http')) {
        setFormData(prev => {
          const updated = [...prev.reels];
          const item = updated[index] || {};
          updated[index] = { ...item, coverPhoto: res.coverPhoto };
          const targetId = doctorToEdit?.id || doctorToEdit?._id;
          if (targetId) {
            updateDoctor(targetId, { reels: updated }).catch(() => {});
          }
          return { ...prev, reels: updated };
        });
      }
    } catch (err) {
      console.warn('Manual auto-fetch cover note:', err);
    } finally {
      setFetchingCoverIdx(prev => (prev === index ? null : prev));
    }
  };

  const handleReelUrlChange = (index, newRawUrl) => {
    dirtyFieldsRef.current.add('reels');
    const rawVal = newRawUrl || '';
    const trimmedVal = rawVal.trim();
    const match = trimmedVal.match(/instagram\.com\/(?:reel|reels|p|tv|share\/reel)\/([^/?#&]+)/i);
    const shortcode = match && match[1] ? match[1] : '';
    const cleanVal = shortcode ? `https://www.instagram.com/reel/${shortcode}/` : rawVal;

    const cur = (typeof formData.reels[index] === 'object' && formData.reels[index]) ? formData.reels[index] : {};
    const oldUrl = (typeof formData.reels[index] === 'string' ? formData.reels[index] : (cur.url || cur.link || '')).trim();

    const isUrlChanged = cleanVal.trim() !== oldUrl;

    let newCover = cur.coverPhoto || '';
    if (isUrlChanged) {
      if (!cleanVal.trim()) {
        newCover = '';
      } else if (cleanVal.includes('cloudinary.com')) {
        newCover = getCloudinaryVideoPoster(cleanVal) || cleanVal.trim().replace(/\.[^/.]+$/, '.jpg');
      } else {
        newCover = '';
      }
    }

    const newReels = [...formData.reels];
    newReels[index] = {
      url: cleanVal,
      coverPhoto: isUrlChanged ? newCover : (cur.coverPhoto || '')
    };

    setFormData(prev => ({ ...prev, reels: newReels }));

    // Automatically fetch reel cover photo immediately upon pasting or entering an Instagram reel URL
    if (shortcode && (isUrlChanged || !cur.coverPhoto)) {
      const targetVal = `https://www.instagram.com/reel/${shortcode}/`;
      setFetchingCoverIdx(index);
      api.getInstagramReelCover(targetVal).then(res => {
        if (res && res.coverPhoto && res.coverPhoto.startsWith('http')) {
          setFormData(prev => {
            const updated = [...prev.reels];
            const item = updated[index] || {};
            const itemUrl = (typeof item === 'string' ? item : item.url) || '';
            const itemMatch = itemUrl.match(/instagram\.com\/(?:reel|reels|p|tv|share\/reel)\/([^/?#&]+)/i);
            const itemShortcode = itemMatch && itemMatch[1] ? itemMatch[1] : '';
            // Match if shortcodes match or if URL matches or if index matches
            if (itemShortcode === shortcode || itemUrl.trim() === targetVal || !itemUrl) {
              updated[index] = { ...item, url: targetVal, coverPhoto: res.coverPhoto };
              const targetId = doctorToEdit?.id || doctorToEdit?._id;
              if (targetId) {
                updateDoctor(targetId, { reels: updated }).catch(() => {});
              }
            }
            return { ...prev, reels: updated };
          });
        }
      }).catch(err => console.warn('Auto cover fetch note:', err))
        .finally(() => {
          setFetchingCoverIdx(prev => (prev === index ? null : prev));
        });
    }
  };

  const handleReelCoverUrlChange = (index, newCoverUrl) => {
    const newCover = (newCoverUrl || '').trim();
    const cur = (typeof formData.reels[index] === 'object' && formData.reels[index]) ? formData.reels[index] : {};
    const currentUrl = (typeof formData.reels[index] === 'string' ? formData.reels[index] : (cur.url || cur.link || '')).trim();

    const newReels = [...formData.reels];
    newReels[index] = { ...cur, url: currentUrl, coverPhoto: newCover };
    setFormData(prev => ({ ...prev, reels: newReels }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitError('');
    if (!validate()) return;

    setIsSubmitting(true);
    isSubmittingRef.current = true;
    try {
      const finalSpecialty = formData.specialty === 'Other' ? formData.customSpecialty.trim() : formData.specialty;
      const finalImage = imageType === 'url' && customImageUrl ? customImageUrl : formData.image;

      const payload = {
        name: formData.name.trim(),
        specialty: finalSpecialty,
        specialization: finalSpecialty,
        experienceYears: (formData.experienceYears !== '' && !isNaN(parseInt(formData.experienceYears, 10))) ? parseInt(formData.experienceYears, 10) : 0,
        experience: (formData.experienceYears !== '' && !isNaN(parseInt(formData.experienceYears, 10))) ? parseInt(formData.experienceYears, 10) : 0,
        experienceText: (formData.experienceYears !== '' && !isNaN(parseInt(formData.experienceYears, 10)) && parseInt(formData.experienceYears, 10) > 0)
          ? `${parseInt(formData.experienceYears, 10)}+ Years Experience`
          : 'Experienced',
        price: (formData.price !== '' && !isNaN(parseInt(formData.price, 10))) ? parseInt(formData.price, 10) : 0,
        fees: (formData.price !== '' && !isNaN(parseInt(formData.price, 10))) ? parseInt(formData.price, 10) : 0,
        rating: doctorToEdit?.rating !== undefined ? doctorToEdit.rating : (parseFloat(formData.rating) || 0),
        reviews: doctorToEdit?.reviews !== undefined ? doctorToEdit.reviews : (formData.reviews || '0'),
        hospital: formData.hospital || (hospitals[0]?.name || 'City General Hospital'),
        degree: formData.degree,
        jobTitle: formData.jobTitle ? String(formData.jobTitle).trim() : '',
        licenseNumber: formData.licenseNumber ? String(formData.licenseNumber).trim() : '',
        phone: formData.phone,
        email: formData.email.trim().toLowerCase(),
        availableDays: formData.availableDays,
        scheduleDays: (doctorToEdit && Array.isArray(doctorToEdit.scheduleDays) && doctorToEdit.scheduleDays.length > 0)
          ? doctorToEdit.scheduleDays
          : (formData.availableDays ? parseAvailableDaysAndHours(formData.availableDays).days : []),
        availableSlots: (doctorToEdit && Array.isArray(doctorToEdit.availableSlots))
          ? doctorToEdit.availableSlots
          : [],
        about: formData.about,
        image: finalImage,
        instagram: formData.instagram || '',
        facebook: formData.facebook || '',
        linkedin: formData.linkedin || '',
        twitter: formData.twitter || '',
        reels: formData.reels
          .map(r => {
            if (typeof r === 'string') return r.trim();
            if (r && typeof r === 'object') {
              const url = (r.url || '').trim();
              let coverPhoto = (r.coverPhoto || '').trim();
              if (coverPhoto && (coverPhoto.includes('reel-cover') || coverPhoto.startsWith('api/'))) {
                coverPhoto = '';
              }
              if (!url && !coverPhoto) return null;
              if (coverPhoto) return { url, coverPhoto };
              return url;
            }
            return null;
          })
          .filter(Boolean),
        youtube_videos: formData.youtube_videos.filter(url => url.trim() !== ''),
        qualifications: formData.degree,
        contact_number: formData.phone,
        helplineNumber: formData.helplineNumber ? String(formData.helplineNumber).trim() : '',
        helplineDays: formData.helplineDays ? String(formData.helplineDays).trim() : '',
        helplineTime: formData.helplineTime ? String(formData.helplineTime).trim() : '',
        available: formData.available,
        faqs: (formData.faqs || []).filter(f => (f.q || f.question || '').trim() !== ''),
        awards: Array.isArray(formData.awards) ? formData.awards.filter(Boolean) : [],
        certifications: Array.isArray(formData.certifications) ? formData.certifications.filter(Boolean) : [],
        memberships: Array.isArray(formData.memberships) ? formData.memberships.filter(Boolean) : [],
        careerExperience: Array.isArray(formData.careerExperience) ? formData.careerExperience.filter(Boolean) : [],
        tags: Array.isArray(formData.tags) ? formData.tags.filter(Boolean) : []
      };

      // Only include isStarDoctor if explicitly changed in this form (or creating a new doctor)
      // to avoid accidentally unstarring or resetting star timestamp during general profile edits
      const isEditing = Boolean(doctorToEdit);
      const starChanged = isEditing ? (Boolean(formData.isStarDoctor) !== Boolean(doctorToEdit.isStarDoctor)) : true;
      if (starChanged) {
        payload.isStarDoctor = Boolean(formData.isStarDoctor);
        if (isEditing) {
          payload.starMutationTimestamp = Date.now();
        }
      }

      if (doctorToEdit) {
        const docId = doctorToEdit._id || doctorToEdit.id;
        const fullPayload = {
          ...payload,
          _id: doctorToEdit._id || doctorToEdit.id,
          id: doctorToEdit.id || doctorToEdit._id,
          email: payload.email || doctorToEdit.email
        };
        const res = await updateDoctor(docId, fullPayload);
        const emailChanged = Boolean(
          payload.email &&
          doctorToEdit.email &&
          payload.email.toLowerCase().trim() !== doctorToEdit.email.toLowerCase().trim()
        );
        if (onSuccess) {
          if (emailChanged || res?.emailChanged) {
            onSuccess(`Doctor email updated to ${payload.email} and temporary password sent to new inbox!`);
          } else {
            onSuccess('Doctor profile updated successfully!');
          }
        }
      } else {
        await addDoctor(payload);
        if (onSuccess) {
          onSuccess('New doctor added successfully and temporary password sent to their email!');
        }
      }
      onClose();
    } catch (err) {
      console.error('Failed to save doctor:', err);
      setSubmitError(err.message || 'Failed to save doctor. Please check email and details.');
    } finally {
      setIsSubmitting(false);
      isSubmittingRef.current = false;
    }
  };

  return (
    <div className={styles.modal} onClick={(e) => e.stopPropagation()}>
      <div className={styles.header}>
        <div className={styles.titleWrap}>
          <div className={styles.iconBadge}>
            <Stethoscope size={22} />
          </div>
          <div>
            <h2>{doctorToEdit ? 'Edit Doctor Profile' : 'Add New Doctor'}</h2>
            <p>{doctorToEdit ? 'Update doctor credentials and schedule' : 'Register a new verified specialist to Sehat Buddy'}</p>
          </div>
        </div>
        <button className={styles.closeBtn} onClick={onClose} aria-label="Close modal">
          <X size={20} />
        </button>
      </div>

      <form
        onSubmit={handleSubmit}
        onKeyDown={(e) => {
          if (e.key === 'Enter') {
            if (e.ctrlKey || e.metaKey) return;
            if (e.target && e.target.tagName === 'TEXTAREA') return;
            if (e.target && e.target.type === 'submit') return;
            e.preventDefault();
          }
        }}
        className={styles.form}
      >
        <div className={styles.body}>
          {submitError && (
            <div style={{ background: '#fee2e2', border: '1px solid #fca5a5', color: '#b91c1c', padding: '12px 16px', borderRadius: '8px', fontSize: '0.86rem', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '16px' }}>
              <AlertCircle size={18} color="#dc2626" style={{ flexShrink: 0 }} />
              <span>{submitError}</span>
            </div>
          )}

          {/* Basic Info */}
          <div className={styles.sectionHeader}>Doctor Details</div>
          
          <div className={styles.grid2}>
            <div className={styles.formGroup}>
              <label>Doctor Full Name <span className={styles.req}>*</span></label>
              <input
                type="text"
                placeholder="e.g. Dr. Priya Roy"
                value={formData.name}
                onChange={(e) => {
                  setFormData({ ...formData, name: e.target.value });
                  if (errors.name) setErrors(prev => ({ ...prev, name: '' }));
                }}
                className={errors.name ? styles.inputError : ''}
              />
              {errors.name && <span className={styles.errorMsg}><AlertCircle size={13} /> {errors.name}</span>}
            </div>

            <div className={styles.formGroup}>
              <label>Specialty <span className={styles.req}>*</span></label>
              <select
                value={formData.specialty}
                onChange={(e) => setFormData({ ...formData, specialty: e.target.value })}
              >
                {SPECIALTY_OPTIONS.map(opt => (
                  <option key={opt} value={opt}>{opt}</option>
                ))}
                <option value="Other">Other / Custom</option>
              </select>
            </div>
          </div>

          {formData.specialty === 'Other' && (
            <div className={styles.formGroup}>
              <label>Custom Specialty <span className={styles.req}>*</span></label>
              <input
                type="text"
                placeholder="e.g. Endocrinologist"
                value={formData.customSpecialty}
                onChange={(e) => {
                  setFormData({ ...formData, customSpecialty: e.target.value });
                  if (errors.customSpecialty) setErrors(prev => ({ ...prev, customSpecialty: '' }));
                }}
                className={errors.customSpecialty ? styles.inputError : ''}
              />
              {errors.customSpecialty && <span className={styles.errorMsg}><AlertCircle size={13} /> {errors.customSpecialty}</span>}
            </div>
          )}

          <div className={styles.grid3}>
            <div className={styles.formGroup}>
              <label>Experience (Years) <span className={styles.req}>*</span></label>
              <input
                type="number"
                min="0"
                max="60"
                value={formData.experienceYears}
                onChange={(e) => {
                  setFormData({ ...formData, experienceYears: e.target.value });
                  if (errors.experienceYears) setErrors(prev => ({ ...prev, experienceYears: '' }));
                }}
                className={errors.experienceYears ? styles.inputError : ''}
              />
              {errors.experienceYears && <span className={styles.errorMsg}><AlertCircle size={13} /> {errors.experienceYears}</span>}
            </div>

            <div className={styles.formGroup}>
              <label>Consultation Fee (₹) <span className={styles.req}>*</span></label>
              <input
                type="number"
                min="50"
                step="50"
                value={formData.price}
                onChange={(e) => {
                  setFormData({ ...formData, price: e.target.value });
                  if (errors.price) setErrors(prev => ({ ...prev, price: '' }));
                }}
                className={errors.price ? styles.inputError : ''}
              />
              {errors.price && <span className={styles.errorMsg}><AlertCircle size={13} /> {errors.price}</span>}
            </div>

            <div className={styles.formGroup}>
              <label>Degrees / Qualification</label>
              <input
                type="text"
                placeholder="e.g. MBBS, MD (AIIMS)"
                value={formData.degree}
                onChange={(e) => setFormData({ ...formData, degree: e.target.value })}
              />
            </div>
          </div>

          {/* Job Title & License Number */}
          <div className={styles.grid2}>
            <div className={styles.formGroup}>
              <label>Designation / Job Title</label>
              <input
                type="text"
                placeholder="e.g. Senior Consultant Cardiologist"
                value={formData.jobTitle || ''}
                onChange={(e) => setFormData({ ...formData, jobTitle: e.target.value })}
              />
              <small style={{ color: '#64748b', fontSize: '0.74rem', marginTop: '3px', display: 'block' }}>
                Clinical designation displayed alongside doctor profile (e.g. Director & HOD).
              </small>
            </div>

            <div className={styles.formGroup}>
              <label>Medical Registration / License No.</label>
              <input
                type="text"
                placeholder="e.g. DMC-2014-78219 or MCI-89412"
                value={formData.licenseNumber || ''}
                onChange={(e) => setFormData({ ...formData, licenseNumber: e.target.value })}
              />
              <small style={{ color: '#64748b', fontSize: '0.74rem', marginTop: '3px', display: 'block' }}>
                Required for clinical verification badge and contributes 15% to profile completion.
              </small>
            </div>
          </div>

          {/* Hospital Affiliation */}
          <div className={styles.formGroup}>
            <label>Affiliated Hospital</label>
            <div className={styles.selectWithIcon}>
              <Building2 size={16} className={styles.fieldIcon} />
              <select
                value={formData.hospital}
                autoComplete="off"
                onChange={(e) => {
                  dirtyFieldsRef.current.add('hospital');
                  setFormData({ ...formData, hospital: e.target.value });
                }}
              >
                <option value="">Select an affiliated hospital</option>
                {Boolean(formData.hospital && formData.hospital !== 'Independent Private Clinic' && !hospitals.some(h => (h.name || '').trim().toLowerCase() === (formData.hospital || '').trim().toLowerCase())) && (
                  <option value={formData.hospital}>
                    {formData.hospital}
                  </option>
                )}
                {hospitals.map(hosp => {
                  const hospKey = hosp._id ? String(hosp._id) : (hosp.id ? String(hosp.id) : hosp.name);
                  return (
                    <option key={hospKey} value={hosp.name}>
                      {hosp.name} {hosp.city ? `(${hosp.city})` : ''}
                    </option>
                  );
                })}
                <option value="Independent Private Clinic">Independent Private Clinic</option>
              </select>
            </div>
          </div>

          {/* Contact & Availability */}
          <div className={styles.grid2}>
            <div className={styles.formGroup}>
              <label>Contact Phone</label>
              <input
                type="tel"
                inputMode="numeric"
                maxLength={10}
                placeholder="Enter 10-digit mobile number"
                value={formData.phone}
                onChange={(e) => {
                  const digits = e.target.value.replace(/\D/g, '').slice(0, 10);
                  setFormData({ ...formData, phone: digits });
                }}
              />
            </div>

            <div className={styles.formGroup}>
              <label>Doctor Email Address <span className={styles.req}>*</span></label>
              <input
                type="email"
                placeholder="doctor@example.com"
                value={formData.email}
                onChange={(e) => {
                  setFormData({ ...formData, email: e.target.value });
                  if (errors.email) setErrors(prev => ({ ...prev, email: '' }));
                }}
                className={errors.email ? styles.inputError : ''}
                required
              />
              {errors.email && <span className={styles.errorMsg}><AlertCircle size={13} /> {errors.email}</span>}
              <small style={{ color: '#64748b', fontSize: '0.74rem', marginTop: '4px', display: 'block' }}>
                Temporary clinical login credentials will be sent to this email address automatically.
              </small>
            </div>
          </div>

          <div className={styles.formGroup}>
            <label>Available Hours / Days</label>
            <input
              type="text"
              placeholder="e.g. Mon - Sat (10:00 AM - 2:00 PM)"
              value={formData.availableDays}
              onChange={(e) => setFormData({ ...formData, availableDays: e.target.value })}
            />
          </div>

          {/* Clinic Desk & Patient Helpline Support */}
          <div style={{
            margin: '20px 0',
            padding: '16px 18px',
            background: '#f8fafc',
            border: '1px solid #cbd5e1',
            borderRadius: '12px'
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '6px' }}>
              <Phone size={16} color="#2563eb" />
              <strong style={{ fontSize: '0.95rem', color: '#0f172a' }}>Clinic Desk & Patient Helpline Support</strong>
            </div>
            <p style={{ margin: '0 0 14px 0', fontSize: '0.78rem', color: '#64748b', lineHeight: 1.4 }}>
              Configures the direct call button and operating hours displayed in the doctor profile's "Have a Specific Question? Call Clinic Desk" FAQ support card.
            </p>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '14px' }}>
              <div className={styles.formGroup} style={{ margin: 0 }}>
                <label style={{ fontSize: '0.82rem', fontWeight: 600 }}>Helpline Phone Number</label>
                <input
                  type="text"
                  placeholder="+91 98765 43210"
                  value={formData.helplineNumber}
                  onChange={(e) => {
                    dirtyFieldsRef.current.add('helplineNumber');
                    setFormData({ ...formData, helplineNumber: e.target.value });
                  }}
                />
                <small style={{ color: '#64748b', fontSize: '0.72rem', marginTop: '3px', display: 'block' }}>
                  e.g. +91 98765 43210
                </small>
              </div>

              <div className={styles.formGroup} style={{ margin: 0 }}>
                <label style={{ fontSize: '0.82rem', fontWeight: 600 }}>Operating Days</label>
                <input
                  type="text"
                  placeholder="Mon – Sat"
                  value={formData.helplineDays}
                  onChange={(e) => {
                    dirtyFieldsRef.current.add('helplineDays');
                    setFormData({ ...formData, helplineDays: e.target.value });
                  }}
                />
                <small style={{ color: '#64748b', fontSize: '0.72rem', marginTop: '3px', display: 'block' }}>
                  e.g. Mon – Sat or All 7 Days
                </small>
              </div>

              <div className={styles.formGroup} style={{ margin: 0 }}>
                <label style={{ fontSize: '0.82rem', fontWeight: 600 }}>Operating Hours / Time</label>
                <input
                  type="text"
                  placeholder="8:00 AM – 8:00 PM"
                  value={formData.helplineTime}
                  onChange={(e) => {
                    dirtyFieldsRef.current.add('helplineTime');
                    setFormData({ ...formData, helplineTime: e.target.value });
                  }}
                />
                <small style={{ color: '#64748b', fontSize: '0.72rem', marginTop: '3px', display: 'block' }}>
                  e.g. 8:00 AM – 8:00 PM
                </small>
              </div>
            </div>

            {/* Live Visual Preview */}
            <div style={{
              marginTop: '14px',
              padding: '10px 14px',
              background: '#eff6ff',
              border: '1px dashed #93c5fd',
              borderRadius: '8px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              flexWrap: 'wrap',
              gap: '10px'
            }}>
              <span style={{ fontSize: '0.78rem', fontWeight: 600, color: '#1e40af' }}>
                Profile Card Preview:
              </span>
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px', flexWrap: 'wrap' }}>
                {formData.helplineNumber ? (
                  <>
                    <span style={{
                      background: '#2563eb',
                      color: '#ffffff',
                      padding: '5px 12px',
                      borderRadius: '20px',
                      fontSize: '0.78rem',
                      fontWeight: 600,
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: '6px'
                    }}>
                      <Phone size={12} />
                      Call Clinic Desk: {formData.helplineNumber}
                    </span>
                    {(formData.helplineDays || formData.helplineTime) && (
                      <span style={{ fontSize: '0.78rem', color: '#475569', display: 'inline-flex', alignItems: 'center', gap: '5px' }}>
                        <Clock size={12} color="#64748b" />
                        {[formData.helplineDays, formData.helplineTime].filter(Boolean).join(' • ')}
                      </span>
                    )}
                  </>
                ) : (
                  <span style={{ fontSize: '0.78rem', color: '#94a3b8', fontStyle: 'italic' }}>
                    No helpline configured (desk button will remain hidden on doctor profile)
                  </span>
                )}
              </div>
            </div>
          </div>

          {/* Profile Avatar / Photo */}
          <div className={styles.sectionHeader}>Doctor Photo / Avatar</div>
          
          {formData.image ? (
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '12px', background: '#f8fafc', padding: '8px 12px', borderRadius: '8px', border: '1px solid #e2e8f0' }}>
              <img 
                src={formData.image} 
                alt="Current doctor photo" 
                style={{ width: '42px', height: '42px', borderRadius: '50%', objectFit: 'cover', border: '2px solid #00a896', flexShrink: 0 }}
                onError={(e) => { e.target.style.display = 'none'; }}
              />
              <div style={{ fontSize: '0.82rem', color: '#334155', flex: 1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                <span style={{ fontWeight: 600, color: '#0f172a' }}>Active Photo: </span>
                {DEFAULT_DOCTOR_AVATARS.find(a => a.url === formData.image)?.label || (formData.image.startsWith('data:') ? 'Custom Uploaded Image' : (PRESET_AVATARS.find(p => p.src === formData.image)?.label || 'Selected Photo'))}
              </div>
              <button 
                type="button" 
                disabled={deletingPhoto}
                onClick={() => handleDeleteDoctorPhoto()}
                style={{
                  fontSize: '0.75rem',
                  background: '#fee2e2',
                  color: '#dc2626',
                  border: '1px solid #fecaca',
                  padding: '5px 12px',
                  borderRadius: '6px',
                  cursor: deletingPhoto ? 'not-allowed' : 'pointer',
                  fontWeight: 700,
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '4px'
                }}
                title="Permanently delete photo from Cloudinary & leave blank"
              >
                {deletingPhoto ? (
                  <>
                    <Loader2 size={12} style={{ animation: 'spin 1s linear infinite' }} />
                    <span>Deleting...</span>
                  </>
                ) : (
                  <>
                    <Trash2 size={12} />
                    <span>Delete Photo</span>
                  </>
                )}
              </button>
            </div>
          ) : (
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '12px', background: '#f8fafc', padding: '8px 12px', borderRadius: '8px', border: '1px dashed #cbd5e1' }}>
              <div style={{ width: '38px', height: '38px', borderRadius: '50%', background: '#e2e8f0', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#94a3b8', flexShrink: 0 }}>
                <User size={20} />
              </div>
              <div style={{ fontSize: '0.82rem', color: '#64748b', flex: 1 }}>
                <span style={{ fontWeight: 600, color: '#334155' }}>No Photo Selected (Blank): </span>
                Doctor profile will remain blank without any avatar photo.
              </div>
            </div>
          )}

          <div className={styles.avatarSelectionTabs}>
            <button
              type="button"
              className={`${styles.tabBtn} ${imageType === 'preset' ? styles.tabActive : ''}`}
              onClick={() => setImageType('preset')}
            >
              Choose Preset
            </button>
            <button
              type="button"
              className={`${styles.tabBtn} ${imageType === 'url' ? styles.tabActive : ''}`}
              onClick={() => setImageType('url')}
            >
              Web Image URL
            </button>
            <button
              type="button"
              className={`${styles.tabBtn} ${imageType === 'upload' ? styles.tabActive : ''}`}
              onClick={() => setImageType('upload')}
            >
              Upload File
            </button>
          </div>

          {imageType === 'preset' && (
            <div className={styles.presetGrid}>
              <div
                className={`${styles.presetItem} ${!formData.image ? styles.presetSelected : ''}`}
                onClick={() => handleDeleteDoctorPhoto(true)}
                title="Leave profile photo blank"
                style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', cursor: 'pointer' }}
              >
                <div style={{ width: '48px', height: '48px', borderRadius: '50%', background: '#f1f5f9', border: '2px dashed #94a3b8', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#94a3b8', marginBottom: '4px' }}>
                  <User size={24} />
                </div>
                <span>Blank (None)</span>
              </div>
              {PRESET_AVATARS.map((preset, idx) => {
                const isSelected = formData.image === preset.src || 
                  formData.image === preset.preview ||
                  (preset.key && String(formData.image || '').includes(preset.key));
                return (
                  <div
                    key={idx}
                    className={`${styles.presetItem} ${isSelected ? styles.presetSelected : ''}`}
                    onClick={() => {
                      if (isSelected) {
                        handleDeleteDoctorPhoto(true);
                      } else {
                        // If replacing custom Cloudinary image with a preset, clean up Cloudinary
                        const oldImg = formData.image || doctorToEdit?.image;
                        if (oldImg && (oldImg.includes('cloudinary.com') || oldImg.includes('res.cloudinary.com'))) {
                          api.deleteImage(oldImg).catch(err => console.warn('Failed to delete old photo from Cloudinary:', err));
                        }
                        setFormData({ ...formData, image: preset.src });
                      }
                    }}
                    title={isSelected ? 'Click to unselect and leave blank' : `Select ${preset.label}`}
                    style={{ cursor: 'pointer' }}
                  >
                    <img src={preset.preview || preset.src} alt={preset.label} />
                    <span>{preset.label}</span>
                  </div>
                );
              })}
            </div>
          )}

          {imageType === 'url' && (
            <div className={styles.formGroup}>
              <label>Image URL</label>
              <input
                type="url"
                placeholder="https://images.unsplash.com/..."
                value={customImageUrl}
                onChange={(e) => {
                  setCustomImageUrl(e.target.value);
                  setFormData(prev => ({ ...prev, image: e.target.value }));
                }}
              />
              {customImageUrl && (
                <div className={styles.previewBox}>
                  <img src={customImageUrl} alt="Preview" onError={(e) => { e.target.style.display = 'none'; }} />
                </div>
              )}
            </div>
          )}

          {imageType === 'upload' && (
            <div className={styles.uploadArea}>
              <label className={styles.uploadLabel}>
                <Upload size={24} />
                <span>Click to select an image from your device</span>
                <input type="file" accept="image/*" onChange={handleFileUpload} className={styles.fileInput} />
              </label>
              {formData.image && (
                <div style={{ marginTop: '12px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', background: '#ffffff', padding: '10px 14px', borderRadius: '8px', border: '1px solid #e2e8f0' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                    <img src={formData.image} alt="Uploaded preview" style={{ width: '42px', height: '42px', borderRadius: '50%', objectFit: 'cover' }} onError={(e) => { e.target.style.display = 'none'; }} />
                    <span style={{ fontSize: '0.82rem', fontWeight: 600, color: '#334155' }}>
                      {formData.image.includes('cloudinary.com') ? 'Cloudinary Photo Active' : 'Uploaded Image Active'}
                    </span>
                  </div>
                  <button
                    type="button"
                    disabled={deletingPhoto}
                    onClick={() => handleDeleteDoctorPhoto()}
                    style={{
                      fontSize: '0.75rem',
                      background: '#fee2e2',
                      color: '#dc2626',
                      border: '1px solid #fecaca',
                      padding: '5px 12px',
                      borderRadius: '6px',
                      cursor: deletingPhoto ? 'not-allowed' : 'pointer',
                      fontWeight: 700,
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: '4px'
                    }}
                    title="Permanently delete photo from Cloudinary"
                  >
                    {deletingPhoto ? <Loader2 size={12} style={{ animation: 'spin 1s linear infinite' }} /> : <Trash2 size={12} />}
                    <span>Delete Photo</span>
                  </button>
                </div>
              )}
            </div>
          )}

          {/* About / Bio */}
          <div className={styles.formGroup} style={{ marginTop: '14px' }}>
            <label>Doctor Bio / Short Description</label>
            <textarea
              rows={3}
              placeholder="Brief summary of professional experience, awards, or medical specialties... (Press Ctrl+Enter to save)"
              value={formData.about}
              onChange={(e) => setFormData({ ...formData, about: e.target.value })}
              onKeyDown={(e) => {
                if (e.key === 'Enter' && (e.ctrlKey || e.metaKey)) {
                  e.preventDefault();
                  handleSubmit(e);
                }
              }}
            />
          </div>

          <div className={styles.formGroup} style={{ marginTop: '14px' }}>
            <label style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer' }}>
              <input
                type="checkbox"
                checked={formData.available}
                onChange={(e) => setFormData({ ...formData, available: e.target.checked })}
                style={{ width: 'auto' }}
              />
              Active / Listed on Find Doctors page
            </label>
          </div>

          <div className={styles.formGroup} style={{ marginTop: '10px' }}>
            <label style={{
              display: 'flex',
              alignItems: 'center',
              gap: '12px',
              cursor: 'pointer',
              background: formData.isStarDoctor ? '#fef3c7' : '#f8fafc',
              border: formData.isStarDoctor ? '1.5px solid #f59e0b' : '1px solid #e2e8f0',
              padding: '12px 14px',
              borderRadius: '10px',
              transition: 'all 0.2s'
            }}>
              <input
                type="checkbox"
                checked={formData.isStarDoctor}
                onChange={(e) => setFormData({ ...formData, isStarDoctor: e.target.checked })}
                style={{ width: '18px', height: '18px', accentColor: '#f59e0b', cursor: 'pointer' }}
              />
              <div>
                <div style={{ fontWeight: 700, color: formData.isStarDoctor ? '#92400e' : '#1e293b', fontSize: '0.92rem', display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <Star size={16} fill={formData.isStarDoctor ? '#f59e0b' : 'none'} color={formData.isStarDoctor ? '#f59e0b' : '#64748b'} />
                  Feature as Star Doctor (Featured on Homepage Popular Doctors)
                </div>
                <div style={{ fontSize: '0.78rem', color: formData.isStarDoctor ? '#b45309' : '#64748b', marginTop: '2px' }}>
                  Doctors marked as Star will appear prominently in the "Popular Doctors" section on the front page.
                </div>
              </div>
            </label>
          </div>

          {/* Clinical Focus & Procedure Tags */}
          <div className={styles.sectionHeader} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginTop: '20px' }}>
            <span style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <Tag size={16} />
              Clinical Focus & Procedure Tags
              <span className={styles.credBadge}>{(formData.tags || []).length}</span>
            </span>
            <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
              <button
                type="button"
                onClick={handleResetDefaultTags}
                style={{ background: 'none', border: 'none', color: '#2563eb', fontSize: '0.78rem', cursor: 'pointer', fontWeight: 600 }}
                title="Reset to recommended specialty tags"
              >
                Reset Recommendations
              </button>
              <span style={{ color: '#cbd5e1' }}>|</span>
              <button
                type="button"
                onClick={handleClearAllTags}
                style={{ background: 'none', border: 'none', color: '#ef4444', fontSize: '0.78rem', cursor: 'pointer', fontWeight: 600 }}
                title="Clear all tags"
              >
                Clear All
              </button>
            </div>
          </div>
          <p style={{ fontSize: '0.82rem', color: '#64748b', margin: '-4px 0 10px 0' }}>
            These procedure & focus badges appear directly under the doctor's name on the public doctor profile (e.g. Angioplasty Specialist, Heart Failure Care, Preventive Cardiology).
          </p>
          {renderTagsManager()}

          {/* Social Links */}
          <div className={styles.sectionHeader} style={{ marginTop: '20px' }}>Social Profiles</div>
          <div className={styles.grid2}>
            <div className={styles.formGroup}>
              <label>Instagram URL</label>
              <input
                type="url"
                placeholder="https://instagram.com/..."
                value={formData.instagram}
                onChange={(e) => {
                  dirtyFieldsRef.current.add('instagram');
                  setFormData({ ...formData, instagram: e.target.value });
                }}
              />
            </div>
            <div className={styles.formGroup}>
              <label>Facebook URL</label>
              <input
                type="url"
                placeholder="https://facebook.com/..."
                value={formData.facebook}
                onChange={(e) => {
                  dirtyFieldsRef.current.add('facebook');
                  setFormData({ ...formData, facebook: e.target.value });
                }}
              />
            </div>
            <div className={styles.formGroup}>
              <label>LinkedIn URL</label>
              <input
                type="url"
                placeholder="https://linkedin.com/in/..."
                value={formData.linkedin}
                onChange={(e) => {
                  dirtyFieldsRef.current.add('linkedin');
                  setFormData({ ...formData, linkedin: e.target.value });
                }}
              />
            </div>
            <div className={styles.formGroup}>
              <label>Twitter / X URL</label>
              <input
                type="url"
                placeholder="https://x.com/..."
                value={formData.twitter}
                onChange={(e) => {
                  dirtyFieldsRef.current.add('twitter');
                  setFormData({ ...formData, twitter: e.target.value });
                }}
              />
            </div>
          </div>

          {/* Instagram Reels */}
          <div className={styles.sectionHeader} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <span>Instagram Reels & Cover Photos (Max 5)</span>
            <span style={{ fontSize: '0.78rem', color: '#2563eb', fontWeight: 600 }}>Auto Cover Extraction</span>
          </div>
          <p style={{ fontSize: '0.82rem', color: '#64748b', margin: '-4px 0 12px 0' }}>
            Enter any Instagram Reel URL. The native high-resolution cover photo will be extracted and displayed on the public doctor profile. You can also specify an optional custom cover photo.
          </p>
          {[0, 1, 2, 3, 4].map((index) => {
            const reelVal = formData.reels[index];
            const reelUrl = typeof reelVal === 'string' ? reelVal : (reelVal?.url || '');
            let rawCover = typeof reelVal === 'object' ? (reelVal?.coverPhoto || '') : '';
            // If rawCover was saved as an internal proxy url, don't show it in the text box
            const customCover = (rawCover && (rawCover.includes('reel-cover') || rawCover.startsWith('api/') || rawCover.startsWith('/api/'))) ? '' : rawCover;

            // Extract shortcode for live preview (supports instagram.com URLs and converted Cloudinary ig_<shortcode> URLs)
            let shortcode = '';
            const igMatch = reelUrl.match(/instagram\.com\/(?:reel|reels|p|tv|share\/reel)\/([^/?#&]+)/i);
            if (igMatch && igMatch[1]) {
              shortcode = igMatch[1];
            } else {
              const cldMatch = reelUrl.match(/\/ig_([a-zA-Z0-9_-]+)(?:\.[a-zA-Z0-9]+|\?|$)/i);
              if (cldMatch && cldMatch[1]) {
                shortcode = cldMatch[1];
              }
            }
            const isCloudinaryVideo = reelUrl && reelUrl.includes('cloudinary.com');
            const cloudinaryDirectCover = shortcode ? `https://res.cloudinary.com/nehlbmp2/image/upload/sehatbuddy/covers/ig_${shortcode}.jpg` : '';
            const previewCover = (customCover && !customCover.includes('instagram.com/p/'))
              ? customCover
              : (shortcode ? (cloudinaryDirectCover || `${API_BASE}/reel-cover?url=${encodeURIComponent(reelUrl)}`) : (isCloudinaryVideo ? getCloudinaryVideoPoster(reelUrl) : ''));

            return (
              <div 
                className={styles.formGroup} 
                key={`reel-${index}`}
                style={{ 
                  background: '#f8fafc', 
                  padding: '12px 14px', 
                  borderRadius: '10px', 
                  border: '1px solid #e2e8f0', 
                  marginBottom: '12px' 
                }}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '6px', flexWrap: 'wrap', gap: '6px' }}>
                  <label style={{ margin: 0, fontWeight: 700, fontSize: '0.86rem', color: '#0f172a' }}>
                    Reel {index + 1} URL
                  </label>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                    {shortcode && (
                      <span style={{ fontSize: '0.72rem', color: '#16a34a', background: '#dcfce7', padding: '2px 8px', borderRadius: '100px', fontWeight: 700 }}>
                        ✓ Instagram Reel
                      </span>
                    )}
                    {reelUrl && (reelUrl.includes('cloudinary.com') || /\.(mp4|webm|mov)(\?.*)?$/i.test(reelUrl)) && (
                      <span style={{ fontSize: '0.72rem', color: '#0284c7', background: '#e0f2fe', padding: '2px 8px', borderRadius: '100px', fontWeight: 700 }}>
                        ✓ Direct Video
                      </span>
                    )}
                    <label
                      style={{
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: '4px',
                        fontSize: '0.72rem',
                        fontWeight: 700,
                        color: '#0284c7',
                        background: '#e0f2fe',
                        border: '1px solid #bae6fd',
                        padding: '3px 8px',
                        borderRadius: '6px',
                        cursor: uploadingReelVideoIdx === index ? 'not-allowed' : 'pointer'
                      }}
                      title="Upload custom MP4/WebM video file directly to Cloudinary"
                    >
                      {uploadingReelVideoIdx === index ? (
                        <>
                          <Loader2 size={12} style={{ animation: 'spin 1s linear infinite' }} />
                          <span>Uploading Video...</span>
                        </>
                      ) : (
                        <>
                          <Video size={12} />
                          <span>Upload MP4</span>
                        </>
                      )}
                      <input
                        type="file"
                        accept="video/*"
                        disabled={uploadingReelVideoIdx === index}
                        style={{ display: 'none' }}
                        onChange={(e) => {
                          const file = e.target.files?.[0];
                          if (file) {
                            handleReelVideoUpload(index, file);
                            e.target.value = '';
                          }
                        }}
                      />
                    </label>

                    {(reelUrl || customCover) && (
                      <button
                        type="button"
                        disabled={deletingReelIdx === index}
                        onClick={() => handleDeleteReel(index)}
                        style={{
                          display: 'inline-flex',
                          alignItems: 'center',
                          gap: '4px',
                          fontSize: '0.72rem',
                          fontWeight: 700,
                          color: '#dc2626',
                          background: '#fee2e2',
                          border: '1px solid #fecaca',
                          padding: '3px 8px',
                          borderRadius: '6px',
                          cursor: deletingReelIdx === index ? 'not-allowed' : 'pointer',
                          transition: 'all 0.15s ease'
                        }}
                        title="Permanently delete this reel and its cover photo from Cloudinary"
                      >
                        {deletingReelIdx === index ? (
                          <>
                            <Loader2 size={12} style={{ animation: 'spin 1s linear infinite' }} />
                            <span>Deleting Reel...</span>
                          </>
                        ) : (
                          <>
                            <Trash2 size={12} />
                            <span>Delete Reel</span>
                          </>
                        )}
                      </button>
                    )}
                  </div>
                </div>
                <input
                  type="text"
                  placeholder="https://www.instagram.com/reel/..."
                  value={reelUrl}
                  onChange={(e) => handleReelUrlChange(index, e.target.value)}
                  onPaste={(e) => {
                    const text = e.clipboardData ? e.clipboardData.getData('text') : '';
                    if (text && text.trim()) {
                      e.preventDefault();
                      handleReelUrlChange(index, text.trim());
                    }
                  }}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      e.preventDefault();
                      handleCommitReels();
                    }
                  }}
                  onBlur={() => handleCommitReels()}
                  style={{ marginBottom: '8px' }}
                />

                {(reelUrl || customCover) && (
                  <div style={{ marginTop: '8px', padding: '10px 12px', background: '#ffffff', borderRadius: '8px', border: '1px solid #e2e8f0' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px', flexWrap: 'wrap', gap: '6px' }}>
                      <span style={{ fontSize: '0.8rem', fontWeight: 700, color: '#334155', display: 'flex', alignItems: 'center', gap: '6px' }}>
                        <span>Reel Cover Photo</span>
                        {fetchingCoverIdx === index && (
                          <span style={{ fontSize: '0.7rem', color: '#b45309', background: '#fef3c7', padding: '2px 8px', borderRadius: '4px', fontWeight: 700, border: '1px solid #fde68a', display: 'inline-flex', alignItems: 'center', gap: '5px' }}>
                            <span style={{ display: 'inline-block', width: '8px', height: '8px', borderRadius: '50%', border: '2px solid #b45309', borderTopColor: 'transparent', animation: 'spin 0.6s linear infinite' }} />
                            Auto-fetching cover...
                          </span>
                        )}
                        {customCover && customCover.includes('cloudinary.com') && (
                          <span style={{ fontSize: '0.68rem', color: '#0284c7', background: '#e0f2fe', padding: '2px 6px', borderRadius: '4px', fontWeight: 700, border: '1px solid #bae6fd' }}>
                            ✓ Cloudinary
                          </span>
                        )}
                      </span>

                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        {/* Auto-Fetch Cover Button */}
                        {shortcode && (
                          <button
                            type="button"
                            disabled={fetchingCoverIdx === index}
                            onClick={() => handleAutoFetchReelCover(index)}
                            style={{
                              display: 'inline-flex',
                              alignItems: 'center',
                              gap: '5px',
                              fontSize: '0.76rem',
                              fontWeight: 700,
                              color: '#0284c7',
                              background: '#e0f2fe',
                              border: '1px solid #bae6fd',
                              padding: '5px 10px',
                              borderRadius: '6px',
                              cursor: fetchingCoverIdx === index ? 'not-allowed' : 'pointer',
                              transition: 'all 0.15s ease'
                            }}
                            title="Auto-fetch reel cover thumbnail from Instagram"
                          >
                            {fetchingCoverIdx === index ? (
                              <>
                                <Loader2 size={13} style={{ animation: 'spin 1s linear infinite' }} />
                                <span>Fetching...</span>
                              </>
                            ) : (
                              <>
                                <Sparkles size={13} />
                                <span>Auto-Fetch Cover</span>
                              </>
                            )}
                          </button>
                        )}

                        {/* Delete Cover Photo Button (Permanent Delete from Cloudinary & DB) */}
                        {customCover && (
                          <button
                            type="button"
                            disabled={deletingCoverIdx === index}
                            onClick={() => handleDeleteCoverPhoto(index)}
                            style={{
                              display: 'inline-flex',
                              alignItems: 'center',
                              gap: '5px',
                              fontSize: '0.76rem',
                              fontWeight: 700,
                              color: '#dc2626',
                              background: '#fee2e2',
                              border: '1px solid #fecaca',
                              padding: '5px 10px',
                              borderRadius: '6px',
                              cursor: deletingCoverIdx === index ? 'not-allowed' : 'pointer',
                              transition: 'all 0.15s ease'
                            }}
                            title="Permanently delete this cover photo from Cloudinary"
                          >
                            {deletingCoverIdx === index ? (
                              <>
                                <Loader2 size={13} style={{ animation: 'spin 1s linear infinite' }} />
                                <span>Deleting...</span>
                              </>
                            ) : (
                              <>
                                <Trash2 size={13} />
                                <span>Delete Cover</span>
                              </>
                            )}
                          </button>
                        )}

                        {/* Upload Button: Local Storage -> Cloudinary */}
                        <label 
                          style={{
                            display: 'inline-flex',
                            alignItems: 'center',
                            gap: '6px',
                            fontSize: '0.76rem',
                            fontWeight: 700,
                            color: '#ffffff',
                            background: uploadingReelIdx === index ? '#94a3b8' : 'linear-gradient(135deg, #0284c7 0%, #0369a1 100%)',
                            padding: '5px 12px',
                            borderRadius: '6px',
                            cursor: uploadingReelIdx === index ? 'not-allowed' : 'pointer',
                            boxShadow: '0 2px 4px rgba(2, 132, 199, 0.25)',
                            transition: 'all 0.2s'
                          }}
                          title="Upload cover photo from local storage directly to Cloudinary"
                        >
                          {uploadingReelIdx === index ? (
                            <>
                              <Loader2 size={13} style={{ animation: 'spin 1s linear infinite' }} />
                              <span>Uploading to Cloudinary...</span>
                            </>
                          ) : (
                            <>
                              <Upload size={13} />
                              <span>Upload Cover Photo</span>
                            </>
                          )}
                          <input
                            type="file"
                            accept="image/*"
                            disabled={uploadingReelIdx === index}
                            style={{ display: 'none' }}
                            onChange={(e) => {
                              const file = e.target.files?.[0];
                              if (file) {
                                handleReelCoverUpload(index, file);
                                e.target.value = '';
                              }
                            }}
                          />
                        </label>
                      </div>
                    </div>

                    <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
                      <div style={{ flex: 1 }}>
                        <input
                          type="text"
                          placeholder={fetchingCoverIdx === index ? "⏳ Auto-fetching reel cover from Instagram..." : "Cloudinary URL or image link (Auto-filled on upload, or paste link)"}
                          value={customCover}
                          onChange={(e) => handleReelCoverUrlChange(index, e.target.value)}
                          onKeyDown={(e) => {
                            if (e.key === 'Enter') {
                              e.preventDefault();
                              handleCommitReels();
                            }
                          }}
                          onBlur={() => handleCommitReels()}
                          style={{ fontSize: '0.8rem', padding: '7px 10px', width: '100%', boxSizing: 'border-box' }}
                        />
                      </div>
                      {previewCover && (
                        <div style={{ position: 'relative', display: 'inline-block' }}>
                          <div 
                            style={{ 
                              width: '42px', 
                              height: '56px', 
                              borderRadius: '6px', 
                              overflow: 'hidden', 
                              border: '1px solid #cbd5e1', 
                              flexShrink: 0, 
                              background: '#f8fafc',
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                              boxShadow: '0 2px 6px rgba(0,0,0,0.08)'
                            }} 
                            title="Reel Cover Photo Preview"
                          >
                            <img 
                              src={previewCover} 
                              alt="Cover" 
                              style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }} 
                              onError={(e) => { 
                                e.target.style.display = 'none'; 
                                if (e.target.nextElementSibling) e.target.nextElementSibling.style.display = 'flex';
                              }} 
                            />
                            <div style={{ display: 'none', alignItems: 'center', justifyContent: 'center', width: '100%', height: '100%', color: '#94a3b8' }}>
                              <Camera size={18} />
                            </div>
                          </div>
                          {customCover && (
                            <button
                              type="button"
                              onClick={() => handleDeleteCoverPhoto(index)}
                              title="Delete cover photo"
                              style={{
                                position: 'absolute',
                                top: '-6px',
                                right: '-6px',
                                background: '#dc2626',
                                color: '#ffffff',
                                border: '2px solid #ffffff',
                                borderRadius: '50%',
                                width: '18px',
                                height: '18px',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                cursor: 'pointer',
                                padding: 0,
                                boxShadow: '0 1px 3px rgba(0,0,0,0.3)'
                              }}
                            >
                              <X size={10} />
                            </button>
                          )}
                        </div>
                      )}
                    </div>
                  </div>
                )}
              </div>
            );
          })}

          {/* YouTube Videos */}
          <div className={styles.sectionHeader}>YouTube Educational Videos (Max 2)</div>
          {[0, 1].map((index) => (
            <div className={styles.formGroup} key={`yt-${index}`}>
              <label>Video {index + 1} URL</label>
              <input
                type="url"
                placeholder="https://www.youtube.com/watch?v=..."
                value={formData.youtube_videos[index] || ''}
                onChange={(e) => {
                  const newYt = [...formData.youtube_videos];
                  newYt[index] = e.target.value;
                  setFormData({ ...formData, youtube_videos: newYt });
                }}
              />
            </div>
          ))}

          {/* Credentials, Honors & Clinical Experience */}
          <div className={styles.sectionHeader} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginTop: '20px' }}>
            <span style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <Award size={18} />
              Credentials, Honors & Clinical Experience
            </span>
            <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
              <button
                type="button"
                onClick={() => handleLoadSamples(activeCredTab)}
                style={{ background: 'none', border: 'none', color: '#2563eb', fontSize: '0.78rem', cursor: 'pointer', fontWeight: 600 }}
                title="Load sample template for this category"
              >
                Load Sample
              </button>
              <span style={{ color: '#cbd5e1' }}>|</span>
              <button
                type="button"
                onClick={() => handleClearList(activeCredTab, activeCredTab)}
                style={{ background: 'none', border: 'none', color: '#ef4444', fontSize: '0.78rem', cursor: 'pointer', fontWeight: 600 }}
                title="Clear all entries in this category"
              >
                Clear
              </button>
            </div>
          </div>
          <p style={{ fontSize: '0.82rem', color: '#64748b', margin: '-4px 0 10px 0' }}>
            Manage the doctor's verified awards, board certifications, medical council memberships, and hospital career timeline.
          </p>

          <div className={styles.credSection}>
            {/* Category Sub-Tabs */}
            <div className={styles.credNav}>
              <button
                type="button"
                className={`${styles.credTab} ${activeCredTab === 'awards' ? styles.credTabActive : ''}`}
                onClick={() => setActiveCredTab('awards')}
              >
                <Award size={14} />
                <span>Awards</span>
                <span className={styles.credBadge}>{(formData.awards || []).length}</span>
              </button>
              <button
                type="button"
                className={`${styles.credTab} ${activeCredTab === 'certifications' ? styles.credTabActive : ''}`}
                onClick={() => setActiveCredTab('certifications')}
              >
                <GraduationCap size={14} />
                <span>Certificates</span>
                <span className={styles.credBadge}>{(formData.certifications || []).length}</span>
              </button>
              <button
                type="button"
                className={`${styles.credTab} ${activeCredTab === 'memberships' ? styles.credTabActive : ''}`}
                onClick={() => setActiveCredTab('memberships')}
              >
                <Users size={14} />
                <span>Memberships</span>
                <span className={styles.credBadge}>{(formData.memberships || []).length}</span>
              </button>
              <button
                type="button"
                className={`${styles.credTab} ${activeCredTab === 'careerExperience' ? styles.credTabActive : ''}`}
                onClick={() => setActiveCredTab('careerExperience')}
              >
                <Briefcase size={14} />
                <span>Timeline</span>
                <span className={styles.credBadge}>{(formData.careerExperience || []).length}</span>
              </button>
              <button
                type="button"
                className={`${styles.credTab} ${activeCredTab === 'tags' ? styles.credTabActive : ''}`}
                onClick={() => setActiveCredTab('tags')}
              >
                <Tag size={14} />
                <span>Focus Tags</span>
                <span className={styles.credBadge}>{(formData.tags || []).length}</span>
              </button>
            </div>

            {/* TAB 1: Awards & Honors */}
            {activeCredTab === 'awards' && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                <div className={styles.credCardList}>
                  {(formData.awards || []).length === 0 ? (
                    <div className={styles.credEmpty}>
                      No awards or honors added yet. Add one below or click "Load Sample" above.
                    </div>
                  ) : (
                    formData.awards.map((rawAward, idx) => {
                      const item = parseAward(rawAward);
                      const isEditing = editingAwardIdx === idx;
                      if (isEditing) {
                        return (
                          <div key={idx} className={styles.credEditBox}>
                            <input
                              type="text"
                              value={editingAwardData.title}
                              onChange={(e) => setEditingAwardData({ ...editingAwardData, title: e.target.value })}
                              placeholder="Award Title (e.g. Best Cardiologist of the Year)"
                              style={{ width: '100%', padding: '6px 10px', fontSize: '0.85rem', borderRadius: '6px', border: '1px solid #cbd5e1', boxSizing: 'border-box' }}
                            />
                            <div className={styles.grid2}>
                              <input
                                type="text"
                                value={editingAwardData.subtitle}
                                onChange={(e) => setEditingAwardData({ ...editingAwardData, subtitle: e.target.value })}
                                placeholder="Conferring Body / Institution"
                                style={{ width: '100%', padding: '6px 10px', fontSize: '0.85rem', borderRadius: '6px', border: '1px solid #cbd5e1', boxSizing: 'border-box' }}
                              />
                              <input
                                type="text"
                                value={editingAwardData.year}
                                onChange={(e) => setEditingAwardData({ ...editingAwardData, year: e.target.value })}
                                placeholder="Year (e.g. 2023)"
                                style={{ width: '100%', padding: '6px 10px', fontSize: '0.85rem', borderRadius: '6px', border: '1px solid #cbd5e1', boxSizing: 'border-box' }}
                              />
                            </div>
                            <div style={{ display: 'flex', gap: '8px', justifyContent: 'flex-end', marginTop: '4px' }}>
                              <button
                                type="button"
                                onClick={() => handleSaveEditAward(idx)}
                                style={{ background: '#2563eb', color: '#fff', border: 'none', borderRadius: '6px', padding: '5px 12px', fontSize: '0.78rem', cursor: 'pointer', fontWeight: 600 }}
                              >
                                Save Changes
                              </button>
                              <button
                                type="button"
                                onClick={() => setEditingAwardIdx(null)}
                                style={{ background: '#cbd5e1', color: '#334155', border: 'none', borderRadius: '6px', padding: '5px 10px', fontSize: '0.78rem', cursor: 'pointer' }}
                              >
                                Cancel
                              </button>
                            </div>
                          </div>
                        );
                      }
                      return (
                        <div key={idx} className={styles.credItem}>
                          <div className={styles.credItemContent}>
                            <div className={styles.credItemTitle}>
                              <span>{item.title}</span>
                              {item.year && <span className={styles.credPill}>{item.year}</span>}
                            </div>
                            <div className={styles.credItemSub}>{item.subtitle}</div>
                          </div>
                          <div className={styles.credActions}>
                            <button
                              type="button"
                              className={styles.credActionBtn}
                              disabled={idx === 0}
                              onClick={() => moveItem('awards', idx, -1)}
                              title="Move Up"
                            >
                              <ArrowUp size={14} />
                            </button>
                            <button
                              type="button"
                              className={styles.credActionBtn}
                              disabled={idx === (formData.awards.length - 1)}
                              onClick={() => moveItem('awards', idx, 1)}
                              title="Move Down"
                            >
                              <ArrowDown size={14} />
                            </button>
                            <button
                              type="button"
                              className={`${styles.credActionBtn} ${styles.credActionEdit}`}
                              onClick={() => {
                                setEditingAwardIdx(idx);
                                setEditingAwardData({ title: item.title, subtitle: item.subtitle, year: item.year });
                              }}
                              title="Edit Award"
                            >
                              <Edit2 size={14} />
                            </button>
                            <button
                              type="button"
                              className={`${styles.credActionBtn} ${styles.credActionDelete}`}
                              onClick={() => handleRemoveAward(idx)}
                              title="Delete Award"
                            >
                              <Trash2 size={14} />
                            </button>
                          </div>
                        </div>
                      );
                    })
                  )}
                </div>

                {/* Add Award Box */}
                <div className={styles.credAddBox}>
                  <span style={{ fontSize: '0.82rem', fontWeight: 600, color: '#334155', display: 'flex', alignItems: 'center', gap: '6px' }}>
                    <Plus size={14} color="#2563eb" /> Add Award or Honor
                  </span>
                  <input
                    type="text"
                    value={newAwardTitle}
                    onChange={(e) => setNewAwardTitle(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') {
                        e.preventDefault();
                        handleAddAward();
                      }
                    }}
                    placeholder="Award Title (e.g. Best Cardiologist of the Year)"
                    style={{ width: '100%', padding: '6px 10px', fontSize: '0.85rem', borderRadius: '6px', border: '1px solid #cbd5e1', boxSizing: 'border-box' }}
                  />
                  <div className={styles.grid2}>
                    <input
                      type="text"
                      value={newAwardSubtitle}
                      onChange={(e) => setNewAwardSubtitle(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') {
                          e.preventDefault();
                          handleAddAward();
                        }
                      }}
                      placeholder="Conferring Organization (e.g. National Healthcare Summit)"
                      style={{ width: '100%', padding: '6px 10px', fontSize: '0.85rem', borderRadius: '6px', border: '1px solid #cbd5e1', boxSizing: 'border-box' }}
                    />
                    <input
                      type="text"
                      value={newAwardYear}
                      onChange={(e) => setNewAwardYear(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') {
                          e.preventDefault();
                          handleAddAward();
                        }
                      }}
                      placeholder="Year (e.g. 2023)"
                      style={{ width: '100%', padding: '6px 10px', fontSize: '0.85rem', borderRadius: '6px', border: '1px solid #cbd5e1', boxSizing: 'border-box' }}
                    />
                  </div>
                  <button
                    type="button"
                    onClick={handleAddAward}
                    disabled={!newAwardTitle.trim()}
                    style={{
                      alignSelf: 'flex-start',
                      background: newAwardTitle.trim() ? '#2563eb' : '#94a3b8',
                      color: '#fff',
                      border: 'none',
                      borderRadius: '6px',
                      padding: '6px 14px',
                      fontSize: '0.8rem',
                      fontWeight: 600,
                      cursor: newAwardTitle.trim() ? 'pointer' : 'not-allowed',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '5px'
                    }}
                  >
                    <Plus size={14} /> Add Award
                  </button>
                </div>
              </div>
            )}

            {/* TAB 2: Certificates & Fellowships */}
            {activeCredTab === 'certifications' && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                <div className={styles.credCardList}>
                  {(formData.certifications || []).length === 0 ? (
                    <div className={styles.credEmpty}>
                      No certificates or fellowships added yet. Add one below or click "Load Sample" above.
                    </div>
                  ) : (
                    formData.certifications.map((rawCert, idx) => {
                      const item = parseCert(rawCert);
                      const isEditing = editingCertIdx === idx;
                      if (isEditing) {
                        return (
                          <div key={idx} className={styles.credEditBox}>
                            <input
                              type="text"
                              value={editingCertData.title}
                              onChange={(e) => setEditingCertData({ ...editingCertData, title: e.target.value })}
                              placeholder="Certificate / Fellowship Name"
                              style={{ width: '100%', padding: '6px 10px', fontSize: '0.85rem', borderRadius: '6px', border: '1px solid #cbd5e1', boxSizing: 'border-box' }}
                            />
                            <div className={styles.grid2}>
                              <input
                                type="text"
                                value={editingCertData.subtitle}
                                onChange={(e) => setEditingCertData({ ...editingCertData, subtitle: e.target.value })}
                                placeholder="Accrediting Board / University"
                                style={{ width: '100%', padding: '6px 10px', fontSize: '0.85rem', borderRadius: '6px', border: '1px solid #cbd5e1', boxSizing: 'border-box' }}
                              />
                              <input
                                type="text"
                                value={editingCertData.tag}
                                onChange={(e) => setEditingCertData({ ...editingCertData, tag: e.target.value })}
                                placeholder="Badge / Tag (e.g. FACC, Fellowship)"
                                style={{ width: '100%', padding: '6px 10px', fontSize: '0.85rem', borderRadius: '6px', border: '1px solid #cbd5e1', boxSizing: 'border-box' }}
                              />
                            </div>
                            <div style={{ display: 'flex', gap: '8px', justifyContent: 'flex-end', marginTop: '4px' }}>
                              <button
                                type="button"
                                onClick={() => handleSaveEditCert(idx)}
                                style={{ background: '#2563eb', color: '#fff', border: 'none', borderRadius: '6px', padding: '5px 12px', fontSize: '0.78rem', cursor: 'pointer', fontWeight: 600 }}
                              >
                                Save Changes
                              </button>
                              <button
                                type="button"
                                onClick={() => setEditingCertIdx(null)}
                                style={{ background: '#cbd5e1', color: '#334155', border: 'none', borderRadius: '6px', padding: '5px 10px', fontSize: '0.78rem', cursor: 'pointer' }}
                              >
                                Cancel
                              </button>
                            </div>
                          </div>
                        );
                      }
                      return (
                        <div key={idx} className={styles.credItem}>
                          <div className={styles.credItemContent}>
                            <div className={styles.credItemTitle}>
                              <span>{item.title}</span>
                              {item.tag && <span className={styles.credPill}>{item.tag}</span>}
                            </div>
                            <div className={styles.credItemSub}>{item.subtitle}</div>
                          </div>
                          <div className={styles.credActions}>
                            <button
                              type="button"
                              className={styles.credActionBtn}
                              disabled={idx === 0}
                              onClick={() => moveItem('certifications', idx, -1)}
                              title="Move Up"
                            >
                              <ArrowUp size={14} />
                            </button>
                            <button
                              type="button"
                              className={styles.credActionBtn}
                              disabled={idx === (formData.certifications.length - 1)}
                              onClick={() => moveItem('certifications', idx, 1)}
                              title="Move Down"
                            >
                              <ArrowDown size={14} />
                            </button>
                            <button
                              type="button"
                              className={`${styles.credActionBtn} ${styles.credActionEdit}`}
                              onClick={() => {
                                setEditingCertIdx(idx);
                                setEditingCertData({ title: item.title, subtitle: item.subtitle, tag: item.tag });
                              }}
                              title="Edit Certificate"
                            >
                              <Edit2 size={14} />
                            </button>
                            <button
                              type="button"
                              className={`${styles.credActionBtn} ${styles.credActionDelete}`}
                              onClick={() => handleRemoveCert(idx)}
                              title="Delete Certificate"
                            >
                              <Trash2 size={14} />
                            </button>
                          </div>
                        </div>
                      );
                    })
                  )}
                </div>

                {/* Add Certificate Box */}
                <div className={styles.credAddBox}>
                  <span style={{ fontSize: '0.82rem', fontWeight: 600, color: '#334155', display: 'flex', alignItems: 'center', gap: '6px' }}>
                    <Plus size={14} color="#2563eb" /> Add Certificate or Fellowship
                  </span>
                  <input
                    type="text"
                    value={newCertTitle}
                    onChange={(e) => setNewCertTitle(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') {
                        e.preventDefault();
                        handleAddCert();
                      }
                    }}
                    placeholder="Certificate / Fellowship Name (e.g. Fellow of the American College of Cardiology)"
                    style={{ width: '100%', padding: '6px 10px', fontSize: '0.85rem', borderRadius: '6px', border: '1px solid #cbd5e1', boxSizing: 'border-box' }}
                  />
                  <div className={styles.grid2}>
                    <input
                      type="text"
                      value={newCertSubtitle}
                      onChange={(e) => setNewCertSubtitle(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') {
                          e.preventDefault();
                          handleAddCert();
                        }
                      }}
                      placeholder="Accrediting Board (e.g. American College of Cardiology)"
                      style={{ width: '100%', padding: '6px 10px', fontSize: '0.85rem', borderRadius: '6px', border: '1px solid #cbd5e1', boxSizing: 'border-box' }}
                    />
                    <input
                      type="text"
                      value={newCertTag}
                      onChange={(e) => setNewCertTag(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') {
                          e.preventDefault();
                          handleAddCert();
                        }
                      }}
                      placeholder="Badge / Tag (e.g. FACC, Fellowship, Certified)"
                      style={{ width: '100%', padding: '6px 10px', fontSize: '0.85rem', borderRadius: '6px', border: '1px solid #cbd5e1', boxSizing: 'border-box' }}
                    />
                  </div>
                  <button
                    type="button"
                    onClick={handleAddCert}
                    disabled={!newCertTitle.trim()}
                    style={{
                      alignSelf: 'flex-start',
                      background: newCertTitle.trim() ? '#2563eb' : '#94a3b8',
                      color: '#fff',
                      border: 'none',
                      borderRadius: '6px',
                      padding: '6px 14px',
                      fontSize: '0.8rem',
                      fontWeight: 600,
                      cursor: newCertTitle.trim() ? 'pointer' : 'not-allowed',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '5px'
                    }}
                  >
                    <Plus size={14} /> Add Certificate
                  </button>
                </div>
              </div>
            )}

            {/* TAB 3: Professional Medical Memberships */}
            {activeCredTab === 'memberships' && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                <div className={styles.credCardList}>
                  {(formData.memberships || []).length === 0 ? (
                    <div className={styles.credEmpty}>
                      No medical memberships added yet. Add one below or click "Load Sample" above.
                    </div>
                  ) : (
                    formData.memberships.map((rawMem, idx) => {
                      const item = parseMembership(rawMem);
                      const isEditing = editingMemIdx === idx;
                      if (isEditing) {
                        return (
                          <div key={idx} className={styles.credEditBox}>
                            <input
                              type="text"
                              value={editingMemData.title}
                              onChange={(e) => setEditingMemData({ ...editingMemData, title: e.target.value })}
                              placeholder="Medical Association / Council Name"
                              style={{ width: '100%', padding: '6px 10px', fontSize: '0.85rem', borderRadius: '6px', border: '1px solid #cbd5e1', boxSizing: 'border-box' }}
                            />
                            <div className={styles.grid2}>
                              <input
                                type="text"
                                value={editingMemData.council}
                                onChange={(e) => setEditingMemData({ ...editingMemData, council: e.target.value })}
                                placeholder="Council Subtitle / Chapter"
                                style={{ width: '100%', padding: '6px 10px', fontSize: '0.85rem', borderRadius: '6px', border: '1px solid #cbd5e1', boxSizing: 'border-box' }}
                              />
                              <input
                                type="text"
                                value={editingMemData.status}
                                onChange={(e) => setEditingMemData({ ...editingMemData, status: e.target.value })}
                                placeholder="Status (e.g. Life Member)"
                                style={{ width: '100%', padding: '6px 10px', fontSize: '0.85rem', borderRadius: '6px', border: '1px solid #cbd5e1', boxSizing: 'border-box' }}
                              />
                            </div>
                            <label style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '0.8rem', color: '#334155', cursor: 'pointer', marginTop: '2px' }}>
                              <input
                                type="checkbox"
                                checked={editingMemData.showStatus}
                                onChange={(e) => setEditingMemData({ ...editingMemData, showStatus: e.target.checked })}
                                style={{ width: 'auto' }}
                              />
                              Display status badge on public doctor profile
                            </label>
                            <div style={{ display: 'flex', gap: '8px', justifyContent: 'flex-end', marginTop: '4px' }}>
                              <button
                                type="button"
                                onClick={() => handleSaveEditMembership(idx)}
                                style={{ background: '#2563eb', color: '#fff', border: 'none', borderRadius: '6px', padding: '5px 12px', fontSize: '0.78rem', cursor: 'pointer', fontWeight: 600 }}
                              >
                                Save Changes
                              </button>
                              <button
                                type="button"
                                onClick={() => setEditingMemIdx(null)}
                                style={{ background: '#cbd5e1', color: '#334155', border: 'none', borderRadius: '6px', padding: '5px 10px', fontSize: '0.78rem', cursor: 'pointer' }}
                              >
                                Cancel
                              </button>
                            </div>
                          </div>
                        );
                      }
                      return (
                        <div key={idx} className={styles.credItem}>
                          <div className={styles.credItemContent}>
                            <div className={styles.credItemTitle}>
                              <span>{item.title}</span>
                              {item.showStatus && item.status && <span className={styles.credPill}>{item.status}</span>}
                            </div>
                            <div className={styles.credItemSub}>{item.council}</div>
                          </div>
                          <div className={styles.credActions}>
                            <button
                              type="button"
                              className={styles.credActionBtn}
                              disabled={idx === 0}
                              onClick={() => moveItem('memberships', idx, -1)}
                              title="Move Up"
                            >
                              <ArrowUp size={14} />
                            </button>
                            <button
                              type="button"
                              className={styles.credActionBtn}
                              disabled={idx === (formData.memberships.length - 1)}
                              onClick={() => moveItem('memberships', idx, 1)}
                              title="Move Down"
                            >
                              <ArrowDown size={14} />
                            </button>
                            <button
                              type="button"
                              className={`${styles.credActionBtn} ${styles.credActionEdit}`}
                              onClick={() => {
                                setEditingMemIdx(idx);
                                setEditingMemData({ title: item.title, council: item.council, status: item.status, showStatus: item.showStatus });
                              }}
                              title="Edit Membership"
                            >
                              <Edit2 size={14} />
                            </button>
                            <button
                              type="button"
                              className={`${styles.credActionBtn} ${styles.credActionDelete}`}
                              onClick={() => handleRemoveMembership(idx)}
                              title="Delete Membership"
                            >
                              <Trash2 size={14} />
                            </button>
                          </div>
                        </div>
                      );
                    })
                  )}
                </div>

                {/* Add Membership Box */}
                <div className={styles.credAddBox}>
                  <span style={{ fontSize: '0.82rem', fontWeight: 600, color: '#334155', display: 'flex', alignItems: 'center', gap: '6px' }}>
                    <Plus size={14} color="#2563eb" /> Add Medical Membership
                  </span>
                  <input
                    type="text"
                    value={newMemTitle}
                    onChange={(e) => setNewMemTitle(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') {
                        e.preventDefault();
                        handleAddMembership();
                      }
                    }}
                    placeholder="Medical Council / Association (e.g. Cardiological Society of India)"
                    style={{ width: '100%', padding: '6px 10px', fontSize: '0.85rem', borderRadius: '6px', border: '1px solid #cbd5e1', boxSizing: 'border-box' }}
                  />
                  <div className={styles.grid2}>
                    <input
                      type="text"
                      value={newMemCouncil}
                      onChange={(e) => setNewMemCouncil(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') {
                          e.preventDefault();
                          handleAddMembership();
                        }
                      }}
                      placeholder="Council Subtitle / Chapter (e.g. Official Medical Council)"
                      style={{ width: '100%', padding: '6px 10px', fontSize: '0.85rem', borderRadius: '6px', border: '1px solid #cbd5e1', boxSizing: 'border-box' }}
                    />
                    <input
                      type="text"
                      value={newMemStatus}
                      onChange={(e) => setNewMemStatus(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') {
                          e.preventDefault();
                          handleAddMembership();
                        }
                      }}
                      placeholder="Status (e.g. Life Member, Senior Member)"
                      style={{ width: '100%', padding: '6px 10px', fontSize: '0.85rem', borderRadius: '6px', border: '1px solid #cbd5e1', boxSizing: 'border-box' }}
                    />
                  </div>
                  <label style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '0.8rem', color: '#334155', cursor: 'pointer' }}>
                    <input
                      type="checkbox"
                      checked={newMemShowStatus}
                      onChange={(e) => setNewMemShowStatus(e.target.checked)}
                      style={{ width: 'auto' }}
                    />
                    Display status badge on public doctor profile
                  </label>
                  <button
                    type="button"
                    onClick={handleAddMembership}
                    disabled={!newMemTitle.trim()}
                    style={{
                      alignSelf: 'flex-start',
                      background: newMemTitle.trim() ? '#2563eb' : '#94a3b8',
                      color: '#fff',
                      border: 'none',
                      borderRadius: '6px',
                      padding: '6px 14px',
                      fontSize: '0.8rem',
                      fontWeight: 600,
                      cursor: newMemTitle.trim() ? 'pointer' : 'not-allowed',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '5px'
                    }}
                  >
                    <Plus size={14} /> Add Membership
                  </button>
                </div>
              </div>
            )}

            {/* TAB 4: Career Experience & Hospital Timeline */}
            {activeCredTab === 'careerExperience' && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                <div className={styles.credCardList}>
                  {(formData.careerExperience || []).length === 0 ? (
                    <div className={styles.credEmpty}>
                      No career experience roles added yet. Add one below or click "Load Sample" above.
                    </div>
                  ) : (
                    formData.careerExperience.map((rawExp, idx) => {
                      const item = parseCareerExp(rawExp, formData.hospital);
                      const isEditing = editingExpIdx === idx;
                      const yearText = item.isPresent 
                        ? (item.startYear ? `${item.startYear} – Present` : 'Present')
                        : (item.startYear && item.endYear ? `${item.startYear} – ${item.endYear}` : (item.startYear || item.endYear || ''));

                      if (isEditing) {
                        return (
                          <div key={idx} className={styles.credEditBox}>
                            <input
                              type="text"
                              value={editingExpData.role}
                              onChange={(e) => setEditingExpData({ ...editingExpData, role: e.target.value })}
                              placeholder="Designation / Role (e.g. Senior Consultant Cardiologist)"
                              style={{ width: '100%', padding: '6px 10px', fontSize: '0.85rem', borderRadius: '6px', border: '1px solid #cbd5e1', boxSizing: 'border-box' }}
                            />
                            <input
                              type="text"
                              value={editingExpData.hospital}
                              onChange={(e) => setEditingExpData({ ...editingExpData, hospital: e.target.value })}
                              placeholder="Hospital / Clinic (e.g. Apollo Hospital)"
                              style={{ width: '100%', padding: '6px 10px', fontSize: '0.85rem', borderRadius: '6px', border: '1px solid #cbd5e1', boxSizing: 'border-box' }}
                            />
                            <div className={styles.grid2}>
                              <input
                                type="text"
                                value={editingExpData.startYear}
                                onChange={(e) => setEditingExpData({ ...editingExpData, startYear: e.target.value })}
                                placeholder="Start Year (e.g. 2018)"
                                style={{ width: '100%', padding: '6px 10px', fontSize: '0.85rem', borderRadius: '6px', border: '1px solid #cbd5e1', boxSizing: 'border-box' }}
                              />
                              <input
                                type="text"
                                value={editingExpData.endYear}
                                disabled={editingExpData.isPresent}
                                onChange={(e) => setEditingExpData({ ...editingExpData, endYear: e.target.value })}
                                placeholder={editingExpData.isPresent ? 'Present' : 'End Year (e.g. 2022)'}
                                style={{ width: '100%', padding: '6px 10px', fontSize: '0.85rem', borderRadius: '6px', border: '1px solid #cbd5e1', boxSizing: 'border-box', opacity: editingExpData.isPresent ? 0.6 : 1 }}
                              />
                            </div>
                            <label style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '0.8rem', color: '#334155', cursor: 'pointer', marginTop: '2px' }}>
                              <input
                                type="checkbox"
                                checked={editingExpData.isPresent}
                                onChange={(e) => setEditingExpData({ ...editingExpData, isPresent: e.target.checked, endYear: e.target.checked ? '' : editingExpData.endYear })}
                                style={{ width: 'auto' }}
                              />
                              Currently working here (Present)
                            </label>
                            <div style={{ display: 'flex', gap: '8px', justifyContent: 'flex-end', marginTop: '4px' }}>
                              <button
                                type="button"
                                onClick={() => handleSaveEditCareerExp(idx)}
                                style={{ background: '#2563eb', color: '#fff', border: 'none', borderRadius: '6px', padding: '5px 12px', fontSize: '0.78rem', cursor: 'pointer', fontWeight: 600 }}
                              >
                                Save Changes
                              </button>
                              <button
                                type="button"
                                onClick={() => setEditingExpIdx(null)}
                                style={{ background: '#cbd5e1', color: '#334155', border: 'none', borderRadius: '6px', padding: '5px 10px', fontSize: '0.78rem', cursor: 'pointer' }}
                              >
                                Cancel
                              </button>
                            </div>
                          </div>
                        );
                      }
                      return (
                        <div key={idx} className={styles.credItem}>
                          <div className={styles.credItemContent}>
                            <div className={styles.credItemTitle}>
                              <span>{item.role}</span>
                              {yearText && <span className={styles.credPill}>{yearText}</span>}
                            </div>
                            <div className={styles.credItemSub}>{item.hospital}</div>
                          </div>
                          <div className={styles.credActions}>
                            <button
                              type="button"
                              className={styles.credActionBtn}
                              disabled={idx === 0}
                              onClick={() => moveItem('careerExperience', idx, -1)}
                              title="Move Up"
                            >
                              <ArrowUp size={14} />
                            </button>
                            <button
                              type="button"
                              className={styles.credActionBtn}
                              disabled={idx === (formData.careerExperience.length - 1)}
                              onClick={() => moveItem('careerExperience', idx, 1)}
                              title="Move Down"
                            >
                              <ArrowDown size={14} />
                            </button>
                            <button
                              type="button"
                              className={`${styles.credActionBtn} ${styles.credActionEdit}`}
                              onClick={() => {
                                setEditingExpIdx(idx);
                                setEditingExpData({
                                  role: item.role,
                                  hospital: item.hospital,
                                  startYear: item.startYear,
                                  endYear: item.endYear,
                                  isPresent: item.isPresent
                                });
                              }}
                              title="Edit Experience Role"
                            >
                              <Edit2 size={14} />
                            </button>
                            <button
                              type="button"
                              className={`${styles.credActionBtn} ${styles.credActionDelete}`}
                              onClick={() => handleRemoveCareerExp(idx)}
                              title="Delete Experience Role"
                            >
                              <Trash2 size={14} />
                            </button>
                          </div>
                        </div>
                      );
                    })
                  )}
                </div>

                {/* Add Career Experience Box */}
                <div className={styles.credAddBox}>
                  <span style={{ fontSize: '0.82rem', fontWeight: 600, color: '#334155', display: 'flex', alignItems: 'center', gap: '6px' }}>
                    <Plus size={14} color="#2563eb" /> Add Career Experience / Timeline Role
                  </span>
                  <input
                    type="text"
                    value={newRole}
                    onChange={(e) => setNewRole(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') {
                        e.preventDefault();
                        handleAddCareerExp();
                      }
                    }}
                    placeholder="Role / Designation (e.g. Senior Consultant Interventional Cardiologist)"
                    style={{ width: '100%', padding: '6px 10px', fontSize: '0.85rem', borderRadius: '6px', border: '1px solid #cbd5e1', boxSizing: 'border-box' }}
                  />
                  <input
                    type="text"
                    value={newRoleHospital}
                    onChange={(e) => setNewRoleHospital(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') {
                        e.preventDefault();
                        handleAddCareerExp();
                      }
                    }}
                    placeholder={`Hospital / Clinic (defaults to ${formData.hospital || 'Doctor Hospital'})`}
                    style={{ width: '100%', padding: '6px 10px', fontSize: '0.85rem', borderRadius: '6px', border: '1px solid #cbd5e1', boxSizing: 'border-box' }}
                  />
                  <div className={styles.grid2}>
                    <input
                      type="text"
                      value={newRoleStartYear}
                      onChange={(e) => setNewRoleStartYear(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') {
                          e.preventDefault();
                          handleAddCareerExp();
                        }
                      }}
                      placeholder="Start Year (e.g. 2018)"
                      style={{ width: '100%', padding: '6px 10px', fontSize: '0.85rem', borderRadius: '6px', border: '1px solid #cbd5e1', boxSizing: 'border-box' }}
                    />
                    <input
                      type="text"
                      value={newRoleEndYear}
                      disabled={newRoleIsPresent}
                      onChange={(e) => setNewRoleEndYear(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') {
                          e.preventDefault();
                          handleAddCareerExp();
                        }
                      }}
                      placeholder={newRoleIsPresent ? 'Present' : 'End Year (e.g. 2022)'}
                      style={{ width: '100%', padding: '6px 10px', fontSize: '0.85rem', borderRadius: '6px', border: '1px solid #cbd5e1', boxSizing: 'border-box', opacity: newRoleIsPresent ? 0.6 : 1 }}
                    />
                  </div>
                  <label style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '0.8rem', color: '#334155', cursor: 'pointer' }}>
                    <input
                      type="checkbox"
                      checked={newRoleIsPresent}
                      onChange={(e) => {
                        setNewRoleIsPresent(e.target.checked);
                        if (e.target.checked) setNewRoleEndYear('');
                      }}
                      style={{ width: 'auto' }}
                    />
                    Currently working here (Present)
                  </label>
                  <button
                    type="button"
                    onClick={handleAddCareerExp}
                    disabled={!newRole.trim()}
                    style={{
                      alignSelf: 'flex-start',
                      background: newRole.trim() ? '#2563eb' : '#94a3b8',
                      color: '#fff',
                      border: 'none',
                      borderRadius: '6px',
                      padding: '6px 14px',
                      fontSize: '0.8rem',
                      fontWeight: 600,
                      cursor: newRole.trim() ? 'pointer' : 'not-allowed',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '5px'
                    }}
                  >
                    <Plus size={14} /> Add Experience Role
                  </button>
                </div>
              </div>
            )}

            {/* TAB 5: Clinical Focus & Procedure Tags */}
            {activeCredTab === 'tags' && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                {renderTagsManager()}
              </div>
            )}
          </div>

          {/* Doctor Profile FAQs (Managed by Admin) */}
          <div className={styles.sectionHeader} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginTop: '20px' }}>
            <span style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <HelpCircle size={16} />
              Public Doctor Page FAQs
            </span>
          </div>
          <p style={{ fontSize: '0.82rem', color: '#64748b', margin: '-4px 0 12px 0' }}>
            Frequently Asked Questions shown on this doctor's public profile page. (FAQs can be edited only by admin).
          </p>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', marginBottom: '14px' }}>
            {(formData.faqs && formData.faqs.length > 0) ? (
              formData.faqs.map((faq, fIdx) => (
                <div
                  key={fIdx}
                  draggable={editingFaqIdx === null}
                  onDragStart={(e) => handleFaqDragStart(e, fIdx)}
                  onDragOver={(e) => handleFaqDragOver(e, fIdx)}
                  onDrop={(e) => handleFaqDrop(e, fIdx)}
                  style={{
                    background: draggedFaqIndex === fIdx ? '#eff6ff' : '#f8fafc',
                    border: draggedFaqIndex === fIdx ? '1.5px dashed #3b82f6' : '1px solid #e2e8f0',
                    borderRadius: '8px',
                    padding: '10px 12px',
                    transition: 'all 0.15s ease'
                  }}
                >
                  {editingFaqIdx === fIdx ? (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                      <input
                        type="text"
                        value={editingFaqData.q}
                        onChange={(e) => setEditingFaqData({ ...editingFaqData, q: e.target.value })}
                        placeholder="Question..."
                        style={{ width: '100%', padding: '6px 8px', fontSize: '0.85rem', borderRadius: '6px', border: '1px solid #cbd5e1' }}
                      />
                      <textarea
                        rows={2}
                        value={editingFaqData.a}
                        onChange={(e) => setEditingFaqData({ ...editingFaqData, a: e.target.value })}
                        placeholder="Answer..."
                        style={{ width: '100%', padding: '6px 8px', fontSize: '0.85rem', borderRadius: '6px', border: '1px solid #cbd5e1' }}
                      />
                      <input
                        type="text"
                        value={editingFaqData.category || ''}
                        onChange={(e) => setEditingFaqData({ ...editingFaqData, category: e.target.value })}
                        placeholder="Category (e.g. Booking & Schedule, Clinic Preparation, etc.)"
                        style={{ width: '100%', padding: '5px 8px', fontSize: '0.8rem', borderRadius: '6px', border: '1px solid #cbd5e1' }}
                      />
                      <div style={{ marginTop: '4px', marginBottom: '4px' }}>
                        <FaqSymbolSelector
                          isCompact={true}
                          selectedValue={editingFaqData.image || editingFaqData.icon}
                          onSelect={({ icon, image }) => {
                            setEditingFaqData(prev => ({
                              ...prev,
                              icon: icon || image,
                              image: image || (icon?.startsWith('http') ? icon : '')
                            }));
                          }}
                        />
                      </div>
                      <div style={{ display: 'flex', gap: '8px', justifyContent: 'flex-end' }}>
                        <button
                          type="button"
                          onClick={() => {
                            if (!editingFaqData.q.trim()) return;
                            const updated = [...formData.faqs];
                            updated[fIdx] = {
                              ...editingFaqData,
                              q: editingFaqData.q.trim(),
                              question: editingFaqData.q.trim(),
                              a: editingFaqData.a.trim(),
                              answer: editingFaqData.a.trim(),
                              category: editingFaqData.category?.trim() || 'Doctor FAQ'
                            };
                            dirtyFieldsRef.current.add('faqs');
                            setFormData({ ...formData, faqs: updated });
                            setEditingFaqIdx(null);
                          }}
                          style={{ background: '#2563eb', color: '#fff', border: 'none', borderRadius: '6px', padding: '4px 10px', fontSize: '0.78rem', cursor: 'pointer', fontWeight: 600 }}
                        >
                          Save
                        </button>
                        <button
                          type="button"
                          onClick={() => setEditingFaqIdx(null)}
                          style={{ background: '#cbd5e1', color: '#334155', border: 'none', borderRadius: '6px', padding: '4px 8px', fontSize: '0.78rem', cursor: 'pointer' }}
                        >
                          Cancel
                        </button>
                      </div>
                    </div>
                  ) : (
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '8px' }}>
                      <div style={{ display: 'flex', alignItems: 'flex-start', gap: '8px', flex: 1 }}>
                        <div
                          style={{
                            cursor: 'grab',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            color: '#94a3b8',
                            padding: '4px 2px',
                            flexShrink: 0,
                            userSelect: 'none'
                          }}
                          title="Drag up or down to reorder FAQ"
                        >
                          <GripVertical size={16} />
                        </div>
                        {(faq.image || faq.icon) && (
                          <div style={{
                            width: '28px',
                            height: '28px',
                            borderRadius: '6px',
                            background: '#eff6ff',
                            border: '1px solid #bfdbfe',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            flexShrink: 0,
                            overflow: 'hidden'
                          }}>
                            {(faq.image || (faq.icon && (faq.icon.startsWith('http') || faq.icon.startsWith('data:image')))) ? (
                              <img src={faq.image || faq.icon} alt="Icon" style={{ width: '20px', height: '20px', objectFit: 'contain' }} />
                            ) : (
                              <HelpCircle size={16} color="#2563eb" />
                            )}
                          </div>
                        )}
                        <div style={{ flex: 1 }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '3px' }}>
                            <span style={{ fontSize: '0.72rem', fontWeight: 700, background: '#eff6ff', color: '#2563eb', padding: '1px 6px', borderRadius: '4px', textTransform: 'uppercase' }}>
                              {faq.category || 'Doctor FAQ'}
                            </span>
                            <span style={{ fontSize: '0.68rem', color: '#94a3b8', fontWeight: 600 }}>
                              #{fIdx + 1}
                            </span>
                          </div>
                          <div style={{ fontWeight: 600, fontSize: '0.85rem', color: '#1e293b', marginBottom: '2px' }}>
                            Q{fIdx + 1}: {faq.q || faq.question}
                          </div>
                          <div style={{ fontSize: '0.82rem', color: '#64748b' }}>
                            {faq.a || faq.answer}
                          </div>
                        </div>
                      </div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '3px', flexShrink: 0 }}>
                        <button
                          type="button"
                          disabled={fIdx === 0}
                          onClick={() => handleMoveFaq(fIdx, -1)}
                          style={{
                            background: fIdx === 0 ? 'transparent' : '#ffffff',
                            border: '1px solid',
                            borderColor: fIdx === 0 ? '#e2e8f0' : '#cbd5e1',
                            borderRadius: '4px',
                            color: fIdx === 0 ? '#cbd5e1' : '#334155',
                            cursor: fIdx === 0 ? 'not-allowed' : 'pointer',
                            padding: '3px 5px',
                            display: 'inline-flex',
                            alignItems: 'center',
                            justifyContent: 'center'
                          }}
                          title={fIdx === 0 ? 'Already at top' : 'Move FAQ Up'}
                          aria-label="Move FAQ Up"
                        >
                          <ArrowUp size={13} />
                        </button>
                        <button
                          type="button"
                          disabled={fIdx === formData.faqs.length - 1}
                          onClick={() => handleMoveFaq(fIdx, 1)}
                          style={{
                            background: fIdx === formData.faqs.length - 1 ? 'transparent' : '#ffffff',
                            border: '1px solid',
                            borderColor: fIdx === formData.faqs.length - 1 ? '#e2e8f0' : '#cbd5e1',
                            borderRadius: '4px',
                            color: fIdx === formData.faqs.length - 1 ? '#cbd5e1' : '#334155',
                            cursor: fIdx === formData.faqs.length - 1 ? 'not-allowed' : 'pointer',
                            padding: '3px 5px',
                            display: 'inline-flex',
                            alignItems: 'center',
                            justifyContent: 'center'
                          }}
                          title={fIdx === formData.faqs.length - 1 ? 'Already at bottom' : 'Move FAQ Down'}
                          aria-label="Move FAQ Down"
                        >
                          <ArrowDown size={13} />
                        </button>
                        <button
                          type="button"
                          onClick={() => {
                            setEditingFaqIdx(fIdx);
                            setEditingFaqData({
                              q: faq.q || faq.question || '',
                              a: faq.a || faq.answer || '',
                              category: faq.category || 'Booking & Schedule',
                              icon: faq.icon || 'calendar',
                              image: faq.image || ''
                            });
                          }}
                          style={{ background: '#eff6ff', border: '1px solid #bfdbfe', borderRadius: '4px', color: '#2563eb', cursor: 'pointer', padding: '3px 5px', display: 'inline-flex', alignItems: 'center' }}
                          title="Edit FAQ"
                        >
                          <Edit2 size={13} />
                        </button>
                        <button
                          type="button"
                          onClick={() => {
                            const updated = formData.faqs.filter((_, i) => i !== fIdx);
                            dirtyFieldsRef.current.add('faqs');
                            setFormData({ ...formData, faqs: updated });
                          }}
                          style={{ background: '#fef2f2', border: '1px solid #fecaca', borderRadius: '4px', color: '#ef4444', cursor: 'pointer', padding: '3px 5px', display: 'inline-flex', alignItems: 'center' }}
                          title="Delete FAQ"
                        >
                          <Trash2 size={13} />
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              ))
            ) : (
              <div style={{ padding: '16px', background: '#f8fafc', borderRadius: '8px', border: '1px dashed #cbd5e1', textAlign: 'center' }}>
                <span style={{ fontSize: '0.84rem', color: '#64748b', display: 'block' }}>
                  No FAQs added for this doctor yet. Use the form below to add custom FAQs.
                </span>
              </div>
            )}
          </div>

          {/* Add New FAQ Form */}
          <div style={{ background: '#f1f5f9', border: '1px dashed #cbd5e1', borderRadius: '8px', padding: '12px' }}>
            <span style={{ fontSize: '0.82rem', fontWeight: 600, color: '#334155', display: 'block', marginBottom: '8px' }}>
              + Add Custom FAQ for this Doctor
            </span>
            <input
              type="text"
              placeholder="Question (e.g. Does Dr. Roy perform laparoscopic surgeries?)"
              value={newFaqQ}
              onChange={(e) => setNewFaqQ(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  e.preventDefault();
                  if (!newFaqQ.trim()) return;
                  const updated = [...(formData.faqs || []), {
                    q: newFaqQ.trim(),
                    question: newFaqQ.trim(),
                    a: newFaqA.trim(),
                    answer: newFaqA.trim(),
                    category: newFaqCategory.trim() || 'Booking & Schedule',
                    icon: newFaqIcon,
                    image: newFaqImage
                  }];
                  setFormData({ ...formData, faqs: updated });
                  setNewFaqQ('');
                  setNewFaqA('');
                }
              }}
              style={{ width: '100%', padding: '6px 10px', fontSize: '0.85rem', borderRadius: '6px', border: '1px solid #cbd5e1', marginBottom: '6px', boxSizing: 'border-box' }}
            />
            <textarea
              rows={2}
              placeholder="Answer... (Press Ctrl+Enter to add)"
              value={newFaqA}
              onChange={(e) => setNewFaqA(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter' && (e.ctrlKey || e.metaKey)) {
                  e.preventDefault();
                  if (!newFaqQ.trim()) return;
                  const updated = [...(formData.faqs || []), {
                    q: newFaqQ.trim(),
                    question: newFaqQ.trim(),
                    a: newFaqA.trim(),
                    answer: newFaqA.trim(),
                    category: newFaqCategory.trim() || 'Booking & Schedule',
                    icon: newFaqIcon,
                    image: newFaqImage
                  }];
                  setFormData({ ...formData, faqs: updated });
                  setNewFaqQ('');
                  setNewFaqA('');
                }
              }}
              style={{ width: '100%', padding: '6px 10px', fontSize: '0.85rem', borderRadius: '6px', border: '1px solid #cbd5e1', marginBottom: '8px', boxSizing: 'border-box' }}
            />
            
            <input
              type="text"
              placeholder="Category (e.g. Booking & Schedule, Clinic Preparation, Cashless Insurance)"
              value={newFaqCategory}
              onChange={(e) => setNewFaqCategory(e.target.value)}
              style={{ width: '100%', padding: '6px 10px', fontSize: '0.82rem', borderRadius: '6px', border: '1px solid #cbd5e1', marginBottom: '8px', boxSizing: 'border-box' }}
            />

            <div style={{ marginBottom: '10px' }}>
              <FaqSymbolSelector
                isCompact={true}
                selectedValue={newFaqImage || newFaqIcon}
                onSelect={({ icon, image }) => {
                  setNewFaqIcon(icon || image);
                  setNewFaqImage(image || (icon?.startsWith('http') ? icon : ''));
                }}
              />
            </div>

            <button
              type="button"
              onClick={() => {
                if (!newFaqQ.trim()) return;
                const updated = [...(formData.faqs || []), {
                  q: newFaqQ.trim(),
                  question: newFaqQ.trim(),
                  a: newFaqA.trim(),
                  answer: newFaqA.trim(),
                  category: newFaqCategory.trim() || 'Booking & Schedule',
                  icon: newFaqIcon,
                  image: newFaqImage
                }];
                setFormData({ ...formData, faqs: updated });
                setNewFaqQ('');
                setNewFaqA('');
              }}
              style={{ background: '#2563eb', color: '#fff', border: 'none', borderRadius: '6px', padding: '6px 12px', fontSize: '0.8rem', fontWeight: 600, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '4px' }}
            >
              <Plus size={14} /> Add FAQ
            </button>
          </div>
        </div>

        {submitError && (
          <div style={{ background: '#fee2e2', border: '1px solid #fca5a5', color: '#b91c1c', padding: '10px 14px', borderRadius: '8px', fontSize: '0.84rem', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '8px', margin: '0 24px 14px 24px' }}>
            <AlertCircle size={18} color="#dc2626" style={{ flexShrink: 0 }} />
            <span>{submitError}</span>
          </div>
        )}

        <div className={styles.footer}>
          <button type="button" className={styles.cancelBtn} onClick={onClose} disabled={isSubmitting}>
            Cancel
          </button>
          <button type="submit" className={styles.submitBtn} disabled={isSubmitting} style={{ display: 'inline-flex', alignItems: 'center', gap: '6px' }}>
            {isSubmitting && <Loader2 size={16} style={{ animation: 'spin 1s linear infinite' }} />}
            <span>{isSubmitting ? (doctorToEdit ? 'Saving Changes...' : 'Adding Doctor...') : (doctorToEdit ? 'Save Changes' : 'Add Doctor')}</span>
          </button>
        </div>
      </form>
    </div>
  );
};

const DoctorFormModal = ({ isOpen, onClose, doctorToEdit, onSuccess }) => {
  if (!isOpen) return null;

  return (
    <div className={styles.overlay} onClick={onClose}>
      <DoctorFormContent
        key={doctorToEdit ? (doctorToEdit.id || doctorToEdit._id) : 'new'}
        doctorToEdit={doctorToEdit}
        onClose={onClose}
        onSuccess={onSuccess}
      />
    </div>
  );
};

export default DoctorFormModal;
