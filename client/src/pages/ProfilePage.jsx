import React from 'react';
import { User, Gift, Clock, Star, Edit2, Check, X, Heart, MapPin, CheckCircle, Ticket } from 'lucide-react';
import { Navigate, useNavigate } from 'react-router-dom';
import { useAppContext } from '../context/AppContext';
import { PointController, UserDB, FavoriteController, CheckInController, TicketController, AdController, MovieController } from '../services/db';

const ProfilePage = () => {
  const { user, toast, updateUser } = useAppContext();
  const navigate = useNavigate();
  const [isEditing, setIsEditing] = React.useState(false);
  const [newName, setNewName] = React.useState(user?.name || '');
  const [history, setHistory] = React.useState([]);
  const [loading, setLoading] = React.useState(false);
  const [favLocations, setFavLocations] = React.useState(() =>
    user ? FavoriteController.getUserFavoriteLocations(user.id) : []
  );
  const [checkinLocations] = React.useState(() =>
    user ? CheckInController.getUserCheckInLocations(user.id) : []
  );
  const [tickets] = React.useState(() =>
    user ? TicketController.getUserTickets(user.id) : []
  );
  // ✅ ย้ายมาไว้ก่อน conditional return เพื่อให้ถูกต้องตาม Rules of Hooks
  const [formError, setFormError] = React.useState('');
  const ads = AdController.list();

  const pts = PointController.get(user?.id);

  const fetchHistory = React.useCallback(async () => {
    if (!user) return;
    try {
      const data = await UserDB.getNameHistory(user.id);
      setHistory(data);
    } catch (err) {
      console.error('Failed to fetch name history:', err);
    }
  }, [user]);

  React.useEffect(() => {
    fetchHistory();
  }, [fetchHistory]);

  // Sync newName when user data changes (e.g. initial load)
  React.useEffect(() => {
    if (user?.name) setNewName(user.name);
  }, [user?.name]);

  if (!user) return <Navigate to="/auth" replace />;

  const handleUpdateName = async (e) => {
    if (e) e.preventDefault();
    setFormError('');

    if (!newName.trim()) {
      setFormError('กรุณาระบุชื่อที่ต้องการเปลี่ยน');
      return;
    }
    if (newName.trim() === user.name) {
      setIsEditing(false);
      return;
    }

    setLoading(true);
    try {
      const updated = await UserDB.updateName(user.id, newName.trim());
      updateUser(updated);
      toast('เปลี่ยนชื่อสำเร็จแล้ว! ประวัติการเปลี่ยนของคุณถูกบันทึกเรียบร้อย');
      setIsEditing(false);
      fetchHistory();
    } catch (err) {
      console.error('Update name error:', err);
      let errMsg = err.message || 'บันทึกข้อมูลไม่สำเร็จ';

      // Translate common Supabase/Postgres errors to Thai
      if (errMsg.includes('Permission denied')) errMsg = 'ไม่มีสิทธิ์บันทึกข้อมูล (กรุณาเช็คการตั้งค่า RLS ใน Supabase)';
      if (errMsg.includes('foreign key constraint')) errMsg = 'ไม่พบข้อมูลผู้ใช้ในระบบหลัก';
      if (errMsg.includes('network')) errMsg = 'ไม่สามารถเชื่อมต่อฐานข้อมูลได้ (Network Error)';

      setFormError(errMsg);
      toast(errMsg, 'error');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-[800px] mx-auto mt-[140px] mb-[100px] px-6">
      <div className="animate-fade-up">

        <div className="flex items-center gap-6 mb-10 pb-10 border-b border-white/10 max-md:flex-col max-md:text-center max-md:gap-4 max-md:pb-6">
          <div className="w-[100px] h-[100px] rounded-full bg-gradient-to-br from-gold to-gold-dim text-[#07070F] flex items-center justify-center text-[40px] font-bold shrink-0 shadow-[0_0_30px_rgba(232,160,32,0.15)]">
            {user?.name?.charAt(0)?.toUpperCase() || '?'}
          </div>
          <div className="flex-1">
            <div className="flex items-center gap-3 mb-1.5 max-md:justify-center min-h-[48px]">
              {isEditing ? (
                <div className="flex-1 max-w-[400px]">
                  <form onSubmit={handleUpdateName} className="flex items-center gap-2 animate-fade-in w-full">
                    <input
                      className="inp py-2 px-4 text-[22px] font-serif flex-1 border-gold/50 shadow-[0_0_15px_rgba(232,160,32,0.1)] transition-all focus:border-gold"
                      value={newName}
                      onChange={e => { setNewName(e.target.value); setFormError(''); }}
                      autoFocus
                      placeholder="ใส่ชื่อใหม่ของคุณ..."
                      disabled={loading}
                    />
                    <div className="flex gap-1">
                      <button type="submit" disabled={loading} className="w-10 h-10 flex items-center justify-center bg-gold text-[#07070F] rounded-xl hover:scale-105 active:scale-95 transition-all shadow-lg" title="บันทึก">
                        <Check size={20} strokeWidth={3} />
                      </button>
                      <button type="button" onClick={() => { setIsEditing(false); setNewName(user.name); setFormError(''); }} className="w-10 h-10 flex items-center justify-center bg-white/5 hover:bg-white/10 text-white rounded-xl transition-all" title="ยกเลิก">
                        <X size={20} />
                      </button>
                    </div>
                  </form>
                  {formError && <div className="text-[#FF6B6B] text-[12px] mt-1.5 animate-fade-in flex items-center gap-1">⚠ {formError}</div>}
                </div>
              ) : (
                <>
                  <h1 className="font-serif text-[32px] m-0 leading-tight">{user.name}</h1>
                  <button onClick={() => setIsEditing(true)} className="w-8 h-8 flex items-center justify-center text-white/30 hover:text-gold hover:bg-gold/10 rounded-lg transition-all" title="แก้ไขชื่อ">
                    <Edit2 size={16} />
                  </button>
                  <span className="badge badge-gray px-2.5 py-0.5 text-[11px] uppercase tracking-wider">{user.role}</span>
                </>
              )}
            </div>
            <div className="text-muted text-[16px] flex items-center gap-1.5 mb-3 max-md:justify-center">
              <User size={15} className="opacity-60" /> {user.email}
            </div>
            <div className="bg-gold/10 border border-gold/20 rounded-[24px] px-4 py-1 inline-flex items-center gap-2 text-gold font-semibold max-md:mx-auto text-[14px]">
              <Star size={14} className="fill-gold" /> {pts} แต้มสะสม
            </div>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-8 max-md:grid-cols-1">
          <div>
            <h2 className="font-serif text-[24px] mb-5 flex items-center gap-2">
              <Clock size={24} className="text-gold" /> กิจกรรมล่าสุด
            </h2>
            <div className="bg-card border border-white/5 rounded-2xl p-8 text-center min-h-[220px] flex flex-col justify-center">
              <Gift size={48} className="text-white/10 mx-auto mb-4" />
              <div className="text-[16px] text-muted mb-1">ยังไม่มีประวัติการแลกของรางวัล</div>
              <div className="text-[14px] text-white/20">สะสมแต้มจากการเข้าร่วมกิจกรรมและนำมาแลกรางวัล!</div>
            </div>
          </div>

          <div>
            <h2 className="font-serif text-[24px] mb-5 flex items-center gap-2">
              <Clock size={24} className="text-white/40" /> ประวัติการเปลี่ยนชื่อ
            </h2>
            <div className="bg-card border border-white/5 rounded-2xl p-4 min-h-[220px]">
              {history.length > 0 ? (
                <div className="space-y-4">
                  {history.map(h => (
                    <div key={h.id} className="border-b border-white/5 pb-3 last:border-0 last:pb-0">
                      <div className="flex justify-between items-start mb-1">
                        <div className="text-[14px] font-medium text-white/80">{h.oldName} → {h.newName}</div>
                        <div className="text-[11px] text-muted">{new Date(h.changedAt).toLocaleDateString('th-TH')}</div>
                      </div>
                      <div className="text-[11px] text-white/20">เปลี่ยนเมื่อ {new Date(h.changedAt).toLocaleTimeString('th-TH')}</div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="h-full flex flex-col items-center justify-center text-center opacity-40 py-8">
                  <User size={32} className="mb-2" />
                  <div className="text-[13px]">ยังไม่มีประวัติการเปลี่ยนชื่อ</div>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Privilege Tickets */}
        {tickets.length > 0 && (
          <div className="mt-12">
            <h2 className="font-serif text-[24px] mb-5 flex items-center gap-2">
              <Ticket size={24} className="text-gold" /> ตั๋วสิทธิพิเศษของฉัน
            </h2>
            <div className="grid grid-cols-[repeat(auto-fill,minmax(300px,1fr))] gap-5">
              {tickets.map(t => {
                const ad = ads.find(a => a.id === t.adId || a.id === t.adid);
                return (
                  <div key={t.id} className="relative rounded-2xl overflow-hidden border border-gold/20 bg-gradient-to-br from-[#1a1b26] to-[#0d0d1a] shadow-[0_10px_30px_rgba(232,160,32,0.1)]">
                    <div className="absolute top-0 right-0 w-16 h-16 opacity-5 pointer-events-none">
                      <Ticket size={80} className="text-gold rotate-12 translate-x-4 -translate-y-4" />
                    </div>
                    <div className="p-5 border-b border-dashed border-white/10 relative z-10">
                      <span className="badge badge-gold mb-3 inline-block">Partner Ticket</span>
                      {ad?.movieId && (
                        <div className="text-[11px] text-gold/60 font-bold mb-1 flex items-center gap-1 opacity-70">
                          🎬 {MovieController.get(ad.movieId)?.title || 'ไม่พบชื่อภาพยนตร์'}
                        </div>
                      )}
                      <h3 className="font-serif text-[18px] text-main mb-2 leading-tight">{ad?.title || 'ตั๋วสิทธิพิเศษ'}</h3>
                      <p className="text-[13px] text-muted line-clamp-2">{ad?.description || 'แสดงตั๋วใบนี้กับร้านค้าที่ร่วมรายการเพื่อรับสิทธิ์'}</p>
                    </div>
                    <div className="p-5 bg-gold/5 flex flex-col items-center relative z-10">
                      <div className="text-[11px] text-muted mb-1 uppercase tracking-widest font-medium">รหัสการใช้สิทธิ์ของคุณ</div>
                      <div className="font-mono text-[22px] tracking-widest font-bold text-main py-1 px-4 bg-black/40 rounded-lg border border-gold/10 inline-block">{t.ticketCode}</div>
                      <div className="text-[11px] text-white/30 mt-3 flex items-center justify-between w-full">
                        <span>ได้เมื่อ: {new Date(t.redeemedAt || t.createdAt).toLocaleDateString('th-TH')}</span>
                        <span className={`${t.used ? 'text-red-400' : 'text-green-400'}`}>
                          {t.used ? 'ใช้สิทธิ์แล้ว' : 'พร้อมใช้งาน'}
                        </span>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* Favorite Locations */}
        <div className="mt-12">
          <h2 className="font-serif text-[24px] mb-5 flex items-center gap-2">
            <Heart size={24} style={{ fill: '#e8401f', stroke: '#e8401f' }} /> สถานที่โปรด
          </h2>
          {favLocations.length > 0 ? (
            <div className="grid grid-cols-[repeat(auto-fill,minmax(260px,1fr))] gap-4">
              {favLocations.map(l => (
                <div key={l.id} className="relative bg-card border border-white/5 rounded-2xl p-5 flex flex-col gap-3">
                  <div className="flex items-start justify-between gap-3">
                    <div
                      className="flex items-center gap-3 cursor-pointer flex-1 min-w-0"
                      onClick={() => navigate(`/location/${l.id}`)}
                    >
                      <div className="w-10 h-10 rounded-xl bg-gold/10 flex items-center justify-center text-gold shrink-0">
                        <MapPin size={20} />
                      </div>
                      <div className="min-w-0">
                        <div className="font-semibold text-[15px] truncate">{l.name}</div>
                        <div className="text-muted text-[12px]">{l.province}</div>
                      </div>
                    </div>
                    <button
                      title="นำออกจากสถานที่โปรด"
                      onClick={async (e) => {
                        e.stopPropagation();
                        try {
                          await FavoriteController.toggle(user.id, l.id);
                          setFavLocations(FavoriteController.getUserFavoriteLocations(user.id));
                          toast('นำออกจากสถานที่โปรดแล้ว');
                        } catch (err) {
                          toast('เกิดข้อผิดพลาด: ' + err.message, 'error');
                        }
                      }}
                      className="p-1.5 rounded-lg flex items-center shrink-0 text-red-500 hover:bg-red-500/10 transition-all duration-200 cursor-pointer bg-transparent border-none"
                    >
                      <Heart size={18} className="fill-red-500 stroke-red-500" />
                    </button>
                  </div>
                  {l.description && (
                    <p className="text-[#A8A5B4] text-[13px] leading-[1.6] m-0">
                      {l.description.length > 90 ? l.description.substring(0, 90) + '...' : l.description}
                    </p>
                  )}
                </div>
              ))}
            </div>
          ) : (
            <div className="bg-card border border-dashed border-white/10 rounded-2xl p-10 text-center">
              <Heart size={40} className="text-white/10 mx-auto mb-3" />
              <div className="text-[15px] text-muted mb-1">ยังไม่มีสถานที่โปรด</div>
              <div className="text-[13px] text-white/20 mb-5">กดไอคอนหัวใจที่การ์ดสถานที่เพื่อเพิ่มในสถานที่โปรด</div>
              <button
                onClick={() => navigate('/')}
                className="btn-ghost px-5 py-2 rounded-xl text-[13px] inline-flex items-center gap-2"
              >
                <MapPin size={14} /> ไปดูสถานที่
              </button>
            </div>
          )}
        </div>

        {/* Checked-in Locations */}
        <div className="mt-12">
          <h2 className="font-serif text-[24px] mb-5 flex items-center gap-2">
            <CheckCircle size={24} className="text-green-400" /> สถานที่ที่เช็คอินแล้ว
          </h2>
          {checkinLocations.length > 0 ? (
            <div className="grid grid-cols-[repeat(auto-fill,minmax(260px,1fr))] gap-4">
              {checkinLocations.map(l => (
                <div
                  key={l.id}
                  className="bg-card border border-white/5 rounded-2xl p-5 flex items-center gap-4 cursor-pointer hover:border-green-500/20 transition-all"
                  onClick={() => navigate(`/location/${l.id}`)}
                >
                  <div className="w-11 h-11 rounded-xl bg-green-500/10 flex items-center justify-center text-green-400 shrink-0">
                    <CheckCircle size={22} />
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="font-semibold text-[15px] truncate mb-0.5">{l.name}</div>
                    <div className="text-muted text-[12px]">{l.province}</div>
                  </div>
                  <div className="text-[11px] font-bold text-green-400 bg-green-500/10 border border-green-500/20 rounded-lg px-2.5 py-1 shrink-0">
                    +500 แต้ม
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="bg-card border border-dashed border-white/10 rounded-2xl p-10 text-center">
              <CheckCircle size={40} className="text-white/10 mx-auto mb-3" />
              <div className="text-[15px] text-muted mb-1">ยังไม่มีสถานที่ที่เช็คอิน</div>
              <div className="text-[13px] text-white/20 mb-5">เดินทางไปยังสถานที่จริงแล้วกด &quot;เช็คอินสถานที่นี้&quot; เพื่อรับ 500 แต้ม</div>
              <button
                onClick={() => navigate('/map')}
                className="btn-ghost px-5 py-2 rounded-xl text-[13px] inline-flex items-center gap-2"
              >
                <MapPin size={14} /> ดูแผนที่สถานที่
              </button>
            </div>
          )}
        </div>

      </div>
    </div>
  );
};

export default ProfilePage;
