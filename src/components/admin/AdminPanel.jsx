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
  LayoutTemplate
} from 'lucide-react';
import { useData } from '../../context/useData';
import DoctorFormModal from './DoctorFormModal';
import HospitalFormModal from './HospitalFormModal';
import DeleteConfirmModal from './DeleteConfirmModal';
import FrontPageEditor from './FrontPageEditor';
import styles from './AdminPanel.module.css';

const AdminPanel = ({ onExit, onNavigate }) => {
  const {
    doctors,
    hospitals,
    deleteDoctor,
    deleteHospital,
    resetToDefaults,
    stats
  } = useData();

  // Navigation tab: 'overview' | 'doctors' | 'hospitals'
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

  const [deleteModalState, setDeleteModalState] = useState({
    isOpen: false,
    type: null, // 'doctor' | 'hospital' | 'reset'
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
    } else if (deleteModalState.type === 'reset') {
      resetToDefaults();
      showToast('All doctors and hospitals reset to demo defaults.');
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
          <div className={styles.logoIcon}>
            <HeartPulse size={26} color="#0E7C6B" strokeWidth={2.5} />
          </div>
          <div>
            <div className={styles.brandTitleWrap}>
              <span className={styles.brandTitle}>The Sehat Buddy</span>
              <span className={styles.adminBadge}>
                <ShieldCheck size={13} /> Admin Panel
              </span>
            </div>
            <p className={styles.brandSub}>Doctors & Healthcare Directory Management</p>
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
          </div>

          <div className={styles.quickAddBox}>
            <span className={styles.quickAddTitle}>Quick Actions</span>
            <button className={styles.quickDoctorBtn} onClick={handleOpenAddDoctor}>
              <Plus size={16} /> Add Doctor
            </button>
            <button className={styles.quickHospitalBtn} onClick={handleOpenAddHospital}>
              <Plus size={16} /> Add Hospital
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
                    {doctors.slice(0, 4).map(doc => (
                      <div key={doc.id} className={styles.boxItem}>
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
                    {hospitals.slice(0, 4).map(hosp => (
                      <div key={hosp.id} className={styles.boxItem}>
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
                        <tr key={doc.id}>
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
                    <div key={hosp.id} className={styles.hospitalAdminCard}>
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

                        <div className={styles.cardFooterActions}>
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
              <FrontPageEditor showToast={showToast} />
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

      <DeleteConfirmModal
        isOpen={deleteModalState.isOpen}
        onClose={() => setDeleteModalState({ isOpen: false, type: null, item: null })}
        onConfirm={handleConfirmDelete}
        title={
          deleteModalState.type === 'reset'
            ? 'Reset to Default Seeds?'
            : `Delete ${deleteModalState.type === 'doctor' ? 'Doctor' : 'Hospital'}?`
        }
        message={
          deleteModalState.type === 'reset'
            ? 'This will restore the initial pre-configured doctors and hospitals database.'
            : `Are you sure you want to delete this record? It will be removed from both the Admin Panel and the public website.`
        }
        itemName={deleteModalState.item?.name}
      />
    </div>
  );
};

export default AdminPanel;
