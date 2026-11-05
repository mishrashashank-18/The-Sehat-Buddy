import mongoose from 'mongoose';
import User from '../models/User.js';

export const calculateAgeFromDob = (dobStr) => {
  if (!dobStr || dobStr === 'Not Selected') return null;
  const d = new Date(dobStr);
  if (isNaN(d.getTime())) return null;
  const today = new Date();
  let age = today.getFullYear() - d.getFullYear();
  const m = today.getMonth() - d.getMonth();
  if (m < 0 || (m === 0 && today.getDate() < d.getDate())) {
    age--;
  }
  return age >= 0 && age <= 130 ? age : null;
};

/**
 * Enriches appointment list in realtime with actual registered patient details
 * (calculating age from live user DOB/age, and overriding stale legacy defaults).
 */
export const enrichAppointmentsWithLiveUserData = async (appointments) => {
  if (!Array.isArray(appointments) || appointments.length === 0) return [];

  const userIds = new Set();
  const userEmails = new Set();

  for (const apt of appointments) {
    if (apt.userId && mongoose.Types.ObjectId.isValid(apt.userId)) {
      userIds.add(new mongoose.Types.ObjectId(apt.userId));
    }
    const email = apt.userData?.email || apt.patientEmail;
    if (email && typeof email === 'string' && email.trim()) {
      userEmails.add(email.trim().toLowerCase());
    }
  }

  const queryOr = [];
  if (userIds.size > 0) queryOr.push({ _id: { $in: Array.from(userIds) } });
  if (userEmails.size > 0) queryOr.push({ email: { $in: Array.from(userEmails) } });

  const usersMap = new Map();
  if (queryOr.length > 0) {
    try {
      const users = await User.find({ $or: queryOr }).select('name email phone dob gender age').lean();
      for (const u of users) {
        if (u._id) usersMap.set(u._id.toString(), u);
        if (u.email) usersMap.set(u.email.toLowerCase().trim(), u);
      }
    } catch (e) {
      console.warn('[enrichAppointments] Error fetching users for realtime sync:', e.message);
    }
  }

  return appointments.map(apt => {
    const aptObj = typeof apt.toObject === 'function' ? apt.toObject() : { ...apt };
    if (!aptObj.userData) aptObj.userData = {};

    const u = (aptObj.userId && usersMap.get(aptObj.userId.toString())) ||
              (aptObj.userData?.email && usersMap.get(aptObj.userData.email.toLowerCase().trim())) ||
              (aptObj.patientEmail && usersMap.get(aptObj.patientEmail.toLowerCase().trim()));

    if (u) {
      // 1. Live age resolution
      let liveAge = null;
      if (u.age && !isNaN(parseInt(u.age, 10)) && parseInt(u.age, 10) > 0) {
        liveAge = parseInt(u.age, 10);
      } else if (u.dob && u.dob !== 'Not Selected') {
        liveAge = calculateAgeFromDob(u.dob);
      }
      
      // Real-time synchronization: preserve form-entered age if live user profile doesn't have age set
      liveAge = liveAge || aptObj.userData?.age || aptObj.age || null;
      aptObj.userData.age = liveAge;
      aptObj.age = liveAge;

      // 2. Live gender resolution
      let liveGender = null;
      if (u.gender && u.gender !== 'Not Selected' && u.gender !== 'Not specified') {
        liveGender = u.gender;
      }
      liveGender = liveGender || aptObj.userData?.gender || aptObj.gender || null;
      aptObj.userData.gender = liveGender;
      aptObj.gender = liveGender;

      // 3. Live phone resolution
      if (u.phone && u.phone !== '0000000000' && (!aptObj.userData.phone || aptObj.userData.phone === '0000000000')) {
        aptObj.userData.phone = u.phone;
        aptObj.phone = u.phone;
      }
    } else {
      // Guest booking or unlinked patient: sanitize legacy defaults
      if (aptObj.userData.gender === 'Not Selected' || aptObj.userData.gender === 'Not specified') {
        aptObj.userData.gender = null;
        aptObj.gender = null;
      }
    }

    return aptObj;
  });
};
