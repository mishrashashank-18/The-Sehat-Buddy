import React, { useState, useEffect } from 'react';
import Container from '../layout/Container';
import FeatureItem from './FeatureItem';
import { useData } from '../../context/useData';
import { Play, X, Volume2, Maximize2, Video as VideoIcon, Sparkles } from 'lucide-react';
import styles from './WhyChooseSection.module.css';

const extractVideoId = (url) => {
  if (!url) return '';
  try {
    if (url.includes('youtu.be/')) {
      return url.split('youtu.be/')[1]?.split(/[?#&]/)[0];
    } else if (url.includes('youtube.com/watch')) {
      const u = new URL(url.startsWith('http') ? url : `https://${url}`);
      return u.searchParams.get('v');
    } else if (url.includes('youtube.com/embed/')) {
      return url.split('youtube.com/embed/')[1]?.split(/[?#&]/)[0];
    } else if (url.includes('youtube.com/shorts/')) {
      return url.split('youtube.com/shorts/')[1]?.split(/[?#&]/)[0];
    }
  } catch (e) {
    console.error('Error parsing video URL', e);
  }
  return '';
};

const getInlineEmbedUrl = (url) => {
  const videoId = extractVideoId(url);
  if (videoId) {
    return `https://www.youtube.com/embed/${videoId}?autoplay=1&mute=1&loop=1&playlist=${videoId}&controls=1&rel=0&playsinline=1&modestbranding=1`;
  }
  return url;
};

const getModalEmbedUrl = (url) => {
  const videoId = extractVideoId(url);
  if (videoId) {
    return `https://www.youtube.com/embed/${videoId}?autoplay=1&mute=0&controls=1&rel=0&playsinline=1`;
  }
  return url;
};

const WhyChooseSection = () => {
  const { features, heroContent } = useData();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [canLoadIframe, setCanLoadIframe] = useState(false);

  useEffect(() => {
    // Defer mounting continuous media iframe until after parent page finishes loading
    const timer = setTimeout(() => {
      setCanLoadIframe(true);
    }, 350);
    return () => clearTimeout(timer);
  }, []);

  const rawVideoUrl = (heroContent?.whyChooseVideoUrl || '').trim();
  const videoUrl = rawVideoUrl === 'https://www.youtube.com/watch?v=zCCD52Pty4A' ? '' : rawVideoUrl;
  const isYouTube = Boolean(videoUrl && (videoUrl.includes('youtube.com') || videoUrl.includes('youtu.be')));

  const inlineEmbedUrl = isYouTube ? getInlineEmbedUrl(videoUrl) : videoUrl;
  const modalEmbedUrl = isYouTube ? getModalEmbedUrl(videoUrl) : videoUrl;

  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'Escape') setIsModalOpen(false);
    };
    if (isModalOpen) {
      document.body.style.overflow = 'hidden';
      window.addEventListener('keydown', handleKeyDown);
    } else {
      document.body.style.overflow = '';
    }
    return () => {
      document.body.style.overflow = '';
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [isModalOpen]);

  const handleOpenModal = (e) => {
    e.preventDefault();
    e.stopPropagation();
    if (videoUrl) {
      setIsModalOpen(true);
    }
  };

  return (
    <section className={styles.section}>
      <Container>
        <div className={styles.wrapper}>
          {/* Left Column: Autoplaying Video directly on Main Page or Presentation Card */}
          <div className={styles.leftContent}>
            {videoUrl ? (
              <div className={styles.inlineVideoContainer}>
                {isYouTube ? (
                  canLoadIframe ? (
                    <iframe
                      src={inlineEmbedUrl}
                      title="Sehat Buddy Explainer Video"
                      frameBorder="0"
                      allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                      allowFullScreen
                      loading="lazy"
                      className={styles.inlineIframe}
                    />
                  ) : (
                    <div
                      style={{
                        width: '100%',
                        height: '100%',
                        background: '#0f172a',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center'
                      }}
                    >
                      <Play size={40} color="#38bdf8" style={{ opacity: 0.85 }} />
                    </div>
                  )
                ) : (
                  <video
                    src={videoUrl}
                    autoPlay
                    muted
                    loop
                    playsInline
                    controls
                    preload="metadata"
                    className={styles.inlineVideoTag}
                  />
                )}

                {/* Action Badge to open with sound in full modal */}
                <button
                  className={styles.soundExpandBadge}
                  onClick={handleOpenModal}
                  title="Watch full screen with sound"
                >
                  <Volume2 size={14} />
                  <span>Play with Sound</span>
                  <Maximize2 size={12} style={{ marginLeft: 2 }} />
                </button>
              </div>
            ) : (
              <div className={styles.noVideoContainer}>
                <div className={styles.noVideoIconRing}>
                  <VideoIcon size={34} color="#38bdf8" />
                </div>
                <h3 className={styles.noVideoTitle}>
                  {heroContent?.whyChooseVideoText ? heroContent.whyChooseVideoText.replace(/\n/g, ' ') : 'Watch How The Sehat Buddy Works'}
                </h3>
                <p className={styles.noVideoSubtitle}>
                  Verified Specialists & Accredited Hospitals
                </p>
                <div className={styles.noVideoBadge}>
                  <Sparkles size={13} color="#38bdf8" />
                  <span>Explainer Video Uploadable in Admin Panel</span>
                </div>
              </div>
            )}
          </div>
          
          {/* Right Column: Features */}
          <div className={styles.rightContent}>
            <h2 className={styles.title}>{heroContent?.whyChooseTitle || 'Why Choose The Sehat Buddy?'}</h2>
            <div className={styles.featuresGrid}>
              {features?.map((feature, index) => (
                <React.Fragment key={feature.id}>
                  <FeatureItem feature={feature} />
                  {index < features.length - 1 && <div className={styles.divider}></div>}
                </React.Fragment>
              ))}
            </div>
          </div>
        </div>
      </Container>

      {/* Expanded Modal with Sound */}
      {isModalOpen && (
        <div className={styles.modalOverlay} onClick={() => setIsModalOpen(false)}>
          <div className={styles.modalContent} onClick={(e) => e.stopPropagation()}>
            <button
              className={styles.closeBtn}
              onClick={() => setIsModalOpen(false)}
              aria-label="Close video"
            >
              <X size={20} />
            </button>
            <div className={styles.videoResponsiveWrap}>
              {isYouTube ? (
                <iframe
                  src={modalEmbedUrl}
                  title="Sehat Buddy Explainer Video Full"
                  frameBorder="0"
                  allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
                  allowFullScreen
                  className={styles.videoIframe}
                />
              ) : (
                <video
                  src={videoUrl}
                  autoPlay
                  controls
                  playsInline
                  className={styles.videoPlayer}
                />
              )}
            </div>
          </div>
        </div>
      )}
    </section>
  );
};

export default WhyChooseSection;
