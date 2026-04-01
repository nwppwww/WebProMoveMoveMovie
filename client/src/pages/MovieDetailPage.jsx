import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, Clock, Calendar, MapPin, Film } from 'lucide-react';
import { Shimmer, Particles } from '../components/UI';
import { MovieController, LocationController } from '../services/db';
import { movieAPI } from '../services/api';

const MovieDetailPage = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [movie, setMovie] = useState(null);
  const [scenes, setScenes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      try {
        const [mRes, sRes] = await Promise.all([
          movieAPI.getById(id),
          movieAPI.getScenes(id)
        ]);

        if (mRes.data && mRes.data.length > 0) {
          const m = mRes.data[0];
          const normalized = {
            ...m,
            releaseYear: m.releaseyear || m.release_year
          };
          setMovie(normalized);
          document.title = `movemovemovie | ${normalized.title || 'หนัง'}`;

          // Normalize scenes (movieid -> movieId, locationid -> locationId)
          const normScenes = sRes.data.map(s => ({
            ...s,
            movieId: s.movieid,
            locationId: s.locationid,
            imgUrl: s.imgurl
          }));
          setScenes(normScenes);
        }
      } catch (err) {
        console.error('Fetch error:', err);
        setError('ไม่สามารถโหลดข้อมูลภาพยนตร์ได้ กรุณาลองใหม่อีกครั้ง');
      } finally {
        setLoading(false);
      }
    };

    fetchData();
    return () => { document.title = 'movemovemovie'; };
  }, [id]);

  if (loading) {
    return (
      <div className="max-w-[1000px] mx-auto py-[100px] px-6">
        <Shimmer h={400} r={24} style={{ marginBottom: 40 }} />
        <Shimmer h={40} w="60%" style={{ marginBottom: 16 }} />
        <Shimmer h={20} w="80%" style={{ marginBottom: 8 }} />
        <Shimmer h={20} w="75%" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="text-center py-[120px] px-5">
        <div className="text-red-400 text-[48px] mb-4">⚠️</div>
        <h2 className="font-serif text-[24px] text-red-400 mb-2">เกิดข้อผิดพลาด</h2>
        <p className="text-muted mb-6">{error}</p>
        <div className="flex gap-3 justify-center">
          <button className="btn-gold px-6 py-2.5 rounded-xl text-[14px]" onClick={() => { setError(null); setLoading(true); }}>
            ลองใหม่อีกครั้ง
          </button>
          <button className="btn-ghost px-6 py-2.5 rounded-[20px] inline-flex items-center gap-2" onClick={() => navigate('/movies')}>
            <ArrowLeft size={16} /> กลับไปหน้าภาพยนตร์
          </button>
        </div>
      </div>
    );
  }

  if (!movie) {
    return (
      <div className="text-center py-[120px] px-5 text-muted">
        <h2 className="font-serif text-[24px]">ไม่พบข้อมูลภาพยนตร์</h2>
        <button className="btn-ghost px-6 py-2.5 rounded-[20px] mt-5 inline-flex items-center gap-2" onClick={() => navigate('/movies')}>
          <ArrowLeft size={16} /> กลับไปหน้าภาพยนตร์
        </button>
      </div>
    );
  }

  return (
    <>
      {/* Hero Section */}
      <div className="relative h-[60vh] min-h-[400px]">
        <div className="absolute inset-0 bg-[#0D0D1A]">
          <img
            src={movie.poster}
            alt={movie.title}
            className="w-full h-full object-cover"
            onError={e => { e.target.style.display = 'none'; e.target.nextSibling.style.display = 'flex'; }}
          />
          <div className="absolute inset-0 hidden items-center justify-center text-[80px] bg-[#1A1A2E]">🎬</div>
          <div className="absolute inset-0 bg-gradient-to-b from-[rgba(7,7,15,0.4)] to-[#07070F]" />
        </div>
        <Particles count={15} />

        <div className="absolute bottom-0 left-0 right-0 px-6 pb-[60px]">
          <div className="max-w-[1000px] mx-auto">
            <button className="btn-ghost flex items-center gap-1.5 px-4 py-2 rounded-[20px] mb-6 text-[13px]" onClick={() => navigate(-1)}>
              <ArrowLeft size={14} /> ย้อนกลับ
            </button>
            <div className="animate-fade-up delay-100">
              <span className="badge mb-4">🎬 {movie.genre || 'ภาพยนตร์'}</span>
              <h1 className="font-serif text-[clamp(32px,5vw,56px)] leading-[1.1] m-0 mb-4">{movie.title}</h1>
              <div className="flex flex-wrap gap-6 text-muted text-[14px]">
                <span className="flex items-center gap-1.5"><Calendar size={16} /> {movie.releaseYear}</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-[1000px] mx-auto px-6 pb-[80px]">
        <div className="animate-fade-up delay-200 mb-[60px]">
          <h2 className="font-serif text-[24px] m-0 mb-4">เรื่องย่อ</h2>
          <p className="text-[#A8A5B4] leading-[1.8] text-[16px] m-0 max-w-[800px]">{movie.description}</p>
        </div>

        <div className="animate-fade-up delay-300">
          <div className="flex items-center justify-between mb-6">
            <h2 className="font-serif text-[28px] m-0">
              สถานที่<span className="gold-text">ถ่ายทำ</span>
            </h2>
            <span className="badge badge-gray">{scenes.length} สถานที่</span>
          </div>

          <div className="grid grid-cols-[repeat(auto-fill,minmax(300px,1fr))] gap-6">
            {scenes.length > 0 ? (
              scenes.map(scene => {
                const locData = LocationController.get(scene.locationId);
                const locName = locData ? locData.name : 'ดูรายละเอียดสถานที่';

                return (
                  <div key={scene.id} className="card-hover bg-card border border-white/5 rounded-2xl overflow-hidden cursor-pointer" onClick={() => navigate(`/location/${scene.locationId}`)}>
                    <div className="h-[200px] relative">
                      <img src={scene.imgUrl || `https://picsum.photos/400/250?scene=${scene.id}`} alt="scene" className="w-full h-full object-cover" />
                      <div className="absolute inset-0 bg-gradient-to-t from-[rgba(13,13,26,0.9)] via-transparent" />
                    </div>
                    <div className="p-5">
                      <div className="flex gap-2 mb-3 items-start">
                        <MapPin size={18} className="text-gold shrink-0 mt-[3px]" />
                        <div className="font-semibold text-[16px] text-white">{locName}</div>
                      </div>
                      <p className="text-muted text-[13px] leading-[1.6] m-0 flex items-start gap-1">
                        <Film size={14} className="shrink-0 mt-[4px]" />
                        ฉาก: {scene.description}
                      </p>
                    </div>
                  </div>
                );
              })
            ) : (
              <div className="col-span-full p-[60px] text-center bg-white/5 rounded-2xl border border-dashed border-white/10">
                <p className="text-muted m-0">ยังไม่มีข้อมูลสถานที่ถ่ายทำสำหรับภาพยนตร์เรื่องนี้</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </>
  );
};

export default MovieDetailPage;
