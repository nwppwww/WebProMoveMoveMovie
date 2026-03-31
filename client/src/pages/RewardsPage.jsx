import React, { useState } from 'react';
import { Gift, Star, Clock, Ticket, MapPin, CheckCircle } from 'lucide-react';
import { Modal } from '../components/UI';
import { useAppContext } from '../context/AppContext';
import { RewardController, PointController, AdController, TicketController, LocationController, MovieController } from '../services/db';
import { useNavigate } from 'react-router-dom';

const RewardsPage = () => {
  const { user, toast } = useAppContext();
  const navigate = useNavigate();
  
  const rawRewards = RewardController.list();
  const rewards = rawRewards.filter(r => !r.hidden);
  
  const rawAds = AdController.list();
  const campaigns = rawAds.filter(a => !a.hidden);
  
  const [targetItem, setTargetItem] = useState(null);
  const [isProcessing, setIsProcessing] = useState(false);

  const handleRedeem = async () => {
    if (!targetItem) return;
    setIsProcessing(true);
    try {
      if (targetItem.type === 'reward') {
        const item = targetItem.data;
        await PointController.spend(user.id, item.points);
        await RewardController.update(item.id, { stock: item.stock - 1 });
        toast(`แลกรับ ${item.title} สำเร็จ!`);
        setTargetItem(null);
      } else if (targetItem.type === 'campaign') {
        const item = targetItem.data;
        await PointController.spend(user.id, item.pointsRequired);
        await TicketController.redeem(user.id, item.id);
        toast(`แลกตั๋วสิทธิพิเศษสำเร็จ! ไปดูรหัสตั๋วได้ที่หน้าโปรไฟล์ของคุณ`);
        setTargetItem(null);
        navigate('/profile');
      }
    } catch (err) {
      toast(err.message || 'แต้มสะสมไม่พอ หรือเกิดข้อผิดพลาด', 'error');
      setTargetItem(null);
    } finally {
      setIsProcessing(false);
    }
  };

  const pts = user ? PointController.get(user.id) : 0;

  if (!user) {
    return (
      <div className="text-center py-[120px] px-6 text-muted">
        <Ticket size={48} className="mx-auto mb-4" />
        <h2 className="font-serif text-[24px]">กรุณาเข้าสู่ระบบเพื่อดูและแลกของรางวัล</h2>
      </div>
    );
  }

  return (
    <div className="max-w-[1200px] mx-auto pt-[100px] pb-16 px-6">
      <div className="animate-fade-up">

        <div className="bg-card border border-gold/10 rounded-3xl p-10 mb-[40px] flex justify-between items-center max-md:flex-col max-md:text-center max-md:gap-8 max-md:p-6">
          <div>
            <h1 className="font-serif text-[clamp(28px,4vw,42px)] m-0 mb-3 flex items-center gap-3 max-md:justify-center">
              <Gift size={36} className="text-gold" /> 
              แลกของรางวัลสุด<span className="gold-text">พิเศษ</span>
            </h1>
            <p className="text-muted text-[16px]">สะสมแต้มจากการแชร์ประสบการณ์การไปตามรอยภาพยนตร์</p>
          </div>
          <div className="bg-gold/5 px-10 py-5 rounded-[20px] text-center border border-gold/20 shrink-0">
            <div className="text-muted text-[13px] mb-2 uppercase tracking-wide">แต้มสะสมปัจจุบัน</div>
            <div className="text-gold text-[48px] font-bold leading-none drop-shadow-[0_0_20px_rgba(232,160,32,0.3)]">
              {pts} <span className="text-[18px] text-main font-normal">pts</span>
            </div>
          </div>
        </div>

        {/* --- TICKETS SECTION --- */}
        {campaigns.length > 0 && (
          <div className="mb-[60px]">
            <h2 className="font-serif text-[24px] mb-6 flex items-center gap-2">
              <Ticket size={24} className="text-gold" /> ตั๋วสิทธิพิเศษจาก Partner
            </h2>
            <div className="grid grid-cols-[repeat(auto-fill,minmax(280px,1fr))] gap-6">
              {campaigns.map(c => (
                <div key={c.id} className="card-hover delay-100 bg-card border border-white/5 rounded-2xl overflow-hidden shadow-lg border-t-gold/20 flex flex-col">
                  <div className="p-6 flex-1">
                    <span className="badge badge-gold mb-3 inline-block">Partner Ticket</span>
                    {c.movieId && (
                      <div className="text-[12px] text-gold/80 font-bold mb-1 uppercase tracking-wider flex items-center gap-1.5 grayscale opacity-50 contrast-125">
                        🎬 {MovieController.get(c.movieId)?.title || 'ไม่พบชื่อภาพยนตร์'}
                      </div>
                    )}
                    <h3 className="font-serif text-[18px] mb-2 text-main">{c.title}</h3>
                    <p className="text-muted text-[14px] leading-[1.6] mb-4">{c.description}</p>
                  </div>
                  <div className="p-6 pt-0 mt-auto border-t border-white/5 pt-4">
                    <div className="flex justify-between items-center mb-4 text-[14px] text-gold font-bold bg-gold/5 px-4 py-2 rounded-xl">
                      <div className="flex items-center gap-1.5"><Star size={16} fill="var(--color-gold)"/> ใช้แต้มแลก</div>
                      <div className="text-[18px]">{c.pointsRequired > 0 ? `${c.pointsRequired} pts` : 'ฟรี!'}</div>
                    </div>
                    <button onClick={() => setTargetItem({ type: 'campaign', data: c })} className="btn-gold w-full py-3 rounded-xl text-[14px] flex justify-center items-center gap-2">
                      <Ticket size={16} /> {c.pointsRequired > 0 ? 'แลกรับตั๋วสิทธิพิเศษ' : 'รับสิทธิ์ฟรี'}
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* --- REWARDS SECTION --- */}
        <div>
          <h2 className="font-serif text-[24px] mb-6 flex items-center gap-2">
            <Gift size={24} className="text-gold" /> ของที่ระลึกจากแอป
          </h2>
          <div className="grid grid-cols-[repeat(auto-fill,minmax(280px,1fr))] gap-6">
            {rewards.map(r => (
              <div key={r.id} className="card-hover delay-200 bg-card border border-white/5 rounded-2xl overflow-hidden flex flex-col">
                <div className="h-[180px] relative shrink-0">
                  <img src={r.img || `https://picsum.photos/400/300?reward=${r.id}`} alt={r.title} className="w-full h-full object-cover" />
                  <div className="absolute top-3 right-3 bg-[rgba(7,7,15,0.8)] backdrop-blur-md px-3.5 py-1.5 rounded-full text-[13px] font-bold text-gold flex items-center gap-1.5 border border-gold/30">
                    <Star fill="var(--color-gold)" size={14} /> {r.points} แต้ม
                  </div>
                </div>
                <div className="p-6 flex flex-col flex-1">
                  <h3 className="font-serif text-[18px] mb-2">{r.title}</h3>
                  <div className="text-muted text-[13px] flex justify-between items-center mb-5 mt-auto">
                    <span className="flex items-center gap-1.5"><Clock size={14} /> {r.stock > 0 ? `เหลือ ${r.stock} สิทธิ์` : 'หมดแล้ว'}</span>
                  </div>
                  {r.stock > 0 ? (
                    <button onClick={() => setTargetItem({ type: 'reward', data: r })} className="btn-gold w-full py-3 rounded-xl text-[14px]">
                      แลกรับสิทธิ์
                    </button>
                  ) : (
                    <button className="btn-ghost w-full py-3 rounded-xl text-[14px] cursor-not-allowed opacity-50" disabled>
                      สิทธิ์เต็มแล้ว
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
          {rewards.length === 0 && (
            <div className="text-center py-10 text-muted">ยังไม่มีของรางวัลในระบบขณะนี้</div>
          )}
        </div>

      </div>

      <Modal open={!!targetItem} onClose={() => !isProcessing && setTargetItem(null)} title="ยืนยันการแลกรับสิทธิ์">
        {targetItem && (
          <div>
            <div className="text-center mb-6">
              <div className="w-20 h-20 rounded-full bg-gold/10 flex items-center justify-center mx-auto mb-4 text-gold">
                {targetItem.type === 'campaign' ? <Ticket size={32} /> : <Gift size={32} />}
              </div>
              <h4 className="font-serif text-[22px] m-0 mb-2">
                {targetItem.type === 'campaign' ? targetItem.data.title : targetItem.data.title}
              </h4>
              <p className="text-muted m-0">
                {targetItem.type === 'campaign' && targetItem.data.pointsRequired === 0 
                  ? 'รับสิทธิ์ฟรี ไม่หักแต้มสะสม' 
                  : `ใช้ ${targetItem.type === 'campaign' ? targetItem.data.pointsRequired : targetItem.data.points} แต้ม จาก ${pts} แต้มของคุณ`
                }
              </p>
            </div>
            
            <div className="flex gap-3 mt-8">
              <button onClick={() => setTargetItem(null)} disabled={isProcessing} className="btn-ghost flex-1 py-3 rounded-xl disabled:opacity-50">ยกเลิก</button>
              <button 
                onClick={handleRedeem} 
                disabled={isProcessing || pts < (targetItem.type === 'campaign' ? targetItem.data.pointsRequired : targetItem.data.points)}
                className={`flex-1 py-3 rounded-xl transition-all ${(!isProcessing && pts >= (targetItem.type === 'campaign' ? targetItem.data.pointsRequired : targetItem.data.points)) ? 'btn-gold' : 'bg-white/5 text-muted cursor-not-allowed'}`}>
                {isProcessing ? 'กำลังดำเนินการ...' : (pts >= (targetItem.type === 'campaign' ? targetItem.data.pointsRequired : targetItem.data.points) ? 'ยืนยันการแลก' : 'แต้มไม่พอ')}
              </button>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
};

export default RewardsPage;
