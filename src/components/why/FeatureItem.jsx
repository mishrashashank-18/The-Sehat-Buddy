import React from 'react';
import {
  ShieldCheck,
  CalendarCheck,
  MessageSquareText,
  Award,
  HeartPulse,
  Clock,
  Sparkles,
  CheckCircle,
  ThumbsUp,
  Activity
} from 'lucide-react';
import styles from './FeatureItem.module.css';

const ICON_MAP = {
  ShieldCheck,
  CalendarCheck,
  MessageSquareText,
  Award,
  HeartPulse,
  Clock,
  Sparkles,
  CheckCircle,
  ThumbsUp,
  Activity
};

const isValidComponent = (comp) => {
  return typeof comp === 'function' || (typeof comp === 'object' && comp !== null && Boolean(comp.$$typeof));
};

const FeatureItem = ({ feature }) => {
  let Icon = null;

  if (feature && isValidComponent(feature.icon)) {
    Icon = feature.icon;
  } else if (feature?.iconName && ICON_MAP[feature.iconName]) {
    Icon = ICON_MAP[feature.iconName];
  } else {
    Icon = ShieldCheck;
  }

  return (
    <div className={styles.item}>
      <div className={styles.iconWrapper}>
        <Icon size={24} className={styles.icon} />
      </div>
      <h4 className={styles.title}>{feature?.title || 'Healthcare Excellence'}</h4>
      <p className={styles.description}>{feature?.description || 'Trusted medical services'}</p>
    </div>
  );
};

export default FeatureItem;
