import React, { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, MapPin, Tag, MessagesSquare, Map, Star, Compass, CheckCircle, Heart } from 'lucide-react';
import { Shimmer, LeafletMap, Stars, Field } from '../components/UI';
import { useAppContext } from '../context/AppContext';
import { LocationController, AdController, ReviewController, MovieController, FavoriteController, CheckInController } from '../services/db';

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
    const parsedId = parseInt(id);

    const localData = LocationController.get(parsedId);
    if (localData) {
      setLoc(localData);
      document.title = `Move\u00b3Movie | ${localData.name || '\u0e2a\u0e16\u0e32\u0e19\u0e17\u0e35\u0e48'}`;
      setAds(AdController.list().filter(a => !a.hidden));
      setReviews(ReviewController.list(parsedId));
      const relatedMovies = MovieController.list().filter(m =>
        MovieController.scenes(m.id).some(s => s.locationId === parsedId)
      );
      setMovies(relatedMovies);
      if (user) setIsFav(FavoriteController.isFavorite(user.id, parsedId));
    }

    // Check real check-in status from DB (prevents bypass via page refresh)
    const checkStatus = async () => {
      if (user) {
        // First check cache for speed
        const cachedCheckedIn = CheckInController.hasCheckedIn(user.id, parsedId);
        if (cachedCheckedIn) {
          setHasCheckedIn(true);
        } else {
          // Verify from DB to catch cases where cache is stale
          const dbCheckedIn = await CheckInController.hasCheckedInDB(user.id, parsedId);
          setHasCheckedIn(dbCheckedIn);
        }
      }
      setLoading(false);
    };

    // Small delay to let UI render first
    setTimeout(() => { checkStatus(); }, 300);

    return () => { document.title = 'Move\u00b3Movie'; };
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
    if (!user) return toast('\u0e01\u0e23\u0e38\u0e13\u0e32\u0e40\u0e02\u0e49\u0e32\u0e2a\u0e39\u0e48\u0e23\u0e30\u0e1a\u0e1a\u0e40\u0e1e\u0e37\u0e48\u0e2d\u0e40\u0e0a\u0e47\u0e04\u0e2d\u0e34\u0e19', 'error');
    if (hasCheckedIn) return toast('\u0e04\u0e38\u0e13\u0e44\u0e14\u0e49\u0e40\u0e0a\u0e47\u0e04\u0e2d\u0e34\u0e19\u0e2a\u0e16\u0e32\u0e19\u0e17\u0e35\u0e48\u0e19\u0e35\u0e49\u0e44\u0e1b\u0e41\u0e25\u0e49\u0e27 (1 \u0e2a\u0e16\u0e32\u0e19\u0e17\u0e35\u0e48 / 1 \u0e1a\u0e31\u0e0d\u0e0a\u0e35)', 'error');

    if (!navigator.geolocation) {
      return toast('\u0e40\u0e1a\u0e23\u0e32\u0e27\u0e4c\u0e40\u0e0b\u0e2d\u0e23\u0e4c\u0e02\u0e2d\u0e07\u0e04\u0e38\u0e13\u0e44\u0e21\u0e48\u0e23\u0e2d\u0e07\u0e23\u0e31\u0e1a\u0e01\u0e32\u0e23\u0e23\u0e30\u0e1a\u0e38\u0e15\u0e33\u0e41\u0e2b\u0e19\u0e48\u0e07', 'error');
    }

    setIsCheckingIn(true);
    navigator.geolocation.getCurrentPosition(
      async (position) => {
        const userLat = position.coords.latitude;
        const userLng = position.coords.longitude;

        // Haversine formula
        const R = 6371;
        const dLat = (loc.lat - userLat) * (Math.PI / 180);
        const dLng = (loc.lng - userLng) * (Math.PI / 180);
        const a =
          Math.sin(dLat / 2) * Math.sin(dLat / 2) +
          Math.cos(userLat * (Math.PI / 180)) * Math.cos(loc.lat * (Math.PI / 180)) *
          Math.sin(dLng / 2) * Math.sin(dLng / 2);
        const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
        const distance = R * c;

        if (distance <= 5) {
          try {
            const result = await CheckInController.checkIn(user.id, parseInt(id), 500);
            toast(`\u0e40\u0e0a\u0e47\u0e04\u0e2d\u0e34\u0e19\u0e2a\u0e33\u0e40\u0e23\u0e47\u0e08! \u0e04\u0e38\u0e13\u0e44\u0e14\u0e49\u0e23\u0e31\u0e1a 500 \u0e41\u0e15\u0e49\u0e21 \ud83c\udfc6 (\u0e23\u0e27\u0e21 ${result.newPoints} \u0e41\u0e15\u0e49\u0e21)`, 'success');
            setHasCheckedIn(true);
          } catch (err) {
            if (err.message === 'ALREADY_CHECKED_IN') {
              toast('\u0e04\u0e38\u0e13\u0e44\u0e14\u0e49\u0e40\u0e0a\u0e47\u0e04\u0e2d\u0e34\u0e19\u0e2a\u0e16\u0e32\u0e19\u0e17\u0e35\u0e48\u0e19\u0e35\u0e49\u0e44\u0e1b\u0e41\u0e25\u0e49\u0e27 (1 \u0e2a\u0e16\u0e32\u0e19\u0e17\u0e35\u0e48 / 1 \u0e1a\u0e31\u0e0d\u0e0a\u0e35)', 'error');
              setHasCheckedIn(true);
            } else {
              toast('\u0e40\u0e01\u0e34\u0e14\u0e02\u0e49\u0e2d\u0e1c\u0e34\u0e14\u0e1e\u0e25\u0e32\u0e14: ' + err.message, 'error');
            }
          }
        } else {
          toast(`\u0e04\u0e38\u0e13\u0e2d\u0e22\u0e39\u0e48\u0e2b\u0e48\u0e32\u0e07\u0e08\u0e32\u0e01\u0e2a\u0e16\u0e32\u0e19\u0e17\u0e35\u0e48\u0e40\u0e01\u0e34\u0e19\u0e44\u0e1b (${distance.toFixed(1)} \u0e01\u0e21. / \u0e01\u0e33\u0e2b\u0e19\u0e14 5 \u0e01\u0e21.)`, 'error');
        }
        setIsCheckingIn(false);
      },
      (error) => {
        let errorMsg = '\u0e40\u0e01\u0e34\u0e14\u0e02\u0e49\u0e2d\u0e1c\u0e34\u0e14\u0e1e\u0e25\u0e32\u0e14\u0e43\u0e19\u0e01\u0e32\u0e23\u0e14\u0e36\u0e07\u0e15\u0e33\u0e41\u0e2b\u0e19\u0e48\u0e07';
        if (error.code === 1) errorMsg = '\u0e04\u0e38\u0e13\u0e44\u0e21\u0e48\u0e2d\u0e19\u0e38\u0e0d\u0e32\u0e15\u0e43\u0e2b\u0e49\u0e40\u0e02\u0e49\u0e32\u0e16\u0e36\u0e07\u0e15\u0e33\u0e41\u0e2b\u0e19\u0e48\u0e07\u0e17\u0e35\u0e48\u0e15\u0e31\u0e49\u0e07';
        else if (error.code === 2) errorMsg = '\u0e44\u0e21\u0e48\u0e2a\u0e32\u0e21\u0e32\u0e23\u0e16\u0e23\u0e30\u0e1a\u0e38\u0e15\u0e33\u0e41\u0e2b\u0e19\u0e48\u0e07\u0e02\u0e2d\u0e07\u0e04\u0e38\u0e13\u0e44\u0e14\u0e49';
        else if (error.code === 3) errorMsg = '\u0e2b\u0e21\u0e14\u0e40\u0e27\u0e25\u0e32\u0e43\u0e19\u0e01\u0e32\u0e23\u0e14\u0e36\u0e07\u0e15\u0e33\u0e41\u0e2b\u0e19\u0e48\u0e07';
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
                className={`mt-1.5 flex items-center gap-1.5 px-3.5 py-2.5 rounded-xl border text-[13px] font-medium whitespace-nowrap shrink-0 transition-all duration-200 cursor-pointer
                  ${isFav
                    ? 'bg-red-500/10 border-red-500/30 text-red-500'
                    : 'bg-white/5 border-white/10 text-[#888] hover:border-white/20'
                  }
                  ${favToggling ? 'scale-95 opacity-60' : 'scale-100 opacity-100'}`}
              >
                <Heart
                  size={18}
                  className={`transition-all duration-200 ${isFav ? 'fill-red-500 stroke-red-500 drop-shadow-[0_0_4px_rgba(232,64,31,0.5)]' : 'fill-none stroke-[#888]'}`}
                />
                {isFav ? 'เพิ่มในสถานที่โปรดแล้ว' : 'เพิ่มในสถานที่โปรด'}
              </button>
            </div>
            {loc.imgUrl && (
              <img src={loc.imgUrl} alt={loc.name} className="w-full h-[300px] object-cover rounded-2xl mb-6 border border-white/10" />
            )}
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