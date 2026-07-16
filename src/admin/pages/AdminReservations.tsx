// ADMIN RESERVATIONS — View and manage table bookings

import { useMemo, useState } from 'react';
import { CalendarDays, Users, X } from 'lucide-react';
import type { Reservation } from '../../types';
import { formatRelativeTime, useReservationsAdminData } from '../hooks/useAdminData';

type RStatus = Reservation['status'];

const STATUS_CONFIG: Record<RStatus, { label: string; cls: string }> = {
  pending:   { label: 'Pending',   cls: 'bg-yellow-100 text-yellow-700' },
  confirmed: { label: 'Confirmed', cls: 'bg-blue-100 text-blue-700' },
  seated:    { label: 'Seated',    cls: 'bg-green-100 text-green-700' },
  completed: { label: 'Completed', cls: 'bg-gray-100 text-gray-600' },
  cancelled: { label: 'Cancelled', cls: 'bg-red-100 text-red-600' },
  no_show:   { label: 'No Show',   cls: 'bg-rose-100 text-rose-700' },
};

const NEXT_STATUS: Partial<Record<RStatus, RStatus>> = {
  pending: 'confirmed', confirmed: 'seated', seated: 'completed',
};

const TABS: { key: RStatus | 'all'; label: string }[] = [
  { key: 'all', label: 'All' }, { key: 'pending', label: 'Pending' }, { key: 'confirmed', label: 'Confirmed' },
  { key: 'seated', label: 'Seated' }, { key: 'completed', label: 'Completed' }, { key: 'cancelled', label: 'Cancelled' },
];

function DetailModal({ reservation, onClose, onUpdate }: { reservation: Reservation; onClose: () => void; onUpdate: (id: string, s: RStatus) => void }) {
  const s = STATUS_CONFIG[reservation.status];
  const next = NEXT_STATUS[reservation.status];
  const date = new Date(reservation.date).toLocaleDateString('en-IE', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' });
  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl max-w-md w-full shadow-2xl">
        <div className="flex items-center justify-between p-5 border-b border-gray-100">
          <div>
            <p className="font-semibold text-gray-800">{reservation.customerName}</p>
            <span className={`inline-flex px-2.5 py-0.5 rounded-full text-xs font-semibold mt-1 ${s.cls}`}>{s.label}</span>
          </div>
          <button onClick={onClose} className="p-2 hover:bg-gray-100 rounded-lg"><X size={18} /></button>
        </div>
        <div className="p-5 space-y-2.5 text-sm text-gray-600">
          <p><span className="font-medium text-gray-700">Date:</span> {date}</p>
          <p><span className="font-medium text-gray-700">Time:</span> {reservation.time}</p>
          <p><span className="font-medium text-gray-700">Guests:</span> {reservation.guests}</p>
          <p><span className="font-medium text-gray-700">Email:</span> {reservation.customerEmail}</p>
          <p><span className="font-medium text-gray-700">Phone:</span> {reservation.customerPhone}</p>
          {reservation.notes && <p><span className="font-medium text-gray-700">Notes:</span> {reservation.notes}</p>}
        </div>
        <div className="p-5 pt-0 space-y-2">
          {next && (
            <button onClick={() => { onUpdate(reservation.id, next); onClose(); }}
              className="w-full bg-amber-600 text-white py-2.5 rounded-xl font-semibold text-sm hover:bg-amber-700 transition-colors">
              Mark as {STATUS_CONFIG[next].label} →
            </button>
          )}
          {reservation.status !== 'cancelled' && reservation.status !== 'completed' && reservation.status !== 'no_show' && (
            <button onClick={() => { onUpdate(reservation.id, 'no_show'); onClose(); }}
              className="w-full border border-rose-300 text-rose-600 py-2 rounded-xl text-sm font-medium hover:bg-rose-50 transition-colors">
              No Show
            </button>
          )}
          {reservation.status === 'pending' && (
            <button onClick={() => { onUpdate(reservation.id, 'cancelled'); onClose(); }}
              className="w-full border border-red-300 text-red-600 py-2 rounded-xl text-sm font-medium hover:bg-red-50 transition-colors">
              Cancel Booking
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

export default function AdminReservations() {
  const { data: reservations, loading, error, updateStatus } = useReservationsAdminData();
  const [activeTab, setActiveTab] = useState<RStatus | 'all'>('all');
  const [viewItem, setViewItem] = useState<Reservation | null>(null);

  const filtered = useMemo(
    () => activeTab === 'all' ? reservations : reservations.filter((r) => r.status === activeTab),
    [activeTab, reservations],
  );
  const todayCount = reservations.filter((r) => r.date === new Date().toISOString().slice(0, 10) && r.status !== 'cancelled' && r.status !== 'no_show').length;

  return (
    <div className="p-8">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-800">Reservations</h1>
          <p className="text-sm text-gray-500 mt-0.5">{todayCount} booking{todayCount !== 1 ? 's' : ''} today</p>
        </div>
      </div>
      {error && <div className="mb-4 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">{error}</div>}
      <div className="flex gap-2 overflow-x-auto pb-1 mb-6">
        {TABS.map((tab) => {
          const count = tab.key === 'all' ? reservations.length : reservations.filter((r) => r.status === tab.key).length;
          return (
            <button key={tab.key} onClick={() => setActiveTab(tab.key)}
              className={`px-3 py-1.5 rounded-lg text-sm font-medium whitespace-nowrap transition-colors ${activeTab === tab.key ? 'bg-amber-600 text-white' : 'bg-white border border-gray-200 text-gray-600 hover:bg-gray-50'}`}>
              {tab.label} ({count})
            </button>
          );
        })}
      </div>
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
        {loading ? (
          <div className="text-center py-16 text-gray-400 text-sm">Loading reservations…</div>
        ) : filtered.length === 0 ? (
          <div className="text-center py-16 text-gray-400">
            <CalendarDays size={36} className="mx-auto mb-3 opacity-30" />
            <p className="text-sm">No reservations here.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-gray-50 text-left text-xs text-gray-500 uppercase tracking-wide">
                  {['Date', 'Time', 'Name', 'Guests', 'Status', 'Notes', 'Booked', 'Action'].map((h) => (
                    <th key={h} className="px-5 py-3 font-medium">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {filtered.map((r) => {
                  const s = STATUS_CONFIG[r.status];
                  const next = NEXT_STATUS[r.status];
                  return (
                    <tr key={r.id} className="hover:bg-gray-50 transition-colors">
                      <td className="px-5 py-3 font-medium text-gray-800 whitespace-nowrap">
                        {new Date(r.date).toLocaleDateString('en-IE', { day: '2-digit', month: 'short' })}
                      </td>
                      <td className="px-5 py-3 text-gray-600">{r.time}</td>
                      <td className="px-5 py-3 font-medium text-gray-800">{r.customerName}</td>
                      <td className="px-5 py-3 text-gray-500"><span className="flex items-center gap-1"><Users size={14} />{r.guests}</span></td>
                      <td className="px-5 py-3"><span className={`inline-flex px-2.5 py-0.5 rounded-full text-xs font-semibold ${s.cls}`}>{s.label}</span></td>
                      <td className="px-5 py-3 text-gray-400 text-xs max-w-[120px] truncate">{r.notes || '—'}</td>
                      <td className="px-5 py-3 text-gray-400 text-xs">{formatRelativeTime(r.createdAt)}</td>
                      <td className="px-5 py-3">
                        <div className="flex items-center gap-2 flex-wrap">
                          {next && (
                            <button onClick={() => void updateStatus(r.id, next)}
                              className="text-xs bg-amber-100 text-amber-700 px-2 py-1 rounded-lg font-medium hover:bg-amber-200 whitespace-nowrap">
                              → {STATUS_CONFIG[next].label}
                            </button>
                          )}
                          {['confirmed', 'seated'].includes(r.status) && (
                            <button
                              onClick={() => void updateStatus(r.id, 'no_show')}
                              className="text-xs text-rose-500 hover:text-rose-700 font-medium whitespace-nowrap">
                              No-show
                            </button>
                          )}
                          {['pending', 'confirmed'].includes(r.status) && (
                            <button
                              onClick={() => {
                                if (window.confirm(`Cancel booking for ${r.customerName}?`)) void updateStatus(r.id, 'cancelled');
                              }}
                              className="text-xs text-red-500 hover:text-red-700 font-medium whitespace-nowrap">
                              ✕ Cancel
                            </button>
                          )}
                          <button onClick={() => setViewItem(r)} className="text-xs text-gray-400 hover:text-amber-600 font-medium">View</button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
      {viewItem && <DetailModal reservation={viewItem} onClose={() => setViewItem(null)} onUpdate={(id, s) => void updateStatus(id, s)} />}
    </div>
  );
}
