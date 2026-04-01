import React from 'react';
import { Eye, EyeOff, Trash2 } from 'lucide-react';
import { AdController } from '../../services/db';

const AdsTab = ({ ads, users, onToggleVis, onDelete }) => {
  return (
    <div>
      <h3 className="font-serif mb-4 text-[20px]">อนุมัติตั๋วสิทธิพิเศษจาก Partner</h3>
      <div className="overflow-x-auto">
        <table>
          <thead><tr><th>ID</th><th>หัวข้อ</th><th>ชื่อ Partner</th><th>แต้มที่ใช้แลก</th><th>สถานะ</th><th>จัดการ</th></tr></thead>
          <tbody>
            {ads.map(a => {
              const partner = users.find(u => u.id === a.partnerId);
              return (
                <tr key={a.id}>
                  <td>{a.id}</td>
                  <td>{a.title}</td>
                  <td>{partner ? partner.name : 'Unknown Partner'}</td>
                  <td className="text-gold font-medium">{a.pointsRequired > 0 ? `${a.pointsRequired} แต้ม` : '-'}</td>
                  <td>
                    {a.hidden ? 
                      <span className="text-muted bg-white/5 px-2 py-0.5 rounded-full text-xs">รออนุมัติ / ซ่อน</span> : 
                      <span className="text-green-400 bg-green-400/10 px-2 py-0.5 rounded-full text-xs">อนุมัติแล้ว / แสดง</span>
                    }
                  </td>
                  <td>
                    <button onClick={() => onToggleVis(a.id, AdController)} className="btn-ghost py-1.5 px-3 rounded-md mr-2 text-[13px] inline-flex items-center gap-1.5">
                      {a.hidden ? <Eye size={14} /> : <EyeOff size={14} />} 
                      {a.hidden ? 'อนุมัติ (แสดงผล)' : 'ระงับ (ซ่อน)'}
                    </button>
                    <button onClick={() => onDelete(a.id, AdController, 'ตั๋วสิทธิพิเศษ', a.title)} className="btn-danger p-1.5 rounded-md"><Trash2 size={14} /></button>
                  </td>
                </tr>
              )})}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default AdsTab;
