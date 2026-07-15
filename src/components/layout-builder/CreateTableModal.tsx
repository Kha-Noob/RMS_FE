'use client'

import { useEffect, useRef, useState } from 'react'
import type { TableStyle } from '@/types'
import { TABLE_STYLE_OPTIONS } from '@/types'

interface CreateTableModalProps {
  isOpen: boolean
  onClose: () => void
  onCreate: (data: { name: string; capacity: number; zone: string; notes: string; tableStyle: TableStyle }) => void
  defaultName?: string
  defaultCapacity?: number
  defaultStyle?: TableStyle
}

export default function CreateTableModal({
  isOpen,
  onClose,
  onCreate,
  defaultName = '',
  defaultCapacity = 4,
  defaultStyle = 'ROUND',
}: CreateTableModalProps) {
  const [name, setName] = useState(defaultName)
  const [capacity, setCapacity] = useState(defaultCapacity)
  const [zone, setZone] = useState('')
  const [notes, setNotes] = useState('')
  const [tableStyle, setTableStyle] = useState<TableStyle>(defaultStyle)
  const nameRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    if (isOpen) {
      setName(defaultName)
      setCapacity(defaultCapacity)
      setZone('')
      setNotes('')
      setTableStyle(defaultStyle)
      setTimeout(() => nameRef.current?.focus(), 100)
    }
  }, [isOpen, defaultName, defaultCapacity, defaultStyle])

  if (!isOpen) return null

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!name.trim()) return
    onCreate({ name: name.trim(), capacity, zone: zone.trim(), notes: notes.trim(), tableStyle })
    onClose()
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div className="absolute inset-0 bg-black/50" onClick={onClose} />
      <div className="relative bg-white rounded-lg shadow-xl w-full max-w-md mx-4 p-6">
        <h2 className="text-lg font-semibold text-slate-900 mb-4">Tạo bàn mới</h2>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Tên bàn</label>
            <input
              ref={nameRef}
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              placeholder="VD: Bàn 1"
              required
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Sức chứa</label>
            <div className="flex items-center border border-slate-300 rounded-lg overflow-hidden focus-within:border-blue-500 focus-within:ring-2 focus-within:ring-blue-500/20">
              <button type="button" onClick={() => setCapacity(c => Math.max(1, c - 1))} className="px-3 py-2 text-slate-500 hover:bg-slate-100 transition-colors text-lg font-medium">−</button>
              <input
                type="number"
                value={capacity}
                onChange={(e) => setCapacity(Math.max(1, Number(e.target.value)))}
                min={1}
                className="flex-1 text-center bg-white text-sm text-slate-800 focus:outline-none [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
              />
              <span className="text-xs text-slate-400 px-1">khách</span>
              <button type="button" onClick={() => setCapacity(c => c + 1)} className="px-3 py-2 text-slate-500 hover:bg-slate-100 transition-colors text-lg font-medium">+</button>
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Kiểu bàn</label>
            <div className="grid grid-cols-2 gap-2">
              {TABLE_STYLE_OPTIONS.map(opt => (
                <button
                  key={opt.value}
                  type="button"
                  onClick={() => setTableStyle(opt.value)}
                  className={`flex items-center gap-2 px-3 py-2 border rounded-lg text-sm transition-colors ${tableStyle === opt.value ? 'border-blue-500 bg-blue-50 text-blue-700 ring-1 ring-blue-500/30' : 'border-slate-300 text-slate-600 hover:border-slate-400'}`}
                >
                  <span>{opt.icon}</span>
                  <span>{opt.label}</span>
                </button>
              ))}
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Khu vực (tùy chọn)</label>
            <input
              type="text"
              value={zone}
              onChange={(e) => setZone(e.target.value)}
              className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              placeholder="VD: Tầng 1, Sân vườn"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Ghi chú (tùy chọn)</label>
            <textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              rows={2}
              className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 resize-none"
            />
          </div>
          <div className="flex justify-end gap-3 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-sm font-medium text-slate-700 bg-slate-100 rounded-lg hover:bg-slate-200 transition-colors"
            >
              Hủy
            </button>
            <button
              type="submit"
              className="px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-lg hover:bg-blue-700 transition-colors"
            >
              Tạo
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
