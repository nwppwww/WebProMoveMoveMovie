import React, { useState, useEffect, useMemo, useRef } from 'react';
import { CheckCircle2, XCircle, AlertTriangle, Info } from 'lucide-react';

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
        <div class="popup-container">
          <strong class="popup-title">${loc.name || loc.locationName}</strong>
          <span class="popup-sub">📍 ${loc.province || ''}</span>
          ${loc.description ? `<p class="popup-desc">${loc.description.substring(0, 80)}...</p>` : ''}
          <a 
            href="https://www.google.com/maps/search/?api=1&query=${loc.lat},${loc.lng}" 
            target="_blank" 
            class="popup-link"
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

  const extractProvince = (addr) => {
    if (!addr) return '';
    // Priority order for Thai addressing
    let p = addr.province || addr.state || addr.city || addr.town || addr.village;
    if (!p) return '';
    
    // Clean common prefixes for Thai provinces
    return p
      .replace('จังหวัด', '')
      .replace('Province', '')
      .replace('Changwat', '')
      .replace('State of ', '')
      .replace('City of ', '')
      .replace('Special Administrative Area of ', '')
      .replace('Sukhaphiban ', '')
      .trim();
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
    <div className="mb-4">
      <Label>ค้นหาและปักหมุดสถานที่:</Label>
      <div className="relative mb-2">
        <div className="flex gap-2">
          <input 
            type="text" 
            value={search} 
            onChange={e => setSearch(e.target.value)} 
            placeholder="เช่น KMITL, Central World..." 
            className="inp flex-1"
            onKeyDown={e => e.key === 'Enter' && handleSearch()}
          />
          <button 
            type="button" 
            onClick={handleSearch} 
            disabled={searching}
            className="btn-gold px-4 rounded-xl shrink-0 text-sm"
          >
            {searching ? 'รอ...' : 'ค้นหา'}
          </button>
        </div>

        {results.length > 0 && (
          <div className="absolute top-full left-0 right-0 bg-[#1A1A24] border border-white/10 rounded-xl mt-1 z-[1000] shadow-2xl overflow-hidden">
            {results.map((r, i) => (
              <div 
                key={i} 
                onClick={() => selectPlace(r)}
                className="p-3 border-b border-white/5 cursor-pointer transition-colors hover:bg-gold/10"
              >
                <div className="text-[13px] font-bold text-white mb-0.5">{r.display_name.split(',')[0]}</div>
                <div className="text-[11px] text-muted truncate">{r.display_name}</div>
              </div>
            ))}
          </div>
        )}
      </div>
      
      <div ref={pickerMapRef} className="rounded-xl border border-white/10" style={{ height, cursor: 'crosshair' }} />
      <div className="text-[11px] text-gold mt-2 text-center opacity-80">
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

// Beautiful confirm dialog - replaces browser confirm()
export const ConfirmDialog = ({ data, onConfirm, onCancel }) => {
  if (!data) return null;
  const isDanger = data.type === 'danger';
  const isInfo = data.type === 'info';

  const IconComp = isDanger ? AlertTriangle : isInfo ? Info : AlertTriangle;
  const iconColor = isDanger ? '#FF6B6B' : isInfo ? 'var(--color-gold)' : '#FF6B6B';
  const confirmBtnStyle = isDanger
    ? { background: 'rgba(255,107,107,.15)', color: '#FF6B6B', border: '1px solid rgba(255,107,107,.3)' }
    : { background: 'linear-gradient(135deg, var(--color-gold), var(--color-gold-dim))', color: '#07070F', border: 'none' };

  return (
    <div className="confirm-dialog-overlay" onClick={e => e.target === e.currentTarget && onCancel()}>
      <div className="confirm-dialog-box">
        <div style={{ display: 'flex', alignItems: 'center', gap: 14, marginBottom: 20 }}>
          <div style={{ 
            width: 44, height: 44, borderRadius: 12, flexShrink: 0,
            background: isDanger ? 'rgba(255,107,107,.1)' : 'rgba(232,160,32,.1)',
            display: 'flex', alignItems: 'center', justifyContent: 'center'
          }}>
            <IconComp size={22} color={iconColor} />
          </div>
          <div>
            <div style={{ fontWeight: 600, fontSize: 16, color: 'var(--color-main)', marginBottom: 4 }}>
              {isDanger ? 'ยืนยันการดำเนินการ' : 'แจ้งเตือน'}
            </div>
            <div style={{ color: 'var(--color-muted)', fontSize: 14, lineHeight: 1.5, whiteSpace: 'pre-wrap' }}>{data.msg}</div>
          </div>
        </div>
        <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end' }}>
          <button
            onClick={onCancel}
            className="btn-ghost"
            style={{ padding: '9px 24px', borderRadius: 10, fontSize: 13, fontWeight: 500 }}
          >
            ยกเลิก
          </button>
          <button
            onClick={() => { onConfirm(); onCancel(); }}
            style={{ ...confirmBtnStyle, padding: '9px 24px', borderRadius: 10, fontSize: 13, fontWeight: 600, cursor: 'pointer', transition: 'all .2s' }}
          >
            {isDanger ? 'ยืนยัน' : 'ตกลง'}
          </button>
        </div>
      </div>
    </div>
  );
};

import ReactDOM from 'react-dom';

export const Modal = ({ open, onClose, title, children }) => {
  const boxRef = useRef(null);

  // Lock body scroll when modal open
  useEffect(() => {
    if (open) {
      document.body.style.overflow = 'hidden';
      // Scroll modal content to top when opened
      setTimeout(() => {
        if (boxRef.current) boxRef.current.scrollTop = 0;
      }, 10);
    } else {
      document.body.style.overflow = '';
    }
    return () => { document.body.style.overflow = ''; };
  }, [open]);

  if (!open) return null;
  return ReactDOM.createPortal(
    <div className="modal-overlay" onClick={e => e.target === e.currentTarget && onClose()}>
      <div className="modal-box" ref={boxRef}>
        <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:24 }}>
          <h3 className="font-serif" style={{ fontSize:20, color:'var(--color-main)' }}>{title}</h3>
          <button type="button" onClick={onClose} className="btn-ghost" style={{ borderRadius:8, width:32, height:32, fontSize:16, display:'flex', alignItems:'center', justifyContent:'center' }}>✕</button>
        </div>
        {children}
      </div>
    </div>,
    document.body
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
  <label style={{ display:'block', fontSize:12, fontWeight:600, color:'var(--color-muted)', textTransform:'uppercase', letterSpacing:'.05em', marginBottom:6 }}>{children}</label>
);

export const Field = ({ label, children }) => (
  <div style={{ marginBottom:16 }}>
    {label && <Label>{label}</Label>}
    {children}
  </div>
);

export const ErrorBanner = ({ msg, onRetry, onClose }) => {
  if (!msg) return null;
  return (
    <div className="fixed top-24 left-1/2 -translate-x-1/2 z-[2000] w-[90%] max-w-[600px] animate-fadeDown">
      <div className="bg-[#1C1111] border border-red-500/30 rounded-2xl p-5 flex items-start gap-4 shadow-2xl backdrop-blur-md">
        <div className="w-12 h-12 rounded-xl bg-red-500/20 flex items-center justify-center shrink-0">
          <XCircle size={24} className="text-red-500" />
        </div>
        <div className="flex-1 pt-0.5">
          <h4 className="font-bold text-red-100 mb-1">เกิดข้อผิดพลาดในการดึงข้อมูล</h4>
          <p className="text-red-200/70 text-[14px] leading-relaxed mb-4">{msg}</p>
          <div className="flex gap-3">
            {onRetry && (
              <button 
                onClick={onRetry} 
                className="bg-red-500 hover:bg-red-600 text-white px-4 py-1.5 rounded-lg text-sm font-semibold transition-all"
              >
                ลองใหม่อีกครั้ง
              </button>
            )}
            <button 
              onClick={onClose} 
              className="bg-white/10 hover:bg-white/20 text-white/80 px-4 py-1.5 rounded-lg text-sm font-medium transition-all"
            >
              ปิด
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export const GlobalLoader = () => (
  <div className="fixed inset-0 z-[3000] flex items-center justify-center bg-[#07070F]/60 backdrop-blur-sm animate-fadeIn">
    <div className="flex flex-col items-center">
      <div className="w-12 h-12 border-4 border-gold/20 border-t-gold rounded-full animate-spin mb-4 shadow-[0_0_15px_rgba(232,160,32,0.3)]"></div>
      <div className="font-serif gold-text text-xl animate-pulse tracking-widest">LOADING...</div>
    </div>
  </div>
);
