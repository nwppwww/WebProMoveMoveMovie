import React, { useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { Home, Film, Map, Gift, User, Settings, Megaphone, Clapperboard, LogOut, Star, Menu, X } from 'lucide-react';
import { useAppContext } from '../context/AppContext';
import { PointController } from '../services/db';

const Navbar = () => {
  const { user, logout } = useAppContext();
  const [mobileOpen, setMobileOpen] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();
  const page = location.pathname;

  const pts = user ? PointController.get(user.id) : 0;
  
  const links = [
    { id: '/', l: 'หน้าหลัก', icon: Home },
    { id: '/movies', l: 'ภาพยนตร์', icon: Film },
    { id: '/map', l: 'แผนที่', icon: Map },
    ...(user ? [
      { id: '/rewards', l: 'ของรางวัล', icon: Gift },
      { id: '/profile', l: 'โปรไฟล์', icon: User }
    ] : []),
    ...(user?.role === 'admin' ? [{ id: '/admin', l: 'Admin', icon: Settings }] : []),
    ...(user?.role === 'partner' ? [{ id: '/partner', l: 'Partner', icon: Megaphone }] : []),
  ];

  const navTo = (path) => {
    navigate(path);
    setMobileOpen(false);
  };

  return (
    <>
      <nav className="fixed top-0 left-0 right-0 z-[1000] h-[62px] bg-[#07070F]/82 backdrop-blur-[22px] border-b border-gold/10">
        <div className="max-w-[1200px] mx-auto px-6 h-full flex items-center justify-between">
          
          <button onClick={() => navTo('/')} className="bg-transparent border-none cursor-pointer flex items-center gap-[9px]">
            <Clapperboard className="text-gold" size={24} />
            <span className="font-serif text-[18px] text-main font-bold mt-1">
              movemovemovie
            </span>
          </button>
          
          <div className="hidden md:flex items-center gap-0.5">
            {links.map(lk => {
              const active = page === lk.id || (lk.id !== '/' && page.startsWith(lk.id));
              return (
                <button key={lk.id} onClick={() => navTo(lk.id)}
                  className={`bg-transparent cursor-pointer font-sans text-[13px] font-medium px-3.5 py-1.5 border-b-[2px] transition-all -mb-[2px] flex items-center gap-1.5 
                  ${active ? 'text-gold border-gold' : 'text-muted border-transparent hover:text-main'}`}>
                  <lk.icon size={15} className="inline-block align-middle" /> {lk.l}
                </button>
              );
            })}
          </div>

          <div className="flex items-center gap-[10px]">
            {user ? (
              <>
                <div className="flex items-center gap-1 bg-gold/10 border border-gold/20 rounded-full px-[13px] py-1 text-[13px] text-gold font-semibold">
                  <Star size={14} className="fill-gold" /> {pts}
                </div>
                <button onClick={logout} className="bg-white/5 text-muted border border-white/10 cursor-pointer transition-all hover:border-gold/30 hover:text-gold flex items-center gap-1.5 rounded-xl px-3.5 py-1.5 text-[13px]">
                  <LogOut size={14} className="inline-block align-middle" /> ออก
                </button>
              </>
            ) : (
              <button onClick={() => navTo('/auth')} className="bg-gradient-to-br from-gold to-gold-dim text-[#07070F] font-semibold border-none cursor-pointer transition-all hover:from-gold-light hover:to-gold hover:-translate-y-0.5 hover:shadow-[0_10px_28px_rgba(232,160,32,0.38)] rounded-[10px] px-5 py-2 text-[13px]">
                เข้าสู่ระบบ
              </button>
            )}
            
            <button className="md:hidden flex flex-col gap-[5px] bg-transparent border-none cursor-pointer p-1" onClick={() => setMobileOpen(!mobileOpen)}>
               {mobileOpen ? <X className="text-muted" size={24}/> : <Menu className="text-muted" size={24}/>}
            </button>
          </div>
        </div>
      </nav>
      
      {/* Mobile Menu */}
      {mobileOpen && (
        <div className="fixed top-[62px] left-0 right-0 z-[999] bg-[#07070F]/97 backdrop-blur-[20px] border-b border-gold/10 flex flex-col p-3 animate-fade-in md:hidden">
          {links.map(lk => {
            const active = page === lk.id || (lk.id !== '/' && page.startsWith(lk.id));
            return (
              <button key={lk.id} onClick={() => navTo(lk.id)} 
                className={`bg-transparent border-none font-sans text-[15px] p-[14px_16px] cursor-pointer text-left rounded-[10px] transition-all flex items-center gap-[10px] w-full
                ${active ? 'bg-gold/10 text-gold' : 'text-muted hover:bg-gold/10 hover:text-gold'}`}>
                <lk.icon size={18} className="inline-block align-middle" /> {lk.l}
              </button>
            );
          })}
        </div>
      )}
    </>
  );
};

export default Navbar;
