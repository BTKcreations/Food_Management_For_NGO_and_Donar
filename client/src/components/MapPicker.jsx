import { useState, useEffect, useRef, useMemo } from 'react';
import { MapContainer, TileLayer, Marker, Popup, useMapEvents, useMap } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import './MapPicker.css';

// Fix Leaflet default marker icon issue with bundlers
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon-2x.png',
  iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-shadow.png',
});

// Custom green marker for selected location
const selectedIcon = new L.Icon({
  iconUrl: 'https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-green.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-shadow.png',
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
  shadowSize: [41, 41]
});

// Component to recenter map when location changes externally
function RecenterMap({ lat, lng }) {
  const map = useMap();
  useEffect(() => {
    if (lat && lng) {
      map.setView([lat, lng], map.getZoom());
    }
  }, [lat, lng, map]);
  return null;
}

// Component to handle map clicks
function MapClickHandler({ onClick }) {
  useMapEvents({
    click(e) {
      onClick(e.latlng.lat, e.latlng.lng);
    }
  });
  return null;
}

// Draggable marker component
function DraggableMarker({ position, onDragEnd }) {
  const markerRef = useRef(null);

  const eventHandlers = useMemo(() => ({
    dragend() {
      const marker = markerRef.current;
      if (marker) {
        const pos = marker.getLatLng();
        onDragEnd(pos.lat, pos.lng);
      }
    },
  }), [onDragEnd]);

  return (
    <Marker
      draggable={true}
      eventHandlers={eventHandlers}
      position={position}
      ref={markerRef}
      icon={selectedIcon}
    >
      <Popup>
        <strong>📍 Selected Location</strong><br />
        Lat: {position[0].toFixed(6)}<br />
        Lng: {position[1].toFixed(6)}<br />
        <em style={{ fontSize: '0.75rem', color: '#666' }}>Drag to adjust</em>
      </Popup>
    </Marker>
  );
}

export default function MapPicker({ 
  latitude, 
  longitude, 
  onLocationChange, 
  height = '350px',
  readOnly = false,
  showSearch = true,
  label = 'Verify & Adjust Location'
}) {
  const [position, setPosition] = useState(null);
  const [geoLoading, setGeoLoading] = useState(false);
  const [geoError, setGeoError] = useState('');
  const [addressText, setAddressText] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [searching, setSearching] = useState(false);
  const [mapReady, setMapReady] = useState(false);

  // Default center (India)
  const defaultCenter = [20.5937, 78.9629];
  const defaultZoom = 5;

  useEffect(() => {
    if (latitude && longitude && latitude !== 0 && longitude !== 0) {
      setPosition([parseFloat(latitude), parseFloat(longitude)]);
      reverseGeocode(parseFloat(latitude), parseFloat(longitude));
    }
  }, [latitude, longitude]);

  // Reverse geocode to get address text from coordinates
  const reverseGeocode = async (lat, lng) => {
    try {
      const res = await fetch(
        `https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lng}&zoom=18&addressdetails=1`,
        { headers: { 'Accept-Language': 'en' } }
      );
      const data = await res.json();
      if (data.display_name) {
        setAddressText(data.display_name);
      }
    } catch (err) {
      console.log('Reverse geocode failed:', err);
    }
  };

  // Forward geocode - search by place name
  const handleSearch = async () => {
    if (!searchQuery.trim()) return;
    setSearching(true);
    try {
      const res = await fetch(
        `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(searchQuery)}&limit=1`,
        { headers: { 'Accept-Language': 'en' } }
      );
      const data = await res.json();
      if (data.length > 0) {
        const { lat, lon, display_name } = data[0];
        const newLat = parseFloat(lat);
        const newLng = parseFloat(lon);
        setPosition([newLat, newLng]);
        setAddressText(display_name);
        if (onLocationChange) {
          onLocationChange(newLat, newLng, display_name);
        }
      } else {
        setGeoError('Location not found. Try a different search term.');
        setTimeout(() => setGeoError(''), 3000);
      }
    } catch (err) {
      setGeoError('Search failed. Please try again.');
      setTimeout(() => setGeoError(''), 3000);
    } finally {
      setSearching(false);
    }
  };

  // Get current GPS location
  const handleGetMyLocation = () => {
    if (!navigator.geolocation) {
      setGeoError('Geolocation is not supported by your browser');
      return;
    }

    setGeoLoading(true);
    setGeoError('');

    navigator.geolocation.getCurrentPosition(
      (pos) => {
        const lat = pos.coords.latitude;
        const lng = pos.coords.longitude;
        setPosition([lat, lng]);
        reverseGeocode(lat, lng);
        if (onLocationChange) {
          onLocationChange(lat, lng);
        }
        setGeoLoading(false);
      },
      (err) => {
        setGeoError(`Location error: ${err.message}. You can search or click on the map instead.`);
        setGeoLoading(false);
      },
      {
        enableHighAccuracy: true,
        timeout: 15000,
        maximumAge: 0
      }
    );
  };

  // Handle map click or marker drag
  const handleMapLocationChange = (lat, lng) => {
    if (readOnly) return;
    setPosition([lat, lng]);
    reverseGeocode(lat, lng);
    if (onLocationChange) {
      onLocationChange(lat, lng);
    }
  };

  const mapCenter = position || defaultCenter;
  const mapZoom = position ? 15 : defaultZoom;

  return (
    <div className="map-picker-container">
      <div className="map-picker-header">
        <h3 className="map-picker-title">📍 {label}</h3>
        {!readOnly && (
          <div className="map-picker-actions">
            <button
              type="button"
              className="btn btn-primary btn-sm"
              onClick={handleGetMyLocation}
              disabled={geoLoading}
            >
              {geoLoading ? (
                <>
                  <div className="spinner" style={{ width: 14, height: 14, borderWidth: 2 }}></div>
                  Locating...
                </>
              ) : (
                '📍 Get My Location'
              )}
            </button>
          </div>
        )}
      </div>

      {/* Search bar */}
      {showSearch && !readOnly && (
        <div className="map-search-bar">
          <input
            type="text"
            className="form-input map-search-input"
            placeholder="Search for a place (e.g. Connaught Place, Delhi)"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && (e.preventDefault(), handleSearch())}
          />
          <button
            type="button"
            className="btn btn-secondary btn-sm"
            onClick={handleSearch}
            disabled={searching}
          >
            {searching ? '...' : '🔍 Search'}
          </button>
        </div>
      )}

      {/* Error message */}
      {geoError && (
        <div className="map-picker-error">{geoError}</div>
      )}

      {/* The Map */}
      <div className="map-wrapper" style={{ height }}>
        <MapContainer
          center={mapCenter}
          zoom={mapZoom}
          style={{ height: '100%', width: '100%', borderRadius: '12px' }}
          whenReady={() => setMapReady(true)}
        >
          <TileLayer
            attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          />

          {!readOnly && <MapClickHandler onClick={handleMapLocationChange} />}

          {position && (
            <>
              <RecenterMap lat={position[0]} lng={position[1]} />
              {readOnly ? (
                <Marker position={position} icon={selectedIcon}>
                  <Popup>
                    <strong>📍 Location</strong><br />
                    {addressText || `${position[0].toFixed(6)}, ${position[1].toFixed(6)}`}
                  </Popup>
                </Marker>
              ) : (
                <DraggableMarker
                  position={position}
                  onDragEnd={handleMapLocationChange}
                />
              )}
            </>
          )}
        </MapContainer>

        {!position && !readOnly && (
          <div className="map-overlay">
            <span className="map-overlay-icon">🗺️</span>
            <p>Click "Get My Location" or search for a place</p>
            <p className="map-overlay-hint">You can also click directly on the map</p>
          </div>
        )}
      </div>

      {/* Location Details */}
      {position && (
        <div className="map-location-details">
          <div className="location-coord-row">
            <div className="location-coord">
              <span className="coord-label">Latitude</span>
              <span className="coord-value">{position[0].toFixed(6)}</span>
            </div>
            <div className="location-coord">
              <span className="coord-label">Longitude</span>
              <span className="coord-value">{position[1].toFixed(6)}</span>
            </div>
            <div className="location-status">
              <span className="status-dot"></span>
              Location Set
            </div>
          </div>
          {addressText && (
            <div className="location-address">
              <span className="address-icon">📌</span>
              <span className="address-text">{addressText}</span>
            </div>
          )}
          {!readOnly && (
            <p className="map-help-text">
              💡 Drag the marker or click on the map to adjust the location
            </p>
          )}
        </div>
      )}
    </div>
  );
}
