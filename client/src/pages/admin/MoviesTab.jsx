import React from 'react';
import { Edit2, Trash2, Plus, Film } from 'lucide-react';
import { MovieController } from '../../services/db';

const MoviesTab = ({ movies, onEdit, onCreate, onDelete }) => {
  return (
    <div>
      <div className="flex justify-end mb-4">
        <button onClick={onCreate} className="btn-gold flex items-center gap-1.5 py-2 px-4 rounded-lg text-sm">
          <Plus size={16} /> เพิ่มภาพยนตร์
        </button>
      </div>
      <div className="overflow-x-auto">
        <table>
          <thead><tr><th>ID</th><th>ชื่อเรื่อง</th><th>ปีที่ฉาย</th><th>หมวดหมู่</th><th>จัดการ</th></tr></thead>
          <tbody>
            {movies.map(m => (
              <tr key={m.id}>
                <td>{m.id}</td>
                <td>{m.title}</td>
                <td>{m.releaseYear}</td>
                <td>{m.genre}</td>
                <td>
                  <button onClick={() => onEdit(m)} className="btn-ghost p-1.5 rounded-md mr-2"><Edit2 size={14} /></button>
                  <button onClick={() => onDelete(m.id, MovieController, 'ภาพยนตร์', m.title)} className="btn-danger p-1.5 rounded-md"><Trash2 size={14} /></button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default MoviesTab;
