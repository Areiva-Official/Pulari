import type { AnalyticsSummary, BlogPost, Coupon, MenuCategory, MenuItem, Order, OrderItem, Reservation, RestaurantSettings, Review, SpecialOffer, User } from '../../types';

type AdminDb = {
  categories: MenuCategory[];
  items: MenuItem[];
  orders: Order[];
  settings: RestaurantSettings;
  reservations: Reservation[];
  reviews: Review[];
  offers: SpecialOffer[];
  coupons: Coupon[];
  users: User[];
  posts: BlogPost[];
};

const STORAGE_KEY = 'pulari_admin_db_v1';

const categoriesSeed: MenuCategory[] = [
  { id: '1', name: 'Starters', slug: 'starters', description: 'South Indian starters and snacks', displayOrder: 1, isActive: true, createdAt: iso(), updatedAt: iso() },
  { id: '2', name: 'Mains', slug: 'mains', description: 'Curries, biryanis and specialities', displayOrder: 2, isActive: true, createdAt: iso(), updatedAt: iso() },
  { id: '3', name: 'Breads & Rice', slug: 'breads-rice', description: 'Kerala breads, naan and rice', displayOrder: 3, isActive: true, createdAt: iso(), updatedAt: iso() },
  { id: '4', name: 'Beverages & Desserts', slug: 'beverages-desserts', description: 'Drinks, tea and desserts', displayOrder: 4, isActive: true, createdAt: iso(), updatedAt: iso() },
];

const itemsSeed: MenuItem[] = [
  item('1','1','SAMOSA','samosa','Handmade pastry stuffed with mashed spiced potatoes, green peas served with chickpeas and chutneys',4.99,true,false,false,true,false),
  item('2','1','MEDU VADA','medu-vada','Authentic South Indian street food made with lentil and spices served with homemade chutney',5.99,true,true,true,true,false),
  item('3','1','NADAN MASALA OMELETTE','nadan-masala-omelette','A Kerala-style omelette made with onions, turmeric and chillies',6.99,true,false,true,true,false),
  item('4','1','KOTTAYAM CHICKEN FRY','kottayam-chicken-fry','Chicken marinated with chilly, coriander, garam masala served with mixed salad leaves',7.99,false,false,true,true,true),
  item('5','1','BANANA FRY','banana-fry','A traditional Kerala snack — golden, crispy banana fritters that are soft and sweet inside',3.99,true,true,false,true,false),
  item('6','1','VENADU KOCHU FRY','venadu-kochu-fry','Prawns sautéed with onion, tomato and pepper, served with salad leaves and lemon',8.99,false,false,true,true,false),
  item('7','1','GHEE ROAST','ghee-roast','Mangalorean-style dry roasted in a tangy, spicy and aromatic ghee sauce',9.99,false,false,true,true,true),
  item('8','2','MASALA DOSA','masala-dosa','Crispy South Indian pancake filled with spiced potato and onion filling',9.99,true,false,true,true,true),
  item('9','2','SET DOSA','set-dosa','Soft, fluffy South Indian pancakes served with potato curry, sambar and chutney',9.99,true,false,true,true,false),
  item('10','2','MYLAPOR EGG ROAST','mylapor-egg-roast','Classic Chennai-style dry egg curry with a bold spicy onion and tomato masala',11.99,false,false,true,true,false),
  item('11','2','HOUSE BOAT FISH CURRY','house-boat-fish-curry','Fresh fish simmered in spicy, tangy gravy with Kashmiri chillies, turmeric and Kerala kudampuli',13.99,false,false,true,true,true),
  item('12','2','NADAN POTHU ROAST','nadan-pothu-roast','Traditional Kerala-style beef cooked with curry leaves, black pepper and fennel seeds',12.99,false,false,true,true,false),
  item('13','2','HI RANGE BEEF ULARTHIYATHU','hi-range-beef-ularthiyathu','Slow-cooked beef with coconut pieces, curry leaves, and spices from the High Ranges of Kerala',14.99,false,false,true,true,true),
  item('14','2','VEETTILE KOZHI CURRY','veettile-kozhi-curry','Homestyle Kerala chicken curry cooked on the bone with black pepper, coriander and cinnamon',13.99,false,false,true,true,false),
  item('15','2','KONCHU MANGO CURRY','konchu-mango-curry','Prawns and raw mango simmered in a coconut milk gravy with curry leaves and South Indian spices',14.99,false,false,true,true,false),
  item('16','2','MALABAR CHICKEN BIRIYANI','malabar-chicken-biriyani','Fragrant Malabar-style biryani with tender chicken, basmati rice and a blend of whole spices',15.99,false,false,true,true,true),
  item('17','2','MALABAR BEEF BIRIYANI','malabar-beef-biriyani','Slow-cooked beef biryani prepared in the authentic Malabar wedding style',16.99,false,false,true,true,true),
  item('18','2','KAPPA PUZHUKKU','kappa-puzhukku','A comforting Kerala dish made with mashed tapioca and spices',7.99,false,false,true,true,false),
  item('19','2','OLD DELHI BUTTER CHICKEN','old-delhi-butter-chicken','Tender chicken in a rich, creamy tomato-based sauce with aromatic North Indian spices',13.99,false,false,true,true,true),
  item('20','2','PANEER BUTTER MASALA','paneer-butter-masala','Fresh cottage cheese in a rich, creamy tomato-based sauce with butter and aromatic spices',12.99,true,false,true,true,true),
  item('21','3','KERALA PARATHA','kerala-paratha','Flaky, layered Indian flatbread cooked in butter',2.99,true,false,false,true,false),
  item('22','3','APPAM','appam','Soft, lacy fermented rice hoppers with a crispy edge — a beloved Kerala classic',2.99,true,false,true,true,false),
  item('23','3','BUTTER NAAN','butter-naan','Soft, fluffy leavened bread cooked in a tandoor and finished with butter',2.99,true,false,false,true,false),
  item('24','3','NEYY CHORU','neyy-choru','Fragrant ghee rice cooked with whole spices — a Kerala staple served at festivals',3.99,true,false,true,true,false),
  item('25','3','STEAM RICE','steam-rice','Plain steamed Kerala red rice, the perfect base for any curry',3.0,true,true,true,true,false),
  item('26','3','PULAO RICE','pulao-rice','Fragrant basmati rice cooked with whole spices and saffron',4.99,true,false,true,true,false),
  item('27','3','RAITA','raita','Cooling yogurt sauce with cucumber and cumin — the perfect accompaniment to biryani',2.5,true,false,true,true,false),
  item('28','4','MANGO LASSI','mango-lassi','A refreshing blend of yogurt, mango pulp and a touch of cardamom',3.99,true,false,true,true,true),
  item('29','4','GULAB JAMUN','gulab-jamun','Soft milk-solid dumplings soaked in rose-flavoured sugar syrup. Served warm.',4.99,true,false,false,true,true),
  item('30','4','NADAN CHAI','nadan-chai','Traditional Kerala tea brewed strong with fresh milk and spices',2.5,true,false,true,true,false),
  item('31','4','MASALA TEA','masala-tea','Aromatic spiced tea with ginger, cardamom, cinnamon and cloves',2.5,true,false,true,true,false),
  item('32','4','CARDAMOM TEA','cardamom-tea','Delicate Kerala-style tea infused with fresh green cardamom',2.5,true,false,true,true,false),
  item('33','4','FILTER COFFEE','filter-coffee','Traditional South Indian filter coffee',3.0,true,false,true,true,false),
];

// PII data: only included in dev builds. Tree-shaken out of production bundles by Vite.
const ordersSeed: Order[] = import.meta.env.DEV ? [
  order('PUL-20260621-0042','Seán Murphy','sean@email.ie','087 123 4567','collection','preparing', [orderItem('16','MALABAR CHICKEN BIRIYANI',15.99,1), orderItem('30','NADAN CHAI',2.5,2), orderItem('27','RAITA',2.5,1)]),
  order('PUL-20260621-0041','Priya Nair','priya@email.ie','086 987 6543','dine_in','confirmed', [orderItem('11','HOUSE BOAT FISH CURRY',13.99,1), orderItem('21','KERALA PARATHA',2.99,2), orderItem('28','MANGO LASSI',3.99,2)]),
  order('PUL-20260621-0040','James O\'Brien','james@email.ie','085 222 3333','collection','ready', [orderItem('7','GHEE ROAST',9.99,1), orderItem('21','KERALA PARATHA',2.99,3)]),
  order('PUL-20260621-0039','Anitha Raj','anitha@email.ie','087 444 5555','dine_in','completed', [orderItem('8','MASALA DOSA',9.99,2), orderItem('33','FILTER COFFEE',3,2), orderItem('1','SAMOSA',4.99,4)]),
  order('PUL-20260621-0038','Conor Walsh','conor@email.ie','086 111 2222','collection','completed', [orderItem('5','BANANA FRY',3.99,2), orderItem('31','MASALA TEA',2.5,2)]),
  order('PUL-20260621-0037','Emma Byrne','emma@email.ie','087 777 8888','collection','cancelled', [orderItem('20','PANEER BUTTER MASALA',12.99,1), orderItem('23','BUTTER NAAN',2.99,2)]),
] : [];

const settingsSeed: RestaurantSettings = {
  name: 'Pulari Restaurant',
  tagline: "Dublin's Finest South Indian Cuisine",
  address: { line1: 'Temple Street', city: 'Dublin 2', county: 'Dublin', postcode: '', country: 'Ireland' },
  phone: '087 973 8186',
  email: 'pularidesicafe@gmail.com',
  whatsapp: '353879738186',
  website: 'https://www.pulari.ie',
  openingHours: [
    { dayOfWeek: 0, isOpen: false, openTime: '12:00', closeTime: '21:00', notes: 'Closed' },
    { dayOfWeek: 1, isOpen: true, openTime: '12:00', closeTime: '21:00' },
    { dayOfWeek: 2, isOpen: false, openTime: '12:00', closeTime: '21:00', notes: 'Closed Tuesdays' },
    { dayOfWeek: 3, isOpen: true, openTime: '12:00', closeTime: '21:00' },
    { dayOfWeek: 4, isOpen: true, openTime: '12:00', closeTime: '21:00' },
    { dayOfWeek: 5, isOpen: true, openTime: '12:00', closeTime: '21:00' },
    { dayOfWeek: 6, isOpen: true, openTime: '12:00', closeTime: '21:00' },
  ],
  socialLinks: {},
  stripePublishableKey: '',
  pinpointAppId: (import.meta.env.VITE_PINPOINT_APP_ID as string | undefined) ?? '',
  enableOnlineOrdering: true,
  enableReservations: true,
  enableDelivery: false,
  minimumOrderAmount: 0,
  serviceChargePercent: 10,
  taxPercent: 0,
};

function iso() {
  return new Date().toISOString();
}

function item(id: string, categoryId: string, name: string, slug: string, description: string, price: number, isVegetarian: boolean, isVegan: boolean, isGlutenFree: boolean, isAvailable: boolean, isFeatured: boolean): MenuItem {
  return { id, categoryId, name, slug, description, price, imageUrl: '', isVegetarian, isVegan, isGlutenFree, isAvailable, isFeatured, displayOrder: Number(id), createdAt: iso(), updatedAt: iso() };
}

function orderItem(menuItemId: string, name: string, price: number, quantity: number): OrderItem {
  return { id: `${menuItemId}-${quantity}-${Math.random().toString(36).slice(2, 6)}`, menuItemId, name, price, quantity, subtotal: Number((price * quantity).toFixed(2)) };
}

function order(orderNumber: string, customerName: string, customerEmail: string, customerPhone: string, type: 'collection' | 'dine_in', status: Order['status'], items: OrderItem[]): Order {
  const subtotal = Number(items.reduce((sum, current) => sum + current.subtotal, 0).toFixed(2));
  const serviceCharge = Number((subtotal * 0.1).toFixed(2));
  const total = Number((subtotal + serviceCharge).toFixed(2));
  return {
    id: orderNumber,
    orderNumber,
    customerName,
    customerEmail,
    customerPhone,
    type,
    status,
    paymentStatus: status === 'cancelled' ? 'failed' : 'succeeded',
    items,
    subtotal,
    taxAmount: 0,
    discountAmount: 0,
    serviceCharge,
    total,
    createdAt: iso(),
    updatedAt: iso(),
  };
}

// ─── RESERVATIONS SEED ────────────────────────────────────────────────────────
// PII data: only included in dev builds. Tree-shaken out of production bundles by Vite.
const reservationsSeed: Reservation[] = import.meta.env.DEV ? [
  { id: 'r1', customerName: "Seán Murphy",   customerEmail: 'sean@email.ie',   customerPhone: '087 123 4567', date: '2026-06-21', time: '18:00', guests: 2, status: 'confirmed', notes: 'Window seat preferred', createdAt: iso(), updatedAt: iso() },
  { id: 'r2', customerName: 'Priya Nair',    customerEmail: 'priya@email.ie',  customerPhone: '086 987 6543', date: '2026-06-21', time: '19:30', guests: 4, status: 'pending',   notes: '',                       createdAt: iso(), updatedAt: iso() },
  { id: 'r3', customerName: "James O'Brien", customerEmail: 'james@email.ie',  customerPhone: '085 222 3333', date: '2026-06-22', time: '13:00', guests: 3, status: 'confirmed', notes: 'Birthday celebration',    createdAt: iso(), updatedAt: iso() },
  { id: 'r4', customerName: 'Anitha Raj',    customerEmail: 'anitha@email.ie', customerPhone: '087 444 5555', date: '2026-06-20', time: '20:00', guests: 2, status: 'completed', notes: '',                       createdAt: iso(), updatedAt: iso() },
  { id: 'r5', customerName: 'Conor Walsh',   customerEmail: 'conor@email.ie',  customerPhone: '086 111 2222', date: '2026-06-20', time: '18:30', guests: 6, status: 'cancelled', notes: 'Group booking cancelled', createdAt: iso(), updatedAt: iso() },
  { id: 'r6', customerName: 'Emma Byrne',    customerEmail: 'emma@email.ie',   customerPhone: '087 777 8888', date: '2026-06-23', time: '17:00', guests: 2, status: 'pending',   notes: 'Anniversary dinner',     createdAt: iso(), updatedAt: iso() },
] : [];

// ─── REVIEWS SEED ─────────────────────────────────────────────────────────────
function daysAgo(n: number) { return new Date(Date.now() - 86400000 * n).toISOString(); }

// PII data: only included in dev builds. Tree-shaken out of production bundles by Vite.
const reviewsSeed: Review[] = import.meta.env.DEV ? [
  { id: 'rv1', customerName: "Seán Murphy", rating: 5, comment: 'Absolutely incredible food! The Malabar Chicken Biriyani was out of this world. Reminded me of the real thing back home.', isApproved: true,  isHighlighted: true,  createdAt: daysAgo(2) },
  { id: 'rv2', customerName: 'Emma Byrne',  rating: 5, comment: 'Best South Indian food in Dublin, hands down. The Kerala Paratha and Houseboat Fish Curry together is just divine.',           isApproved: true,  isHighlighted: false, createdAt: daysAgo(5) },
  { id: 'rv3', customerName: 'Conor Walsh', rating: 4, comment: 'Great food and atmosphere. The service was a bit slow but totally worth the wait. Will be back!',                               isApproved: true,  isHighlighted: false, createdAt: daysAgo(7) },
  { id: 'rv4', customerName: 'Priya Nair',  rating: 5, comment: 'Feels just like eating at home in Kerala. The Appam is perfect!',                                                               isApproved: false, isHighlighted: false, createdAt: daysAgo(1) },
  { id: 'rv5', customerName: "James O'Brien", rating: 3, comment: 'Food was good but not amazing. Portion sizes could be bigger for the price. Nice decor though.',                             isApproved: false, isHighlighted: false, createdAt: daysAgo(0) },
] : [];

// ─── OFFERS SEED ──────────────────────────────────────────────────────────────
const offersSeed: SpecialOffer[] = [
  { id: 'o1', slug: 'kerala-thali',  title: 'Kerala Thali',  subtitle: 'Traditional feast',    description: 'A complete Kerala feast with rice, 3 curries, pickles, papad and dessert', price: '€18.99', badge: 'Best Value',   color: 'from-orange-500 to-red-500',   isActive: true,  displayOrder: 1, createdAt: iso(), updatedAt: iso() },
  { id: 'o2', slug: 'lunch-combo',   title: 'Lunch Combo',   subtitle: 'Weekdays 12–3pm',      description: 'Any main + bread + soft drink for a special price',                       price: '€13.99', badge: 'Weekday Only', color: 'from-amber-500 to-orange-500', isActive: true,  displayOrder: 2, createdAt: iso(), updatedAt: iso() },
  { id: 'o3', slug: 'student-deal',  title: 'Student Deal',  subtitle: 'Valid student ID required', description: '20% off total bill with valid student card',                        badge: 'Students',                      color: 'from-green-500 to-emerald-500', isActive: false, displayOrder: 3, createdAt: iso(), updatedAt: iso() },
];

// ─── COUPONS SEED ─────────────────────────────────────────────────────────────
const couponsSeed: Coupon[] = [
  { id: 'cp1', code: 'WELCOME10', type: 'percentage', value: 10, minOrderAmount: 20, maxUsesTotal: 100, currentUses: 14, isActive: true,  validFrom: '2026-01-01', createdAt: iso(), createdBy: 'admin' },
  { id: 'cp2', code: 'FIRST5',    type: 'fixed',      value: 5,  minOrderAmount: 25, maxUsesTotal: 50,  currentUses: 7,  isActive: true,  validFrom: '2026-01-01', createdAt: iso(), createdBy: 'admin' },
  { id: 'cp3', code: 'SUMMER20',  type: 'percentage', value: 20, minOrderAmount: 30, maxUsesTotal: 30,  currentUses: 2,  isActive: false, validFrom: '2026-06-01', validUntil: '2026-08-31', createdAt: iso(), createdBy: 'admin' },
];

// ─── USERS (CUSTOMERS) SEED ───────────────────────────────────────────────────
// PII data: only included in dev builds. Tree-shaken out of production bundles by Vite.
const usersSeed: User[] = import.meta.env.DEV ? [
  { id: 'u1', email: 'sean@email.ie',   fullName: "Seán Murphy",   phone: '087 123 4567', role: 'customer', createdAt: daysAgo(30), lastLoginAt: daysAgo(1),   isEmailVerified: true  },
  { id: 'u2', email: 'priya@email.ie',  fullName: 'Priya Nair',    phone: '086 987 6543', role: 'customer', createdAt: daysAgo(25), lastLoginAt: daysAgo(2),   isEmailVerified: true  },
  { id: 'u3', email: 'james@email.ie',  fullName: "James O'Brien", phone: '085 222 3333', role: 'customer', createdAt: daysAgo(20), lastLoginAt: daysAgo(3),   isEmailVerified: true  },
  { id: 'u4', email: 'anitha@email.ie', fullName: 'Anitha Raj',    phone: '087 444 5555', role: 'customer', createdAt: daysAgo(15), lastLoginAt: daysAgo(0.1), isEmailVerified: true  },
  { id: 'u5', email: 'conor@email.ie',  fullName: 'Conor Walsh',   phone: '086 111 2222', role: 'customer', createdAt: daysAgo(10), lastLoginAt: daysAgo(5),   isEmailVerified: false },
  { id: 'u6', email: 'emma@email.ie',   fullName: 'Emma Byrne',    phone: '087 777 8888', role: 'customer', createdAt: daysAgo(5),  lastLoginAt: daysAgo(0.5), isEmailVerified: true  },
] : [];

// ─── BLOG POSTS SEED ──────────────────────────────────────────────────────────
const postsSeed: BlogPost[] = import.meta.env.DEV ? [
  {
    id: 'bp1', slug: 'authentic-kerala-cuisine-dublin',
    title: 'Authentic Kerala Cuisine in the Heart of Dublin',
    excerpt: "Discover why Pulari Restaurant brings the true flavours of Kerala to Temple Street, Dublin 2 — from Malabar biryani to freshly made Kerala paratha.",
    content: "## Welcome to Pulari\n\nNestled in Temple Street, Dublin 2, Pulari Restaurant is the go-to destination for authentic South Indian and Kerala cuisine in Ireland's capital.\n\n### Our Story\n\nFounded in 2025 by Mr. Bijukuttan, every dish is prepared from traditional family recipes using premium spices sourced directly from Kerala.\n\n### Our Must-Try Dishes\n\n- **Malabar Chicken Biriyani** — fragrant, tender, and deeply spiced\n- **House Boat Fish Curry** — tangy kudampuli gravy, a Kerala classic\n- **Kerala Paratha** — flaky, buttery layers of heaven\n\nVisit us at Temple Street and experience a taste of Kerala in Dublin.",
    featuredImageUrl: 'https://images.pexels.com/photos/958545/pexels-photo-958545.jpeg?auto=compress&cs=tinysrgb&w=1280',
    featuredImageAlt: 'Kerala feast at Pulari Restaurant Dublin',
    categoryId: 'bc1', authorName: 'Pulari Team', status: 'published',
    tags: ['kerala', 'dublin', 'indian food', 'south indian'], readingTimeMinutes: 3,
    publishedAt: daysAgo(14), createdAt: daysAgo(14), updatedAt: daysAgo(14),
  },
  {
    id: 'bp2', slug: 'what-is-kerala-paratha',
    title: 'What is Kerala Paratha? Everything You Need to Know',
    excerpt: 'Kerala paratha is one of the most beloved breads in South Indian cuisine. We break down what makes it special and how we make ours at Pulari.',
    content: "## The Kerala Paratha — A Bread Like No Other\n\nCrispy on the outside, soft and layered within — Kerala paratha is the perfect partner to any curry.\n\n### How It's Made\n\nUnlike naan or roti, Kerala paratha is layered through a technique of folding and coiling the dough, creating characteristic flaky layers that pull apart beautifully.\n\n### At Pulari\n\nOur paratha is cooked fresh to order in butter. Pair it with Nadan Pothu Roast or House Boat Fish Curry for the full experience.\n\nCome visit us at Temple Street, Dublin 2!",
    featuredImageUrl: 'https://images.pexels.com/photos/2474661/pexels-photo-2474661.jpeg?auto=compress&cs=tinysrgb&w=1280',
    featuredImageAlt: 'Kerala paratha with curry',
    categoryId: 'bc2', authorName: 'Pulari Team', status: 'published',
    tags: ['paratha', 'recipe', 'south indian'], readingTimeMinutes: 2,
    publishedAt: daysAgo(7), createdAt: daysAgo(7), updatedAt: daysAgo(7),
  },
  {
    id: 'bp3', slug: 'now-on-just-eat',
    title: 'Pulari is Now on Just Eat!',
    excerpt: 'Great news — you can now order your favourite Pulari dishes for delivery through Just Eat. Malabar biryani, Kerala paratha, and more delivered to your door in Dublin.',
    content: "## Order Pulari on Just Eat\n\nWe're excited to announce that Pulari Authentic Desi Kitchen is now available on Just Eat in Dublin!\n\nYou can also find us on Uber Eats and Deliveroo, or order directly through our website for collection.\n\nThank you for your continued support!",
    featuredImageUrl: '', featuredImageAlt: '',
    categoryId: 'bc3', authorName: 'Pulari Team', status: 'draft',
    tags: ['just eat', 'delivery', 'news'], readingTimeMinutes: 1,
    createdAt: daysAgo(1), updatedAt: daysAgo(1),
  },
] : [];

function defaultDb(): AdminDb {
  return {
    categories: categoriesSeed,
    items: itemsSeed,
    orders: ordersSeed,
    settings: settingsSeed,
    reservations: reservationsSeed,
    reviews: reviewsSeed,
    offers: offersSeed,
    coupons: couponsSeed,
    users: usersSeed,
    posts: postsSeed,
  };
}

export function getAdminDb(): AdminDb {
  if (typeof window === 'undefined') return defaultDb();
  const raw = window.localStorage.getItem(STORAGE_KEY);
  if (!raw) {
    const seeded = defaultDb();
    saveAdminDb(seeded);
    return seeded;
  }
  try {
    const parsed = JSON.parse(raw) as Partial<AdminDb>;
    const defaults = defaultDb();
    // Forward-migration: fill in any collection added after the stored snapshot
    // was written (e.g. 'offers' added in Week 3). Missing arrays fall back to
    // seed data so new features don't crash on old localStorage blobs.
    const merged: AdminDb = {
      categories:   parsed.categories   ?? defaults.categories,
      items:        parsed.items        ?? defaults.items,
      orders:       parsed.orders       ?? defaults.orders,
      settings:     parsed.settings     ?? defaults.settings,
      reservations: parsed.reservations ?? defaults.reservations,
      reviews:      parsed.reviews      ?? defaults.reviews,
      offers:       parsed.offers       ?? defaults.offers,
      coupons:      parsed.coupons      ?? defaults.coupons,
      users:        parsed.users        ?? defaults.users,
      posts:        parsed.posts        ?? defaults.posts,
    };
    return merged;
  } catch {
    const seeded = defaultDb();
    saveAdminDb(seeded);
    return seeded;
  }
}

export function saveAdminDb(next: AdminDb) {
  if (typeof window === 'undefined') return;
  window.localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
}

export function listCategories(): MenuCategory[] {
  return getAdminDb().categories.sort((a, b) => a.displayOrder - b.displayOrder);
}

export function listItems(categoryId?: string): MenuItem[] {
  const items = getAdminDb().items;
  return items.filter((item) => !categoryId || item.categoryId === categoryId).sort((a, b) => a.displayOrder - b.displayOrder);
}

export function createItem(payload: Omit<MenuItem, 'id' | 'createdAt' | 'updatedAt'>): MenuItem {
  const db = getAdminDb();
  const next: MenuItem = { ...payload, id: cryptoId(), createdAt: iso(), updatedAt: iso() };
  db.items = [...db.items, next];
  saveAdminDb(db);
  return next;
}

export function updateItem(id: string, patch: Partial<MenuItem>): MenuItem | null {
  const db = getAdminDb();
  let updated: MenuItem | null = null;
  db.items = db.items.map((entry) => {
    if (entry.id !== id) return entry;
    updated = { ...entry, ...patch, updatedAt: iso() };
    return updated;
  });
  saveAdminDb(db);
  return updated;
}

export function deleteItem(id: string) {
  const db = getAdminDb();
  db.items = db.items.filter((entry) => entry.id !== id);
  saveAdminDb(db);
}

export function listOrders(status?: string): Order[] {
  const orders = getAdminDb().orders;
  return orders.filter((order) => !status || order.status === status).sort((a, b) => b.orderNumber.localeCompare(a.orderNumber));
}

export function updateOrderStatus(id: string, status: Order['status']): Order | null {
  const db = getAdminDb();
  let updated: Order | null = null;
  db.orders = db.orders.map((entry) => {
    if (entry.id !== id && entry.orderNumber !== id) return entry;
    updated = { ...entry, status, updatedAt: iso() };
    return updated;
  });
  saveAdminDb(db);
  return updated;
}

export function getSettings(): RestaurantSettings {
  return getAdminDb().settings;
}

export function updateSettings(patch: Partial<RestaurantSettings>): RestaurantSettings {
  const db = getAdminDb();
  db.settings = { ...db.settings, ...patch };
  saveAdminDb(db);
  return db.settings;
}

export function getAnalyticsSummary(): AnalyticsSummary {
  const db = getAdminDb();
  const completedOrders = db.orders.filter((order) => order.status === 'completed');
  const totalRevenue = completedOrders.reduce((sum, order) => sum + order.total, 0);
  const itemMap = new Map<string, { itemId: string; name: string; count: number }>();
  db.orders.forEach((order) => {
    order.items.forEach((entry) => {
      const current = itemMap.get(entry.menuItemId) ?? { itemId: entry.menuItemId, name: entry.name, count: 0 };
      current.count += entry.quantity;
      itemMap.set(entry.menuItemId, current);
    });
  });
  return {
    totalOrdersToday: db.orders.length,
    totalRevenueToday: Number(totalRevenue.toFixed(2)),
    totalOrdersThisWeek: db.orders.length,
    totalRevenueThisWeek: Number(totalRevenue.toFixed(2)),
    totalOrdersThisMonth: db.orders.length,
    totalRevenueThisMonth: Number(totalRevenue.toFixed(2)),
    averageOrderValue: completedOrders.length ? Number((totalRevenue / completedOrders.length).toFixed(2)) : 0,
    popularItems: [...itemMap.values()].sort((a, b) => b.count - a.count).slice(0, 5),
    recentOrders: db.orders.slice(0, 5),
  };
}

function cryptoId() {
  return `${Date.now()}-${Math.random().toString(36).slice(2, 10)}`;
}

// ─── RESERVATIONS CRUD ────────────────────────────────────────────────────────

export function listReservations(status?: Reservation['status']): Reservation[] {
  const all = getAdminDb().reservations;
  return (status ? all.filter((r) => r.status === status) : all)
    .sort((a, b) => b.date.localeCompare(a.date) || b.time.localeCompare(a.time));
}

export function updateReservationStatus(id: string, status: Reservation['status']): Reservation | null {
  const db = getAdminDb();
  let updated: Reservation | null = null;
  db.reservations = db.reservations.map((r) => {
    if (r.id !== id) return r;
    updated = { ...r, status, updatedAt: iso(), confirmedAt: status === 'confirmed' ? iso() : r.confirmedAt };
    return updated;
  });
  saveAdminDb(db);
  return updated;
}

export function createReservation(payload: Omit<Reservation, 'id' | 'createdAt' | 'updatedAt'>): Reservation {
  const db = getAdminDb();
  const next: Reservation = { ...payload, id: cryptoId(), createdAt: iso(), updatedAt: iso() };
  db.reservations = [...db.reservations, next];
  saveAdminDb(db);
  return next;
}

// ─── REVIEWS CRUD ─────────────────────────────────────────────────────────────

export function listReviews(filter?: 'pending' | 'approved' | 'highlighted'): Review[] {
  const all = getAdminDb().reviews;
  if (filter === 'pending')     return all.filter((r) => !r.isApproved);
  if (filter === 'approved')    return all.filter((r) => r.isApproved);
  if (filter === 'highlighted') return all.filter((r) => r.isHighlighted);
  return all.sort((a, b) => b.createdAt.localeCompare(a.createdAt));
}

export function updateReview(id: string, patch: Partial<Pick<Review, 'isApproved' | 'isHighlighted'>>): Review | null {
  const db = getAdminDb();
  let updated: Review | null = null;
  db.reviews = db.reviews.map((r) => {
    if (r.id !== id) return r;
    updated = { ...r, ...patch };
    return updated;
  });
  saveAdminDb(db);
  return updated;
}

export function deleteReview(id: string) {
  const db = getAdminDb();
  db.reviews = db.reviews.filter((r) => r.id !== id);
  saveAdminDb(db);
}

// ─── OFFERS CRUD ──────────────────────────────────────────────────────────────

export function listOffers(): SpecialOffer[] {
  return getAdminDb().offers.sort((a, b) => a.displayOrder - b.displayOrder);
}

export function createOffer(payload: Omit<SpecialOffer, 'id' | 'createdAt' | 'updatedAt'>): SpecialOffer {
  const db = getAdminDb();
  const next: SpecialOffer = { ...payload, id: cryptoId(), createdAt: iso(), updatedAt: iso() };
  db.offers = [...db.offers, next];
  saveAdminDb(db);
  return next;
}

export function updateOffer(id: string, patch: Partial<SpecialOffer>): SpecialOffer | null {
  const db = getAdminDb();
  let updated: SpecialOffer | null = null;
  db.offers = db.offers.map((o) => {
    if (o.id !== id) return o;
    updated = { ...o, ...patch, updatedAt: iso() };
    return updated;
  });
  saveAdminDb(db);
  return updated;
}

export function deleteOffer(id: string) {
  const db = getAdminDb();
  db.offers = db.offers.filter((o) => o.id !== id);
  saveAdminDb(db);
}

// ─── COUPONS CRUD ─────────────────────────────────────────────────────────────

export function listCoupons(): Coupon[] {
  return getAdminDb().coupons.sort((a, b) => b.createdAt.localeCompare(a.createdAt));
}

export function createCoupon(payload: Omit<Coupon, 'id' | 'createdAt' | 'currentUses'>): Coupon {
  const db = getAdminDb();
  const next: Coupon = { ...payload, id: cryptoId(), currentUses: 0, createdAt: iso() };
  db.coupons = [...db.coupons, next];
  saveAdminDb(db);
  return next;
}

export function updateCoupon(id: string, patch: Partial<Coupon>): Coupon | null {
  const db = getAdminDb();
  let updated: Coupon | null = null;
  db.coupons = db.coupons.map((c) => {
    if (c.id !== id) return c;
    updated = { ...c, ...patch };
    return updated;
  });
  saveAdminDb(db);
  return updated;
}

export function deleteCoupon(id: string) {
  const db = getAdminDb();
  db.coupons = db.coupons.filter((c) => c.id !== id);
  saveAdminDb(db);
}

// ─── USERS (READ-ONLY for now) ────────────────────────────────────────────────

export function listUsers(): User[] {
  return getAdminDb().users.sort((a, b) => b.createdAt.localeCompare(a.createdAt));
}

// ─── BLOG POSTS CRUD ──────────────────────────────────────────────────────────

export function listPosts(status?: BlogPost['status']): BlogPost[] {
  const all = getAdminDb().posts;
  return (status ? all.filter((p) => p.status === status) : all)
    .sort((a, b) => b.createdAt.localeCompare(a.createdAt));
}

export function createPost(payload: Omit<BlogPost, 'id' | 'createdAt' | 'updatedAt'>): BlogPost {
  const db = getAdminDb();
  const ts = iso();
  const next: BlogPost = { ...payload, id: cryptoId(), createdAt: ts, updatedAt: ts };
  db.posts = [next, ...db.posts];
  saveAdminDb(db);
  return next;
}

export function updatePost(id: string, patch: Partial<BlogPost>): BlogPost | null {
  const db = getAdminDb();
  let updated: BlogPost | null = null;
  db.posts = db.posts.map((p) => {
    if (p.id !== id) return p;
    updated = { ...p, ...patch, updatedAt: iso() };
    return updated;
  });
  saveAdminDb(db);
  return updated;
}

export function deletePost(id: string) {
  const db = getAdminDb();
  db.posts = db.posts.filter((p) => p.id !== id);
  saveAdminDb(db);
}
