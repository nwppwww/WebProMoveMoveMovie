import React from 'react';
import { Edit2, Shield, LogIn, Trash2 } from 'lucide-react';

const UsersTab = ({ users, currentUser, onEditUser, onImpersonate, onDeleteUser }) => {
  return (
    <div>
      <div className="flex justify-between items-center mb-4">
        <div className="text-muted text-[13px]">
          รวม {users.length} บัญชี · สามารถแก้ไขข้อมูลและเข้าสู่ระบบแทนได้
        </div>
      </div>
      <div className="overflow-x-auto">
        <table>
          <thead><tr><th>ID</th><th>ชื่อ</th><th>อีเมล</th><th>บทบาท</th><th>วันที่สมัคร</th><th>จัดการ</th></tr></thead>
          <tbody>
            {users.map(u => (
              <tr key={u.id}>
                <td className="text-muted text-[12px]">{u.id}</td>
                <td className="font-medium">{u.name}</td>
                <td className="text-muted">{u.email}</td>
                <td><span className={u.role === 'admin' ? 'badge badge-green' : u.role === 'partner' ? 'badge' : 'badge badge-gray'}>{u.role}</span></td>
                <td className="text-muted text-[12px]">{u.createdAt ? new Date(u.createdAt).toLocaleDateString('th-TH') : '-'}</td>
                <td>
                  <div className="flex gap-1.5 flex-wrap">
                    <button onClick={() => onEditUser(u)} className="btn-ghost px-2.5 py-1 rounded-md text-[12px] flex items-center gap-1" title="แก้ไขข้อมูล">
                      <Edit2 size={13} /> แก้ไข
                    </button>
                    {u.id !== currentUser.id && (
                      <button onClick={() => onImpersonate(u)} className="btn-ghost px-2.5 py-1 rounded-md text-[12px] flex items-center gap-1 border-gold/30 text-gold" title="เข้าสู่ระบบแทน">
                        <LogIn size={13} /> Login แทน
                      </button>
                    )}
                    {u.id !== currentUser.id && u.role !== 'admin' && (
                      <button onClick={() => onDeleteUser(u)} className="btn-danger p-1 rounded-md" title="ลบบัญชี">
                        <Trash2 size={13} />
                      </button>
                    )}
                    {u.id === currentUser.id && (
                      <span className="text-muted text-[11px] px-2 py-1 flex items-center gap-1">
                        <Shield size={12} />คุณ
                      </span>
                    )}
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default UsersTab;
