import React from 'react';
import { Edit2, Trash2, Plus, Eye, EyeOff, MapPin } from 'lucide-react';
import { LocationController } from '../../services/db';

const LocationsTab = ({ locations, movies, onEdit, onCreate, onDelete, onToggleVis }) => {
  return (
    <div>
      <div className="flex justify-end mb-4">
        <button onClick={onCreate} className="btn-gold flex items-center gap-1.5 py-2 px-4 rounded-lg text-sm">
          <Plus size={16} /> เพิ่มสถานที่
        </button>
      </div>
      <div className="overflow-x-auto">
        <table>
          <thead><tr><th>ID</th><th>ชื่อสถานที่</th><th>ภาพยนตร์</th><th>จังหวัด</th><th>สถานะ</th><th>จัดการ</th></tr></thead>
          <tbody>
            {locations.map(l => (
              <tr key={l.id}>
                <td>{l.id}</td>
                <td>{l.name}</td>
                <td className="text-gold font-medium">{movies.find(m => m.id === l.movieId)?.title || '-'}</td>
                <td>{l.province}</td>
                <td>{l.hidden ? <span className="text-muted"><EyeOff size={14} className="inline mr-1" /> ซ่อน</span> : <span className="text-gold"><Eye size={14} className="inline mr-1" /> แสดง</span>}</td>
                <td>
                  <button onClick={() => onToggleVis(l.id, LocationController)} className="btn-ghost p-1.5 rounded-md mr-2">{l.hidden ? <Eye size={14} /> : <EyeOff size={14} />}</button>
                  <button onClick={() => onEdit(l)} className="btn-ghost p-1.5 rounded-md mr-2"><Edit2 size={14} /></button>
                  <button onClick={() => onDelete(l.id, LocationController, 'สถานที่', l.name)} className="btn-danger p-1.5 rounded-md"><Trash2 size={14} /></button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default LocationsTab;
