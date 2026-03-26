import React, { useState, useEffect, useMemo, useRef } from 'react';
import { CheckCircle2, XCircle } from 'lucide-react';

export const Particles = ({ count = 20 }) => {
  const particles = useMemo(() =>
    Array.from({ length: count }, (_, i) => ({
      id: i,
      left: Math.random() * 100,
      size: Math.random() * 4 + 2,
      duration: Math.random() * 8 + 10,
      delay: Math.random() * 10,
      opacity: Math.random() * 0.4 + 0.1,
    })), [count]);
  return (
    <div className="particles">
      {particles.map(p => (
        <div key={p.id} className="particle" style={{
          left: `${p.left}%`, width: p.size, height: p.size,
          animationDuration: `${p.duration}s`, animationDelay: `${p.delay}s`,
          opacity: p.opacity
        }} />
      ))}
    </div>
  );
};

export const Shimmer = ({ w = '100%', h = 200, r = 12, style = {} }) => (
  <div className="shimmer" style={{ width: w, height: h, borderRadius: r, ...style }} />
);

export const MovieCardSkeleton = () => (
  <div style={{ background: 'var(--bg-card)', border: '1px solid rgba(255,255,255,.06)', borderRadius: 16, overflow: 'hidden' }}>
    <Shimmer h={280} r={0} />
    <div style={{ padding: '14px 15px' }}>
      <Shimmer h={18} w="70%" style={{ marginBottom: 8 }} />
      <Shimmer h={14} w="40%" style={{ marginBottom: 8 }} />
      <Shimmer h={12} w="90%" />
    </div>
  </div>
);

export const LeafletMap = ({ locations = [], center, zoom = 13, height = 350, onMarkerClick }) => {
  const mapRef = useRef(null);
  const mapInstanceRef = useRef(null);

  useEffect(() => {
    if (!mapRef.current || mapInstanceRef.current || !window.L) return;
    const L = window.L;
    const defaultCenter = center || (locations.length > 0
      ? [locations[0].lat, locations[0].lng]
      : [13.7563, 100.5018]);
    const map = L.map(mapRef.current, {
      zoomControl: false,
      attributionControl: false,
    }).setView(defaultCenter, zoom);

    L.control.zoom({ position: 'bottomright' }).addTo(map);

    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
      maxZoom: 19
    }).addTo(map);

    const goldIcon = L.divIcon({
      className: '',
      html: `<div style="width:28px;height:28px;background:linear-gradient(135deg,#E8A020,#C47010);border-radius:50%;border:3px solid #07070F;box-shadow:0 0 16px rgba(232,160,32,.5);display:flex;align-items:center;justify-content:center;font-size:12px;">📍</div>`,
      iconSize: [28, 28],
      iconAnchor: [14, 14],
    });

    locations.forEach(loc => {
      if (!loc.lat || !loc.lng) return;
      const marker = L.marker([loc.lat, loc.lng], { icon: goldIcon }).addTo(map);
      marker.bindPopup(`
        <div style="padding:10px;font-family:DM Sans,sans-serif;min-width:180px;">
          <strong style="color:#E8A020;font-size:15px;display:block;margin-bottom:4px;">${loc.name || loc.locationName}</strong>
          <span style="color:#7A7990;font-size:13px;display:block;margin-bottom:12px;">📍 ${loc.province || ''}</span>
          ${loc.description ? `<p style="color:#A8A5B4;font-size:13px;margin:0 0 12px;line-height:1.5;max-height:80px;overflow:hidden;">${loc.description.substring(0,80)}...</p>` : ''}
          <a 
            href="https://www.google.com/maps/search/?api=1&query=${loc.lat},${loc.lng}" 
            target="_blank" 
            style="display:inline-block;padding:8px 14px;background:rgba(232,160,32,.15);color:#E8A020;border-radius:8px;text-decoration:none;font-size:13px;font-weight:600;width:100%;text-align:center;box-sizing:border-box;border:1px solid rgba(232,160,32,.3);"
          >📍 นำทางด้วย Google Maps</a>
        </div>
      `, { className: 'map-popup', maxWidth: 300 });
      if (onMarkerClick) marker.on('click', () => onMarkerClick(loc));
    });

    if (locations.length > 1) {
      const bounds = L.latLngBounds(locations.filter(l => l.lat && l.lng).map(l => [l.lat, l.lng]));
      if(bounds.isValid()) map.fitBounds(bounds, { padding: [40, 40] });
    }

    mapInstanceRef.current = map;
    return () => { map.remove(); mapInstanceRef.current = null; };
  }, [locations, center, zoom]);

  return <div ref={mapRef} style={{ height, borderRadius: 16, border: '1px solid rgba(232,160,32,.15)' }} />;
};

export const MapPicker = ({ lat, lng, onPick, height = 280 }) => {
  const pickerMapRef = useRef(null);
  const pickerMapInstance = useRef(null);
  const makerInstance = useRef(null);
  const [search, setSearch] = useState('');
  const [searching, setSearching] = useState(false);
  const [results, setResults] = useState([]);

  // Extract province from address data (Thailand format)
  const extractProvince = (addr) => {
    if (!addr) return '';
    // Nominatim uses 'state' or 'province' or 'city_district' for Thai provinces
    const p = addr.province || addr.state || addr.city || addr.town || addr.village;
    return p ? p.replace('จังหวัด', '').replace('Province', '').trim() : '';
  };

  const reverseGeocode = async (lat, lng) => {
    try {
      const res = await fetch(`https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lng}&addressdetails=1`);
      const data = await res.json();
      if (data && data.address) {
        return extractProvince(data.address);
      }
    } catch (err) {
      console.error('Reverse Geocode failed:', err);
    }
    return '';
  };

  const handleSearch = async (e) => {
    e?.preventDefault();
    if (!search || !pickerMapInstance.current) return;
    setSearching(true);
    try {
      const res = await fetch(`https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(search)}&addressdetails=1&limit=5`);
      const data = await res.json();
      setResults(data || []);
      if (!data || data.length === 0) alert('ไม่พบสถานที่นี้ ลองระบุชื่อให้ชัดเจนขึ้นครับ');
    } catch (err) {
      console.error('Search failed:', err);
    } finally {
      setSearching(false);
    }
  };

  const selectPlace = (place) => {
    if (!pickerMapInstance.current) return;
    const newLat = parseFloat(place.lat);
    const newLng = parseFloat(place.lon);
    const province = extractProvince(place.address);
    
    pickerMapInstance.current.setView([newLat, newLng], 15);
    
    const L = window.L;
    const goldIcon = L.divIcon({
      className: '',
      html: `<div style="width:28px;height:28px;background:linear-gradient(135deg,#E8A020,#C47010);border-radius:50%;border:4px solid #fff;box-shadow:0 0 20px rgba(0,0,0,.5);display:flex;align-items:center;justify-content:center;font-size:14px;">⭐️</div>`,
      iconSize: [28, 28],
      iconAnchor: [14, 28],
    });

    if (makerInstance.current) {
      makerInstance.current.setLatLng([newLat, newLng]);
    } else {
      makerInstance.current = L.marker([newLat, newLng], { icon: goldIcon }).addTo(pickerMapInstance.current);
    }
    
    onPick(newLat, newLng, province);
    setResults([]); 
    setSearch(place.display_name.split(',')[0]); 
  };

  useEffect(() => {
    if (!pickerMapRef.current || !window.L || pickerMapInstance.current) return;
    const L = window.L;
    
    const initialPos = (lat && lng) ? [lat, lng] : [13.7563, 100.5018];
    const map = L.map(pickerMapRef.current, {
      zoomControl: false,
      attributionControl: false,
    }).setView(initialPos, 13);

    L.control.zoom({ position: 'bottomright' }).addTo(map);
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
    }).addTo(map);

    const goldIcon = L.divIcon({
      className: '',
      html: `<div style="width:28px;height:28px;background:linear-gradient(135deg,#E8A020,#C47010);border-radius:50%;border:4px solid #fff;box-shadow:0 0 20px rgba(0,0,0,.5);display:flex;align-items:center;justify-content:center;font-size:14px;">⭐️</div>`,
      iconSize: [28, 28],
      iconAnchor: [14, 28],
    });

    if (lat && lng) {
      makerInstance.current = L.marker([lat, lng], { icon: goldIcon }).addTo(map);
    }

    map.on('click', async (e) => {
      const { lat, lng } = e.latlng;
      if (makerInstance.current) {
        makerInstance.current.setLatLng(e.latlng);
      } else {
        makerInstance.current = L.marker(e.latlng, { icon: goldIcon }).addTo(map);
      }
      
      const province = await reverseGeocode(lat, lng);
      onPick(lat, lng, province);
      setResults([]); 
    });

    pickerMapInstance.current = map;
    return () => { map.remove(); pickerMapInstance.current = null; };
  }, []);

  return (
    <div style={{ marginBottom: 16 }}>
      <Label>ค้นหาและปักหมุดสถานที่:</Label>
      <div style={{ position: 'relative', marginBottom: 8 }}>
        <div style={{ display: 'flex', gap: 8 }}>
          <input 
            type="text" 
            value={search} 
            onChange={e => setSearch(e.target.value)} 
            placeholder="เช่น KMITL, Central World..." 
            className="inp"
            style={{ flex: 1 }}
            onKeyDown={e => e.key === 'Enter' && handleSearch()}
          />
          <button 
            type="button" 
            onClick={handleSearch} 
            disabled={searching}
            className="btn-gold" 
            style={{ padding: '0 16px', borderRadius: 10, flexShrink: 0, fontSize: 13 }}
          >
            {searching ? 'รอ...' : 'ค้นหา'}
          </button>
        </div>

        {results.length > 0 && (
          <div style={{ position: 'absolute', top: '100%', left: 0, right: 0, background: '#1A1A24', border: '1px solid rgba(255,255,255,.1)', borderRadius: 12, marginTop: 4, zIndex: 1000, boxShadow: '0 10px 30px rgba(0,0,0,.5)', overflow: 'hidden' }}>
            {results.map((r, i) => (
              <div 
                key={i} 
                onClick={() => selectPlace(r)}
                style={{ padding: '12px 16px', borderBottom: i < results.length - 1 ? '1px solid rgba(255,255,255,.05)' : 'none', cursor: 'pointer', transition: 'background .2s' }}
                onMouseEnter={e => e.currentTarget.style.background = 'rgba(232,160,32,0.1)'}
                onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
              >
                <div style={{ fontSize: 13, fontWeight: 600, color: '#fff', marginBottom: 2 }}>{r.display_name.split(',')[0]}</div>
                <div style={{ fontSize: 11, color: 'var(--muted)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{r.display_name}</div>
              </div>
            ))}
          </div>
        )}
      </div>
      
      <div ref={pickerMapRef} style={{ height, borderRadius: 12, border: '1px solid rgba(255,255,255,.1)', marginBottom: 8, cursor: 'crosshair' }} />
      <div style={{ fontSize: 11, color: 'var(--gold)', textAlign: 'center', opacity: 0.8 }}>
         👆 เลือกผลการค้นหา หรือคลิกบนแผนที่เพื่อระบุจังหวัดอัตโนมัติ
      </div>
    </div>
  );
};

export const ScrollToTop = () => {
  const [visible, setVisible] = useState(false);
  useEffect(() => {
    const onScroll = () => setVisible(window.scrollY > 400);
    window.addEventListener('scroll', onScroll);
    return () => window.removeEventListener('scroll', onScroll);
  }, []);
  return (
    <button className={`scroll-top ${visible ? 'visible' : ''}`}
      onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}>↑</button>
  );
};

export const ToastMsg = ({ msg, type, onClose }) => {
  useEffect(() => { const t = setTimeout(onClose, 3200); return () => clearTimeout(t); }, [onClose]);
  const bg = type === 'error' ? 'rgba(200,50,50,.92)' : 'rgba(20,160,90,.92)';
  const Icon = type === 'error' ? XCircle : CheckCircle2;
  return (
    <div className="toast animate-fadeUp" style={{ background: bg, color: '#fff' }}>
      <Icon size={18} /> {msg}
    </div>
  );
};

export const Modal = ({ open, onClose, title, children }) => {
  if (!open) return null;
  return (
    <div className="modal-overlay" onClick={e => e.target === e.currentTarget && onClose()}>
      <div className="modal-box">
        <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:24 }}>
          <h3 className="font-serif" style={{ fontSize:20, color:'var(--text)' }}>{title}</h3>
          <button onClick={onClose} className="btn-ghost" style={{ borderRadius:8, width:32, height:32, fontSize:16 }}>✕</button>
        </div>
        {children}
      </div>
    </div>
  );
};

export const Stars = ({ val = 0, onChange, size = 20, readonly = false }) => {
  const [hov, setHov] = useState(0);
  return (
    <div style={{ display:'flex', gap:2 }}>
      {[1,2,3,4,5].map(i => (
        <span key={i}
          className={readonly ? '' : 'star'}
          style={{ fontSize: size, color: (hov || val) >= i ? '#E8A020' : '#2A2A3A', lineHeight:1 }}
          onMouseEnter={() => !readonly && setHov(i)}
          onMouseLeave={() => !readonly && setHov(0)}
          onClick={() => !readonly && onChange?.(i)}
        >★</span>
      ))}
    </div>
  );
};

export const Label = ({ children }) => (
  <label style={{ display:'block', fontSize:12, fontWeight:600, color:'var(--muted)', textTransform:'uppercase', letterSpacing:'.05em', marginBottom:6 }}>{children}</label>
);

export const Field = ({ label, children }) => (
  <div style={{ marginBottom:16 }}>
    {label && <Label>{label}</Label>}
    {children}
  </div>
);
