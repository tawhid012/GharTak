import React, { useState } from 'react';
import { X, MapPin, CheckCircle, Navigation, ShieldCheck, Loader2 } from 'lucide-react';
import { useApp } from '../context/AppContext';
import { HAILAKANDI_LOCATIONS } from '../services/api';

export const LocationModal = () => {
  const {
    isLocationModalOpen,
    setIsLocationModalOpen,
    selectedLocation,
    setLocation,
    requestBrowserGps,
    isLocatingGps
  } = useApp();

  const [searchLoc, setSearchLoc] = useState('');

  if (!isLocationModalOpen) return null;

  const filteredLocations = HAILAKANDI_LOCATIONS.filter(l =>
    l.label.toLowerCase().includes(searchLoc.toLowerCase()) ||
    l.name.toLowerCase().includes(searchLoc.toLowerCase())
  );

  return (
    <div className="gt-modal-overlay" onClick={() => setIsLocationModalOpen(false)}>
      <div className="gt-modal-box" onClick={(e) => e.stopPropagation()} style={{ maxWidth: '440px' }}>
        {/* Modal Header */}
        <div className="gt-modal-header">
          <div>
            <h3 className="gt-modal-title">Select Delivery Location</h3>
            <p style={{ fontSize: '0.8125rem', color: 'var(--gt-text-muted)' }}>
              Hailakandi Cluster 01 • Strict 7 KM Doorstep Delivery
            </p>
          </div>
          <button
            onClick={() => setIsLocationModalOpen(false)}
            className="gt-icon-btn"
            style={{ width: '32px', height: '32px' }}
            aria-label="Close location selector"
          >
            <X size={16} />
          </button>
        </div>

        {/* Modal Body */}
        <div className="gt-modal-body">
          {/* Authoritative GPS Geolocation Request */}
          <button
            onClick={requestBrowserGps}
            disabled={isLocatingGps}
            style={{
              width: '100%',
              display: 'flex',
              alignItems: 'center',
              gap: '12px',
              padding: '14px 16px',
              backgroundColor: 'var(--gt-primary-surface)',
              border: '1.5px solid var(--gt-primary)',
              borderRadius: 'var(--gt-radius-lg)',
              marginBottom: '14px',
              textAlign: 'left',
              cursor: isLocatingGps ? 'wait' : 'pointer'
            }}
          >
            <div
              style={{
                width: '38px',
                height: '38px',
                borderRadius: 'var(--gt-radius-full)',
                backgroundColor: 'var(--gt-primary)',
                color: '#fff',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                flexShrink: 0
              }}
            >
              {isLocatingGps ? (
                <Loader2 size={18} className="gt-spin" />
              ) : (
                <Navigation size={18} />
              )}
            </div>
            <div>
              <div style={{ fontWeight: 700, fontSize: '0.9375rem', color: 'var(--gt-primary)' }}>
                {isLocatingGps ? 'Detecting Precise GPS...' : 'Use Current Device GPS'}
              </div>
              <div style={{ fontSize: '0.75rem', color: 'var(--gt-text-secondary)' }}>
                Verifies exact 7 KM serviceability from nearby stores
              </div>
            </div>
          </button>

          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              padding: '10px 12px',
              backgroundColor: 'var(--gt-bg-card-hover)',
              borderRadius: 'var(--gt-radius-md)',
              border: '1px solid var(--gt-border-subtle)',
              marginBottom: '18px',
              fontSize: '0.75rem',
              color: 'var(--gt-text-secondary)'
            }}
          >
            <ShieldCheck size={16} style={{ color: 'var(--gt-success)', flexShrink: 0 }} />
            <span>
              Distance is measured directly from <strong>Store GPS to Customer GPS</strong>.
            </span>
          </div>

          {/* Quick Select Areas */}
          <h4
            style={{
              fontFamily: 'var(--gt-font-display)',
              fontSize: '0.8125rem',
              fontWeight: 700,
              textTransform: 'uppercase',
              letterSpacing: '0.04em',
              color: 'var(--gt-text-muted)',
              marginBottom: '10px'
            }}
          >
            Hailakandi Service Hubs (788151)
          </h4>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', maxHeight: '240px', overflowY: 'auto' }}>
            {filteredLocations.map(loc => {
              const isSelected = selectedLocation?.id === loc.id;
              return (
                <div
                  key={loc.id}
                  onClick={() => setLocation(loc)}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    padding: '12px 14px',
                    borderRadius: 'var(--gt-radius-md)',
                    border: isSelected
                      ? '1.5px solid var(--gt-primary)'
                      : '1px solid var(--gt-border-subtle)',
                    backgroundColor: isSelected
                      ? 'var(--gt-primary-surface)'
                      : 'var(--gt-bg-surface)',
                    cursor: 'pointer'
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                    <MapPin
                      size={16}
                      style={{
                        color: isSelected ? 'var(--gt-primary)' : 'var(--gt-text-muted)',
                        flexShrink: 0
                      }}
                    />
                    <div>
                      <div style={{ fontWeight: 600, fontSize: '0.875rem' }}>{loc.name}</div>
                      <div style={{ fontSize: '0.75rem', color: 'var(--gt-text-muted)' }}>
                        Lat: {loc.latitude}°N, Lng: {loc.longitude}°E
                      </div>
                    </div>
                  </div>

                  {isSelected && (
                    <CheckCircle size={16} style={{ color: 'var(--gt-primary)', flexShrink: 0 }} />
                  )}
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
};
