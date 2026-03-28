import React, { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, MapPin, Tag, MessagesSquare, Map, Star, Compass, CheckCircle, Heart } from 'lucide-react';
import { Shimmer, LeafletMap, Stars, Field } from '../components/UI';
import { useAppContext } from '../context/AppContext';
import { LocationController, AdController, ReviewController, MovieController, PointController, FavoriteController } from '../services/db';

const LocationPage = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user, toast } = useAppContext();

  const [loc, setLoc] = useState(null);
  const [ads, setAds] = useState([]);
  const [reviews, setReviews] = useState([]);
  const [movies, setMovies] = useState([]);
  const [loading, setLoading] = useState(true);

  // Favorite state
  const [isFav, setIsFav] = useState(false);
  const [favToggling, setFavToggling] = useState(false);

  // Check-in states
  const [isCheckingIn, setIsCheckingIn] = useState(false);
  const [hasCheckedIn, setHasCheckedIn] = useState(false);

  // Form states
  const [reviewText, setReviewText] = useState('');
  const [reviewStars, setReviewStars] = useState(0);

  useEffect(() => {
    setLoading(true);
    setTimeout(() => {
      const parsedId = parseInt(id);
      const data = LocationController.get(parsedId);
      if (data) {
        setLoc(data);
        document.title = `Move³Movie | ${data.name || 'สถานที่'}`;
        setAds(AdController.list().filter(a => !a.hidden));
        setReviews(ReviewController.list(parsedId));

        // Find movies featuring this location
        const dbMovies = MovieController.list();
        const relatedMovies = dbMovies.filter(m => MovieController.scenes(m.id).some(s => s.locationId === parsedId));
        setMovies(relatedMovies);

        // Check favorite state
        if (user) setIsFav(FavoriteController.isFavorite(user.id, parsedId));
      }
      setLoading(false);
    }, 400);

    return () => { document.title = 'Move³Movie'; };
  }, [id, user]);

  const handleToggleFavorite = useCallback(async () => {
    if (!user) return toast('กรุณาเข้าสู่ระบบก่อนเพิ่มสถานที่โปรด', 'error');
    setFavToggling(true);
    try {
      const isNowFav = await FavoriteController.toggle(user.id, parseInt(id));
      setIsFav(isNowFav);
      toast(isNowFav ? 'เพิ่มในสถานที่โปรดแล้ว ❤️' : 'นำออกจากสถานที่โปรดแล้ว');
    } catch (err) {
      toast('เกิดข้อผิดพลาด: ' + err.message, 'error');
    } finally {
      setFavToggling(false);
    }
  }, [user, id, toast]);

  const submitReview = async (e) => {
    e.preventDefault();
    if (!user) return toast('กรุณาเข้าสู่ระบบก่อนเขียนรีวิว', 'error');
    if (!reviewText || !reviewStars) return toast('กรุณาระบุคะแนนและข้อความ', 'error');

    try {
      const nw = await ReviewController.add({ userId: user.id, userName: user.name, locationId: parseInt(id), rating: reviewStars, comment: reviewText });
      setReviews(prev => [nw, ...prev]);
      setReviewText(''); setReviewStars(0);
      toast('บันทึกรีวิวสำเร็จ');
    } catch (err) {
      toast('เกิดข้อผิดพลาด: ' + err.message, 'error');
    }
  };

  const handleCheckIn = () => {
    if (!user) return toast('กรุณาเข้าสู่ระบบเพื่อเช็คอิน', 'error');
    if (hasCheckedIn) return toast('คุณได้เช็คอินสถานที่นี้ไปแล้ว', 'error');

    if (!navigator.geolocation) {
      return toast('เบราว์เซอร์ของคุณไม่รองรับการระบุตำแหน่ง', 'error');
    }

    setIsCheckingIn(true);
    navigator.geolocation.getCurrentPosition(
      async (position) => {
        const userLat = position.coords.latitude;
        const userLng = position.coords.longitude;
        
        // Calculate distance via Haversine formula
        const R = 6371; // Earth's radius in km
        const dLat = (loc.lat - userLat) * (Math.PI / 180);
        const dLng = (loc.lng - userLng) * (Math.PI / 180);
        const a = 
          Math.sin(dLat / 2) * Math.sin(dLat / 2) +
          Math.cos(userLat * (Math.PI / 180)) * Math.cos(loc.lat * (Math.PI / 180)) * 
          Math.sin(dLng / 2) * Math.sin(dLng / 2);
        const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
        const distance = R * c; // Distance in km

        if (distance <= 5) {
          try {
            await PointController.add(user.id, 500);
            toast('เช็คอินสำเร็จ! คุณได้รับ 500 แต้ม', 'success');
            setHasCheckedIn(true);
          } catch (err) {
            toast('เกิดข้อผิดพลาดในการเพิ่มแต้ม: ' + err.message, 'error');
          }
        } else {
          toast(`คุณอยู่ห่างจากสถานที่เกินไป (${distance.toFixed(1)} กม. / กำหนด 5 กม.)`, 'error');
        }
        setIsCheckingIn(false);
      },
      (error) => {
        let errorMsg = 'เกิดข้อผิดพลาดในการดึงตำแหน่ง';
        if (error.code === 1) errorMsg = 'คุณไม่อนุญาตให้เข้าถึงตำแหน่งที่ตั้ง';
        else if (error.code === 2) errorMsg = 'ไม่สามารถระบุตำแหน่งของคุณได้';
        else if (error.code === 3) errorMsg = 'หมดเวลาในการดึงตำแหน่ง';
        toast(errorMsg, 'error');
        setIsCheckingIn(false);
      },
      { enableHighAccuracy: true, timeout: 10000, maximumAge: 0 }
    );
  };

  if (loading) {
    return (
      <div className="max-w-[800px] mx-auto mt-[140px] mb-[100px] px-6">
        <Shimmer h={40} w="60%" className="mb-5" />
        <Shimmer h={200} className="mb-10" />
        <Shimmer h={100} className="mb-5" />
      </div>
    );
  }

  if (!loc) {
    return (
      <div className="text-center py-[120px] px-5 text-muted">
        <h2 className="font-serif text-[24px]">ไม่พบข้อมูลสถานที่</h2>
        <button className="btn-ghost px-6 py-2.5 rounded-[20px] mt-5 inline-flex items-center gap-2" onClick={() => navigate('/map')}>
          กลับไปหน้าแผนที่
        </button>
      </div>
    );
  }

  const avgRating = reviews.length > 0 ? (reviews.reduce((acc, r) => acc + r.rating, 0) / reviews.length).toFixed(1) : '0.0';

  return (
    <div className="max-w-[1000px] mx-auto pt-[100px] pb-[60px] px-6">
      <button className="btn-ghost px-4 py-2 rounded-[20px] mb-6 text-[13px] inline-flex items-center gap-1.5" onClick={() => navigate(-1)}>
        <ArrowLeft size={14} /> ย้อนกลับ
      </button>

      <div className="animate-fade-up">
        
        <div className="flex flex-col md:flex-row gap-10 mb-[60px]">

          <div className="flex-1">
            <div className="flex gap-3 mb-4">
              <span className="badge"><MapPin size={12} className="inline mr-1" /> {loc.province}</span>
              {loc.type && <span className="badge badge-gray"><Tag size={12} className="inline mr-1" /> {loc.type}</span>}
              <span className="badge bg-gold/10 border-gold/20 text-gold"><Star size={12} className="inline mr-1" /> {avgRating}</span>
            </div>

            <div className="flex items-start gap-4 mb-4">
              <h1 className="font-serif text-[clamp(32px,4vw,42px)] m-0 leading-[1.2] flex-1">{loc.name}</h1>
              <button
                onClick={handleToggleFavorite}
                disabled={favToggling}
                title={isFav ? 'นำออกจากสถานที่โปรด' : 'เพิ่มในสถานที่โปรด'}
                style={{
                  marginTop: '6px',
                  background: isFav ? 'rgba(232,64,31,0.1)' : 'rgba(255,255,255,0.05)',
                  border: isFav ? '1px solid rgba(232,64,31,0.3)' : '1px solid rgba(255,255,255,0.1)',
                  borderRadius: '12px',
                  cursor: 'pointer',
                  padding: '10px 14px',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '7px',
                  color: isFav ? '#e8401f' : '#888',
                  fontSize: '13px',
                  fontWeight: 500,
                  transition: 'all 0.2s ease',
                  transform: favToggling ? 'scale(0.92)' : 'scale(1)',
                  opacity: favToggling ? 0.6 : 1,
                  whiteSpace: 'nowrap',
                  flexShrink: 0,
                }}
              >
                <Heart
                  size={18}
                  style={{
                    fill: isFav ? '#e8401f' : 'none',
                    stroke: isFav ? '#e8401f' : '#888',
                    transition: 'all 0.2s ease',
                    filter: isFav ? 'drop-shadow(0 0 4px rgba(232,64,31,0.5))' : 'none',
                  }}
                />
                {isFav ? 'โปรดแล้ว' : 'เพิ่มในโปรด'}
              </button>
            </div>
            <p className="text-[#A8A5B4] leading-[1.85] text-[15px] mb-9 max-w-[680px]">
              {loc.description || 'ไม่มีคำอธิบาย'}
            </p>

            {loc.lat && loc.lng && (
              <div className="mb-10">
                <LeafletMap locations={[loc]} center={[loc.lat, loc.lng]} zoom={15} height={300} />
                <div className="mt-4 flex flex-wrap gap-4">
                  <a
                    href={`https://www.google.com/maps/search/?api=1&query=${loc.lat},${loc.lng}`}
                    target="_blank"
                    rel="noreferrer"
                    className="btn-gold inline-flex items-center gap-2.5 px-6 py-3 rounded-xl no-underline font-semibold text-[15px]"
                  >
                    <Map size={18} /> นำทางด้วย Google Maps
                  </a>
                  
                  <button 
                    onClick={handleCheckIn}
                    disabled={isCheckingIn || hasCheckedIn}
                    className={`inline-flex items-center gap-2.5 px-6 py-3 rounded-xl font-semibold text-[15px] transition-all 
                                ${hasCheckedIn 
                                  ? 'bg-green-500/20 text-green-400 border border-green-500/30' 
                                  : 'bg-[#1a1b26] text-white hover:bg-[#252736] border border-white/10'}`}
                  >
                    {isCheckingIn ? (
                      <span className="animate-spin w-4 h-4 border-2 border-white/30 border-t-white rounded-full" />
                    ) : hasCheckedIn ? (
                      <CheckCircle size={18} />
                    ) : (
                      <MapPin size={18} />
                    )}
                    {isCheckingIn ? 'กำลังตรวจสอบ...' : hasCheckedIn ? 'เช็คอินแล้ว' : 'เช็คอินสถานที่นี้'}
                  </button>
                </div>
              </div>
            )}

            {/* Ads Panel */}
            {ads.length > 0 && (
              <div className="bg-gradient-to-tr from-gold/5 lg:via-gold/10 lg:to-gold/5 border border-gold/20 rounded-2xl p-6 mb-10">
                <h3 className="font-serif text-gold text-[18px] mb-4 flex items-center gap-2">
                  <Compass size={18} /> สถานที่หรือโปรโมชั่นใกล้เคียง
                </h3>
                <div className="grid gap-4">
                  {ads.slice(0, 2).map(ad => (
                    <div key={ad.id} className="bg-[#07070F]/60 rounded-xl p-4">
                      <div className="font-semibold text-main mb-1">{ad.title}</div>
                      <div className="text-[13px] text-muted">{ad.description}</div>
                    </div>
                  ))}
                </div>
              </div>
            )}

          </div>

          <div className="w-full max-w-[320px] max-md:max-w-none">
            
            {/* Related Movies */}
            <div className="bg-card border border-white/5 rounded-2xl p-6 mb-6">
              <h3 className="font-serif text-[18px] mb-4">ปรากฏในภาพยนตร์</h3>
              {movies.length > 0 ? (
                <div className="flex flex-col gap-3">
                  {movies.map(m => (
                    <div key={m.id} onClick={() => navigate(`/movies/${m.id}`)}
                      className="flex gap-3 items-center cursor-pointer p-2 rounded-lg transition-colors hover:bg-white/5">
                      <img src={m.poster} alt={m.title} className="w-11 h-[62px] rounded border border-white/10 object-cover shrink-0" />
                      <div className="min-w-0">
                        <div className="text-[14px] font-semibold text-main truncate">{m.title}</div>
                        <div className="text-[12px] text-muted">{m.releaseYear}</div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-[13px] text-muted">ไม่มีข้อมูลภาพยนตร์ที่แนบกับสถานที่นี้</div>
              )}
            </div>

            {/* Review Form */}
            <div className="bg-card border border-white/5 rounded-2xl p-6">
              <h3 className="font-serif text-[18px] mb-4">เขียนรีวิว</h3>
              {user ? (
                <form onSubmit={submitReview}>
                  <div className="mb-4">
                    <Stars val={reviewStars} onChange={setReviewStars} size={24} />
                  </div>
                  <Field>
                    <textarea placeholder="บรรยากาศเป็นอย่างไรบ้าง..." className="inp min-h-[100px]" value={reviewText} onChange={e => setReviewText(e.target.value)} />
                  </Field>
                  <button type="submit" className="btn-gold w-full py-3 rounded-xl mt-2 text-[14px]">ยืนยันรีวิว</button>
                </form>
              ) : (
                <div className="text-center py-5">
                  <p className="text-[13px] text-muted mb-4">กรุณาเข้าสู่ระบบเพื่อเขียนรีวิวแชร์ประสบการณ์</p>
                  <button onClick={() => navigate('/auth')} className="btn-ghost px-5 py-2 rounded-xl text-[13px]">เข้าสู่ระบบ</button>
                </div>
              )}
            </div>
            
          </div>
        </div>

        {/* Reviews List */}
        <div className="border-t border-white/5 pt-10">
          <h2 className="font-serif text-[24px] mb-6">รีวิวจากผู้ใช้งาน ({reviews.length})</h2>
          {reviews.length > 0 ? (
            <div className="grid grid-cols-[repeat(auto-fill,minmax(300px,1fr))] gap-5">
                {reviews.map(r => {
                  const dateVal = r.createdAt || r.createdat;
                  const nameVal = r.userName || r.username || 'ผู้ใช้แอป';
                  
                  return (
                    <div key={r.id} className="bg-card border border-white/5 rounded-2xl p-5 md:p-6">
                      <div className="flex justify-between items-start mb-4">
                        <div className="flex items-center gap-3">
                          <div className="w-9 h-9 rounded-full bg-gold/10 text-gold flex items-center justify-center font-semibold text-[14px]">
                            {nameVal.charAt(0)}
                          </div>
                          <div>
                            <div className="font-semibold text-[14px]">{nameVal}</div>
                            <div className="text-[12px] text-muted">
                              {dateVal ? new Date(dateVal).toLocaleDateString('th-TH') : 'เมื่อสักครู่'}
                            </div>
                          </div>
                        </div>
                        <Stars val={r.rating} size={14} readonly />
                      </div>
                      <p className="text-[#EDE9E3] text-[14px] leading-[1.6] m-0">"{r.comment}"</p>
                    </div>
                  );
                })}
            </div>
          ) : (
            <div className="p-10 text-center bg-card rounded-2xl border border-dashed border-white/10">
              <MessagesSquare size={32} className="text-muted mx-auto mb-3" />
              <div className="text-main mb-1">ยังไม่มีรีวิว</div>
              <div className="text-muted text-[13px]">เป็นคนแรกที่แชร์ประสบการณ์สิ!</div>
            </div>
          )}
        </div>
        
      </div>
    </div>
  );
};

export default LocationPage;