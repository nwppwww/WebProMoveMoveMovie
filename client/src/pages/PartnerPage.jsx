import React, { useState, useMemo } from 'react';
import { Megaphone, Plus, Edit2, Trash2, Eye, EyeOff, MapPin, Search, ChevronDown, Star, Ticket } from 'lucide-react';
import { Modal, Field, MapPicker } from '../components/UI';
import { useAppContext } from '../context/AppContext';
import { AdController, LocationController, MovieController } from '../services/db';

const PartnerPage = () => {
  const { user, toast } = useAppContext();
  const [updater, setUpdater] = useState(0);

  const [modalOpen, setModalOpen] = useState(false);
  const [editingAd, setEditingAd] = useState(null);
  const [formData, setFormData] = useState({});
  
  // Location selection states
  const [locSearch, setLocSearch] = useState('');
  const [showLocDropdown, setShowLocDropdown] = useState(false);

  if (!user || user.role !== 'partner') {
    return <div className="text-center py-[120px] px-6"><h3 className="text-[20px]">ไม่มีสิทธิ์เข้าถึงหน้านี้ เฉพาะ Partner เท่านั้น</h3></div>;
  }

  const refresh = () => setUpdater(x => x + 1);

  const myAds = AdController.list().filter(a => a.partnerId === user.id);
  const allLocations = LocationController.list();
  const allMovies = MovieController.list();

  // Combine locations with their movie titles for easier searching
  const searchableLocations = useMemo(() => {
    return allLocations.map(loc => {
      const movie = allMovies.find(m => m.id === loc.movieId);
      return {
        ...loc,
        movieTitle: movie?.title || 'ไม่พบชื่อเรื่อง'
      };
    });
  }, [allLocations, allMovies]);

  const filteredLocations = useMemo(() => {
    if (!locSearch) return searchableLocations.slice(0, 10);
    const s = locSearch.toLowerCase();
    return searchableLocations.filter(l => 
      l.name?.toLowerCase().includes(s) || 
      l.movieTitle?.toLowerCase().includes(s) ||
      l.province?.toLowerCase().includes(s)
    ).slice(0, 15);
  }, [searchableLocations, locSearch]);

  const handleEdit = (ad) => {
    setEditingAd(ad);
    setFormData(ad);
    setLocSearch('');
    setModalOpen(true);
  };
  
  const handleCreate = () => {
    setEditingAd(null);
    setFormData({});
    setLocSearch('');
    setModalOpen(true);
  };

  const handleDelete = (id) => {
    if (window.confirm('ยืนยันลบตั๋วสิทธิพิเศษนี้?')) {
      AdController.delete(id);
      toast('ลบตั๋วเรียบร้อย');
      refresh();
    }
  };

  const handleToggleVis = (id) => {
    AdController.toggleVisibility(id);
    toast('เปลี่ยนสถานะตั๋วเรียบร้อย');
    refresh();
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      if (editingAd) {
        await AdController.update(editingAd.id, formData);
      } else {
        await AdController.add({ ...formData, partnerId: user.id });
      }
      toast('บันทึกตั๋วสำเร็จ (สถานะตั้งต้น: รอตรวจสอบหรือซ่อน)');
      setModalOpen(false);
      refresh();
    } catch(err) {
      toast(err.message || 'บันทึกตั๋วไม่สำเร็จ', 'error');
    }
  };

  const selectLocation = (loc) => {
    setFormData({
      ...formData,
      lat: loc.lat,
      lng: loc.lng
    });
    setLocSearch(`${loc.name} (${loc.movieTitle})`);
    setShowLocDropdown(false);
  };

  return (
    <div className="max-w-[1000px] mx-auto pt-[100px] pb-16 px-6">
      <div className="animate-fade-up">
        
        <div className="flex justify-between items-center mb-8 max-md:flex-col max-md:items-start max-md:gap-4">
          <h1 className="font-serif text-[32px] m-0 flex items-center gap-3">
            <Ticket size={32} className="text-gold" /> สร้างตั๋วสิทธิพิเศษ <span className="gold-text">(Partner)</span>
          </h1>
          <button onClick={handleCreate} className="btn-gold flex items-center gap-2 px-5 py-2.5 rounded-xl">
            <Plus size={16} /> สร้างตั๋วใบใหม่
          </button>
        </div>

        {myAds.length > 0 ? (
          <div className="grid grid-cols-[repeat(auto-fill,minmax(300px,1fr))] gap-5">
            {myAds.map(a => (
              <div key={a.id} className={`bg-card rounded-2xl p-6 border transition-colors ${a.hidden ? 'border-red-500/20' : 'border-green-400/20'}`}>
                <div className="flex justify-between items-start mb-4">
                  <span className={`badge ${a.hidden ? 'badge-red' : 'badge-green'}`}>
                    {a.hidden ? 'ระงับ/รออนุมัติ' : 'เผยแพร่แล้ว'}
                  </span>
                  <div className="flex gap-2">
                    <button onClick={() => handleToggleVis(a.id)} className="btn-ghost p-1.5 rounded-md" title={a.hidden ? 'ขอเผยแพร่' : 'ร้องขอซ่อน'}>
                      {a.hidden ? <Eye size={14} /> : <EyeOff size={14} />}
                    </button>
                    <button onClick={() => handleEdit(a)} className="btn-ghost p-1.5 rounded-md"><Edit2 size={14} /></button>
                    <button onClick={() => handleDelete(a.id)} className="btn-danger p-1.5 rounded-md"><Trash2 size={14} /></button>
                  </div>
                </div>
                
                <h3 className="font-serif text-[18px] mb-2 text-main">{a.title}</h3>
                <p className="text-muted text-[14px] leading-[1.6] mb-4 overflow-hidden display-webkit-box webkit-line-clamp-2 webkit-box-orient-vertical">{a.description}</p>
                <div className="text-[12px] text-white/20 flex items-center gap-1.5"><MapPin size={12}/> พิกัด: {a.lat || '-'}, {a.lng || '-'}</div>
                <div className="text-[12px] text-gold mt-1 flex items-center gap-1.5"><Star size={12} fill="currentColor"/> {a.pointsRequired > 0 ? `ใช้ ${a.pointsRequired} แต้มในการแลก` : 'แจกสิทธิ์ฟรี (0 แต้ม)'}</div>
                <div className="text-[12px] text-white/20 mt-1">เพิ่มเมื่อ: {new Date(a.createdAt).toLocaleDateString('th-TH')}</div>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-[60px] px-6 bg-card rounded-2xl border border-dashed border-white/10">
            <Ticket size={40} className="text-muted mx-auto mb-4" />
            <div className="text-main text-[16px] mb-2">ยังไม่มีตั๋วสิทธิพิเศษ</div>
            <div className="text-muted text-[14px]">สร้างตั๋วใบแรกของคุณเพื่อให้ผู้ใช้สามารถนำแต้มมาแลกรับสิทธิ์ได้เลย</div>
          </div>
        )}
      </div>

      <Modal open={modalOpen} onClose={() => setModalOpen(false)} title={editingAd ? 'แก้ไขตั๋ว' : 'สร้างตั๋วสิทธิพิเศษใหม่'}>
        <form onSubmit={handleSubmit}>
          <Field label="ชื่อตั๋วสิทธิพิเศษ">
            <input required value={formData.title || ''} onChange={e => setFormData({ ...formData, title: e.target.value })} className="inp" placeholder="โปรโมชั่นโรงแรมใกล้ชิดธรรมชาติ..." />
          </Field>
          <Field label="รายละเอียด">
            <textarea required value={formData.description || ''} onChange={e => setFormData({ ...formData, description: e.target.value })} className="inp min-h-[80px]" placeholder="รับส่วนลด 20% เมื่อโชว์หน้าแอป..." />
          </Field>

          {/* New Searchable Location Picker */}
          <div className="mb-6 relative">
            <span className="text-[13px] text-muted mb-2 block font-medium">ค้นหาสถานที่ถ่ายทำ (ระบุตำแหน่งอัตโนมัติ)</span>
            <div className="relative">
              <input 
                type="text" 
                className="inp pr-12" 
                style={{ paddingLeft: '48px' }}
                placeholder="พิมพ์ชื่อภาพยนตร์ หรือชื่อสถานที่เพื่อค้นหา..." 
                value={locSearch}
                onChange={e => {
                  setLocSearch(e.target.value);
                  setShowLocDropdown(true);
                }}
                onFocus={() => setShowLocDropdown(true)}
              />
              <Search size={18} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-muted pointer-events-none opacity-50" />
              
              <div className="absolute right-3 top-1/2 -translate-y-1/2 flex items-center gap-1">
                {locSearch && (
                  <button 
                    type="button"
                    title="ล้างการค้นหา"
                    className="p-1 text-white/20 hover:text-white transition-colors"
                    onClick={() => {
                      setLocSearch('');
                      setFormData({ ...formData, lat: null, lng: null });
                    }}
                  >
                    <Plus size={16} className="rotate-45" />
                  </button>
                )}
                <button 
                  type="button"
                  className="p-1 text-muted hover:text-gold transition-colors"
                  onClick={() => setShowLocDropdown(!showLocDropdown)}
                >
                  <ChevronDown size={20} className={`transition-transform duration-200 ${showLocDropdown ? 'rotate-180' : ''}`} />
                </button>
              </div>
            </div>

            {showLocDropdown && (
              <>
                <div 
                  className="fixed inset-0 z-[9998]" 
                  onClick={() => setShowLocDropdown(false)} 
                />
                <div className="absolute z-[9999] w-full mt-2 bg-[#1a1b26]/95 backdrop-blur-xl border border-white/10 rounded-xl overflow-hidden shadow-[0_20px_50px_rgba(0,0,0,0.5)] animate-fade-in max-h-[300px] overflow-y-auto custom-scrollbar border-t-gold/30">
                  {filteredLocations.length > 0 ? (
                    filteredLocations.map(loc => (
                      <button
                        key={loc.id}
                        type="button"
                        className="w-full px-4 py-3 text-left hover:bg-gold/10 transition-colors flex items-center justify-between group border-b border-white/5 last:border-0"
                        onClick={() => selectLocation(loc)}
                      >
                        <div className="flex-1 min-w-0 pr-4">
                          <div className="text-[14px] font-semibold text-main truncate group-hover:text-gold transition-colors">{loc.name}</div>
                          <div className="text-[12px] text-muted truncate">
                            ภาพยนตร์: <span className="text-gold/80">{loc.movieTitle}</span> · {loc.province}
                          </div>
                        </div>
                        <div className="shrink-0 w-8 h-8 rounded-lg bg-white/5 flex items-center justify-center text-muted group-hover:text-gold transition-colors group-hover:bg-gold/20">
                          <MapPin size={16} />
                        </div>
                      </button>
                    ))
                  ) : (
                    <div className="px-4 py-10 text-center text-muted text-[13px]">
                      <Search size={28} className="mx-auto mb-3 opacity-10" />
                      ไม่พบสถานที่หรือภาพยนตร์ที่ตรงกับคำค้น
                    </div>
                  )}
                </div>
              </>
            )}
          </div>

          <MapPicker 
            lat={formData.lat} 
            lng={formData.lng} 
            onPick={(lat, lng) => setFormData({ ...formData, lat, lng })} 
          />

          <div className="flex gap-4 mt-4 max-md:flex-col">
             <Field label="ละติจูดเป้าหมาย"><input type="number" step="0.0001" value={formData.lat || ''} onChange={e => setFormData({ ...formData, lat: parseFloat(e.target.value) })} className="inp" /></Field>
             <Field label="ลองจิจูดเป้าหมาย"><input type="number" step="0.0001" value={formData.lng || ''} onChange={e => setFormData({ ...formData, lng: parseFloat(e.target.value) })} className="inp" /></Field>
          </div>

          <div className="mt-4">
             <Field label="คะแนนที่ใช้แลกเป็นตั๋ว (ใส่ 0 หากเป็นสิทธิพิเศษรับฟรี)">
               <input type="number" min="0" value={formData.pointsRequired || ''} onChange={e => setFormData({ ...formData, pointsRequired: parseInt(e.target.value) || 0 })} className="inp" placeholder="เช่น 500" />
             </Field>
          </div>
          
          <div className="flex gap-3 mt-6">
            <button type="button" onClick={() => setModalOpen(false)} className="btn-ghost flex-1 py-3 rounded-xl block text-center">ยกเลิก</button>
            <button type="submit" className="btn-gold flex-1 py-3 rounded-xl block text-center">บันทึกข้อมูล</button>
          </div>
        </form>
      </Modal>
    </div>
  );
};

export default PartnerPage;
