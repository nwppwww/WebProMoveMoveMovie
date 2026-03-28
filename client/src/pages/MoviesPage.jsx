import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { Search, Popcorn } from 'lucide-react';
import { MovieCardSkeleton } from '../components/UI';
import { MovieController } from '../services/db';

const MoviesPage = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const queryParams = new URLSearchParams(location.search);
  const initQ = queryParams.get('q') || '';
  
  const [q, setQ] = useState(initQ);
  const [movies, setMovies] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setLoading(true);
    const results = MovieController.list();
    const filtered = q 
      ? results.filter(m => m.title.toLowerCase().includes(q.toLowerCase()) || m.description?.toLowerCase().includes(q.toLowerCase()))
      : results;
    
    setTimeout(() => {
      setMovies(filtered);
      setLoading(false);
    }, 400); // simulate network delay for shimmer
  }, [q]);

  const handleSearch = (e) => {
    e.preventDefault();
    navigate(`/movies?q=${encodeURIComponent(q)}`);
  };

  return (
    <div className="max-w-[1200px] mx-auto pt-[100px] pb-[60px] px-6">
      <form onSubmit={handleSearch} className="relative max-w-[600px] mb-10">
        <input
          type="text"
          placeholder="ค้นหาชื่อภาพยนตร์..."
          value={q} onChange={e => setQ(e.target.value)}
          className="w-full py-4 px-6 pl-[54px] bg-white/5 border border-white/10 rounded-[30px] text-main text-[16px] outline-none transition-all duration-200 focus:border-gold/50 focus:shadow-[0_0_0_4px_rgba(232,160,32,0.12)] placeholder:text-muted"
        />
        <Search size={22} className="text-muted absolute left-5 top-1/2 -translate-y-1/2" />
      </form>

      <div className="flex items-center gap-3 mb-7">
        <h2 className="font-serif text-[32px] m-0">ภาพยนตร์<span className="gold-text">ทั้งหมด</span></h2>
        <span className="badge badge-gray">{movies.length} เรื่อง</span>
      </div>

      <div className="grid grid-cols-[repeat(auto-fill,minmax(200px,1fr))] gap-5 max-md:grid-cols-[repeat(auto-fill,minmax(150px,1fr))] max-md:gap-3.5 2xl:grid-cols-[repeat(auto-fill,minmax(220px,1fr))]">
        {loading ? (
          [1, 2, 3, 4, 5, 6].map(i => <MovieCardSkeleton key={i} />)
        ) : movies.length > 0 ? (
          movies.map(m => (
            <div key={m.id} className="card-hover delay-200 rounded-2xl" onClick={() => navigate(`/movies/${m.id}`)}>
              <div className="pt-[140%] relative">
                <img src={m.poster} alt={m.title} className="absolute inset-0 w-full h-full object-cover" />
                <div className="absolute inset-0 bg-gradient-to-t from-[rgba(7,7,15,0.9)] via-transparent to-transparent opacity-80" />
              </div>
              <div className="px-3.5 py-3.5">
                <div className="font-semibold text-[15px] mb-1 truncate">{m.title}</div>
                <div className="text-muted text-[13px]">{m.releaseYear} • {m.genre || 'ทั่วไป'}</div>
              </div>
            </div>
          ))
        ) : (
          <div className="col-span-full py-[60px] px-5 text-center bg-card rounded-2xl border border-dashed border-white/10">
            <Popcorn size={48} className="text-white/10 mx-auto mb-4" />
            <div className="text-[18px] text-main mb-2">ไม่พบภาพยนตร์ที่ค้นหา</div>
            <div className="text-muted text-[14px]">ลองใช้คำค้นหาอื่นดูสิ!</div>
          </div>
        )}
      </div>
    </div>
  );
};

export default MoviesPage;
