import React from 'react';
import { Search, Trash2, Check } from 'lucide-react';
import { TicketController } from '../../services/db';

const TicketsTab = ({ filteredTickets, ads, users, ticketSearch, setTicketSearch, onRefresh, onToast, onDelete }) => {
  return (
    <div>
      <div className="flex justify-between items-center mb-6 max-md:flex-col max-md:items-stretch gap-4">
        <h3 className="font-serif text-[20px] m-0">ประวัติตั๋วและสิทธิ์พิเศษที่ถูกผู้ใช้แลกไป</h3>
        <div className="relative">
          <input 
            type="text" 
            value={ticketSearch} 
            onChange={e => setTicketSearch(e.target.value)} 
            placeholder="ค้นหาด้วยรหัสตั๋ว เช่น MMM-..." 
            className="inp w-[300px] max-md:w-full"
            style={{ paddingLeft: '40px' }}
          />
          <Search size={18} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-muted" />
        </div>
      </div>
      <div className="overflow-x-auto">
        <table>
          <thead><tr><th>ID</th><th>รหัสตั๋ว</th><th>ชื่อตั๋ว (สิทธิพิเศษ)</th><th>ผู้ใช้</th><th>สถานะ</th><th>จัดการ</th></tr></thead>
          <tbody>
            {filteredTickets.map(t => {
              const ad = ads.find(a => a.id === t.adId || a.id === t.adid);
              const usr = users.find(u => u.id === t.userId || u.id === t.userid);
              return (
                <tr key={t.id}>
                  <td>{t.id}</td>
                  <td className="font-mono text-gold font-bold tracking-wider">{t.ticketCode}</td>
                  <td>{ad?.title || 'Unknown Ad'}</td>
                  <td>{usr ? `${usr.name}` : 'Unknown'}</td>
                  <td className={t.used ? 'text-red-400 font-medium' : 'text-green-400 font-medium'}>{t.used ? 'ใช้สิทธิ์แล้ว' : 'พร้อมใช้งาน'}</td>
                  <td>
                    <button onClick={async () => {
                      await TicketController.markUsed(t.id, !t.used);
                      onRefresh();
                      onToast(`เปลี่ยนสถานะตั๋ว ${t.ticketCode} สำเร็จ`);
                    }} className="btn-ghost py-1.5 px-3 rounded-md mr-2 text-[13px] border border-white/20">
                      {t.used ? 'รีเซ็ตเป็น "พร้อมใช้"' : 'ใช้งานตั๋วนี้'}
                    </button>
                    <button onClick={() => onDelete(t.id, TicketController, 'ตั๋ว', t.ticketCode)} className="btn-danger p-1.5 rounded-md"><Trash2 size={14} /></button>
                  </td>
                </tr>
              )
            })}
            {filteredTickets.length === 0 && (
              <tr>
                <td colSpan="6" className="text-center py-8 text-muted">ไม่พบข้อมูลตั๋วที่ค้นหา</td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default TicketsTab;
