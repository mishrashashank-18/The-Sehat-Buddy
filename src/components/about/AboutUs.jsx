import React, { useEffect } from 'react';
import {
  ShieldCheck,
  Heart,
  Eye,
  CheckCircle2,
  Sparkles,
  Target,
  Compass,
  Stethoscope,
  Building2,
  FlaskConical,
  Activity,
  Users,
  Cpu,
  Globe,
  Share2,
  PhoneCall,
  ArrowRight,
  BookOpen,
  Calendar,
  Award
} from 'lucide-react';
import Container from '../layout/Container';
import styles from './AboutUs.module.css';

export default function AboutUs({ onNavigate }) {
  useEffect(() => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
    document.title = 'About Us | The Sehat Buddy - Healthcare That Feels Simple, Trusted & Close to You';
  }, []);

  const handleNav = (target, param) => {
    if (onNavigate) {
      onNavigate(target, param);
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  };

  return (
    <div className={styles.aboutPage}>
      {/* Hero Section */}
      <section className={styles.heroSection}>
        <Container>
          <div className={styles.heroContent}>
            <div className={styles.heroBadge}>
              <Sparkles size={14} className={styles.badgeIcon} />
              <span>ABOUT THE SEHAT BUDDY</span>
            </div>
            <h1 className={styles.heroTitle}>
              Healthcare that feels <span className={styles.gradientText}>simple, trusted</span> and close to you
            </h1>
            <p className={styles.heroSubtitle}>
              The Sehat Buddy is a patient-first healthcare network helping families find the right doctor,
              hospital, and clinical care with confidence. <strong>&lsquo;Sehat&rsquo;</strong> means health, and a buddy is someone who stays by your side — that&rsquo;s exactly what we aim to be.
            </p>
            <div className={styles.heroActions}>
              <button
                className={styles.primaryCta}
                onClick={() => handleNav('find-doctors')}
              >
                <Stethoscope size={18} />
                <span>Find Verified Doctors</span>
              </button>
              <button
                className={styles.secondaryCta}
                onClick={() => handleNav('find-hospitals')}
              >
                <Building2 size={18} />
                <span>Explore Hospitals</span>
              </button>
            </div>
          </div>
        </Container>
      </section>

      {/* Impact Numbers / Stats Strip */}
      <section className={styles.statsStrip}>
        <Container>
          <div className={styles.statsGrid}>
            <div className={styles.statCard}>
              <div className={styles.statNumber}>50+</div>
              <div className={styles.statLabel}>Accredited Hospitals</div>
              <div className={styles.statSub}>Bengaluru & Growing</div>
            </div>
            <div className={styles.statCard}>
              <div className={styles.statNumber}>150+</div>
              <div className={styles.statLabel}>Verified Doctors</div>
              <div className={styles.statSub}>Across 25+ Specialties</div>
            </div>
            <div className={styles.statCard}>
              <div className={styles.statNumber}>24/7</div>
              <div className={styles.statLabel}>Care Concierge Desk</div>
              <div className={styles.statSub}>Real Human Support</div>
            </div>
            <div className={styles.statCard}>
              <div className={styles.statNumber}>100%</div>
              <div className={styles.statLabel}>Cashless & Transparent</div>
              <div className={styles.statSub}>Zero Hidden Charges</div>
            </div>
          </div>
        </Container>
      </section>

      {/* Story & Philosophy Section */}
      <section className={styles.storySection}>
        <Container>
          <div className={styles.storyGrid}>
            <div className={styles.storyTextCol}>
              <span className={styles.sectionPill}>OUR ORIGIN STORY</span>
              <h2 className={styles.sectionTitle}>
                Why We Started <span className={styles.textHighlight}>The Sehat Buddy</span>
              </h2>
              <p className={styles.bodyParagraph}>
                Finding good healthcare shouldn&rsquo;t mean endless phone calls, scattered information, and anxiety-inducing guesswork. Too often, families don&rsquo;t know which doctor to trust, what a procedure might cost, or where to turn when time truly matters.
              </p>
              <p className={styles.bodyParagraph}>
                <strong>The Sehat Buddy</strong> was built from the ground up to change that. We bring verified doctors, multispeciality hospitals, and surgical care insights together in one clear, easy-to-use platform — so you can make confident, informed decisions for yourself and the people you love.
              </p>
              <p className={styles.bodyParagraph}>
                We are growing step-by-step, expanding from doctor consultations and hospital bookings to diagnostic lab tests, cashless insurance assistance, senior care, women&rsquo;s wellness, and pediatric care.
              </p>
            </div>

            <div className={styles.storyVisualCol}>
              <div className={styles.storyQuoteCard}>
                <div className={styles.quoteIconWrap}>
                  <Heart size={28} color="#2563eb" />
                </div>
                <blockquote className={styles.quoteText}>
                  &ldquo;A healthier life begins with genuine access. When medical information is transparent and finding care feels reassuring, entire families live with greater peace of mind.&rdquo;
                </blockquote>
                <div className={styles.quoteAuthor}>
                  <strong>The Sehat Buddy Founding Commitment</strong>
                  <span>Your Everyday Healthcare Companion</span>
                </div>
              </div>
            </div>
          </div>
        </Container>
      </section>

      {/* Mission & Vision Section */}
      <section className={styles.missionVisionSection}>
        <Container>
          <div className={styles.missionVisionGrid}>
            <div className={`${styles.mvCard} ${styles.missionCard}`}>
              <div className={styles.mvIconHeader}>
                <div className={styles.mvIconWrap}>
                  <Target size={26} />
                </div>
                <span className={styles.mvBadge}>OUR MISSION</span>
              </div>
              <h3 className={styles.mvTitle}>Accessible, Clear &amp; Understandable Care</h3>
              <p className={styles.mvDesc}>
                To make quality healthcare easy to find, easy to understand, and easy to access for every family.
              </p>
              <div className={styles.mvFeatureList}>
                <div className={styles.mvFeatureItem}>
                  <CheckCircle2 size={16} />
                  <span>Transparent consultation fees and verified credentials</span>
                </div>
                <div className={styles.mvFeatureItem}>
                  <CheckCircle2 size={16} />
                  <span>Real-time slot availability without waiting rooms</span>
                </div>
                <div className={styles.mvFeatureItem}>
                  <CheckCircle2 size={16} />
                  <span>Direct helpline support from genuine care coordinators</span>
                </div>
              </div>
            </div>

            <div className={`${styles.mvCard} ${styles.visionCard}`}>
              <div className={styles.mvIconHeader}>
                <div className={styles.mvIconWrap}>
                  <Compass size={26} />
                </div>
                <span className={styles.mvBadge}>OUR VISION</span>
              </div>
              <h3 className={styles.mvTitle}>A Future Without Healthcare Delays</h3>
              <p className={styles.mvDesc}>
                A future where no one delays or avoids essential care simply because they don&rsquo;t know where to start or who to trust.
              </p>
              <div className={styles.mvFeatureList}>
                <div className={styles.mvFeatureItem}>
                  <CheckCircle2 size={16} />
                  <span>Bridging patients with trusted clinical specialists instantly</span>
                </div>
                <div className={styles.mvFeatureItem}>
                  <CheckCircle2 size={16} />
                  <span>Affordable treatment paths with full cost predictability</span>
                </div>
                <div className={styles.mvFeatureItem}>
                  <CheckCircle2 size={16} />
                  <span>Unified digital health journey from clinic to recovery</span>
                </div>
              </div>
            </div>
          </div>
        </Container>
      </section>

      {/* What We Stand For (Core Values - Practo Style 4 Pillars) */}
      <section className={styles.valuesSection}>
        <Container>
          <div className={styles.sectionHeaderCenter}>
            <span className={styles.sectionPill}>CORE VALUES</span>
            <h2 className={styles.sectionTitle}>What We Stand For</h2>
            <p className={styles.sectionSubtitle}>
              Every service we design and every provider we partner with adheres to four unwavering commitments.
            </p>
          </div>

          <div className={styles.valuesGrid}>
            <div className={styles.valueCard}>
              <div className={`${styles.valueIcon} ${styles.valTrust}`}>
                <ShieldCheck size={28} />
              </div>
              <h3 className={styles.valueHeading}>Trust</h3>
              <p className={styles.valueText}>
                We work to list only doctors and hospitals we can stand behind, and we are completely upfront about what we do.
              </p>
              <span className={styles.valueTag}>Strict Clinical Vetting</span>
            </div>

            <div className={styles.valueCard}>
              <div className={`${styles.valueIcon} ${styles.valTransparency}`}>
                <Eye size={28} />
              </div>
              <h3 className={styles.valueHeading}>Transparency</h3>
              <p className={styles.valueText}>
                Clear details on specialities, experience, qualifications, and typical price ranges, so there are never surprises.
              </p>
              <span className={styles.valueTag}>Zero Hidden Charges</span>
            </div>

            <div className={styles.valueCard}>
              <div className={`${styles.valueIcon} ${styles.valCare}`}>
                <Heart size={28} />
              </div>
              <h3 className={styles.valueHeading}>Care</h3>
              <p className={styles.valueText}>
                Every request is handled by a real person who deeply understands that healthcare is personal, sensitive, and urgent.
              </p>
              <span className={styles.valueTag}>Human Care Desk</span>
            </div>

            <div className={styles.valueCard}>
              <div className={`${styles.valueIcon} ${styles.valSimplicity}`}>
                <CheckCircle2 size={28} />
              </div>
              <h3 className={styles.valueHeading}>Simplicity</h3>
              <p className={styles.valueText}>
                Healthcare is confusing enough. We keep discovering, comparing, and booking care straightforward and stress-free.
              </p>
              <span className={styles.valueTag}>Intuitive Booking</span>
            </div>
          </div>
        </Container>
      </section>

      {/* What We Aim to Bring Together (Our Healthcare Ecosystem) */}
      <section className={styles.ecosystemSection}>
        <Container>
          <div className={styles.sectionHeaderCenter}>
            <span className={styles.sectionPill}>THE SEHAT BUDDY NETWORK</span>
            <h2 className={styles.sectionTitle}>What We Aim to Bring Together</h2>
            <p className={styles.sectionSubtitle}>
              The Sehat Buddy aims to make every critical aspect of healthcare seamlessly accessible through one convenient platform.
            </p>
          </div>

          <div className={styles.ecosystemGrid}>
            <div className={styles.ecoCard}>
              <div className={styles.ecoIconWrap}>
                <Activity size={24} />
              </div>
              <h4>Healthcare Discovery</h4>
              <p>Helping families explore relevant medical services, doctor specialties, and neighborhood clinical resources.</p>
            </div>

            <div className={styles.ecoCard}>
              <div className={styles.ecoIconWrap}>
                <Stethoscope size={24} />
              </div>
              <h4>Doctor &amp; Specialist Access</h4>
              <p>Making it effortless to find experienced physicians and consult via in-clinic visits or video consultations.</p>
            </div>

            <div className={styles.ecoCard}>
              <div className={styles.ecoIconWrap}>
                <FlaskConical size={24} />
              </div>
              <h4>Diagnostic Services</h4>
              <p>Connecting users with certified diagnostic labs, home blood sample collection, and rapid health packages.</p>
            </div>

            <div className={styles.ecoCard}>
              <div className={styles.ecoIconWrap}>
                <Building2 size={24} />
              </div>
              <h4>Healthcare Solutions</h4>
              <p>Bringing together essential hospital admissions, surgical estimates, ICU beds, and emergency triage in one place.</p>
            </div>

            <div className={styles.ecoCard}>
              <div className={styles.ecoIconWrap}>
                <BookOpen size={24} />
              </div>
              <h4>Health Awareness</h4>
              <p>Empowering people with verified clinical health content, preventive wellness guides, and expert doctor tips.</p>
            </div>

            <div className={styles.ecoCard}>
              <div className={styles.ecoIconWrap}>
                <Share2 size={24} />
              </div>
              <h4>Connected Experience</h4>
              <p>Simplifying the journey between people and healthcare service providers with live updates and reminders.</p>
            </div>
          </div>
        </Container>
      </section>

      {/* What Makes Us Different? */}
      <section className={styles.differentiatorSection}>
        <Container>
          <div className={styles.sectionHeaderCenter}>
            <span className={styles.sectionPill}>OUR ADVANTAGE</span>
            <h2 className={styles.sectionTitle}>What Makes Us Different?</h2>
            <p className={styles.sectionSubtitle}>
              Designed with patient comfort and clinical integrity at every touchpoint.
            </p>
          </div>

          <div className={styles.diffGrid}>
            <div className={styles.diffCard}>
              <div className={styles.diffNumber}>01</div>
              <div className={styles.diffContent}>
                <h3>One Platform, Multiple Healthcare Needs</h3>
                <p>We bring diverse healthcare services together so people don&rsquo;t have to depend on multiple disconnected apps for every medical requirement.</p>
              </div>
            </div>

            <div className={styles.diffCard}>
              <div className={styles.diffNumber}>02</div>
              <div className={styles.diffContent}>
                <h3>People First, Always</h3>
                <p>We believe every individual deserves a compassionate, convenient, and approachable healthcare experience from start to finish.</p>
              </div>
            </div>

            <div className={styles.diffCard}>
              <div className={styles.diffNumber}>03</div>
              <div className={styles.diffContent}>
                <h3>Technology with a Purpose</h3>
                <p>We use modern technology as an empowering bridge to make healthcare discovery, slot booking, and navigation faster and more transparent.</p>
              </div>
            </div>

            <div className={styles.diffCard}>
              <div className={styles.diffNumber}>04</div>
              <div className={styles.diffContent}>
                <h3>Trust and Transparency</h3>
                <p>We believe healthcare decisions should always be backed by clear information, verified practitioner registrations, and upfront fees.</p>
              </div>
            </div>

            <div className={styles.diffCard}>
              <div className={styles.diffNumber}>05</div>
              <div className={styles.diffContent}>
                <h3>Healthcare for Everyone</h3>
                <p>Our goal is to make quality healthcare inclusive, dignifying, and accessible for individuals and families across all walks of life.</p>
              </div>
            </div>
          </div>
        </Container>
      </section>

      {/* Our Promise & Closing Manifesto Card */}
      <section className={styles.promiseSection}>
        <Container>
          <div className={styles.promiseCard}>
            <div className={styles.promiseBadge}>
              <Award size={18} />
              <span>OUR PROMISE TO YOU</span>
            </div>
            <h2 className={styles.promiseHeading}>
              &ldquo;At The Sehat Buddy, we don&rsquo;t just want to be another healthcare platform. We aspire to be your everyday healthcare companion.&rdquo;
            </h2>
            <p className={styles.promiseText}>
              A place where finding healthcare-related services feels easier, information feels clearer, and taking care of yourself and your loved ones becomes a little simpler.
            </p>
            <div className={styles.promiseTagline}>
              Because we believe that a healthier life begins with better access to healthcare.
            </div>
            <div className={styles.promiseBrandName}>
              The Sehat Buddy &mdash; Your One-Stop Healthcare Companion
            </div>

            <div className={styles.promiseCtas}>
              <button
                className={styles.promisePrimaryBtn}
                onClick={() => handleNav('find-doctors')}
              >
                <span>Find Doctors</span>
                <ArrowRight size={18} />
              </button>
              <button
                className={styles.promiseSecondaryBtn}
                onClick={() => handleNav('find-hospitals')}
              >
                <span>View Hospitals</span>
              </button>
              <button
                className={styles.promiseContactBtn}
                onClick={() => handleNav('contact')}
              >
                <PhoneCall size={16} />
                <span>Contact Care Desk</span>
              </button>
            </div>
          </div>
        </Container>
      </section>
    </div>
  );
}
