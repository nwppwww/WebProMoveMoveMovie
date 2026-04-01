import React, { useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { Search, MapPin, Heart, ChevronRight, PlayCircle } from 'lucide-react';
import { Particles } from '../components/UI';
import { MovieController, LocationController, FavoriteController } from '../services/db';
import { movieAPI, locationAPI } from '../services/api';
import { useAppContext } from '../context/AppContext';
import { Shimmer } from '../components/UI';

const HomePage = () => {
  const navigate = useNavigate();
  const { user, toast, setGlobalError } = useAppContext();
  const [q, setQ] = useState('');
  const [popMovies, setPopMovies] = useState([]);
  const [popLocations, setPopLocations] = useState([]);
  const [loading, setLoading] = useState(true);

  const [favoritedIds, setFavoritedIds] = useState(() => {
    if (!user) return new Set();
    return new Set(FavoriteController.getUserFavorites(user.id));
  });
  const [togglingId, setTogglingId] = useState(null);

  React.useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      try {
        const [mRes, lRes] = await Promise.all([
          movieAPI.getPopular(),
          locationAPI.getAll() // Slice manually or can use SB filter
        ]);

        // Normalize keys
        const normalizedMovies = (mRes.data || []).map(m => ({
          ...m,
          releaseYear: m.releaseyear || m.release_year
        }));

        setPopMovies(normalizedMovies);
        setPopLocations((lRes.data || []).slice(0, 6)); // Top 6 locations
      } catch (err) {
        console.error('Fetch error:', err);
        setGlobalError('ไม่สามารถโหลดข้อมูลหน้าแรกได้ กรุณาลองใหม่อีกครั้ง');
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  const handleSearch = (e) => {
    e.preventDefault();
    navigate(`/movies?q=${encodeURIComponent(q)}`);
  };

  const handleToggleFavorite = useCallback(async (e, locationId) => {
    e.stopPropagation(); // don't navigate to location page
    if (!user) {
      toast('กรุณาเข้าสู่ระบบก่อนเพิ่มสถานที่โปรด', 'error');
      return;
    }
    setTogglingId(locationId);
    try {
      const isNowFav = await FavoriteController.toggle(user.id, locationId);
      setFavoritedIds(prev => {
        const next = new Set(prev);
        if (isNowFav) {
          next.add(locationId);
          toast('เพิ่มในสถานที่โปรดแล้ว ❤️');
        } else {
          next.delete(locationId);
          toast('นำออกจากสถานที่โปรดแล้ว');
        }
        return next;
      });
    } catch (err) {
      toast('เกิดข้อผิดพลาด: ' + err.message, 'error');
    } finally {
      setTogglingId(null);
    }
  }, [user, toast]);

  return (
    <div>
      <div className="hero-bg min-h-[93vh] flex flex-col items-center justify-center text-center pt-[76px] pb-[60px] px-6">
        <Particles count={25} />

        <div className="animate-fade-up delay-100 relative z-10">
          <span className="badge mb-5">
            <PlayCircle size={12} className="inline mr-1 align-middle" />
            ระบบแนะนำสถานที่ถ่ายทำตามรอยภาพยนตร์
          </span>
        </div>

        <h1 className="animate-fade-up delay-200 font-serif text-[clamp(38px,7vw,76px)] leading-[1.1] m-0 mb-4 max-w-[820px] relative z-10">
          ตามรอย<span className="gold-text">ภาพยนตร์</span><br />ในสถานที่จริง
        </h1>

        <p className="animate-fade-up delay-300 text-[17px] text-muted max-w-[500px] m-0 mb-9 leading-[1.75] relative z-10">
          ค้นพบสถานที่ถ่ายทำหนังและซีรีส์ไทยที่คุณชื่นชอบ<br />พร้อมรีวิวจากผู้ที่ไปตามรอยจริง
        </p>

        <form onSubmit={handleSearch} className="animate-fade-up delay-400 relative w-full max-w-[500px] z-10">
          <input
            type="text"
            placeholder="ค้นหาภาพยนตร์, ฉาก, สถานที่..."
            value={q} onChange={e => setQ(e.target.value)}
            className="w-full py-4 px-6 pl-[54px] bg-white/5 border border-white/10 rounded-[30px] text-main text-[15px] backdrop-blur-[10px] outline-none transition-all duration-200 focus:border-gold/50 focus:shadow-[0_0_0_4px_rgba(232,160,32,0.12)] placeholder:text-muted"
          />
          <Search size={22} className="text-muted absolute left-5 top-1/2 -translate-y-1/2" />
          <button type="submit" className="btn-gold absolute right-1.5 top-1.5 bottom-1.5 px-6 rounded-[24px] text-sm">
            ค้นหา
          </button>
        </form>
      </div>

      <div className="max-w-[1400px] mx-auto px-6 py-[60px]">
        <div className="flex justify-between items-center mb-7">
          <h2 className="font-serif text-[26px] m-0">ภาพยนตร์<span className="gold-text">ยอดฮิต</span></h2>
          <button onClick={() => navigate('/movies')} className="btn-ghost flex items-center gap-1.5 rounded-[20px] px-4 py-1.5 text-[13px]">
            ดูทั้งหมด <ChevronRight size={14} />
          </button>
        </div>

        <div className="grid grid-cols-[repeat(auto-fill,minmax(200px,1fr))] gap-5 max-md:grid-cols-[repeat(auto-fill,minmax(150px,1fr))] max-md:gap-3.5 2xl:grid-cols-[repeat(auto-fill,minmax(220px,1fr))]">
          {loading ? (
            [1, 2, 3, 4].map(i => <Shimmer key={i} h={280} r={16} />)
          ) : popMovies.map(m => (
            <div key={m.id} className="card-hover rounded-2xl cursor-pointer" onClick={() => navigate(`/movies/${m.id}`)}>
              <div className="pt-[140%] relative">
                <img
                  src={m.poster}
                  alt={m.title}
                  className="absolute inset-0 w-full h-full object-cover"
                  onError={e => { e.target.style.display = 'none'; e.target.nextSibling.style.display = 'flex'; }}
                />
                <div className="absolute inset-0 bg-[#1A1A2E] hidden items-center justify-center text-[40px]">🎬</div>
                <div className="absolute bottom-0 left-0 right-0 pt-[30px] px-[12px] pb-[12px] bg-gradient-to-t from-[#0D0D1A] to-transparent">
                  <span className="bg-gold/90 text-[#07070F] px-[7px] py-[2px] rounded-[5px] text-[11px] font-bold">● ถ่ายทำ</span>
                </div>
              </div>
              <div className="px-3.5 py-3">
                <div className="font-semibold text-[14px] mb-[3px] truncate">{m.title}</div>
                <div className="text-muted text-[12px]">{m.releaseYear} • {m.genre || 'ภาพยนตร์'}</div>
              </div>
            </div>
          ))}
        </div>

        {popLocations.length > 0 && (
          <div className="mt-20">
            <h2 className="font-serif text-[26px] m-0 mb-7">สถานที่<span className="gold-text">ยอดนิยม</span></h2>
            <div className="grid grid-cols-[repeat(auto-fill,minmax(280px,1fr))] gap-5 max-md:grid-cols-1">
              {popLocations.map(l => {
                const isFav = favoritedIds.has(l.id);
                const isToggling = togglingId === l.id;
                return (
                  <div key={l.id} className="card-hover rounded-2xl" onClick={() => navigate(`/location/${l.id}`)}
                    style={{ position: 'relative' }}>
                    <div className="p-6">
                      <div className="flex justify-between mb-4">
                        <div className="w-12 h-12 rounded-xl bg-gold/10 flex items-center justify-center text-gold">
                          <MapPin size={24} />
                        </div>
                        <button
                          onClick={(e) => handleToggleFavorite(e, l.id)}
                          disabled={isToggling}
                          title={isFav ? 'นำออกจากสถานที่โปรด' : 'เพิ่มในสถานที่โปรด'}
                          style={{
                            background: 'none',
                            border: 'none',
                            cursor: 'pointer',
                            padding: '6px',
                            borderRadius: '8px',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            transition: 'transform 0.15s ease',
                            transform: isToggling ? 'scale(0.85)' : 'scale(1)',
                            opacity: isToggling ? 0.5 : 1,
                          }}
                        >
                          <Heart
                            size={22}
                            style={{
                              fill: isFav ? '#e8401f' : 'none',
                              stroke: isFav ? '#e8401f' : 'currentColor',
                              color: isFav ? '#e8401f' : '#888',
                              transition: 'all 0.2s ease',
                              filter: isFav ? 'drop-shadow(0 0 4px rgba(232,64,31,0.5))' : 'none',
                            }}
                          />
                        </button>
                      </div>
                      <div className="font-semibold text-[16px] mb-1.5">{l.name}</div>
                      <div className="text-muted text-[13px] mb-3">{l.province}</div>
                      <p className="text-[#A8A5B4] text-[13px] leading-[1.6] m-0">
                        {l.description ? (l.description.length > 80 ? l.description.substring(0, 80) + '...' : l.description) : 'ไม่มีรายละเอียด'}
                      </p>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default HomePage;
