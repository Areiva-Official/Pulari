import { useEffect, useState } from 'react';
import { Check, Save, BarChart3 } from 'lucide-react';
import type { OpeningHours, RestaurantSettings } from '../../types';
import { useSettingsAdminData } from '../hooks/useAdminData';
import { getLocalEvents } from '../../lib/analytics';

const DAYS = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];

interface HoursForm { isOpen: boolean; openTime: string; closeTime: string; }

const EMPTY_HOURS: HoursForm[] = Array.from({ length: 7 }, (_, index) => ({
  isOpen: index !== 0 && index !== 2,
  openTime: '12:00',
  closeTime: '21:00',
}));

export default function AdminSettings() {
  const { data, loading, error, save } = useSettingsAdminData();
  const [info, setInfo] = useState({ name: 'Pulari Restaurant', tagline: '', address: '', city: '', country: 'Ireland', phone: '', email: '', whatsapp: '' });
  const [hours, setHours] = useState<HoursForm[]>(EMPTY_HOURS);
  const [flags, setFlags] = useState({ onlineOrdering: true, reservations: true, delivery: false });
  const [payment, setPayment] = useState({ serviceCharge: '10', taxRate: '0', stripeKey: '', pinpointAppId: '' });
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    if (!data) return;
    setInfo({
      name: data.name,
      tagline: data.tagline,
      address: data.address.line1,
      city: data.address.city,
      country: data.address.country,
      phone: data.phone,
      email: data.email,
      whatsapp: data.whatsapp,
    });
    setFlags({
      onlineOrdering: data.enableOnlineOrdering,
      reservations: data.enableReservations,
      delivery: data.enableDelivery,
    });
    setPayment({
      serviceCharge: String(data.serviceChargePercent),
      taxRate: String(data.taxPercent),
      stripeKey: data.stripePublishableKey,
      pinpointAppId: data.pinpointAppId ?? '',
    });
    const mapped = Array.from({ length: 7 }, (_, index) => {
      const found = data.openingHours.find((entry) => entry.dayOfWeek === index);
      return {
        isOpen: found?.isOpen ?? false,
        openTime: found?.openTime ?? '12:00',
        closeTime: found?.closeTime ?? '21:00',
      };
    });
    setHours(mapped);
  }, [data]);

  const handleSave = async () => {
    const openingHours: OpeningHours[] = hours.map((entry, index) => ({
      dayOfWeek: index as OpeningHours['dayOfWeek'],
      isOpen: entry.isOpen,
      openTime: entry.openTime,
      closeTime: entry.closeTime,
      notes: !entry.isOpen && index === 2 ? 'Closed Tuesdays' : undefined,
    }));
    const payload: Partial<RestaurantSettings> = {
      name: info.name,
      tagline: info.tagline,
      address: { line1: info.address, city: info.city, county: 'Dublin', postcode: '', country: info.country },
      phone: info.phone,
      email: info.email,
      whatsapp: info.whatsapp,
      enableOnlineOrdering: flags.onlineOrdering,
      enableReservations: flags.reservations,
      enableDelivery: flags.delivery,
      serviceChargePercent: Number(payment.serviceCharge) || 0,
      taxPercent: Number(payment.taxRate) || 0,
      stripePublishableKey: payment.stripeKey,
      pinpointAppId: payment.pinpointAppId,
      openingHours,
    };
    const ok = await save(payload);
    if (!ok) return;
    setSaved(true);
    setTimeout(() => setSaved(false), 2500);
  };
  const setHour = (day: number, key: keyof HoursForm, val: string | boolean) =>
    setHours(prev => prev.map((h, i) => i === day ? { ...h, [key]: val } : h));

  return (
    <div className="p-8 max-w-3xl">
      <div className="flex items-center justify-between mb-8">
        <h1 className="text-2xl font-bold text-gray-800">Settings</h1>
        <button onClick={() => void handleSave()} className="flex items-center gap-2 bg-amber-600 text-white px-5 py-2 rounded-lg text-sm font-semibold hover:bg-amber-700 transition-colors">
          {saved ? <><Check size={16} /> Saved!</> : <><Save size={16} /> Save Changes</>}
        </button>
      </div>

      {error && <div className="mb-4 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">{error}</div>}
      {loading && <div className="mb-4 rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-700">Loading settings…</div>}

      {/* Restaurant Info */}
      <section className="bg-white rounded-xl border border-gray-200 p-6 mb-6">
        <h2 className="text-base font-semibold text-gray-800 mb-4">Restaurant Info</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {[['name','Restaurant Name'],['tagline','Tagline'],['address','Street Address'],['city','City'],['phone','Phone'],['email','Email'],['whatsapp','WhatsApp Number']].map(([k, label]) => (
            <div key={k}>
              <label className="block text-xs font-medium text-gray-600 mb-1">{label}</label>
              <input type="text" value={(info as Record<string,string>)[k]} onChange={e => setInfo(i => ({...i,[k]:e.target.value}))}
                className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-amber-500 focus:border-transparent" />
            </div>
          ))}
        </div>
      </section>

      {/* Opening Hours */}
      <section className="bg-white rounded-xl border border-gray-200 p-6 mb-6">
        <h2 className="text-base font-semibold text-gray-800 mb-4">Opening Hours</h2>
        <div className="space-y-3">
          {DAYS.map((day, i) => (
            <div key={day} className="flex items-center gap-4">
              <div className="w-24 shrink-0">
                <label className="flex items-center gap-2 cursor-pointer">
                  <button type="button" onClick={() => setHour(i, 'isOpen', !hours[i].isOpen)}
                    className={`relative w-9 h-5 rounded-full transition-colors shrink-0 ${hours[i].isOpen ? 'bg-amber-500' : 'bg-gray-300'}`}>
                    <div className={`absolute top-0.5 w-4 h-4 bg-white rounded-full shadow transition-transform ${hours[i].isOpen ? 'translate-x-4' : 'translate-x-0.5'}`} />
                  </button>
                  <span className={`text-sm ${hours[i].isOpen ? 'text-gray-800 font-medium' : 'text-gray-400'}`}>{day}</span>
                </label>
              </div>
              {hours[i].isOpen ? (
                <div className="flex items-center gap-2">
                  <input type="time" value={hours[i].openTime} onChange={e => setHour(i, 'openTime', e.target.value)}
                    className="border border-gray-200 rounded-lg px-2 py-1 text-sm focus:ring-2 focus:ring-amber-500 focus:border-transparent" />
                  <span className="text-gray-400 text-sm">to</span>
                  <input type="time" value={hours[i].closeTime} onChange={e => setHour(i, 'closeTime', e.target.value)}
                    className="border border-gray-200 rounded-lg px-2 py-1 text-sm focus:ring-2 focus:ring-amber-500 focus:border-transparent" />
                </div>
              ) : (
                <span className="text-xs text-red-500 font-medium">Closed</span>
              )}
            </div>
          ))}
        </div>
      </section>

      {/* Payment */}
      <section className="bg-white rounded-xl border border-gray-200 p-6 mb-6">
        <h2 className="text-base font-semibold text-gray-800 mb-4">Payment Settings</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-medium text-gray-600 mb-1">Service Charge (%)</label>
            <input type="number" min="0" max="25" value={payment.serviceCharge} onChange={e => setPayment(p => ({...p,serviceCharge:e.target.value}))}
              className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-amber-500 focus:border-transparent" />
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-600 mb-1">Tax Rate (%)</label>
            <input type="number" min="0" max="25" value={payment.taxRate} onChange={e => setPayment(p => ({...p,taxRate:e.target.value}))}
              className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-amber-500 focus:border-transparent" />
          </div>
          <div className="sm:col-span-2">
            <label className="block text-xs font-medium text-gray-600 mb-1">Stripe Publishable Key</label>
            <input type="text" value={payment.stripeKey} onChange={e => setPayment(p => ({...p,stripeKey:e.target.value}))}
              placeholder="pk_live_..." className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm font-mono focus:ring-2 focus:ring-amber-500 focus:border-transparent" />
          </div>
          <div className="sm:col-span-2">
            <label className="block text-xs font-medium text-gray-600 mb-1">AWS Pinpoint App ID</label>
            <input type="text" value={payment.pinpointAppId} onChange={e => setPayment(p => ({...p,pinpointAppId:e.target.value}))}
              placeholder="e.g. a1b2c3d4e5f6..." className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm font-mono focus:ring-2 focus:ring-amber-500 focus:border-transparent" />
            <p className="text-xs text-gray-400 mt-1">Create a Pinpoint project in AWS Console (eu-west-1). Also set <code className="bg-gray-100 px-1 rounded">VITE_PINPOINT_APP_ID</code> in your .env file.</p>
          </div>
        </div>
      </section>

      {/* AWS Analytics (local events in mock mode) */}
      <section className="bg-white rounded-xl border border-gray-200 p-6 mb-6">
        <div className="flex items-center gap-2 mb-4">
          <BarChart3 size={16} className="text-amber-600" />
          <h2 className="text-base font-semibold text-gray-800">Analytics</h2>
          <span className="ml-auto text-xs bg-amber-100 text-amber-700 px-2 py-0.5 rounded-full font-medium">AWS Pinpoint</span>
        </div>
        {(() => {
          const events = getLocalEvents().slice(-10).reverse();
          return events.length === 0 ? (
            <p className="text-xs text-gray-400">No events recorded yet. Navigate pages to see tracking in action.</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-xs">
                <thead><tr className="text-left text-gray-400 border-b border-gray-100">
                  <th className="pb-2 font-medium">Event</th>
                  <th className="pb-2 font-medium">Details</th>
                  <th className="pb-2 font-medium">Time</th>
                </tr></thead>
                <tbody className="divide-y divide-gray-50">
                  {events.map((e, i) => (
                    <tr key={i} className="text-gray-600">
                      <td className="py-1.5 font-medium text-gray-800">{e.name}</td>
                      <td className="py-1.5 font-mono text-gray-400">{JSON.stringify(e.attributes ?? {})}</td>
                      <td className="py-1.5 text-gray-400 whitespace-nowrap">{new Date(e.timestamp).toLocaleTimeString()}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
              <p className="text-xs text-gray-400 mt-3">Showing last 10 events. In production (Pinpoint configured), events stream to AWS in real-time.</p>
            </div>
          );
        })()}
      </section>

      {/* Feature Flags */}
      <section className="bg-white rounded-xl border border-gray-200 p-6 mb-6">
        <h2 className="text-base font-semibold text-gray-800 mb-4">Features</h2>
        <div className="space-y-3">
          {([['onlineOrdering','Online Ordering','Allow customers to order and pay online'],['reservations','Table Reservations','Allow customers to book a table'],['delivery','Delivery','Enable delivery orders (future use)']] as [keyof typeof flags, string, string][]).map(([k, label, desc]) => (
            <div key={k} className="flex items-center justify-between py-2">
              <div>
                <p className="text-sm font-medium text-gray-800">{label}</p>
                <p className="text-xs text-gray-400">{desc}</p>
              </div>
              <button onClick={() => setFlags(f => ({...f,[k]:!f[k]}))} className={`relative w-11 h-6 rounded-full transition-colors ${flags[k] ? 'bg-amber-500' : 'bg-gray-300'}`}>
                <div className={`absolute top-1 w-4 h-4 bg-white rounded-full shadow transition-transform ${flags[k] ? 'translate-x-6' : 'translate-x-1'}`} />
              </button>
            </div>
          ))}
        </div>
      </section>

      <p className="text-center text-xs text-gray-400">Admin data persists locally in mock mode and switches to AWS APIs automatically once `VITE_API_BASE_URL` is configured.</p>
    </div>
  );
}
