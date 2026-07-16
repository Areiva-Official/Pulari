// ─────────────────────────────────────────────────────────────────────────────
// SEED — populates pulari-menu and pulari-settings in DynamoDB.
// Mirrors the menu used in the frontend mock store (33 items, 4 categories).
// Run: node seed.mjs   (from the lambda/ folder)
// ─────────────────────────────────────────────────────────────────────────────
import { DynamoDBClient } from '@aws-sdk/client-dynamodb';
import {
  DynamoDBDocumentClient,
  BatchWriteCommand,
  PutCommand,
} from '@aws-sdk/lib-dynamodb';

const REGION = process.env.AWS_REGION ?? 'eu-west-1';
const ddb = DynamoDBDocumentClient.from(new DynamoDBClient({ region: REGION }), {
  marshallOptions: { removeUndefinedValues: true },
});

const TABLE_MENU = 'pulari-menu';
const TABLE_SETTINGS = 'pulari-settings';
const now = new Date().toISOString();

// category map: id → display name
const CATEGORIES = {
  '1': 'Starters',
  '2': 'Main Course',
  '3': 'Breads & Rice',
  '4': 'Beverages & Desserts',
};

// [id, categoryId, NAME, slug, description, price, veg, vegan, gf, available, featured]
const RAW = [
  ['1','1','SAMOSA','samosa','Handmade pastry stuffed with mashed spiced potatoes, green peas served with chickpeas and chutneys',4.99,true,false,false,true,false],
  ['2','1','MEDU VADA','medu-vada','Authentic South Indian street food made with lentil and spices served with homemade chutney',5.99,true,true,true,true,false],
  ['3','1','NADAN MASALA OMELETTE','nadan-masala-omelette','A Kerala-style omelette made with onions, turmeric and chillies',6.99,true,false,true,true,false],
  ['4','1','KOTTAYAM CHICKEN FRY','kottayam-chicken-fry','Chicken marinated with chilly, coriander, garam masala served with mixed salad leaves',7.99,false,false,true,true,true],
  ['5','1','BANANA FRY','banana-fry','A traditional Kerala snack — golden, crispy banana fritters that are soft and sweet inside',3.99,true,true,false,true,false],
  ['6','1','VENADU KOCHU FRY','venadu-kochu-fry','Prawns sautéed with onion, tomato and pepper, served with salad leaves and lemon',8.99,false,false,true,true,false],
  ['7','1','GHEE ROAST','ghee-roast','Mangalorean-style dry roasted in a tangy, spicy and aromatic ghee sauce',9.99,false,false,true,true,true],
  ['8','2','MASALA DOSA','masala-dosa','Crispy South Indian pancake filled with spiced potato and onion filling',9.99,true,false,true,true,true],
  ['9','2','SET DOSA','set-dosa','Soft, fluffy South Indian pancakes served with potato curry, sambar and chutney',9.99,true,false,true,true,false],
  ['10','2','MYLAPOR EGG ROAST','mylapor-egg-roast','Classic Chennai-style dry egg curry with a bold spicy onion and tomato masala',11.99,false,false,true,true,false],
  ['11','2','HOUSE BOAT FISH CURRY','house-boat-fish-curry','Fresh fish simmered in spicy, tangy gravy with Kashmiri chillies, turmeric and Kerala kudampuli',13.99,false,false,true,true,true],
  ['12','2','NADAN POTHU ROAST','nadan-pothu-roast','Traditional Kerala-style beef cooked with curry leaves, black pepper and fennel seeds',12.99,false,false,true,true,false],
  ['13','2','HI RANGE BEEF ULARTHIYATHU','hi-range-beef-ularthiyathu','Slow-cooked beef with coconut pieces, curry leaves, and spices from the High Ranges of Kerala',14.99,false,false,true,true,true],
  ['14','2','VEETTILE KOZHI CURRY','veettile-kozhi-curry','Homestyle Kerala chicken curry cooked on the bone with black pepper, coriander and cinnamon',13.99,false,false,true,true,false],
  ['15','2','KONCHU MANGO CURRY','konchu-mango-curry','Prawns and raw mango simmered in a coconut milk gravy with curry leaves and South Indian spices',14.99,false,false,true,true,false],
  ['16','2','MALABAR CHICKEN BIRIYANI','malabar-chicken-biriyani','Fragrant Malabar-style biryani with tender chicken, basmati rice and a blend of whole spices',15.99,false,false,true,true,true],
  ['17','2','MALABAR BEEF BIRIYANI','malabar-beef-biriyani','Slow-cooked beef biryani prepared in the authentic Malabar wedding style',16.99,false,false,true,true,true],
  ['18','2','KAPPA PUZHUKKU','kappa-puzhukku','A comforting Kerala dish made with mashed tapioca and spices',7.99,false,false,true,true,false],
  ['19','2','OLD DELHI BUTTER CHICKEN','old-delhi-butter-chicken','Tender chicken in a rich, creamy tomato-based sauce with aromatic North Indian spices',13.99,false,false,true,true,true],
  ['20','2','PANEER BUTTER MASALA','paneer-butter-masala','Fresh cottage cheese in a rich, creamy tomato-based sauce with butter and aromatic spices',12.99,true,false,true,true,true],
  ['21','3','KERALA PARATHA','kerala-paratha','Flaky, layered Indian flatbread cooked in butter',2.99,true,false,false,true,false],
  ['22','3','APPAM','appam','Soft, lacy fermented rice hoppers with a crispy edge — a beloved Kerala classic',2.99,true,false,true,true,false],
  ['23','3','BUTTER NAAN','butter-naan','Soft, fluffy leavened bread cooked in a tandoor and finished with butter',2.99,true,false,false,true,false],
  ['24','3','NEYY CHORU','neyy-choru','Fragrant ghee rice cooked with whole spices — a Kerala staple served at festivals',3.99,true,false,true,true,false],
  ['25','3','STEAM RICE','steam-rice','Plain steamed Kerala red rice, the perfect base for any curry',3.0,true,true,true,true,false],
  ['26','3','PULAO RICE','pulao-rice','Fragrant basmati rice cooked with whole spices and saffron',4.99,true,false,true,true,false],
  ['27','3','RAITA','raita','Cooling yogurt sauce with cucumber and cumin — the perfect accompaniment to biryani',2.5,true,false,true,true,false],
  ['28','4','MANGO LASSI','mango-lassi','A refreshing blend of yogurt, mango pulp and a touch of cardamom',3.99,true,false,true,true,true],
  ['29','4','GULAB JAMUN','gulab-jamun','Soft milk-solid dumplings soaked in rose-flavoured sugar syrup. Served warm.',4.99,true,false,false,true,true],
  ['30','4','NADAN CHAI','nadan-chai','Traditional Kerala tea brewed strong with fresh milk and spices',2.5,true,false,true,true,false],
  ['31','4','MASALA TEA','masala-tea','Aromatic spiced tea with ginger, cardamom, cinnamon and cloves',2.5,true,false,true,true,false],
  ['32','4','CARDAMOM TEA','cardamom-tea','Delicate Kerala-style tea infused with fresh green cardamom',2.5,true,false,true,true,false],
  ['33','4','FILTER COFFEE','filter-coffee','Traditional South Indian filter coffee',3.0,true,false,true,true,false],
];

const items = RAW.map(([id, categoryId, name, slug, description, price, isVegetarian, isVegan, isGlutenFree, isAvailable, isFeatured]) => ({
  id,
  categoryId,
  category: categoryId,        // GSI partition key
  categoryName: CATEGORIES[categoryId],
  name,
  slug,
  description,
  price,
  imageUrl: '',
  isVegetarian,
  isVegan,
  isGlutenFree,
  isAvailable,
  isFeatured,
  displayOrder: Number(id),
  sortOrder: Number(id),       // GSI sort key
  createdAt: now,
  updatedAt: now,
}));

const settings = {
  name: 'Pulari Restaurant',
  tagline: "Dublin's Finest South Indian Cuisine",
  address: { line1: 'The Design House, Crow St', city: 'Temple Bar, Dublin', county: 'Dublin', postcode: 'D02 F884', country: 'Ireland' },
  phone: '083 068 1518',
  email: 'pularidesicafe@gmail.com',
  whatsapp: '353830681518',
  website: 'https://www.pulari.ie',
  openingHours: [
    { dayOfWeek: 0, isOpen: true, openTime: '12:00', closeTime: '21:00' },
    { dayOfWeek: 1, isOpen: true, openTime: '12:00', closeTime: '21:00' },
    { dayOfWeek: 2, isOpen: true, openTime: '12:00', closeTime: '21:00' },
    { dayOfWeek: 3, isOpen: true, openTime: '12:00', closeTime: '21:00' },
    { dayOfWeek: 4, isOpen: true, openTime: '12:00', closeTime: '21:00' },
    { dayOfWeek: 5, isOpen: true, openTime: '12:00', closeTime: '22:00' },
    { dayOfWeek: 6, isOpen: true, openTime: '12:00', closeTime: '22:00' },
  ],
  socialLinks: {},
  stripePublishableKey: '',
  pinpointAppId: process.env.VITE_PINPOINT_APP_ID ?? '5b6a43af7fa844a7bd13a84edc5deaeb',
  enableOnlineOrdering: true,
  enableReservations: true,
  enableDelivery: false,
  minimumOrderAmount: 0,
  // VAT-inclusive pricing (Irish norm): menu prices ARE the final prices.
  // No add-on service charge or tax line — what the customer sees is charged.
  serviceChargePercent: 0,
  taxPercent: 0,
};

async function seedMenu() {
  // BatchWrite in chunks of 25 (DynamoDB limit).
  for (let i = 0; i < items.length; i += 25) {
    const chunk = items.slice(i, i + 25);
    await ddb.send(
      new BatchWriteCommand({
        RequestItems: {
          [TABLE_MENU]: chunk.map((Item) => ({ PutRequest: { Item } })),
        },
      })
    );
    console.log(`  • wrote menu items ${i + 1}–${i + chunk.length}`);
  }
  console.log(`✓ Seeded ${items.length} menu items`);
}

async function seedSettings() {
  await ddb.send(
    new PutCommand({
      TableName: TABLE_SETTINGS,
      Item: { key: 'restaurant', value: settings, updatedAt: now },
    })
  );
  console.log('✓ Seeded restaurant settings');
}

(async () => {
  console.log('Seeding DynamoDB…');
  await seedMenu();
  await seedSettings();
  console.log('Done.');
})().catch((e) => {
  console.error('Seed failed:', e);
  process.exit(1);
});
