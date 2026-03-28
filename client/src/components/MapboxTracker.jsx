import { useEffect, useRef } from 'react';
import mapboxgl from 'mapbox-gl';
import 'mapbox-gl/dist/mapbox-gl.css';

// TODO: Replace with your actual Mapbox Access Token
// You can get one for FREE at https://www.mapbox.com/
const MAPBOX_TOKEN = 'pk.eyJ1Ijoic2FpLWtyaXNobmEiLCJhIjoiY203cmg0YWNqMDBuOTJqc2VlZjZ1bmNhMyJ9.XjG4E-G3-G-G-G-G-G-G'; 

export default function MapboxTracker({ 
  volunteerLocation, 
  destinationLocation, 
  height = '400px',
  zoom = 14 
}) {
  const mapContainer = useRef(null);
  const map = useRef(null);
  const volunteerMarker = useRef(null);
  const destinationMarker = useRef(null);

  useEffect(() => {
    if (map.current) return; // initialize map only once

    mapboxgl.accessToken = MAPBOX_TOKEN;
    
    map.current = new mapboxgl.Map({
      container: mapContainer.current,
      style: 'mapbox://styles/mapbox/streets-v12',
      center: [volunteerLocation.lng, volunteerLocation.lat],
      zoom: zoom
    });

    // Add navigation controls
    map.current.addControl(new mapboxgl.NavigationControl(), 'top-right');

    // Create custom element for volunteer (Bike icon)
    const el = document.createElement('div');
    el.className = 'marker-volunteer';
    el.innerHTML = '🛵';
    el.style.fontSize = '2rem';
    el.style.transition = 'all 0.5s ease-in-out';

    volunteerMarker.current = new mapboxgl.Marker(el)
      .setLngLat([volunteerLocation.lng, volunteerLocation.lat])
      .addTo(map.current);

    // Add destination marker
    if (destinationLocation) {
      destinationMarker.current = new mapboxgl.Marker({ color: '#ef4444' })
        .setLngLat([destinationLocation.lng, destinationLocation.lat])
        .setPopup(new mapboxgl.Popup().setHTML('<h4>Destination</h4>'))
        .addTo(map.current);
    }
  }, []);

  // Update volunteer marker position when location changes
  useEffect(() => {
    if (volunteerMarker.current && volunteerLocation) {
      volunteerMarker.current.setLngLat([volunteerLocation.lng, volunteerLocation.lat]);
      
      // Optionally fly to the new location to keep it centered
      map.current.easeTo({
        center: [volunteerLocation.lng, volunteerLocation.lat],
        duration: 2000
      });
    }
  }, [volunteerLocation]);

  return (
    <div style={{ position: 'relative', width: '100%', borderRadius: '12px', overflow: 'hidden', border: '2px solid var(--primary-light)' }}>
      <div ref={mapContainer} style={{ height }} />
      <div style={{ position: 'absolute', top: 10, left: 10, background: 'rgba(255,255,255,0.9)', padding: '5px 12px', borderRadius: '20px', fontSize: '0.75rem', fontWeight: 700, boxShadow: '0 2px 4px rgba(0,0,0,0.1)', display: 'flex', alignItems: 'center', gap: '6px' }}>
        <span style={{ width: 8, height: 8, background: '#10b981', borderRadius: '50%', display: 'inline-block', animation: 'pulse 2s infinite' }}></span>
        LIVE TRACKING ACTIVE
      </div>
      <style>{`
        @keyframes pulse {
          0% { transform: scale(0.95); box-shadow: 0 0 0 0 rgba(16, 185, 129, 0.7); }
          70% { transform: scale(1); box-shadow: 0 0 0 6px rgba(16, 185, 129, 0); }
          100% { transform: scale(0.95); box-shadow: 0 0 0 0 rgba(16, 185, 129, 0); }
        }
      `}</style>
    </div>
  );
}
