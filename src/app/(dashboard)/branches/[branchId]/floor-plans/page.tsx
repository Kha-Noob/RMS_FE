'use client';

import { useState, useEffect, useCallback } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { api, getApiErrorMessage } from '@/lib/api';
import { toast } from '@/components/Toast';
import type { FloorPlan, Room } from '@/types';

export default function FloorPlansListPage() {
  const params = useParams();
  const router = useRouter();
  const branchId = params.branchId as string;

  const [floorPlans, setFloorPlans] = useState<FloorPlan[]>([]);
  const [rooms, setRooms] = useState<Room[]>([]);
  const [loading, setLoading] = useState(true);
  const [creating, setCreating] = useState(false);
  const [deletingId, setDeletingId] = useState<number | null>(null);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [selectedRoomId, setSelectedRoomId] = useState<number | ''>('');
  const [newName, setNewName] = useState('');
  const [newWidth, setNewWidth] = useState(1200);
  const [newHeight, setNewHeight] = useState(800);

  const loadFloorPlans = useCallback(async () => {
    if (!branchId) return;
    setLoading(true);
    try {
      const res = await api.get<FloorPlan[]>(`/api/branches/${branchId}/floor-plans`);
      setFloorPlans(res);
    } catch (err) {
      toast.error(getApiErrorMessage(err, 'Không tải được danh sách sơ đồ tầng'));
    } finally {
      setLoading(false);
    }
  }, [branchId]);

  useEffect(() => { loadFloorPlans(); }, [loadFloorPlans]);

  useEffect(() => {
    api.get<Room[]>('/api/pos/rooms', { params: { branchId } })
      .then(setRooms)
      .catch(() => setRooms([]));
  }, [branchId]);

  const resetCreateForm = () => {
    setSelectedRoomId('');
    setNewName('');
    setNewWidth(1200);
    setNewHeight(800);
  };

  const handleCreate = async () => {
    if (!selectedRoomId) { toast.warning('Chọn phòng/khu vực'); return; }
    if (!newName.trim()) { toast.warning('Nhập tên sơ đồ tầng'); return; }
    setCreating(true);
    try {
      await api.post(`/api/branches/${branchId}/floor-plans`, {
        roomId: selectedRoomId,
        name: newName.trim(),
        width: newWidth,
        height: newHeight,
      });
      toast.success('Tạo sơ đồ tầng thành công');
      setShowCreateModal(false);
      resetCreateForm();
      await loadFloorPlans();
    } catch (err) {
      toast.error(getApiErrorMessage(err, 'Tạo sơ đồ tầng thất bại'));
    } finally {
      setCreating(false);
    }
  };

  const handlePublish = async (id: number) => {
    try {
      await api.post(`/api/floor-plans/${id}/publish`);
      toast.success('Đã publish');
      await loadFloorPlans();
    } catch (err) {
      toast.error(getApiErrorMessage(err, 'Publish thất bại'));
    }
  };

  const handleUnpublish = async (id: number) => {
    try {
      await api.post(`/api/floor-plans/${id}/unpublish`);
      toast.success('Đã unpublish');
      await loadFloorPlans();
    } catch (err) {
      toast.error(getApiErrorMessage(err, 'Unpublish thất bại'));
    }
  };

  const handleDelete = async (id: number) => {
    if (!confirm('Xóa sơ đồ tầng này? Các đối tượng trong sơ đồ cũng sẽ bị xóa, nhưng phòng và bàn POS sẽ được giữ lại.')) return;
    setDeletingId(id);
    try {
      await api.delete(`/api/floor-plans/${id}`);
      toast.success('Xóa sơ đồ tầng thành công');
      await loadFloorPlans();
    } catch (err) {
      console.error('Delete floor plan failed', err);
      toast.error(getApiErrorMessage(err, 'Xóa sơ đồ tầng thất bại'));
    } finally {
      setDeletingId(null);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-slate-800">Floor Plans</h1>
          <p className="text-sm text-slate-500 mt-0.5">Chi nhánh: {branchId}</p>
        </div>
        <button
          onClick={() => setShowCreateModal(true)}
          className="px-4 py-2 rounded-lg bg-[#25439b] hover:bg-[#1c3580] text-white text-sm font-medium transition-colors"
        >
          + Tạo Floor Plan
        </button>
      </div>

      {loading ? (
        <div className="flex justify-center py-12">
          <div className="w-8 h-8 border-3 border-slate-200 border-t-[#25439b] rounded-full animate-spin" />
        </div>
      ) : floorPlans.length === 0 ? (
        <div className="text-center py-12 bg-white rounded-xl border border-slate-200">
          <p className="text-slate-400">Chưa có floor plan nào</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {floorPlans.map(fp => (
            <div key={fp.id} className="bg-white rounded-xl border border-slate-200 overflow-hidden hover:shadow-md transition-shadow">
              <div className="h-40 bg-slate-100 relative overflow-hidden">
                {fp.floorDiagramImageUrl ? (
                  <img src={fp.floorDiagramImageUrl} alt={fp.name} className="w-full h-full object-cover" />
                ) : (
                  <div className="flex items-center justify-center h-full text-slate-400 text-sm">
                    Chưa có background
                  </div>
                )}
                <div className="absolute top-2 right-2">
                  <span className={`px-2 py-0.5 rounded text-[10px] font-medium ${fp.status === 'published' ? 'bg-emerald-100 text-emerald-700' : 'bg-slate-100 text-slate-500'}`}>
                    {fp.status === 'published' ? 'Đã publish' : 'Draft'}
                  </span>
                </div>
              </div>

              <div className="p-4">
                <h3 className="font-semibold text-slate-800">{fp.name}</h3>
                <p className="text-xs text-slate-400 mt-1">
                  {fp.room?.name || 'No linked room'} · {fp.width}×{fp.height}px
                </p>
                {fp.panoramaUrl && (
                  <p className="text-xs text-amber-600 mt-1">Có ảnh 360°</p>
                )}

                <div className="flex flex-wrap gap-1.5 mt-3">
                  <button
                    onClick={() => router.push(`/branches/${branchId}/floor-plans/${fp.id}/edit`)}
                    className="px-3 py-1.5 text-xs bg-[#25439b] text-white rounded-lg hover:bg-[#1c3580] transition-colors"
                  >
                    Chỉnh sửa
                  </button>
                  {fp.status === 'draft' ? (
                    <button
                      onClick={() => handlePublish(fp.id)}
                      className="px-3 py-1.5 text-xs bg-emerald-500 text-white rounded-lg hover:bg-emerald-600 transition-colors"
                    >
                      Publish
                    </button>
                  ) : (
                    <button
                      onClick={() => handleUnpublish(fp.id)}
                      className="px-3 py-1.5 text-xs bg-amber-500 text-white rounded-lg hover:bg-amber-600 transition-colors"
                    >
                      Unpublish
                    </button>
                  )}
                  <button
                    onClick={() => window.open(`/restaurants/r1/branches/${branchId}/floor-plan?fpId=${fp.id}`, '_blank')}
                    className="px-3 py-1.5 text-xs bg-slate-100 text-slate-600 rounded-lg hover:bg-slate-200 transition-colors"
                  >
                    Preview
                  </button>
                  <button
                    onClick={() => handleDelete(fp.id)}
                    disabled={deletingId === fp.id}
                    className="px-3 py-1.5 text-xs bg-red-50 text-red-600 rounded-lg hover:bg-red-100 transition-colors disabled:opacity-50"
                  >
                    {deletingId === fp.id ? 'Đang xóa...' : 'Xóa'}
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {showCreateModal && (
        <div className="fixed inset-0 bg-slate-900/30 backdrop-blur-sm z-50 flex items-center justify-center p-4" onClick={() => setShowCreateModal(false)}>
          <div className="bg-white rounded-2xl w-full max-w-md shadow-xl border border-slate-200" onClick={e => e.stopPropagation()}>
            <div className="flex items-center justify-between p-4 border-b border-slate-200">
              <h3 className="text-lg font-semibold text-slate-800">Tạo Floor Plan mới</h3>
              <button onClick={() => setShowCreateModal(false)} className="text-slate-400 hover:text-slate-600 text-xl">×</button>
            </div>
            <div className="p-4 space-y-3">
              <div>
                <label className="text-sm text-slate-600 mb-1 block">Room/Area *</label>
                <select
                  value={selectedRoomId}
                  onChange={e => {
                    const roomId = e.target.value ? Number(e.target.value) : '';
                    setSelectedRoomId(roomId);
                    const room = rooms.find(r => r.id === roomId);
                    if (room && !newName.trim()) setNewName(room.name);
                  }}
                  className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#25439b]"
                >
                  <option value="">Select room/area</option>
                  {rooms.map(room => (
                    <option key={room.id} value={room.id}>{room.name}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="text-sm text-slate-600 mb-1 block">Floor Plan name *</label>
                <input
                  type="text"
                  value={newName}
                  onChange={e => setNewName(e.target.value)}
                  placeholder="VD: Tầng 1 - Main Hall"
                  className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#25439b]"
                  autoFocus
                />
              </div>
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="text-sm text-slate-600 mb-1 block">Width</label>
                  <input type="number" value={newWidth} onChange={e => setNewWidth(parseInt(e.target.value) || 1200)} className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#25439b]" />
                </div>
                <div>
                  <label className="text-sm text-slate-600 mb-1 block">Height</label>
                  <input type="number" value={newHeight} onChange={e => setNewHeight(parseInt(e.target.value) || 800)} className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#25439b]" />
                </div>
              </div>
            </div>
            <div className="p-4 border-t border-slate-200 flex justify-end gap-2">
              <button onClick={() => setShowCreateModal(false)} className="px-4 py-2 text-sm text-slate-600 hover:bg-slate-100 rounded-lg">Hủy</button>
              <button
                onClick={handleCreate}
                disabled={creating || !selectedRoomId || !newName.trim()}
                className="px-4 py-2 text-sm bg-[#25439b] hover:bg-[#1c3580] text-white rounded-lg font-medium disabled:opacity-50 transition-colors"
              >
                {creating ? 'Đang tạo...' : 'Tạo'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}