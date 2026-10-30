import React, { useState } from 'react';

const ExpandableReviewComment = ({
  comment,
  maxLength = 220,
  style = {},
  className = '',
  quotes = false
}) => {
  const [isExpanded, setIsExpanded] = useState(false);

  if (!comment || typeof comment !== 'string') return null;

  const trimmed = comment.trim();
  const isLong = trimmed.length > maxLength;

  if (!isLong) {
    return (
      <p className={className} style={{ margin: 0, fontSize: '0.88rem', color: '#475569', lineHeight: 1.55, ...style }}>
        {quotes ? `"${trimmed}"` : trimmed}
      </p>
    );
  }

  let displayText = trimmed;
  if (!isExpanded) {
    const cutIndex = trimmed.lastIndexOf(' ', maxLength);
    const sliceEnd = cutIndex > maxLength * 0.7 ? cutIndex : maxLength;
    displayText = trimmed.slice(0, sliceEnd).trim() + '...';
  }

  return (
    <p className={className} style={{ margin: 0, fontSize: '0.88rem', color: '#475569', lineHeight: 1.55, ...style }}>
      {quotes ? `"${displayText}"` : displayText}{' '}
      <button
        type="button"
        onClick={(e) => {
          e.stopPropagation();
          setIsExpanded(prev => !prev);
        }}
        style={{
          background: 'none',
          border: 'none',
          padding: '0 2px',
          color: '#2563eb',
          fontWeight: 700,
          fontSize: '0.84rem',
          cursor: 'pointer',
          display: 'inline-flex',
          alignItems: 'center',
          gap: '2px',
          textDecoration: 'none',
          verticalAlign: 'baseline',
          outline: 'none'
        }}
        onMouseEnter={(e) => (e.currentTarget.style.textDecoration = 'underline')}
        onMouseLeave={(e) => (e.currentTarget.style.textDecoration = 'none')}
      >
        {isExpanded ? 'Read less' : 'Read more'}
      </button>
    </p>
  );
};

export default ExpandableReviewComment;
