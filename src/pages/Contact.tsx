import { useState, Fragment } from 'react';
import { MapPin, Phone, Mail, Clock, Send } from 'lucide-react';
import SEO from '../components/SEO';
import { useSettings } from '../contexts/SettingsContext';
import { formatHoursLines, formatTime12, telHref } from '../lib/restaurantSettings';

const DAYS_FULL = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];

export default function Contact() {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    subject: '',
    message: '',
  });
  const [submitting, setSubmitting] = useState(false);
  const [success, setSuccess] = useState(false);
  const { settings } = useSettings();
  const hoursLines = formatHoursLines(settings.openingHours);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);

    setTimeout(() => {
      setSuccess(true);
      setFormData({
        name: '',
        email: '',
        phone: '',
        subject: '',
        message: '',
      });
      setSubmitting(false);
      setTimeout(() => setSuccess(false), 5000);
    }, 1000);
  };

  return (
    <div className="min-h-screen pt-24 bg-gray-50">
      <SEO
        title="Contact Us | Pulari Restaurant Temple Bar Dublin"
        description="Contact Pulari Restaurant at The Design House, Crow St, Temple Bar, Dublin D02 F884. Call 083 068 1518 or email pularidesicafe@gmail.com. Open daily — Mon–Thu &amp; Sun 12–9 PM, Fri–Sat 12–10 PM."
        canonical="/contact"
        keywords="Pulari restaurant contact, Indian restaurant Dublin contact, Temple Street restaurant Dublin, Kerala restaurant Dublin phone, book table Indian restaurant Dublin"
        breadcrumbs={[{ name: 'Contact', url: '/contact' }]}
      />
      <section
        className="relative h-80 flex items-center justify-center bg-cover bg-center"
        style={{
          backgroundImage: 'url(https://images.pexels.com/photos/67468/pexels-photo-67468.jpeg?auto=compress&cs=tinysrgb&w=1920)',
        }}
      >
        <div className="absolute inset-0 bg-black opacity-50"></div>
        <div className="relative z-10 text-center text-white px-4">
          <h1 className="text-6xl font-bold mb-4 animate-fade-in">Contact Us</h1>
          <p className="text-2xl animate-fade-in-delay">We'd love to hear from you</p>
        </div>
      </section>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
          <div className="animate-slide-in-left">
            <h2 className="text-4xl font-bold text-gray-800 mb-8">Get in Touch</h2>

            <div className="space-y-6 mb-10">
              <div className="flex items-start space-x-4">
                <MapPin className="text-amber-600 mt-1" size={24} />
                <div>
                  <h3 className="font-semibold text-gray-800 mb-1">Address</h3>
                  <p className="text-gray-600">{settings.address.line1}</p>
                  <p className="text-gray-600">{settings.address.city}</p>
                  <p className="text-gray-600">{[settings.address.postcode, settings.address.country].filter(Boolean).join(', ')}</p>
                </div>
              </div>

              <div className="flex items-start space-x-4">
                <Phone className="text-amber-600 mt-1" size={24} />
                <div>
                  <h3 className="font-semibold text-gray-800 mb-1">Phone</h3>
                  <a href={telHref(settings)} className="text-gray-600 hover:text-amber-600 transition-colors font-medium">{settings.phone}</a>
                  <p className="text-gray-600 text-sm mt-1">{hoursLines.map((l) => `${l.days}: ${l.time}`).join(' · ')}</p>
                </div>
              </div>

              <div className="flex items-start space-x-4">
                <Mail className="text-amber-600 mt-1" size={24} />
                <div>
                  <h3 className="font-semibold text-gray-800 mb-1">Email</h3>
                  <a href={`mailto:${settings.email}`} className="text-gray-600 hover:text-amber-600 transition-colors">{settings.email}</a>
                </div>
              </div>

              <div className="flex items-start space-x-4">
                <Clock className="text-amber-600 mt-1" size={24} />
                <div>
                  <h3 className="font-semibold text-gray-800 mb-2">Opening Hours</h3>
                  <div className="grid grid-cols-2 gap-x-6 gap-y-1 text-sm text-gray-600">
                    {DAYS_FULL.map((dayName, i) => {
                      const h = settings.openingHours.find((o) => o.dayOfWeek === i);
                      const isWeekend = i === 5 || i === 6;
                      const time = h && h.isOpen ? `${formatTime12(h.openTime)} – ${formatTime12(h.closeTime)}` : 'Closed';
                      const cls = isWeekend ? 'font-semibold text-amber-700' : '';
                      return (
                        <Fragment key={dayName}>
                          <span className={cls}>{dayName}</span>
                          <span className={cls}>{time}</span>
                        </Fragment>
                      );
                    })}
                  </div>
                </div>
              </div>
            </div>

            <div className="bg-white rounded-lg shadow-lg overflow-hidden">
              <iframe
                src="https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d2381.6!2d-6.2669!3d53.3448!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x48670c6bbae9d63b%3A0xd17de3c2c0c12c7c!2sCrow%20St%2C%20Temple%20Bar%2C%20Dublin!5e0!3m2!1sen!2sie!4v1750030000000"
                width="100%"
                height="300"
                style={{ border: 0 }}
                allowFullScreen
                loading="lazy"
                referrerPolicy="no-referrer-when-downgrade"
                title="Pulari Restaurant Location"
              ></iframe>
            </div>
          </div>

          <div className="animate-slide-in-right">
            <div className="bg-white rounded-lg shadow-xl p-8">
              <h2 className="text-3xl font-bold text-gray-800 mb-6">Send us a Message</h2>

              {success && (
                <div className="mb-6 p-4 bg-green-50 border border-green-200 rounded-lg flex items-center space-x-3 animate-fade-in">
                  <Send className="text-green-600" size={24} />
                  <p className="text-green-800">
                    Thank you for your message! We'll get back to you soon.
                  </p>
                </div>
              )}

              <form onSubmit={handleSubmit} className="space-y-6">
                <div>
                  <label htmlFor="name" className="block text-sm font-semibold text-gray-700 mb-2">
                    Name
                  </label>
                  <input
                    type="text"
                    id="name"
                    required
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-transparent transition-all duration-300"
                    placeholder="Your name"
                  />
                </div>

                <div>
                  <label htmlFor="email" className="block text-sm font-semibold text-gray-700 mb-2">
                    Email
                  </label>
                  <input
                    type="email"
                    id="email"
                    required
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-transparent transition-all duration-300"
                    placeholder="your.email@example.com"
                  />
                </div>

                <div>
                  <label htmlFor="phone" className="block text-sm font-semibold text-gray-700 mb-2">
                    Phone
                  </label>
                  <input
                    type="tel"
                    id="phone"
                    value={formData.phone}
                    onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-transparent transition-all duration-300"
                    placeholder="+353 1 234 5678"
                  />
                </div>

                <div>
                  <label htmlFor="subject" className="block text-sm font-semibold text-gray-700 mb-2">
                    Subject
                  </label>
                  <select
                    id="subject"
                    required
                    value={formData.subject}
                    onChange={(e) => setFormData({ ...formData, subject: e.target.value })}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-transparent transition-all duration-300"
                  >
                    <option value="">Select a subject</option>
                    <option value="reservation">Reservation Inquiry</option>
                    <option value="event">Private Event</option>
                    <option value="feedback">Feedback</option>
                    <option value="general">General Question</option>
                    <option value="other">Other</option>
                  </select>
                </div>

                <div>
                  <label htmlFor="message" className="block text-sm font-semibold text-gray-700 mb-2">
                    Message
                  </label>
                  <textarea
                    id="message"
                    required
                    rows={6}
                    value={formData.message}
                    onChange={(e) => setFormData({ ...formData, message: e.target.value })}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-transparent transition-all duration-300"
                    placeholder="How can we help you?"
                  ></textarea>
                </div>

                <button
                  type="submit"
                  disabled={submitting}
                  className="w-full bg-amber-600 text-white py-4 rounded-lg font-semibold hover:bg-amber-700 disabled:bg-gray-400 transform hover:scale-105 transition-all duration-300 flex items-center justify-center space-x-2"
                >
                  <span>{submitting ? 'Sending...' : 'Send Message'}</span>
                  <Send size={20} />
                </button>
              </form>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
