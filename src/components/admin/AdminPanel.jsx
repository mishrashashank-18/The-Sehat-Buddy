import React, { useState } from 'react';
import {
  HeartPulse,
  LayoutDashboard,
  Stethoscope,
  Building2,
  Plus,
  Search,
  Filter,
  Trash2,
  Edit3,
  ExternalLink,
  RotateCcw,
  CheckCircle2,
  MapPin,
  Star,
  Bed,
  Phone,
  Clock,
  ShieldCheck,
  LogOut,
  LayoutTemplate,
  Briefcase,
  HelpCircle,
  MessageSquare,
  Activity,
  Eye,
  EyeOff,
  Palette
} from 'lucide-react';
import { useData } from '../../context/useData';
import DoctorFormModal from './DoctorFormModal';
import HospitalFormModal from './HospitalFormModal';
import DeleteConfirmModal from './DeleteConfirmModal';
import FrontPageEditor from './FrontPageEditor';
import FaqFormModal from './FaqFormModal';
import ReviewFormModal from './ReviewFormModal';
import SpecialityFormModal from './SpecialityFormModal';
import BrandingManager from './BrandingManager';
import styles from './AdminPanel.module.css';

const AdminPanel = ({ onExit, onNavigate }) => {
  const {
    branding,
    doctors,
    hospitals,
    corporateTieups,
    deleteDoctor,
    deleteHospital,
    resetToDefaults,
    stats,
    faqs,
    addFaq,
    updateFaq,
    deleteFaq,
    reviews,
    addReview,
    updateReview,
    deleteReview,
    specialitiesProcedures,
    addSpecialityProcedure,
    updateSpecialityProcedure,
    deleteSpecialityProcedure
  } = useData();

  // Navigation tab: 'overview' | 'doctors' | 'hospitals' | 'content' | 'corporate'
  const [activeTab, setActiveTab] = useState('overview');

  // Search & Filters for Doctors
  const [doctorSearch, setDoctorSearch] = useState('');
  const [doctorSpecialtyFilter, setDoctorSpecialtyFilter] = useState('all');

  // Search & Filters for Hospitals
  const [hospitalSearch, setHospitalSearch] = useState('');
  const [hospitalCityFilter, setHospitalCityFilter] = useState('all');
  const [emergencyOnly, setEmergencyOnly] = useState(false);

  // Modals state
  const [isDoctorModalOpen, setIsDoctorModalOpen] = useState(false);
  const [doctorToEdit, setDoctorToEdit] = useState(null);

  const [isHospitalModalOpen, setIsHospitalModalOpen] = useState(false);
  const [hospitalToEdit, setHospitalToEdit] = useState(null);

  // Search & Filters for FAQs
  const [faqSearch, setFaqSearch] = useState('');
  const [faqCategoryFilter, setFaqCategoryFilter] = useState('all');
  const [isFaqModalOpen, setIsFaqModalOpen] = useState(false);
  const [faqToEdit, setFaqToEdit] = useState(null);

  // Search & Filters for Reviews
  const [reviewSearch, setReviewSearch] = useState('');
  const [reviewStatusFilter, setReviewStatusFilter] = useState('all');
  const [isReviewModalOpen, setIsReviewModalOpen] = useState(false);
  const [reviewToEdit, setReviewToEdit] = useState(null);

  // Search & Filters for Specialities & Procedures
  const [specSearch, setSpecSearch] = useState('');
  const [specTypeFilter, setSpecTypeFilter] = useState('all');
  const [isSpecModalOpen, setIsSpecModalOpen] = useState(false);
  const [specToEdit, setSpecToEdit] = useState(null);

  const [deleteModalState, setDeleteModalState] = useState({
    isOpen: false,
    type: null, // 'doctor' | 'hospital' | 'faq' | 'review' | 'speciality' | 'reset'
    item: null
  });

  // Toast feedback
  const [toastMessage, setToastMessage] = useState('');

  const showToast = (msg) => {
    setToastMessage(msg);
    setTimeout(() => {
      setToastMessage('');
    }, 3500);
  };

  // Filtered Doctors
  const filteredDoctors = doctors.filter(doc => {
    const matchesSearch =
      doc.name?.toLowerCase().includes(doctorSearch.toLowerCase()) ||
      doc.specialty?.toLowerCase().includes(doctorSearch.toLowerCase()) ||
      doc.hospital?.toLowerCase().includes(doctorSearch.toLowerCase());
    const matchesSpecialty =
      doctorSpecialtyFilter === 'all' || doc.specialty?.toLowerCase() === doctorSpecialtyFilter.toLowerCase();
    return matchesSearch && matchesSpecialty;
  });

  // Unique specialties for filter dropdown
  const uniqueSpecialties = Array.from(new Set(doctors.map(d => d.specialty).filter(Boolean)));

  // Filtered Hospitals
  const filteredHospitals = hospitals.filter(hosp => {
    const matchesSearch =
      hosp.name?.toLowerCase().includes(hospitalSearch.toLowerCase()) ||
      hosp.city?.toLowerCase().includes(hospitalSearch.toLowerCase()) ||
      (hosp.specialties && hosp.specialties.some(s => s.toLowerCase().includes(hospitalSearch.toLowerCase())));
    const matchesCity =
      hospitalCityFilter === 'all' || hosp.city?.toLowerCase() === hospitalCityFilter.toLowerCase();
    const matchesEmergency = !emergencyOnly || hosp.emergency24x7;
    return matchesSearch && matchesCity && matchesEmergency;
  });

  // Unique cities for hospital filter
  const uniqueCities = Array.from(new Set(hospitals.map(h => h.city).filter(Boolean)));

  // Handlers for Doctor actions
  const handleOpenAddDoctor = () => {
    setDoctorToEdit(null);
    setIsDoctorModalOpen(true);
  };

  const handleOpenEditDoctor = (doc) => {
    setDoctorToEdit(doc);
    setIsDoctorModalOpen(true);
  };

  const handleDeleteDoctorClick = (doc) => {
    setDeleteModalState({
      isOpen: true,
      type: 'doctor',
      item: doc
    });
  };

  // Handlers for Hospital actions
  const handleOpenAddHospital = () => {
    setHospitalToEdit(null);
    setIsHospitalModalOpen(true);
  };

  const handleOpenEditHospital = (hosp) => {
    setHospitalToEdit(hosp);
    setIsHospitalModalOpen(true);
  };

  const handleDeleteHospitalClick = (hosp) => {
    setDeleteModalState({
      isOpen: true,
      type: 'hospital',
      item: hosp
    });
  };

  const handleConfirmDelete = () => {
    if (deleteModalState.type === 'doctor' && deleteModalState.item) {
      deleteDoctor(deleteModalState.item.id);
      showToast(`Doctor "${deleteModalState.item.name}" deleted successfully.`);
    } else if (deleteModalState.type === 'hospital' && deleteModalState.item) {
      deleteHospital(deleteModalState.item.id);
      showToast(`Hospital "${deleteModalState.item.name}" deleted successfully.`);
    } else if (deleteModalState.type === 'faq' && deleteModalState.item) {
      deleteFaq(deleteModalState.item.id || deleteModalState.item._id);
      showToast('FAQ deleted successfully.');
    } else if (deleteModalState.type === 'review' && deleteModalState.item) {
      deleteReview(deleteModalState.item.id || deleteModalState.item._id);
      showToast('Review deleted successfully.');
    } else if (deleteModalState.type === 'speciality' && deleteModalState.item) {
      deleteSpecialityProcedure(deleteModalState.item.id || deleteModalState.item._id);
      showToast('Speciality / Surgery deleted successfully.');
    } else if (deleteModalState.type === 'reset') {
      resetToDefaults();
      showToast('All doctors, hospitals, FAQs, reviews, and specialities reset to demo defaults.');
    }
  };

  return (
    <div className={styles.adminContainer}>
      {/* Toast Notification */}
      {toastMessage && (
        <div className={styles.toast}>
          <CheckCircle2 size={18} />
          <span>{toastMessage}</span>
        </div>
      )}

      {/* Top Bar */}
      <header className={styles.topbar}>
        <div className={styles.brandGroup}>
          {branding?.showLogo !== false && branding?.logoType !== 'none' && (
            <div className={styles.logoIcon}>
              {branding?.logoType === 'image' && branding?.logoImage ? (
                <img
                  src={branding.logoImage}
                  alt={branding?.siteName || 'Logo'}
                  style={{ height: '28px', maxWidth: '36px', objectFit: 'contain', display: 'block' }}
                />
              ) : (
                <HeartPulse size={26} color="#2563EB" strokeWidth={2.5} />
              )}
            </div>
          )}
          <div>
            <div className={styles.brandTitleWrap}>
              <span className={styles.brandTitle}>{branding?.siteName || 'The Sehat Buddy'}</span>
              <span className={styles.adminBadge}>
                <ShieldCheck size={13} /> Admin Panel
              </span>
            </div>
            <p className={styles.brandSub}>
              {branding?.tagline || 'Doctors & Healthcare Directory Management'}
            </p>
          </div>
        </div>

        <div className={styles.topbarActions}>
          <button
            className={styles.portalNavBtn}
            onClick={() => onNavigate ? onNavigate('doctor') : null}
            title="Open Doctor Clinical Console"
          >
            Doctor Dashboard
          </button>

          <button
            className={styles.portalNavBtn}
            onClick={() => onNavigate ? onNavigate('hospital') : null}
            title="Open Hospital Operations Portal"
          >
            Hospital Dashboard
          </button>

          <button
            className={styles.resetBtn}
            onClick={() => setDeleteModalState({
              isOpen: true,
              type: 'reset',
              item: { name: 'all customized doctors & hospitals' }
            })}
            title="Reset data back to initial seeds"
          >
            <RotateCcw size={16} />
            <span>Reset Demo</span>
          </button>

          <button className={styles.viewSiteBtn} onClick={onExit}>
            <span>View Website</span>
            <ExternalLink size={16} />
          </button>
          <button 
            className={styles.logoutBtn} 
            onClick={() => {
              localStorage.removeItem('token');
              localStorage.removeItem('user');
              window.location.reload();
            }}
          >
            <span>Log Out</span>
            <LogOut size={16} />
          </button>
        </div>
      </header>

      {/* Main Workspace Layout */}
      <div className={styles.workspace}>
        {/* Sidebar */}
        <aside className={styles.sidebar}>
          <div className={styles.sidebarNav}>
            <button
              className={`${styles.navItem} ${activeTab === 'overview' ? styles.navItemActive : ''}`}
              onClick={() => setActiveTab('overview')}
            >
              <LayoutDashboard size={20} />
              <span>Overview</span>
            </button>

            <button
              className={`${styles.navItem} ${activeTab === 'doctors' ? styles.navItemActive : ''}`}
              onClick={() => setActiveTab('doctors')}
            >
              <Stethoscope size={20} />
              <span>Doctors</span>
              <span className={styles.navCount}>{doctors.length}</span>
            </button>

            <button
              className={`${styles.navItem} ${activeTab === 'hospitals' ? styles.navItemActive : ''}`}
              onClick={() => setActiveTab('hospitals')}
            >
              <Building2 size={20} />
              <span>Hospitals</span>
              <span className={styles.navCount}>{hospitals.length}</span>
            </button>

            <button
              className={`${styles.navItem} ${activeTab === 'content' ? styles.navItemActive : ''}`}
              onClick={() => setActiveTab('content')}
            >
              <LayoutTemplate size={20} />
              <span>Front Page Content</span>
            </button>

            <button
              className={`${styles.navItem} ${activeTab === 'corporate' ? styles.navItemActive : ''}`}
              onClick={() => setActiveTab('corporate')}
            >
              <Briefcase size={20} />
              <span>Corporate Tie-ups</span>
              <span className={styles.navCount}>{corporateTieups?.length || 0}</span>
            </button>

            <button
              className={`${styles.navItem} ${activeTab === 'branding' ? styles.navItemActive : ''}`}
              onClick={() => setActiveTab('branding')}
            >
              <Palette size={20} />
              <span>Site Identity & Logo</span>
            </button>

            <button
              className={`${styles.navItem} ${activeTab === 'faqs' ? styles.navItemActive : ''}`}
              onClick={() => setActiveTab('faqs')}
            >
              <HelpCircle size={20} />
              <span>FAQs Management</span>
              <span className={styles.navCount}>{faqs.length}</span>
            </button>

            <button
              className={`${styles.navItem} ${activeTab === 'reviews' ? styles.navItemActive : ''}`}
              onClick={() => setActiveTab('reviews')}
            >
              <MessageSquare size={20} />
              <span>Public Reviews</span>
              <span className={styles.navCount}>{reviews.length}</span>
            </button>

            <button
              className={`${styles.navItem} ${activeTab === 'specialities' ? styles.navItemActive : ''}`}
              onClick={() => setActiveTab('specialities')}
            >
              <Activity size={20} />
              <span>Specialities & Surgeries</span>
              <span className={styles.navCount}>{specialitiesProcedures.length}</span>
            </button>
          </div>

          <div className={styles.quickAddBox}>
            <span className={styles.quickAddTitle}>Quick Actions</span>
            <button className={styles.quickDoctorBtn} onClick={handleOpenAddDoctor}>
              <Plus size={16} /> Add Doctor
            </button>
            <button className={styles.quickHospitalBtn} onClick={handleOpenAddHospital}>
              <Plus size={16} /> Add Hospital
            </button>
            <button
              className={styles.quickDoctorBtn}
              style={{ background: '#eff6ff', color: '#2563eb', border: '1px solid #bfdbfe' }}
              onClick={() => {
                setFaqToEdit(null);
                setIsFaqModalOpen(true);
              }}
            >
              <Plus size={16} /> Add FAQ
            </button>
            <button
              className={styles.quickDoctorBtn}
              style={{ background: '#ecfdf5', color: '#059669', border: '1px solid #a7f3d0' }}
              onClick={() => {
                setSpecToEdit(null);
                setIsSpecModalOpen(true);
              }}
            >
              <Plus size={16} /> Add Speciality / Surgery
            </button>
            <button
              className={styles.quickDoctorBtn}
              style={{ background: '#fef3c7', color: '#b45309', border: '1px solid #fde68a' }}
              onClick={() => {
                setReviewToEdit(null);
                setIsReviewModalOpen(true);
              }}
            >
              <Plus size={16} /> Add Review
            </button>
          </div>

          <div className={styles.sidebarInfo}>
            <p>Sehat Buddy Admin v2.0</p>
            <small>All modifications persist in browser storage.</small>
          </div>
        </aside>

        {/* Content Area */}
        <main className={styles.mainContent}>
          {/* TAB 1: OVERVIEW */}
          {activeTab === 'overview' && (
            <div className={styles.viewSection}>
              <div className={styles.viewHeader}>
                <div>
                  <h1 className={styles.pageTitle}>Dashboard Overview</h1>
                  <p className={styles.pageSubtitle}>Monitor registered doctors, healthcare centers, and clinical capacities</p>
                </div>
                <div className={styles.headerBtnGroup}>
                  <button className={styles.contentBtn} onClick={() => setActiveTab('content')}>
                    <LayoutTemplate size={18} /> Edit Front Page
                  </button>
                  <button className={styles.primaryBtn} onClick={handleOpenAddDoctor}>
                    <Plus size={18} /> Add Doctor
                  </button>
                  <button className={styles.secondaryBtn} onClick={handleOpenAddHospital}>
                    <Plus size={18} /> Add Hospital
                  </button>
                </div>
              </div>

              {/* Stats Cards */}
              <div className={styles.statsGrid}>
                <div className={styles.statCard} onClick={() => setActiveTab('doctors')}>
                  <div className={`${styles.statIconWrap} ${styles.statIconGreen}`}>
                    <Stethoscope size={24} />
                  </div>
                  <div className={styles.statInfo}>
                    <span className={styles.statLabel}>Total Doctors</span>
                    <span className={styles.statValue}>{stats.totalDoctors}</span>
                    <span className={styles.statSub}>Specialists registered</span>
                  </div>
                </div>

                <div className={styles.statCard} onClick={() => setActiveTab('hospitals')}>
                  <div className={`${styles.statIconWrap} ${styles.statIconBlue}`}>
                    <Building2 size={24} />
                  </div>
                  <div className={styles.statInfo}>
                    <span className={styles.statLabel}>Total Hospitals</span>
                    <span className={styles.statValue}>{stats.totalHospitals}</span>
                    <span className={styles.statSub}>Across {uniqueCities.length || 1} cities</span>
                  </div>
                </div>

                <div className={styles.statCard}>
                  <div className={`${styles.statIconWrap} ${styles.statIconPurple}`}>
                    <Bed size={24} />
                  </div>
                  <div className={styles.statInfo}>
                    <span className={styles.statLabel}>Total Inpatient Beds</span>
                    <span className={styles.statValue}>{stats.totalBeds.toLocaleString()}</span>
                    <span className={styles.statSub}>Available capacity</span>
                  </div>
                </div>

                <div className={styles.statCard}>
                  <div className={`${styles.statIconWrap} ${styles.statIconOrange}`}>
                    <Clock size={24} />
                  </div>
                  <div className={styles.statInfo}>
                    <span className={styles.statLabel}>24/7 Emergency</span>
                    <span className={styles.statValue}>{stats.emergencyHospitals}</span>
                    <span className={styles.statSub}>Critical emergency centers</span>
                  </div>
                </div>
              </div>

              {/* Quick Preview Sections */}
              <div className={styles.overviewRow}>
                {/* Recent Doctors Preview */}
                <div className={styles.overviewBox}>
                  <div className={styles.boxHeader}>
                    <div>
                      <h3>Doctors Showcase ({doctors.length})</h3>
                      <p>Active medical professionals on Sehat Buddy</p>
                    </div>
                    <button className={styles.boxActionBtn} onClick={() => setActiveTab('doctors')}>
                      Manage All
                    </button>
                  </div>

                  <div className={styles.boxList}>
                    {doctors.map(doc => (
                      <div key={doc.id || doc._id} className={styles.boxItem}>
                        <img
                          src={doc.image}
                          alt={doc.name}
                          className={styles.docAvatarSmall}
                          onError={(e) => {
                            e.target.src = 'https://images.unsplash.com/photo-1622253692010-333f2da6031d?auto=format&fit=crop&w=150&q=80';
                          }}
                        />
                        <div className={styles.boxItemInfo}>
                          <h4>{doc.name}</h4>
                          <p>{doc.specialty} • {doc.experience}</p>
                          <span className={styles.docHospitalName}>{doc.hospital || 'Private Clinic'}</span>
                        </div>
                        <div className={styles.boxItemRight}>
                          <span className={styles.docPriceTag}>₹{doc.price}</span>
                          <button
                            className={styles.smallActionBtn}
                            onClick={() => handleOpenEditDoctor(doc)}
                            title="Edit Doctor"
                          >
                            <Edit3 size={15} />
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Recent Hospitals Preview */}
                <div className={styles.overviewBox}>
                  <div className={styles.boxHeader}>
                    <div>
                      <h3>Hospitals Directory ({hospitals.length})</h3>
                      <p>Registered medical facilities & emergency hubs</p>
                    </div>
                    <button className={styles.boxActionBtn} onClick={() => setActiveTab('hospitals')}>
                      Manage All
                    </button>
                  </div>

                  <div className={styles.boxList}>
                    {hospitals.map(hosp => (
                      <div key={hosp.id || hosp._id} className={styles.boxItem}>
                        <img
                          src={hosp.image}
                          alt={hosp.name}
                          className={styles.hospThumbSmall}
                          onError={(e) => {
                            e.target.src = 'https://images.unsplash.com/photo-1587351021759-3e566b6af7cc?auto=format&fit=crop&w=150&q=80';
                          }}
                        />
                        <div className={styles.boxItemInfo}>
                          <h4>{hosp.name}</h4>
                          <p><MapPin size={12} /> {hosp.city} • {hosp.totalBeds} Beds</p>
                          {hosp.emergency24x7 && (
                            <span className={styles.emergencyBadgeSmall}>24/7 Emergency</span>
                          )}
                        </div>
                        <div className={styles.boxItemRight}>
                          <div className={styles.ratingBadgeSmall}>
                            <Star size={12} fill="#FACC15" color="#FACC15" />
                            <span>{hosp.rating}</span>
                          </div>
                          <button
                            className={styles.smallActionBtn}
                            onClick={() => handleOpenEditHospital(hosp)}
                            title="Edit Hospital"
                          >
                            <Edit3 size={15} />
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* TAB 2: DOCTORS MANAGEMENT */}
          {activeTab === 'doctors' && (
            <div className={styles.viewSection}>
              <div className={styles.viewHeader}>
                <div>
                  <h1 className={styles.pageTitle}>Doctors Management</h1>
                  <p className={styles.pageSubtitle}>Add, edit, or remove certified doctors and medical specialists</p>
                </div>
                <button className={styles.primaryBtn} onClick={handleOpenAddDoctor}>
                  <Plus size={18} /> Add Doctor
                </button>
              </div>

              {/* Filters & Search */}
              <div className={styles.filterBar}>
                <div className={styles.searchBox}>
                  <Search size={18} className={styles.searchIcon} />
                  <input
                    type="text"
                    placeholder="Search doctor by name, specialty, hospital..."
                    value={doctorSearch}
                    onChange={(e) => setDoctorSearch(e.target.value)}
                  />
                  {doctorSearch && (
                    <button className={styles.clearSearch} onClick={() => setDoctorSearch('')}>×</button>
                  )}
                </div>

                <div className={styles.filterGroup}>
                  <Filter size={16} className={styles.filterIcon} />
                  <select
                    value={doctorSpecialtyFilter}
                    onChange={(e) => setDoctorSpecialtyFilter(e.target.value)}
                  >
                    <option value="all">All Specialties ({doctors.length})</option>
                    {uniqueSpecialties.map(spec => (
                      <option key={spec} value={spec}>{spec}</option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Doctors Table / Cards */}
              {filteredDoctors.length === 0 ? (
                <div className={styles.emptyState}>
                  <Stethoscope size={44} className={styles.emptyIcon} />
                  <h3>No Doctors Found</h3>
                  <p>No doctor matches your search query or filter criteria.</p>
                  <button
                    className={styles.secondaryBtn}
                    onClick={() => { setDoctorSearch(''); setDoctorSpecialtyFilter('all'); }}
                  >
                    Reset Filters
                  </button>
                </div>
              ) : (
                <div className={styles.tableContainer}>
                  <table className={styles.dataTable}>
                    <thead>
                      <tr>
                        <th>Doctor</th>
                        <th>Specialty & Experience</th>
                        <th>Affiliated Hospital</th>
                        <th>Consultation Fee</th>
                        <th>Rating</th>
                        <th>Availability</th>
                        <th style={{ textAlign: 'right' }}>Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {filteredDoctors.map(doc => (
                        <tr key={doc.id || doc._id}>
                          <td>
                            <div className={styles.tableDocProfile}>
                              <img
                                src={doc.image}
                                alt={doc.name}
                                className={styles.tableDocAvatar}
                                onError={(e) => {
                                  e.target.src = 'https://images.unsplash.com/photo-1622253692010-333f2da6031d?auto=format&fit=crop&w=150&q=80';
                                }}
                              />
                              <div>
                                <span className={styles.tableDocName}>{doc.name}</span>
                                {doc.degree && <span className={styles.tableDocDegree}>{doc.degree}</span>}
                              </div>
                            </div>
                          </td>
                          <td>
                            <span className={styles.specialtyBadge}>{doc.specialty}</span>
                            <div className={styles.tableSubText}>{doc.experience}</div>
                          </td>
                          <td>
                            <div className={styles.tableHospitalCell}>
                              <Building2 size={14} />
                              <span>{doc.hospital || 'Private Clinic'}</span>
                            </div>
                          </td>
                          <td>
                            <span className={styles.priceHighlight}>₹{doc.price}</span>
                          </td>
                          <td>
                            <div className={styles.ratingBadge}>
                              <Star size={13} fill="#FACC15" color="#FACC15" />
                              <span>{doc.rating}</span>
                              <small>({doc.reviews})</small>
                            </div>
                          </td>
                          <td>
                            <span className={styles.availabilityText}>
                              {doc.availableDays || 'Mon - Sat'}
                            </span>
                          </td>
                          <td>
                            <div className={styles.actionBtnGroup}>
                              <button
                                className={styles.editActionBtn}
                                onClick={() => handleOpenEditDoctor(doc)}
                                title="Edit Doctor"
                              >
                                <Edit3 size={16} /> Edit
                              </button>
                              <button
                                className={styles.deleteActionBtn}
                                onClick={() => handleDeleteDoctorClick(doc)}
                                title="Delete Doctor"
                              >
                                <Trash2 size={16} />
                              </button>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          )}

          {/* TAB 3: HOSPITALS MANAGEMENT */}
          {activeTab === 'hospitals' && (
            <div className={styles.viewSection}>
              <div className={styles.viewHeader}>
                <div>
                  <h1 className={styles.pageTitle}>Hospitals Directory</h1>
                  <p className={styles.pageSubtitle}>Manage affiliated partner hospitals, bed counts, and clinical departments</p>
                </div>
                <button className={styles.secondaryBtn} onClick={handleOpenAddHospital}>
                  <Plus size={18} /> Add Hospital
                </button>
              </div>

              {/* Filters & Search */}
              <div className={styles.filterBar}>
                <div className={styles.searchBox}>
                  <Search size={18} className={styles.searchIcon} />
                  <input
                    type="text"
                    placeholder="Search hospital by name, city, department..."
                    value={hospitalSearch}
                    onChange={(e) => setHospitalSearch(e.target.value)}
                  />
                  {hospitalSearch && (
                    <button className={styles.clearSearch} onClick={() => setHospitalSearch('')}>×</button>
                  )}
                </div>

                <div className={styles.filterGroup}>
                  <MapPin size={16} className={styles.filterIcon} />
                  <select
                    value={hospitalCityFilter}
                    onChange={(e) => setHospitalCityFilter(e.target.value)}
                  >
                    <option value="all">All Cities ({hospitals.length})</option>
                    {uniqueCities.map(city => (
                      <option key={city} value={city}>{city}</option>
                    ))}
                  </select>
                </div>

                <label className={styles.emergencyFilterToggle}>
                  <input
                    type="checkbox"
                    checked={emergencyOnly}
                    onChange={(e) => setEmergencyOnly(e.target.checked)}
                  />
                  <span>24/7 Emergency Only</span>
                </label>
              </div>

              {/* Hospitals Cards Grid */}
              {filteredHospitals.length === 0 ? (
                <div className={styles.emptyState}>
                  <Building2 size={44} className={styles.emptyIcon} />
                  <h3>No Hospitals Found</h3>
                  <p>No medical center matches your search query or city filter.</p>
                  <button
                    className={styles.secondaryBtn}
                    onClick={() => { setHospitalSearch(''); setHospitalCityFilter('all'); setEmergencyOnly(false); }}
                  >
                    Reset Filters
                  </button>
                </div>
              ) : (
                <div className={styles.hospitalsGrid}>
                  {filteredHospitals.map(hosp => (
                    <div key={hosp.id || hosp._id} className={styles.hospitalAdminCard}>
                      <div className={styles.cardImageContainer}>
                        <img
                          src={hosp.image}
                          alt={hosp.name}
                          className={styles.cardHospitalImage}
                          onError={(e) => {
                            e.target.src = 'https://images.unsplash.com/photo-1587351021759-3e566b6af7cc?auto=format&fit=crop&w=800&q=80';
                          }}
                        />
                        <div className={styles.cardCityBadge}>
                          <MapPin size={13} /> {hosp.city}
                        </div>
                        {hosp.emergency24x7 && (
                          <div className={styles.cardEmergencyBadge}>
                            24/7 Emergency
                          </div>
                        )}
                      </div>

                      <div className={styles.cardHospitalContent}>
                        <div className={styles.cardHeaderRow}>
                          <h3 className={styles.cardHospitalName}>{hosp.name}</h3>
                          <div className={styles.cardRating}>
                            <Star size={14} fill="#FACC15" color="#FACC15" />
                            <span>{hosp.rating}</span>
                          </div>
                        </div>

                        <p className={styles.cardAddress}>{hosp.address}</p>

                        <div className={styles.cardMetaRow}>
                          <div className={styles.metaPill}>
                            <Bed size={14} />
                            <span>{hosp.totalBeds} Beds</span>
                          </div>
                          {hosp.establishedYear && (
                            <div className={styles.metaPill}>
                              <span>Est. {hosp.establishedYear}</span>
                            </div>
                          )}
                          {hosp.phone && (
                            <div className={styles.metaPill}>
                              <Phone size={13} />
                              <span>{hosp.phone}</span>
                            </div>
                          )}
                        </div>

                        {hosp.specialties && hosp.specialties.length > 0 && (
                          <div className={styles.cardSpecialties}>
                            {hosp.specialties.slice(0, 4).map(spec => (
                              <span key={spec} className={styles.specTag}>{spec}</span>
                            ))}
                            {hosp.specialties.length > 4 && (
                              <span className={styles.specTagMore}>+{hosp.specialties.length - 4} more</span>
                            )}
                          </div>
                        )}

                        <div style={{ display: 'flex', gap: '8px', margin: '12px 0 8px', flexWrap: 'wrap' }}>
                          <span style={{ fontSize: '0.75rem', background: '#eff6ff', color: '#2563eb', padding: '3px 8px', borderRadius: '4px', fontWeight: 600 }}>
                            📹 {(hosp.reels || []).filter(Boolean).length || 5} Reels
                          </span>
                          <span style={{ fontSize: '0.75rem', background: '#fef2f2', color: '#ef4444', padding: '3px 8px', borderRadius: '4px', fontWeight: 600 }}>
                            ▶️ {(hosp.youtube_videos || []).filter(Boolean).length || 5} Videos
                          </span>
                          <span style={{ fontSize: '0.75rem', background: '#fffbeb', color: '#d97706', padding: '3px 8px', borderRadius: '4px', fontWeight: 600 }}>
                            ⭐ {(hosp.star_doctors || []).length || 4} Star Doctors
                          </span>
                        </div>

                        <div className={styles.cardFooterActions}>
                          <button
                            className={styles.secondaryBtn}
                            style={{ padding: '6px 12px', fontSize: '0.8rem', display: 'inline-flex', alignItems: 'center', gap: 4 }}
                            onClick={() => onNavigate && onNavigate('hospital-profile', hosp.id || hosp._id)}
                            title="Open public hospital center page"
                          >
                            <ExternalLink size={14} /> View Center
                          </button>
                          <button
                            className={styles.editCardBtn}
                            onClick={() => handleOpenEditHospital(hosp)}
                          >
                            <Edit3 size={15} /> Edit Details
                          </button>
                          <button
                            className={styles.deleteCardBtn}
                            onClick={() => handleDeleteHospitalClick(hosp)}
                            title="Delete Hospital"
                          >
                            <Trash2 size={16} />
                          </button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* TAB 4: FRONT PAGE CONTENT EDITOR */}
          {activeTab === 'content' && (
            <div className={styles.viewSection}>
              <FrontPageEditor showToast={showToast} initialSubTab="hero" />
            </div>
          )}

          {/* TAB 5: CORPORATE TIE-UPS EDITOR */}
          {activeTab === 'corporate' && (
            <div className={styles.viewSection}>
              <FrontPageEditor showToast={showToast} initialSubTab="corporate" />
            </div>
          )}

          {/* TAB 5: FAQs MANAGEMENT */}
          {activeTab === 'faqs' && (
            <div className={styles.viewSection}>
              <div className={styles.sectionHeader}>
                <div>
                  <h2 className={styles.sectionTitle}>Frequently Asked Questions (FAQs)</h2>
                  <p className={styles.sectionSub}>Add new FAQs or modify existing answers displayed on the public portal.</p>
                </div>
                <button
                  className={styles.primaryActionBtn}
                  onClick={() => {
                    setFaqToEdit(null);
                    setIsFaqModalOpen(true);
                  }}
                >
                  <Plus size={16} /> Add New FAQ
                </button>
              </div>

              {/* Filters */}
              <div className={styles.filterBar}>
                <div className={styles.searchWrap}>
                  <Search size={18} className={styles.searchIcon} />
                  <input
                    type="text"
                    placeholder="Search FAQs by question or answer keyword..."
                    value={faqSearch}
                    onChange={(e) => setFaqSearch(e.target.value)}
                    className={styles.searchInput}
                  />
                </div>
                <div className={styles.filterGroup}>
                  <Filter size={16} className={styles.filterIcon} />
                  <select
                    value={faqCategoryFilter}
                    onChange={(e) => setFaqCategoryFilter(e.target.value)}
                    className={styles.filterSelect}
                  >
                    <option value="all">All Categories ({faqs.length})</option>
                    <option value="Insurance & Cashless">Insurance & Cashless</option>
                    <option value="Surgeries & Procedures">Surgeries & Procedures</option>
                    <option value="Hospitals & Admissions">Hospitals & Admissions</option>
                    <option value="Doctors & Consultations">Doctors & Consultations</option>
                    <option value="General">General</option>
                  </select>
                </div>
              </div>

              {/* FAQ Cards */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: '14px', marginTop: '16px' }}>
                {faqs
                  .filter(f => {
                    const matchCat = faqCategoryFilter === 'all' || f.category === faqCategoryFilter;
                    const matchSearch =
                      f.question.toLowerCase().includes(faqSearch.toLowerCase()) ||
                      f.answer.toLowerCase().includes(faqSearch.toLowerCase());
                    return matchCat && matchSearch;
                  })
                  .map((faq) => (
                    <div
                      key={faq.id || faq._id}
                      style={{
                        background: '#ffffff',
                        border: '1px solid #e2e8f0',
                        borderRadius: '14px',
                        padding: '18px 22px',
                        display: 'flex',
                        flexDirection: 'column',
                        gap: '10px'
                      }}
                    >
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '12px' }}>
                        <div>
                          <div style={{ display: 'flex', gap: '8px', alignItems: 'center', marginBottom: '6px' }}>
                            <span style={{ fontSize: '0.75rem', background: '#eff6ff', color: '#2563eb', padding: '2px 8px', borderRadius: '4px', fontWeight: 700 }}>
                              {faq.category}
                            </span>
                            <span style={{ fontSize: '0.75rem', background: faq.isActive ? '#ecfdf5' : '#f1f5f9', color: faq.isActive ? '#059669' : '#64748b', padding: '2px 8px', borderRadius: '4px', fontWeight: 600 }}>
                              {faq.isActive ? 'Active' : 'Hidden'}
                            </span>
                          </div>
                          <h4 style={{ margin: 0, fontSize: '1.05rem', fontWeight: 700, color: '#0f172a' }}>
                            {faq.question}
                          </h4>
                        </div>

                        <div style={{ display: 'flex', gap: '8px' }}>
                          <button
                            type="button"
                            onClick={() => {
                              setFaqToEdit(faq);
                              setIsFaqModalOpen(true);
                            }}
                            style={{
                              background: '#f8fafc',
                              border: '1px solid #cbd5e1',
                              borderRadius: '8px',
                              padding: '6px 12px',
                              fontSize: '0.8rem',
                              fontWeight: 600,
                              color: '#2563eb',
                              cursor: 'pointer',
                              display: 'flex',
                              alignItems: 'center',
                              gap: '4px'
                            }}
                          >
                            <Edit3 size={14} /> Edit
                          </button>
                          <button
                            type="button"
                            onClick={() => {
                              setDeleteModalState({
                                isOpen: true,
                                type: 'faq',
                                item: faq
                              });
                            }}
                            style={{
                              background: '#fef2f2',
                              border: '1px solid #fecaca',
                              borderRadius: '8px',
                              padding: '6px 10px',
                              color: '#ef4444',
                              cursor: 'pointer'
                            }}
                            title="Delete FAQ"
                          >
                            <Trash2 size={14} />
                          </button>
                        </div>
                      </div>

                      <p style={{ margin: 0, fontSize: '0.9rem', color: '#475569', lineHeight: 1.55 }}>
                        {faq.answer}
                      </p>
                    </div>
                  ))}
              </div>
            </div>
          )}

          {/* TAB 6: PUBLIC REVIEWS */}
          {activeTab === 'reviews' && (
            <div className={styles.viewSection}>
              <div className={styles.sectionHeader}>
                <div>
                  <h2 className={styles.sectionTitle}>Public Reviews & Patient Testimonials</h2>
                  <p className={styles.sectionSub}>Moderate user reviews, verify insurance experiences, or add official hospital reviews.</p>
                </div>
                <button
                  className={styles.primaryActionBtn}
                  onClick={() => {
                    setReviewToEdit(null);
                    setIsReviewModalOpen(true);
                  }}
                >
                  <Plus size={16} /> Add New Review
                </button>
              </div>

              {/* Filters */}
              <div className={styles.filterBar}>
                <div className={styles.searchWrap}>
                  <Search size={18} className={styles.searchIcon} />
                  <input
                    type="text"
                    placeholder="Search by patient name, hospital, surgery, or keywords..."
                    value={reviewSearch}
                    onChange={(e) => setReviewSearch(e.target.value)}
                    className={styles.searchInput}
                  />
                </div>
                <div className={styles.filterGroup}>
                  <Filter size={16} className={styles.filterIcon} />
                  <select
                    value={reviewStatusFilter}
                    onChange={(e) => setReviewStatusFilter(e.target.value)}
                    className={styles.filterSelect}
                  >
                    <option value="all">All Reviews ({reviews.length})</option>
                    <option value="approved">Approved</option>
                    <option value="pending">Pending</option>
                    <option value="rejected">Rejected</option>
                  </select>
                </div>
              </div>

              {/* Reviews List */}
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(340px, 1fr))', gap: '16px', marginTop: '16px' }}>
                {reviews
                  .filter(r => {
                    const matchStatus = reviewStatusFilter === 'all' || r.status === reviewStatusFilter;
                    const matchSearch =
                      r.patientName.toLowerCase().includes(reviewSearch.toLowerCase()) ||
                      r.targetName.toLowerCase().includes(reviewSearch.toLowerCase()) ||
                      r.comment.toLowerCase().includes(reviewSearch.toLowerCase());
                    return matchStatus && matchSearch;
                  })
                  .map((rev) => (
                    <div
                      key={rev.id || rev._id}
                      style={{
                        background: '#ffffff',
                        border: '1px solid #e2e8f0',
                        borderRadius: '14px',
                        padding: '18px',
                        display: 'flex',
                        flexDirection: 'column',
                        gap: '10px'
                      }}
                    >
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                        <div>
                          <strong style={{ fontSize: '0.98rem', color: '#0f172a' }}>{rev.patientName}</strong>
                          <span style={{ fontSize: '0.78rem', color: '#94a3b8', display: 'block' }}>{rev.patientCity}</span>
                        </div>
                        <div style={{ display: 'flex', gap: '2px' }}>
                          {[1, 2, 3, 4, 5].map((s) => (
                            <Star
                              key={s}
                              size={14}
                              fill={s <= Number(rev.rating) ? '#f59e0b' : '#e2e8f0'}
                              color={s <= Number(rev.rating) ? '#f59e0b' : '#cbd5e1'}
                            />
                          ))}
                        </div>
                      </div>

                      <div style={{ fontSize: '0.8rem', background: '#f8fafc', padding: '6px 10px', borderRadius: '6px', color: '#334155' }}>
                        <strong>Target:</strong> {rev.targetName} ({rev.targetType})
                        {rev.treatment && <span style={{ display: 'block', color: '#2563eb' }}>Treatment: {rev.treatment}</span>}
                        {rev.insuranceUsed && <span style={{ display: 'block', color: '#059669' }}>Insurance: {rev.insuranceUsed}</span>}
                      </div>

                      <p style={{ margin: 0, fontSize: '0.88rem', color: '#475569', lineHeight: 1.5 }}>
                        {rev.comment}
                      </p>

                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: 'auto', paddingTop: '10px', borderTop: '1px solid #f1f5f9' }}>
                        <span style={{
                          fontSize: '0.72rem',
                          fontWeight: 700,
                          textTransform: 'uppercase',
                          padding: '3px 8px',
                          borderRadius: '4px',
                          background: rev.status === 'approved' ? '#ecfdf5' : rev.status === 'pending' ? '#fef3c7' : '#fef2f2',
                          color: rev.status === 'approved' ? '#059669' : rev.status === 'pending' ? '#b45309' : '#ef4444'
                        }}>
                          {rev.status}
                        </span>

                        <div style={{ display: 'flex', gap: '6px' }}>
                          <button
                            type="button"
                            onClick={() => {
                              setReviewToEdit(rev);
                              setIsReviewModalOpen(true);
                            }}
                            style={{ background: '#f1f5f9', border: 'none', borderRadius: '6px', padding: '4px 8px', fontSize: '0.78rem', fontWeight: 600, color: '#2563eb', cursor: 'pointer' }}
                          >
                            Edit
                          </button>
                          <button
                            type="button"
                            onClick={() => {
                              setDeleteModalState({
                                isOpen: true,
                                type: 'review',
                                item: { ...rev, name: rev.patientName + "'s review" }
                              });
                            }}
                            style={{ background: '#fef2f2', border: 'none', borderRadius: '6px', padding: '4px 8px', fontSize: '0.78rem', color: '#ef4444', cursor: 'pointer' }}
                          >
                            Delete
                          </button>
                        </div>
                      </div>
                    </div>
                  ))}
              </div>
            </div>
          )}

          {/* TAB 7: SPECIALITIES & SURGERIES */}
          {activeTab === 'specialities' && (
            <div className={styles.viewSection}>
              <div className={styles.sectionHeader}>
                <div>
                  <h2 className={styles.sectionTitle}>Specialities & Procedures (Surgeries)</h2>
                  <p className={styles.sectionSub}>Manage clinical departments, surgical procedures, and cashless insurance coverage parameters.</p>
                </div>
                <button
                  className={styles.primaryActionBtn}
                  onClick={() => {
                    setSpecToEdit(null);
                    setIsSpecModalOpen(true);
                  }}
                >
                  <Plus size={16} /> Add Speciality / Surgery
                </button>
              </div>

              {/* Filters */}
              <div className={styles.filterBar}>
                <div className={styles.searchWrap}>
                  <Search size={18} className={styles.searchIcon} />
                  <input
                    type="text"
                    placeholder="Search specialities, procedures, surgeries..."
                    value={specSearch}
                    onChange={(e) => setSpecSearch(e.target.value)}
                    className={styles.searchInput}
                  />
                </div>
                <div className={styles.filterGroup}>
                  <Filter size={16} className={styles.filterIcon} />
                  <select
                    value={specTypeFilter}
                    onChange={(e) => setSpecTypeFilter(e.target.value)}
                    className={styles.filterSelect}
                  >
                    <option value="all">All Items ({specialitiesProcedures.length})</option>
                    <option value="speciality">Specialities Only</option>
                    <option value="procedure">Procedures / Surgeries Only</option>
                  </select>
                </div>
              </div>

              {/* Cards Grid */}
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', gap: '16px', marginTop: '16px' }}>
                {specialitiesProcedures
                  .filter(sp => {
                    const matchType = specTypeFilter === 'all' || sp.type === specTypeFilter;
                    const matchSearch =
                      sp.name.toLowerCase().includes(specSearch.toLowerCase()) ||
                      (sp.description || '').toLowerCase().includes(specSearch.toLowerCase());
                    return matchType && matchSearch;
                  })
                  .map((sp) => (
                    <div
                      key={sp.id || sp._id}
                      style={{
                        background: '#ffffff',
                        border: '1px solid #e2e8f0',
                        borderRadius: '14px',
                        padding: '18px',
                        display: 'flex',
                        flexDirection: 'column',
                        gap: '10px'
                      }}
                    >
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                        <div>
                          <span style={{
                            fontSize: '0.72rem',
                            fontWeight: 700,
                            textTransform: 'uppercase',
                            padding: '2px 8px',
                            borderRadius: '4px',
                            background: sp.type === 'procedure' ? '#eff6ff' : '#f0fdf4',
                            color: sp.type === 'procedure' ? '#2563eb' : '#059669',
                            display: 'inline-block',
                            marginBottom: '4px'
                          }}>
                            {sp.type === 'procedure' ? 'Surgical Procedure' : 'Medical Speciality'}
                          </span>
                          <h4 style={{ margin: 0, fontSize: '1.05rem', fontWeight: 700, color: '#0f172a' }}>
                            {sp.name}
                          </h4>
                        </div>

                        <span style={{ fontSize: '0.8rem', background: '#f8fafc', padding: '4px 8px', borderRadius: '6px', color: '#64748b' }}>
                          Icon: {sp.icon || 'Bot'}
                        </span>
                      </div>

                      <div style={{ background: '#f8fafc', padding: '8px 12px', borderRadius: '8px', fontSize: '0.82rem', display: 'flex', flexDirection: 'column', gap: '4px' }}>
                        <span style={{ color: '#059669', fontWeight: 700 }}>
                          🛡️ {sp.insuranceDetails?.coveragePercent || 'Cashless Available'}
                        </span>
                        <span style={{ color: '#475569' }}>
                          Cost: <strong>{sp.insuranceDetails?.estimatedCostRange || '₹45,000 - ₹90,000'}</strong>
                        </span>
                        <span style={{ color: '#64748b' }}>
                          Pre-Auth: {sp.insuranceDetails?.preAuthHours || '30 Mins'}
                        </span>
                      </div>

                      <p style={{ margin: 0, fontSize: '0.85rem', color: '#64748b', lineHeight: 1.45 }}>
                        {sp.description}
                      </p>

                      <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '8px', marginTop: 'auto', paddingTop: '10px', borderTop: '1px solid #f1f5f9' }}>
                        <button
                          type="button"
                          onClick={() => {
                            setSpecToEdit(sp);
                            setIsSpecModalOpen(true);
                          }}
                          style={{ background: '#f1f5f9', border: 'none', borderRadius: '6px', padding: '5px 12px', fontSize: '0.8rem', fontWeight: 600, color: '#2563eb', cursor: 'pointer' }}
                        >
                          Edit
                        </button>
                        <button
                          type="button"
                          onClick={() => {
                            setDeleteModalState({
                              isOpen: true,
                              type: 'speciality',
                              item: sp
                            });
                          }}
                          style={{ background: '#fef2f2', border: 'none', borderRadius: '6px', padding: '5px 10px', fontSize: '0.8rem', color: '#ef4444', cursor: 'pointer' }}
                        >
                          Delete
                        </button>
                      </div>
                    </div>
                  ))}
              </div>
            </div>
          )}

          {/* TAB 8: SITE IDENTITY & LOGO */}
          {activeTab === 'branding' && (
            <div className={styles.viewSection}>
              <BrandingManager showToast={showToast} />
            </div>
          )}
        </main>
      </div>

      {/* Modals */}
      <DoctorFormModal
        isOpen={isDoctorModalOpen}
        onClose={() => setIsDoctorModalOpen(false)}
        doctorToEdit={doctorToEdit}
        onSuccess={showToast}
      />

      <HospitalFormModal
        isOpen={isHospitalModalOpen}
        onClose={() => setIsHospitalModalOpen(false)}
        hospitalToEdit={hospitalToEdit}
        onSuccess={showToast}
      />

      {isFaqModalOpen && (
        <FaqFormModal
          faqToEdit={faqToEdit}
          onClose={() => setIsFaqModalOpen(false)}
          onSave={(data) => {
            if (faqToEdit) {
              updateFaq(faqToEdit.id || faqToEdit._id, data);
              showToast('FAQ updated successfully!');
            } else {
              addFaq(data);
              showToast('New FAQ added successfully!');
            }
            setIsFaqModalOpen(false);
          }}
        />
      )}

      {isReviewModalOpen && (
        <ReviewFormModal
          reviewToEdit={reviewToEdit}
          onClose={() => setIsReviewModalOpen(false)}
          onSave={(data) => {
            if (reviewToEdit) {
              updateReview(reviewToEdit.id || reviewToEdit._id, data);
              showToast('Review updated successfully!');
            } else {
              addReview(data);
              showToast('New Review added successfully!');
            }
            setIsReviewModalOpen(false);
          }}
        />
      )}

      {isSpecModalOpen && (
        <SpecialityFormModal
          itemToEdit={specToEdit}
          onClose={() => setIsSpecModalOpen(false)}
          onSave={(data) => {
            if (specToEdit) {
              updateSpecialityProcedure(specToEdit.id || specToEdit._id, data);
              showToast('Speciality / Procedure updated successfully!');
            } else {
              addSpecialityProcedure(data);
              showToast('New Speciality / Procedure created successfully!');
            }
            setIsSpecModalOpen(false);
          }}
        />
      )}

      <DeleteConfirmModal
        isOpen={deleteModalState.isOpen}
        onClose={() => setDeleteModalState({ isOpen: false, type: null, item: null })}
        onConfirm={handleConfirmDelete}
        title={
          deleteModalState.type === 'reset'
            ? 'Reset to Default Seeds?'
            : `Delete ${deleteModalState.type === 'doctor' ? 'Doctor' : deleteModalState.type === 'hospital' ? 'Hospital' : deleteModalState.type === 'faq' ? 'FAQ' : deleteModalState.type === 'review' ? 'Review' : 'Speciality'}?`
        }
        message={
          deleteModalState.type === 'reset'
            ? 'This will restore the initial pre-configured database back to initial defaults.'
            : `Are you sure you want to delete this record? It will be removed from both the Admin Panel and the public website.`
        }
        itemName={deleteModalState.item?.name || deleteModalState.item?.question || deleteModalState.item?.patientName}
      />
    </div>
  );
};

export default AdminPanel;
