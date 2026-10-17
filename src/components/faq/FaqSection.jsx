import React, { useState } from 'react';
import {
  HelpCircle,
  ChevronDown,
  ChevronUp,
  Search,
  ShieldCheck,
  PhoneCall,
  Mail,
  Sparkles
} from 'lucide-react';
import { useData } from '../../context/useData';
import Container from '../layout/Container';
import styles from './FaqSection.module.css';

const FAQ_CATEGORIES = [
  'All',
  'Insurance & Cashless',
  'Surgeries & Procedures',
  'Hospitals & Admissions',
  'Doctors & Consultations',
  'General'
];

const FaqSection = () => {
  const { faqs } = useData();
  const [activeCategory, setActiveCategory] = useState('All');
  const [searchQuery, setSearchQuery] = useState('');
  const [expandedId, setExpandedId] = useState(null);

  // Active faqs only
  const activeFaqs = faqs.filter(f => f.isActive !== false);

  const filteredFaqs = activeFaqs.filter(faq => {
    const matchesCategory = activeCategory === 'All' || faq.category === activeCategory;
    const matchesSearch =
      faq.question.toLowerCase().includes(searchQuery.toLowerCase()) ||
      faq.answer.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesCategory && matchesSearch;
  });

  const toggleAccordion = (id) => {
    setExpandedId(prev => (prev === id ? null : id));
  };

  return (
    <section className={styles.faqSection} id="faq-section">
      <Container>
        {/* Header */}
        <div className={styles.header}>
          <div className={styles.badge}>
            <HelpCircle size={15} color="#2563eb" />
            <span>Got Questions? We Have Answers</span>
          </div>
          <h2 className={styles.title}>Frequently Asked Questions</h2>
          <p className={styles.subtitle}>
            Everything you need to know about cashless insurance claims, surgical procedures, and hospital admissions.
          </p>
        </div>

        {/* Search & Category Filter */}
        <div className={styles.controlsWrap}>
          <div className={styles.searchBox}>
            <Search size={18} className={styles.searchIcon} />
            <input
              type="text"
              placeholder="Search insurance, surgeries, cashless pre-approval..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className={styles.searchInput}
            />
          </div>

          <div className={styles.categoryPills}>
            {FAQ_CATEGORIES.map((cat) => (
              <button
                key={cat}
                type="button"
                className={`${styles.catBtn} ${activeCategory === cat ? styles.catBtnActive : ''}`}
                onClick={() => setActiveCategory(cat)}
              >
                {cat}
              </button>
            ))}
          </div>
        </div>

        {/* FAQ List */}
        <div className={styles.faqList}>
          {filteredFaqs.length > 0 ? (
            filteredFaqs.map((faq) => {
              const isOpen = expandedId === (faq.id || faq._id);
              return (
                <div
                  key={faq.id || faq._id}
                  className={`${styles.faqCard} ${isOpen ? styles.faqCardOpen : ''}`}
                >
                  <button
                    type="button"
                    className={styles.questionBtn}
                    onClick={() => toggleAccordion(faq.id || faq._id)}
                    aria-expanded={isOpen}
                  >
                    <span className={styles.questionText}>{faq.question}</span>
                    <span className={styles.chevronWrap}>
                      {isOpen ? <ChevronUp size={20} /> : <ChevronDown size={20} />}
                    </span>
                  </button>

                  {isOpen && (
                    <div className={styles.answerBox}>
                      <p>{faq.answer}</p>
                      <div className={styles.faqMeta}>
                        <span className={styles.metaCategory}>Category: {faq.category}</span>
                      </div>
                    </div>
                  )}
                </div>
              );
            })
          ) : (
            <div className={styles.emptyState}>
              <p>No questions found matching your search. Try another keyword or category!</p>
            </div>
          )}
        </div>

        {/* Helpline Card */}
        <div className={styles.supportCard}>
          <div className={styles.supportInfo}>
            <ShieldCheck size={32} color="#059669" />
            <div>
              <h3>Have a specific insurance or surgery question?</h3>
              <p>Our 24x7 Cashless Desk & Medical Advisory Team is here to guide you.</p>
            </div>
          </div>
          <div className={styles.supportActions}>
            <a href="tel:1800-SEHAT-CARE" className={styles.callBtn}>
              <PhoneCall size={16} />
              <span>1800-SEHAT-CARE</span>
            </a>
            <a href="mailto:support@thesehatbuddy.com" className={styles.emailBtn}>
              <Mail size={16} />
              <span>Email Support</span>
            </a>
          </div>
        </div>
      </Container>
    </section>
  );
};

export default FaqSection;
