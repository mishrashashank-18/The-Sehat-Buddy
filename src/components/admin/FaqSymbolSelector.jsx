import React, { useState, useRef, useMemo } from 'react';
import { Upload, Loader2, Check, Sparkles, Image as ImageIcon, Trash2, Plus, Info } from 'lucide-react';
import { useData } from '../../context/useData';
import { api } from '../../services/api';

/**
 * FaqSymbolSelector
 * Allows selecting default symbols/images from MongoDB database,
 * or uploading an image directly from local storage to Cloudinary in realtime.
 * 
 * Props:
 * - selectedValue: current icon or image url / key
 * - onSelect: callback({ icon, image })
 * - isCompact: boolean (optional, for smaller modal areas)
 */
export const FaqSymbolSelector = ({ selectedValue = '', onSelect, isCompact = false }) => {
  const { faqSymbols = [], addFaqSymbol, deleteFaqSymbol } = useData();
  const fileInputRef = useRef(null);
  const [isUploading, setIsUploading] = useState(false);
  const [saveToLibrary, setSaveToLibrary] = useState(false);
  const [newSymbolName, setNewSymbolName] = useState('');
  const [showSaveModal, setShowSaveModal] = useState(false);
  const [recentlyUploadedUrl, setRecentlyUploadedUrl] = useState('');
  const [activeTab, setActiveTab] = useState('library'); // 'library' | 'upload'

  // Match the currently selected item to either a library symbol or custom URL
  const selectedSymbol = useMemo(() => {
    if (!selectedValue) return null;
    return faqSymbols.find(s => s.key === selectedValue || s.imageUrl === selectedValue) || null;
  }, [selectedValue, faqSymbols]);

  const isCustomImage = useMemo(() => {
    if (!selectedValue) return false;
    return selectedValue.startsWith('http') || selectedValue.startsWith('data:image') || selectedValue.startsWith('/');
  }, [selectedValue]);

  // Handle direct file upload to Cloudinary from local storage
  const handleLocalImageUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('image/') && !file.name.endsWith('.svg')) {
      alert('Please upload an image file (PNG, JPG, SVG, WebP, etc.).');
      return;
    }

    setIsUploading(true);
    try {
      // 1. Direct Cloudinary upload
      const uploadedUrl = await api.uploadImage(file, 'sehatbuddy/faqs');
      if (!uploadedUrl) {
        throw new Error('Cloudinary returned empty URL');
      }

      setRecentlyUploadedUrl(uploadedUrl);
      if (onSelect) {
        onSelect({ icon: uploadedUrl, image: uploadedUrl });
      }

      // If user enabled save to library or asks to save
      setNewSymbolName(file.name.replace(/\.[^/.]+$/, '').replace(/[-_]/g, ' '));
      setShowSaveModal(true);
    } catch (err) {
      console.error('Failed to upload FAQ image to Cloudinary:', err);
      // Fallback to local Data URI if upload fails
      try {
        const reader = new FileReader();
        reader.onload = (loadEvt) => {
          const dataUri = loadEvt.target.result;
          setRecentlyUploadedUrl(dataUri);
          if (onSelect) {
            onSelect({ icon: dataUri, image: dataUri });
          }
        };
        reader.readAsDataURL(file);
      } catch (fErr) {
        alert('Upload failed. Please check your internet connection or try a smaller image.');
      }
    } finally {
      setIsUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  const handleSaveToDatabase = async () => {
    if (!recentlyUploadedUrl) return;
    const name = newSymbolName.trim() || 'Custom FAQ Symbol';
    const key = name.toLowerCase().replace(/[^a-z0-9]/g, '-').slice(0, 30) + '-' + Date.now().toString(36).slice(-4);
    try {
      await addFaqSymbol({
        key,
        name,
        category: 'Custom',
        imageUrl: recentlyUploadedUrl,
        isDefault: false
      });
      setShowSaveModal(false);
      setNewSymbolName('');
      if (onSelect) {
        onSelect({ icon: key, image: recentlyUploadedUrl });
      }
    } catch (err) {
      alert('Failed to save symbol to database library: ' + (err.message || 'Error'));
    }
  };

  const handleSelectSymbol = (symbol) => {
    if (onSelect) {
      onSelect({
        icon: symbol.key,
        image: symbol.imageUrl || symbol.svg || ''
      });
    }
  };

  const handleDeleteCustomSymbol = async (e, symbolId) => {
    e.stopPropagation();
    if (window.confirm('Are you sure you want to remove this symbol from the database library?')) {
      try {
        await deleteFaqSymbol(symbolId);
      } catch (err) {
        console.error('Failed to delete symbol:', err);
      }
    }
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', width: '100%' }}>
      {/* Header with Switcher Tabs */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '8px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
          <ImageIcon size={15} color="#2563eb" />
          <span style={{ fontSize: '0.82rem', fontWeight: 700, color: '#1e293b' }}>
            FAQ Symbol / Image *
          </span>
          <span style={{ fontSize: '0.72rem', background: '#dbeafe', color: '#1e40af', padding: '2px 6px', borderRadius: '4px', fontWeight: 600 }}>
            Realtime DB
          </span>
        </div>

        <div style={{ display: 'flex', background: '#f1f5f9', borderRadius: '8px', padding: '2px' }}>
          <button
            type="button"
            onClick={() => setActiveTab('library')}
            style={{
              border: 'none',
              background: activeTab === 'library' ? '#ffffff' : 'transparent',
              color: activeTab === 'library' ? '#2563eb' : '#64748b',
              fontWeight: 700,
              fontSize: '0.75rem',
              padding: '4px 10px',
              borderRadius: '6px',
              cursor: 'pointer',
              boxShadow: activeTab === 'library' ? '0 1px 2px rgba(0,0,0,0.06)' : 'none',
              transition: 'all 0.15s ease'
            }}
          >
            Default Symbols ({faqSymbols.length})
          </button>
          <button
            type="button"
            onClick={() => {
              setActiveTab('upload');
              fileInputRef.current?.click();
            }}
            style={{
              border: 'none',
              background: activeTab === 'upload' ? '#ffffff' : 'transparent',
              color: activeTab === 'upload' ? '#2563eb' : '#64748b',
              fontWeight: 700,
              fontSize: '0.75rem',
              padding: '4px 10px',
              borderRadius: '6px',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '4px',
              boxShadow: activeTab === 'upload' ? '0 1px 2px rgba(0,0,0,0.06)' : 'none',
              transition: 'all 0.15s ease'
            }}
          >
            <Upload size={12} />
            <span>Upload from Local</span>
          </button>
        </div>
      </div>

      {/* Current Selection Banner */}
      {selectedValue && (
        <div style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          padding: '8px 12px',
          background: '#f0f9ff',
          border: '1.5px solid #bae6fd',
          borderRadius: '10px'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <div style={{
              width: '36px',
              height: '36px',
              borderRadius: '8px',
              background: '#ffffff',
              border: '1px solid #93c5fd',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              overflow: 'hidden',
              flexShrink: 0
            }}>
              {isCustomImage ? (
                <img src={selectedValue} alt="Selected" style={{ width: '28px', height: '28px', objectFit: 'contain' }} />
              ) : selectedSymbol?.imageUrl ? (
                <img src={selectedSymbol.imageUrl} alt={selectedSymbol.name} style={{ width: '28px', height: '28px', objectFit: 'contain' }} />
              ) : (
                <span style={{ fontSize: '0.75rem', fontWeight: 700, color: '#0284c7' }}>
                  {selectedSymbol?.key?.slice(0, 3).toUpperCase() || 'FAQ'}
                </span>
              )}
            </div>
            <div>
              <div style={{ fontSize: '0.8rem', fontWeight: 700, color: '#0369a1' }}>
                {selectedSymbol ? selectedSymbol.name : 'Custom Uploaded Image'}
              </div>
              <div style={{ fontSize: '0.7rem', color: '#0284c7' }}>
                {isCustomImage ? 'Cloudinary / Custom Image' : `Key: ${selectedSymbol?.key || selectedValue}`}
              </div>
            </div>
          </div>

          <button
            type="button"
            onClick={() => onSelect && onSelect({ icon: '', image: '' })}
            style={{
              background: 'none',
              border: 'none',
              color: '#ef4444',
              fontSize: '0.75rem',
              fontWeight: 600,
              cursor: 'pointer',
              padding: '4px 6px'
            }}
          >
            Clear
          </button>
        </div>
      )}

      {/* Grid of Default Symbols from Database */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: isCompact ? 'repeat(auto-fill, minmax(82px, 1fr))' : 'repeat(auto-fill, minmax(102px, 1fr))',
        gap: '10px',
        maxHeight: '235px',
        overflowY: 'auto',
        padding: '4px',
        borderRadius: '12px'
      }}>
        {faqSymbols.map(symbol => {
          const isSelected = selectedValue === symbol.key || selectedValue === symbol.imageUrl;
          const imgSrc = symbol.imageUrl || symbol.svg;
          return (
            <div
              key={symbol._id || symbol.id || symbol.key}
              onClick={() => handleSelectSymbol(symbol)}
              style={{
                position: 'relative',
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                justifyContent: 'space-between',
                height: '86px',
                minHeight: '86px',
                padding: '8px 6px 6px 6px',
                borderRadius: '12px',
                border: isSelected ? '2px solid #2563eb' : '1.5px solid #e2e8f0',
                background: isSelected ? '#eff6ff' : '#ffffff',
                cursor: 'pointer',
                transition: 'all 0.15s ease',
                boxShadow: isSelected ? '0 0 0 1px #2563eb, 0 2px 6px rgba(37,99,235,0.15)' : 'none',
                boxSizing: 'border-box'
              }}
              title={symbol.name}
            >
              {isSelected && (
                <div style={{
                  position: 'absolute',
                  top: '4px',
                  right: '4px',
                  width: '16px',
                  height: '16px',
                  borderRadius: '50%',
                  background: '#2563eb',
                  color: '#ffffff',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  boxShadow: '0 1px 3px rgba(37,99,235,0.35)',
                  zIndex: 2
                }}>
                  <Check size={10} strokeWidth={3} />
                </div>
              )}

              {/* Symbol preview */}
              <div style={{
                width: '36px',
                height: '36px',
                borderRadius: '8px',
                background: isSelected ? '#ffffff' : '#f8fafc',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                border: isSelected ? '1px solid #bfdbfe' : '1px solid #f1f5f9',
                flexShrink: 0
              }}>
                {imgSrc ? (
                  <img src={imgSrc} alt={symbol.name} style={{ width: '28px', height: '28px', objectFit: 'contain' }} />
                ) : (
                  <Sparkles size={18} color="#0284c7" />
                )}
              </div>

              <span style={{
                fontSize: '0.68rem',
                fontWeight: isSelected ? 700 : 600,
                color: isSelected ? '#1d4ed8' : '#334155',
                textAlign: 'center',
                lineHeight: 1.15,
                width: '100%',
                maxHeight: '26px',
                display: '-webkit-box',
                WebkitLineClamp: 2,
                WebkitBoxOrient: 'vertical',
                overflow: 'hidden',
                wordBreak: 'break-word',
                padding: '0 2px'
              }}>
                {symbol.name}
              </span>

              {/* Delete button for custom user-added symbols */}
              {!symbol.isDefault && (
                <button
                  type="button"
                  onClick={(e) => handleDeleteCustomSymbol(e, symbol._id || symbol.id)}
                  title="Remove from database library"
                  style={{
                    position: 'absolute',
                    top: '2px',
                    left: '2px',
                    background: 'rgba(239,68,68,0.1)',
                    border: 'none',
                    borderRadius: '4px',
                    color: '#ef4444',
                    width: '16px',
                    height: '16px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    cursor: 'pointer',
                    padding: 0
                  }}
                >
                  <Trash2 size={10} />
                </button>
              )}
            </div>
          );
        })}

        {/* Upload Button Tile inside Grid */}
        <div
          onClick={() => fileInputRef.current?.click()}
          style={{
            position: 'relative',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'space-between',
            height: '86px',
            minHeight: '86px',
            padding: '8px 6px 6px 6px',
            borderRadius: '12px',
            border: '1.5px dashed #94a3b8',
            background: isUploading ? '#eff6ff' : '#f8fafc',
            cursor: 'pointer',
            transition: 'all 0.15s ease',
            boxSizing: 'border-box'
          }}
          title="Upload image directly from local storage to Cloudinary"
        >
          <div style={{
            width: '36px',
            height: '36px',
            borderRadius: '8px',
            background: '#ffffff',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: '#2563eb',
            border: '1px solid #cbd5e1',
            flexShrink: 0
          }}>
            {isUploading ? <Loader2 size={18} className="animate-spin" /> : <Upload size={18} />}
          </div>
          <span style={{
            fontSize: '0.68rem',
            fontWeight: 700,
            color: '#2563eb',
            textAlign: 'center',
            lineHeight: 1.15,
            width: '100%',
            maxHeight: '26px',
            display: '-webkit-box',
            WebkitLineClamp: 2,
            WebkitBoxOrient: 'vertical',
            overflow: 'hidden'
          }}>
            {isUploading ? 'Uploading...' : '+ Upload New'}
          </span>
        </div>
      </div>

      {/* Hidden file input */}
      <input
        type="file"
        ref={fileInputRef}
        accept="image/png,image/jpeg,image/svg+xml,image/webp"
        style={{ display: 'none' }}
        onChange={handleLocalImageUpload}
      />

      {/* Cloudinary Live Upload Note & Quick Save Prompt */}
      {showSaveModal && recentlyUploadedUrl && (
        <div style={{
          padding: '10px 12px',
          background: '#ecfdf5',
          border: '1px solid #a7f3d0',
          borderRadius: '8px',
          display: 'flex',
          flexDirection: 'column',
          gap: '8px'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <span style={{ fontSize: '0.78rem', fontWeight: 700, color: '#065f46', display: 'flex', alignItems: 'center', gap: '6px' }}>
              <Check size={14} color="#059669" /> Image uploaded directly to Cloudinary!
            </span>
            <button
              type="button"
              onClick={() => setShowSaveModal(false)}
              style={{ background: 'none', border: 'none', color: '#64748b', fontSize: '0.72rem', cursor: 'pointer' }}
            >
              Dismiss
            </button>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <input
              type="text"
              value={newSymbolName}
              onChange={(e) => setNewSymbolName(e.target.value)}
              placeholder="Symbol name in library..."
              style={{
                flex: 1,
                padding: '6px 10px',
                fontSize: '0.78rem',
                borderRadius: '6px',
                border: '1px solid #cbd5e1',
                outline: 'none'
              }}
            />
            <button
              type="button"
              onClick={handleSaveToDatabase}
              style={{
                background: '#059669',
                color: '#ffffff',
                border: 'none',
                borderRadius: '6px',
                padding: '6px 12px',
                fontSize: '0.76rem',
                fontWeight: 700,
                cursor: 'pointer',
                whiteSpace: 'nowrap'
              }}
            >
              Save as Reusable Preset
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default FaqSymbolSelector;
