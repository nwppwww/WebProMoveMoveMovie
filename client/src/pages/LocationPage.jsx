import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, MapPin, Tag, MessagesSquare, ThumbsUp, Map, Star, Compass } from 'lucide-react';
import { Shimmer, LeafletMap, Stars, Field } from '../components/UI';
import { useAppContext } from '../context/AppContext';
import { LocationController, AdController, ReviewController, MovieController } from '../services/db';

const LocationPage = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user, toast } = useAppContext();
  
  const [loc, setLoc] = useState(null);
  const [ads, setAds] = useState([]);
  const [reviews, setReviews] = useState([]);
  const [movies, setMovies] = useState([]);
  const [loading, setLoading] = useState(true);

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
        setAds(AdController.list().filter(a => !a.hidden)); // In a real app, distance based
        setReviews(ReviewController.list(parsedId));
        
        // Find movies featuring this location
        const dbMovies = MovieController.list();
        const relatedMovies = dbMovies.filter(m => MovieController.scenes(m.id).some(s => s.locationId === parsedId));
        setMovies(relatedMovies);
      }
      setLoading(false);
    }, 400);
  }, [id]);

  const submitReview = (e) => {
    e.preventDefault();
    if (!user) return toast('กรุณาเข้าสู่ระบบก่อนเขียนรีวิว', 'error');
    if (!reviewText || !reviewStars) return toast('กรุณาระบุคะแนนและข้อความ', 'error');

    const nw = ReviewController.add({ userId: user.id, userName: user.name, locationId: parseInt(id), rating: reviewStars, comment: reviewText });
    setReviews([nw, ...reviews]);
    setReviewText(''); setReviewStars(0);
    toast('บันทึกรีวิวสำเร็จ');
  };

  if (loading) {
    return (
      <div style={{ maxWidth: 800, margin: '140px auto 100px', padding: '0 24px' }}>
        <Shimmer h={40} w="60%" style={{ marginBottom: 20 }} />
        <Shimmer h={200} style={{ marginBottom: 40 }} />
        <Shimmer h={100} style={{ marginBottom: 20 }} />
      </div>
    );
  }

  if (!loc) {
    return (
      <div style={{ textAlign: 'center', padding: '120px 20px', color: 'var(--muted)' }}>
        <h2>ไม่พบข้อมูลสถานที่</h2>
        <button className="btn-ghost" onClick={() => navigate('/map')} style={{ marginTop: 20, padding: '10px 24px', borderRadius: 20 }}>
           กลับไปหน้าแผนที่
        </button>
      </div>
    );
  }

  const avgRating = reviews.length > 0 ? (reviews.reduce((acc, r) => acc + r.rating, 0) / reviews.length).toFixed(1) : '0.0';

  return (
    <div style={{ maxWidth: 1000, margin: '0 auto', padding: '100px 24px 60px' }}>
      <button className="btn-ghost" onClick={() => navigate(-1)} style={{ padding: '8px 16px', borderRadius: 20, marginBottom: 24, fontSize: 13, display: 'inline-flex', alignItems: 'center', gap: 6 }}>
        <ArrowLeft size={14} /> ย้อนกลับ
      </button>

      <div className="animate-fadeUp">
        <div style={{ display: 'flex', flexDirection: 'column', md: { flexDirection: 'row' }, gap: 40, marginBottom: 60 }}>
          
          <div style={{ flex: 1 }}>
            <div style={{ display: 'flex', gap: 12, marginBottom: 16 }}>
              <span className="badge"><MapPin size={12} style={{ display: 'inline', marginRight: 4 }} /> {loc.province}</span>
              {loc.type && <span className="badge badge-gray"><Tag size={12} style={{ display: 'inline', marginRight: 4 }} /> {loc.type}</span>}
              <span className="badge" style={{ background: 'rgba(232,160,32,-9)', color: 'var(--gold)' }}><Star size={12} style={{ display: 'inline', marginRight: 4 }} /> {avgRating}</span>
            </div>
            
            <h1 className="font-serif" style={{ fontSize: 'clamp(32px, 4vw, 42px)', margin: '0 0 16px', lineHeight: 1.2 }}>{loc.name}</h1>
            <p style={{ color: '#A8A5B4', lineHeight: 1.85, fontSize: 15, marginBottom: 36, maxWidth: 680 }}>
              {loc.description || 'ไม่มีคำอธิบาย'}
            </p>

            {loc.lat && loc.lng && (
              <div style={{ marginBottom: 40 }}>
                <LeafletMap locations={[loc]} center={[loc.lat, loc.lng]} zoom={15} height={300} />
                <div style={{ marginTop: 16 }}>
                  <a 
                    href={`https://www.google.com/maps/search/?api=1&query=${loc.lat},${loc.lng}`}
                    target="_blank"
                    rel="noreferrer"
                    className="btn-gold"
                    style={{ display: 'inline-flex', alignItems: 'center', gap: 10, padding: '12px 24px', borderRadius: 12, textDecoration: 'none', fontWeight: 600, fontSize: 15 }}
                  >
                    <Map size={18} /> นำทางด้วย Google Maps
                  </a>
                </div>
              </div>
            )}

            {/* Ads Panel */}
            {ads.length > 0 && (
              <div style={{ background: 'linear-gradient(45deg, rgba(232,160,32,.08), rgba(232,160,32,.02))', border: '1px solid rgba(232,160,32,.2)', borderRadius: 16, padding: 24, marginBottom: 40 }}>
                <h3 className="font-serif" style={{ color: 'var(--gold)', fontSize: 18, marginBottom: 16 }}>
                  <Compass size={18} style={{ display: 'inline', marginRight: 8, verticalAlign: 'middle' }} /> 
                  สถานที่หรือโปรโมชั่นใกล้เคียง
                </h3>
                <div style={{ display: 'grid', gap: 16 }}>
                  {ads.slice(0, 2).map(ad => (
                    <div key={ad.id} style={{ background: 'rgba(7,7,15,.6)', borderRadius: 12, padding: 16 }}>
                      <div style={{ fontWeight: 600, color: 'var(--text)', marginBottom: 4 }}>{ad.title}</div>
                      <div style={{ fontSize: 13, color: 'var(--muted)' }}>{ad.description}</div>
                    </div>
                  ))}
                </div>
              </div>
            )}
            
          </div>

          <div style={{ width: '100%', maxWidth: 320 }}>
            {/* Related Movies */}
            <div style={{ background: 'var(--bg-card)', border: '1px solid rgba(255,255,255,.06)', borderRadius: 16, padding: 24, marginBottom: 24 }}>
              <h3 className="font-serif" style={{ fontSize: 18, marginBottom: 16 }}>ปรากฏในภาพยนตร์</h3>
              {movies.length > 0 ? (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                  {movies.map(m => (
                    <div key={m.id} onClick={() => navigate(`/movies/${m.id}`)}
                      style={{ display: 'flex', gap: 12, alignItems: 'center', cursor: 'pointer', padding: 8, borderRadius: 8, transition: 'background .2s' }}
                      onMouseOver={e => e.currentTarget.style.background = 'rgba(255,255,255,.05)'}
                      onMouseOut={e => e.currentTarget.style.background = 'transparent'}>
                      <img src={m.poster} alt={m.title} style={{ width: 44, height: 62, borderRadius: 6, objectFit: 'cover' }} />
                      <div>
                        <div style={{ fontSize: 14, fontWeight: 600, color: 'var(--text)' }}>{m.title}</div>
                        <div style={{ fontSize: 12, color: 'var(--muted)' }}>{m.releaseYear}</div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div style={{ fontSize: 13, color: 'var(--muted)' }}>ไม่มีข้อมูลภาพยนตร์ที่แนบกับสถานที่นี้</div>
              )}
            </div>

            {/* Review Form */}
            <div style={{ background: 'var(--bg-card)', border: '1px solid rgba(255,255,255,.06)', borderRadius: 16, padding: 24 }}>
              <h3 className="font-serif" style={{ fontSize: 18, marginBottom: 16 }}>เขียนรีวิว</h3>
              {user ? (
                <form onSubmit={submitReview}>
                  <div style={{ marginBottom: 16 }}>
                     <Stars val={reviewStars} onChange={setReviewStars} size={24} />
                  </div>
                  <Field>
                    <textarea placeholder="บรรยากาศเป็นอย่างไรบ้าง..." className="inp" value={reviewText} onChange={e => setReviewText(e.target.value)} />
                  </Field>
                  <button type="submit" className="btn-gold" style={{ width: '100%', padding: '12px 0', borderRadius: 10 }}>ยืนยันรีวิว</button>
                </form>
              ) : (
                <div style={{ textAlign: 'center', padding: '20px 0' }}>
                  <p style={{ fontSize: 13, color: 'var(--muted)', marginBottom: 16 }}>กรุณาเข้าสู่ระบบเพื่อเขียนรีวิวแชร์ประสบการณ์</p>
                  <button onClick={() => navigate('/auth')} className="btn-ghost" style={{ padding: '8px 20px', borderRadius: 10, fontSize: 13 }}>เข้าสู่ระบบ</button>
                </div>
              )}
            </div>
          </div>

        </div>

        {/* Reviews List */}
        <div style={{ borderTop: '1px solid rgba(255,255,255,.06)', paddingTop: 40 }}>
          <h2 className="font-serif" style={{ fontSize: 24, marginBottom: 24 }}>รีวิวจากผู้ใช้งาน ({reviews.length})</h2>
          {reviews.length > 0 ? (
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: 20 }}>
              {reviews.map(r => (
                <div key={r.id} style={{ background: 'var(--bg-card)', border: '1px solid rgba(255,255,255,.06)', borderRadius: 16, padding: '20px 24px' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 16 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                      <div style={{ width: 36, height: 36, borderRadius: '50%', background: 'rgba(232,160,32,.1)', color: 'var(--gold)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 600 }}>
                        {r.userName?.charAt(0) || 'U'}
                      </div>
                      <div>
                        <div style={{ fontWeight: 600, fontSize: 14 }}>{r.userName || 'ผู้ใช้แอป'}</div>
                        <div style={{ fontSize: 12, color: 'var(--muted)' }}>{new Date(r.createdAt).toLocaleDateString('th-TH')}</div>
                      </div>
                    </div>
                    <Stars val={r.rating} size={14} readonly />
                  </div>
                  <p style={{ color: '#EDE9E3', fontSize: 14, lineHeight: 1.6, margin: 0 }}>"{r.comment}"</p>
                </div>
              ))}
            </div>
          ) : (
            <div style={{ padding: '40px', textAlign: 'center', background: 'var(--bg-card)', borderRadius: 16, border: '1px dashed rgba(255,255,255,.1)' }}>
              <MessagesSquare size={32} color="var(--muted)" style={{ margin: '0 auto 12px' }} />
              <div style={{ color: 'var(--text)', marginBottom: 4 }}>ยังไม่มีรีวิว</div>
              <div style={{ color: 'var(--muted)', fontSize: 13 }}>เป็นคนแรกที่แชร์ประสบการณ์สิ!</div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default LocationPage;
