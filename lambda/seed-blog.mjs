// ─────────────────────────────────────────────────────────────────────────────
// SEED BLOG — migrates the original hard-coded SEO articles into pulari-blog.
// Safe to re-run: uses deterministic ids so posts are upserted, not duplicated.
// Run: node seed-blog.mjs   (from the lambda/ folder)
// ─────────────────────────────────────────────────────────────────────────────
import { DynamoDBClient } from '@aws-sdk/client-dynamodb';
import { DynamoDBDocumentClient, PutCommand } from '@aws-sdk/lib-dynamodb';

const REGION = process.env.AWS_REGION ?? 'eu-west-1';
const ddb = DynamoDBDocumentClient.from(new DynamoDBClient({ region: REGION }), {
  marshallOptions: { removeUndefinedValues: true },
});

const TABLE_BLOG = 'pulari-blog';

const posts = [
  {
    id: 'seed-kerala-cuisine-guide-dublin',
    slug: 'kerala-cuisine-guide-dublin',
    title:
      'Authentic Kerala Cuisine in Dublin: A Complete Guide to South Indian Flavours',
    excerpt:
      "If you've been curious about Kerala food but don't know where to start, this guide breaks down everything you need to know — from the spices and techniques to the dishes you absolutely must try at Pulari Restaurant.",
    featuredImageUrl:
      'https://images.pexels.com/photos/1581384/pexels-photo-1581384.jpeg?auto=compress&cs=tinysrgb&w=800',
    featuredImageAlt: 'Authentic Kerala cuisine spread',
    categoryId: 'bc1',
    authorName: 'Mr. Bijukuttan',
    status: 'published',
    tags: ['Kerala Food Guide', 'kerala', 'south-indian'],
    readingTimeMinutes: 8,
    publishedAt: '2026-06-12T10:00:00.000Z',
    createdAt: '2026-06-12T10:00:00.000Z',
    updatedAt: '2026-06-12T10:00:00.000Z',
    content: `Kerala, often called "God's Own Country," is a lush coastal state on the southwestern tip of India — and its cuisine is as rich and vibrant as its landscape. If you're looking for authentic Kerala food in Dublin, you've likely found your way to Pulari Restaurant in Temple Bar. But before you dive into the menu, let us take you on a flavourful journey through what makes Kerala cuisine so special.

## What Makes Kerala Cuisine Unique?

Kerala's position along the ancient Silk Road and spice trade routes fundamentally shaped its cooking. Arab, Portuguese, Dutch, and British merchants all passed through Kerala's ports, and each left traces in the food culture. Today, Kerala cuisine is a beautiful tapestry of influences — but at its heart, it remains distinctly its own.

The defining ingredients of Kerala cooking are:

**Coconut** — Used in almost every dish, from fresh grated coconut in chutneys to rich coconut milk in curries. Kerala produces more coconut than any other Indian state.

**Black Pepper** — Kerala is the birthplace of black pepper, and it features heavily in marinades, curries, and dry-roasted dishes.

**Curry Leaves** — Fresh curry leaves give Kerala food its unmistakable aroma. The moment they hit hot oil, the fragrance is intoxicating.

**Cardamom, Cinnamon & Cloves** — These whole spices form the base of Kerala biryanis and many slow-cooked meat dishes.

**Tamarind & Raw Mango** — Used to add sourness and balance to curries and chutneys.

## The Three Pillars of Kerala Food

**Rice-Based Dishes**: Kerala's love affair with rice runs deep. From simple steam rice served with curries to neyy choru (ghee rice) cooked with whole spices, and the iconic Kerala rice sadya (feast), rice is at the centre of every meal.

**Seafood & Fish**: With over 580 kilometres of coastline, Kerala's seafood dishes are legendary. Our House Boat Fish Curry — inspired by the famous houseboat culture of the Kerala backwaters — is a perfect example: fish simmered in coconut milk with raw mango and aromatic spices.

**Slow-Cooked Meats**: Kerala's Christian and Mappila Muslim communities developed remarkable meat preparations. Our Hi Range Beef Ularthiyathu, slow-cooked with coconut pieces and curry leaves, comes from the highland community traditions of Central Kerala.

## Must-Try Dishes at Pulari Restaurant, Dublin

**Malabar Chicken Biryani**: The Malabar region in northern Kerala has its own distinct biryani tradition, blending Arab cooking techniques with Kerala spices. It's lighter and more aromatic than Hyderabadi biryani, cooked with whole spices and tender chicken. Don't leave without trying it.

**Masala Dosa**: A golden, crispy rice and lentil crepe filled with spiced potato masala — a breakfast staple across South India. At Pulari, ours is made fresh to order.

**Appam**: These soft, lacy fermented rice hoppers with a crispy edge are one of Kerala's most beloved foods. Light enough for breakfast, satisfying enough for dinner.

**Kappa Puzhukku**: Tapioca cooked with coconut, turmeric, and spices. This humble dish from rural Kerala is deeply comforting and utterly delicious.

## Kerala Food and Community in Dublin

Dublin has a vibrant Malayali community, and Pulari was founded in 2025 precisely to give that community — and curious Irish food lovers — a genuine taste of home. Our founder, Mr. Bijukuttan, grew up with these recipes and has brought the authentic techniques and spice combinations of Kerala to Temple Bar.

Whether you're visiting for the first time or returning for your weekly biryani fix, Pulari is your home for Kerala cuisine in Dublin.

*Visit us at Crow St, Temple Bar, Dublin — open daily, 12PM–9PM (10PM Fri & Sat).*`,
  },
  {
    id: 'seed-vegetarian-indian-food-dublin',
    slug: 'vegetarian-indian-food-dublin',
    title:
      "The Best Vegetarian Indian Food in Dublin — A Complete Guide to Pulari's Plant-Based Menu",
    excerpt:
      "Looking for the best vegetarian Indian food in Dublin? South Indian cuisine has one of the world's richest vegetarian traditions, and Pulari brings it all to Temple Bar. Here's everything you need to know.",
    featuredImageUrl:
      'https://images.pexels.com/photos/1640777/pexels-photo-1640777.jpeg?auto=compress&cs=tinysrgb&w=800',
    featuredImageAlt: 'Vegetarian South Indian dishes',
    categoryId: 'bc2',
    authorName: 'Mr. Bijukuttan',
    status: 'published',
    tags: ['Vegetarian Guide', 'vegetarian', 'vegan'],
    readingTimeMinutes: 7,
    publishedAt: '2026-06-05T10:00:00.000Z',
    createdAt: '2026-06-05T10:00:00.000Z',
    updatedAt: '2026-06-05T10:00:00.000Z',
    content: `When people think of Indian food, they often think of chicken tikka masala or butter chicken. But India has one of the world's most sophisticated and diverse vegetarian culinary traditions, and nowhere is this more evident than in the cuisine of South India and Kerala.

At Pulari Restaurant, Temple Bar Dublin, we're proud to offer an extensive vegetarian menu rooted in Kerala's plant-based cooking heritage. Whether you're vegetarian, vegan, or simply looking for a lighter meal, our menu has something exceptional for you.

## Why South Indian Food is Perfect for Vegetarians

South Indian cuisine has historically been far more vegetarian-friendly than its North Indian counterpart. The reasons are both cultural and climatic: the hot, humid climate of South India makes heavy meat dishes less practical, and the strong Hindu and Jain traditions of the region historically emphasised plant-based eating.

The result is a cuisine of extraordinary variety and creativity — one where rice, lentils, coconut, and vegetables are transformed into dishes of remarkable flavour and complexity.

## The Dosa: South India's Greatest Gift to Vegetarians

If you've never had a dosa, you're in for a treat. Made from a fermented batter of rice and lentils, dosas are thin, crispy crepes that can be filled or served plain. The fermentation process makes them naturally probiotic and easier to digest.

At Pulari, we serve three dosa varieties:

**Ghee Roast Dosa**: The simplest and most satisfying — a dosa roasted to golden crispiness with clarified butter. The nutty flavour of the ghee takes it to another level entirely.

**Masala Dosa**: The most famous dosa variety, filled with spiced potato masala and served with sambar (a lentil-based vegetable broth) and coconut chutney. It's a complete meal in itself.

**Set Dosa**: Softer, thicker dosas served in a set — more like pancakes than crepes. Perfect for those who prefer a milder dosa experience.

## Vegetarian Starters Worth Ordering

**Samosas**: Don't mistake our samosas for the bland, mass-produced versions. These are handmade pastry cases stuffed with spiced potato and green pea filling, served with sweet tamarind chutney, mint chutney, and chickpeas. A complete snack.

**Medu Vada**: These lentil fritters are a South Indian street food staple. Crispy outside, soft inside, served with homemade coconut chutney. Our vada are made fresh to order — you can taste the difference.

**Banana Fry**: A classic Kerala snack that surprises everyone who tries it. Golden-fried banana slices with a crispy coating and soft, sweet centre. Utterly addictive.

## Vegetarian Main Courses

**Paneer Butter Masala**: Fresh cottage cheese in a rich, creamy tomato-based sauce with Kerala spices. This dish bridges North and South Indian cooking beautifully.

**Kappa Puzhukku**: Perhaps the most traditionally Keralite dish on our menu. Tapioca (cassava) cooked with fresh coconut, turmeric, and spices until soft and fragrant. A vegan dish of extraordinary depth.

## Vegan-Friendly Options

Many of our starters — samosas, medu vada, and banana fry — are fully vegan, as is kappa puzhukku. We're happy to advise on vegan options when you visit.

## Why Pulari is Dublin's Best Vegetarian Indian Restaurant

Our commitment to authenticity means our vegetarian dishes are never an afterthought. In Kerala, vegetarian cooking has hundreds of years of tradition behind it, and at Pulari we honour that tradition fully.

*Visit us at Crow St, Temple Bar, Dublin — open daily, 12PM–9PM (10PM Fri & Sat).*`,
  },
  {
    id: 'seed-malabar-biryani-guide',
    slug: 'malabar-biryani-guide',
    title:
      "What Makes Malabar Biryani Special? Kerala's Answer to the Perfect Rice Dish",
    excerpt:
      "Not all biryanis are created equal. The Malabar biryani of northern Kerala is lighter, more aromatic, and more complex than most people expect. Here's the story behind one of Pulari's most beloved dishes.",
    featuredImageUrl:
      'https://images.pexels.com/photos/262978/pexels-photo-262978.jpeg?auto=compress&cs=tinysrgb&w=800',
    featuredImageAlt: 'Malabar biryani served on a plate',
    categoryId: 'bc1',
    authorName: 'Mr. Bijukuttan',
    status: 'published',
    tags: ['Food Deep Dive', 'biryani', 'malabar'],
    readingTimeMinutes: 6,
    publishedAt: '2026-05-28T10:00:00.000Z',
    createdAt: '2026-05-28T10:00:00.000Z',
    updatedAt: '2026-05-28T10:00:00.000Z',
    content: `Ask ten Indians about biryani and you'll get ten different passionate opinions. Hyderabadi biryani. Lucknowi biryani. Kolkata biryani. Each region of India has developed its own distinct tradition, and they are all fiercely proud of it. But few biryanis are as underrated, as historically fascinating, or as uniquely flavoured as the Malabar biryani of northern Kerala.

At Pulari Restaurant, Temple Bar Dublin, our Malabar Chicken Biryani and Malabar Beef Biryani are consistently among our most ordered dishes. Here's the story behind them.

## The Origins of Malabar Biryani

Biryani came to the Indian subcontinent through the Mughals, but the Malabar coast had its own connection to the dish through Arab traders. The Mappila Muslims of northern Kerala — descendants of Arab merchants who married into the local population centuries ago — developed their own biryani tradition that blends Arab rice-cooking techniques with Kerala spices.

This is what gives Malabar biryani its distinctive character: it sits somewhere between a Middle Eastern pilaf and a South Indian rice dish, with influences from both traditions clearly visible.

## What Makes Malabar Biryani Different?

**The Rice**: Malabar biryani uses khyma rice, a short-grained, fragrant variety that absorbs flavour beautifully and has a naturally nutty taste. This is different from the basmati used in Hyderabadi or Lucknowi biryani. The shorter grain also means the biryani has a different texture — more cohesive, almost pilaf-like, rather than the loose separate grains of a Hyderabadi preparation.

**The Spices**: While all biryanis use whole spices, Malabar biryani leans heavily on the warm spices of Kerala — cardamom, cinnamon, cloves, star anise, and of course black pepper, which is native to the region. The result is more warming and aromatic than the more pungent spice profile of North Indian biryanis.

**The Meat**: Malabar biryani is traditionally made with bone-in pieces of chicken or beef, which release their flavour into the rice during slow cooking. At Pulari, we use the same traditional approach.

**Fried Onions & Cashews**: Crispy fried onions and golden cashews are a signature garnish of Malabar biryani, adding texture and a sweet crunch that balances the savoury spices. These are stirred through the rice just before serving.

**The Cooking Method**: Malabar biryani is cooked using the "dum" method — the rice and meat are layered together and slow-cooked in a sealed pot, allowing the steam to circulate and the flavours to meld together. At Pulari, Mr. Bijukuttan follows this traditional method faithfully.

## Malabar Biryani vs Hyderabadi Biryani: What's the Difference?

This is the question we get most often, so let's settle it clearly.

Hyderabadi biryani is bold, intensely spiced, and uses long-grain basmati rice. It often includes saffron for colour and has a more pungent flavour profile. It's a Mughal-influenced dish, and it's wonderful.

Malabar biryani is more subtle, more aromatic, and more coconut-adjacent in character. It's lighter, easier to eat in large quantities, and the spice flavours are warm rather than sharp. It's an Arab-Kerala fusion, and it's unlike anything else.

Both are excellent. But at Pulari, we specialise in the Malabar tradition, and we believe ours is the finest Malabar biryani you'll find in Dublin.

## Try Our Malabar Biryani

Our Malabar Chicken Biryani (€15.99) and Malabar Beef Biryani (€16.99) are available every day we're open. We recommend pairing with our raita — a cooling yogurt sauce that perfectly balances the warm spices of the biryani.

*Visit us at Crow St, Temple Bar, Dublin — open daily, 12PM–9PM (10PM Fri & Sat).*`,
  },
];

async function seedBlog() {
  for (const post of posts) {
    await ddb.send(new PutCommand({ TableName: TABLE_BLOG, Item: post }));
    console.log(`  • upserted: ${post.slug}`);
  }
  console.log(`✓ Seeded ${posts.length} blog posts`);
}

(async () => {
  console.log('Seeding pulari-blog…');
  await seedBlog();
  console.log('Done.');
})().catch((e) => {
  console.error('Blog seed failed:', e);
  process.exit(1);
});
