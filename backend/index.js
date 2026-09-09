const express = require('express');
const cors = require('cors');
const dotenv = require('dotenv');
const { createClient } = require('@supabase/supabase-js');

dotenv.config();

const app = express();
app.use(cors({ origin: true }));

// Simple root route to avoid "Cannot GET /" in browser
app.get('/', (req, res) => {
  res.json({ status: 'ok', service: 'agrilink-backend', note: 'Use /health or /api/* endpoints' });
});
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ limit: '10mb', extended: true }));

const jpeg = require('jpeg-js');

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_ANON_KEY || process.env.SUPABASE_SERVICE_ROLE_KEY;
const port = process.env.PORT || 4000;

if (!supabaseUrl || !supabaseKey) {
  console.warn('Missing Supabase environment variables SUPABASE_URL or SUPABASE_ANON_KEY / SUPABASE_SERVICE_ROLE_KEY.');
}

const supabase = createClient(supabaseUrl || '', supabaseKey || '');

const paymentsRoutes = require('./routes/payments');
const ordersRoutes = require('./routes/orders');
const smsService = require('./services/smsService');

app.use('/api/payments', paymentsRoutes(supabase));
app.use('/api/orders', ordersRoutes(supabase));

app.get('/health', (req, res) => {
  res.json({ status: 'ok', service: 'agrilink-backend', escrow: 'enabled' });
});

app.get('/api/profiles/:id', async (req, res) => {
  const { id } = req.params;
  const { data, error } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', id)
    .single();

  if (error) {
    return res.status(400).json({ error: error.message });
  }
  res.json({ profile: data });
});

app.get('/api/farmers/:id', async (req, res) => {
  const { id } = req.params;
  const { data, error } = await supabase
    .from('farmers')
    .select('*')
    .eq('id', id)
    .single();

  if (error) {
    return res.status(400).json({ error: error.message });
  }
  res.json({ farmer: data });
});

app.get('/api/buyers/:id', async (req, res) => {
  const { id } = req.params;
  const { data, error } = await supabase
    .from('buyers')
    .select('*')
    .eq('id', id)
    .single();

  if (error) {
    return res.status(400).json({ error: error.message });
  }
  res.json({ buyer: data });
});

app.get('/api/admin/farmers', async (req, res) => {
  const { data, error } = await supabase
    .from('farmers')
    .select('*, profiles(*)');

  if (error) {
    return res.status(400).json({ error: error.message });
  }
  res.json({ farmers: data });
});

app.post('/api/admin/farmers/:id/verify', async (req, res) => {
  const { id } = req.params;
  const { status } = req.body;
  const validStatuses = ['pending', 'verified', 'suspended', 'rejected'];

  if (!validStatuses.includes(status)) {
    return res.status(400).json({ error: 'Invalid verification status' });
  }

  const { data, error } = await supabase
    .from('farmers')
    .update({ verification_status: status })
    .eq('id', id)
    .select('*')
    .single();

  if (error) {
    return res.status(400).json({ error: error.message });
  }

  // ── Send SMS to Farmer regarding verification status ──
  try {
    const { data: fProfile } = await supabase
      .from('farmers')
      .select('mobile_money_number, profiles(full_name, phone)')
      .eq('id', id)
      .single();

    const fPhone = fProfile?.mobile_money_number || fProfile?.profiles?.phone;
    const fName = fProfile?.profiles?.full_name || 'Farmer';

    if (fPhone) {
      smsService.notifyFarmerVerification({
        farmerPhone: fPhone,
        farmerName: fName,
        status,
      }).catch(e => console.warn('[SMS] Farmer verification SMS error:', e.message));
    }
  } catch (lookupErr) {
    console.warn('[SMS] Farmer verification lookup error:', lookupErr.message);
  }

  res.json({ farmer: data });
});

// ─── SMS TEST & UTILITY ENDPOINTS ───
app.post('/api/sms/test', async (req, res) => {
  try {
    const { to, message, sender, sandbox } = req.body;
    if (!to || !message) {
      return res.status(400).json({ error: 'Both "to" and "message" fields are required.' });
    }
    const result = await smsService.sendSMS({ to, message, sender, sandbox });
    return res.json(result);
  } catch (err) {
    console.error('Test SMS error:', err);
    return res.status(500).json({ error: err.message });
  }
});

app.post('/api/notifications/welcome', async (req, res) => {
  try {
    const { phone, name, role } = req.body;
    if (!phone) {
      return res.status(400).json({ error: '"phone" is required.' });
    }
    const result = await smsService.notifyWelcome({ phone, name, role });
    return res.json(result);
  } catch (err) {
    console.error('Welcome SMS error:', err);
    return res.status(500).json({ error: err.message });
  }
});

// ─── CROP KNOWLEDGE BASE HELPER ───
const CROP_KNOWLEDGE_DB = {
  tomatoes: {
    name: 'Fresh Tomatoes',
    category: 'Vegetables / Solanaceae',
    description: 'A glossy red fruit commonly consumed as a staple vegetable. Known for its juicy, mildly acidic flavor and versatility in soups, stews, and sauces.',
    healthBenefits: ['Rich in Lycopene (potent antioxidant)', 'High in Vitamin C & Potassium', 'Supports heart and skin health'],
    uses: 'Essential for Jollof rice sauce, traditional stews, fresh salads, and salsa.',
    growingRegions: 'Kumasi, Ejisu, Keta, Mampong (Ghana)',
    similarCrops: ['Red Pepper', 'Garden Eggs', 'Onions']
  },
  pepper: {
    name: 'Red Hot Pepper / Chili',
    category: 'Spices & Vegetables',
    description: 'Vibrant red peppers prized for adding spicy heat, rich aroma, and deep color to culinary dishes across West Africa.',
    healthBenefits: ['Contains Capsaicin (boosts metabolism)', 'High in Vitamin A & Vitamin C', 'Natural anti-inflammatory properties'],
    uses: 'Vital component of shito, hot pepper sauces, soups, and meat marinades.',
    growingRegions: 'Ejisu, Techiman, Volta Region',
    similarCrops: ['Fresh Tomatoes', 'Onions', 'Ginger']
  },
  maize: {
    name: 'Fresh Yellow & White Maize',
    category: 'Grains & Cereals',
    description: 'Staple cereal grain with golden or pearl kernels packed with complex carbohydrates, dietary fiber, and natural sweetness.',
    healthBenefits: ['High dietary fiber for healthy digestion', 'Rich in B-vitamins (Thiamine & Niacin)', 'Provides sustained physical energy'],
    uses: 'Boiled corn, roasted street maize, banku, kenkey, and corn porridge (koko).',
    growingRegions: 'Sunyani, Techiman, Ejisu, Tamale',
    similarCrops: ['Cassava', 'Yam', 'Plantain']
  },
  cassava: {
    name: 'Fresh Cassava Roots',
    category: 'Tubers & Root Crops',
    description: 'A robust tropical root tuber with starchy white flesh beneath a woody brown skin. One of the most important food staples in West Africa.',
    healthBenefits: ['High-energy carbohydrate source', 'Gluten-free starch alternative', 'Contains essential minerals like calcium & iron'],
    uses: 'Processing into gari, fufu, cassava flour, or served boiled with stew.',
    growingRegions: 'Eastern, Ashanti, and Central Regions',
    similarCrops: ['Yam', 'Plantain', 'Cocoyam']
  },
  broccoli: {
    name: 'Fresh Broccoli',
    category: 'Brassica Vegetables',
    description: 'An edible green plant with large flowering heads and thick stalk. Renowned worldwide for its crisp texture and immense nutritional density.',
    healthBenefits: ['Loaded with Sulforaphane (anti-cancer compound)', 'High in Fiber, Vitamin K & C', 'Supports digestive & heart wellness'],
    uses: 'Steamed as side dish, stir-fries, vegetable soups, or fresh salads.',
    growingRegions: 'Highland agricultural zones (Aburi, Mampong)',
    similarCrops: ['Cabbage', 'Garden Eggs', 'Lettuce']
  },
  soursop: {
    name: 'Soursop / Graviola',
    category: 'Exotic Fruits',
    description: 'A prickly green tropical fruit with sweet-tart fibrous white pulp. Known for its tropical aroma combining pineapple, banana, and apple flavors.',
    healthBenefits: ['Renowned for immune system boosting properties', 'Rich in Vitamin C & B-complex', 'Contains natural relaxing compounds'],
    uses: 'Fresh juices, tropical smoothies, fruit desserts, or enjoyed fresh.',
    growingRegions: 'Forest & sub-tropical belts',
    similarCrops: ['Mango', 'Papaya', 'Passion Fruit']
  },
  dragonfruit: {
    name: 'Dragon Fruit (Pitaya)',
    category: 'Exotic Fruits',
    description: 'A striking tropical cactus fruit featuring bright pink skin and black-seeded white or magenta flesh with a light, refreshing taste.',
    healthBenefits: ['Packed with antioxidants and prebiotic fiber', 'Promotes healthy gut microbiome', 'Hydrating and low in calories'],
    uses: 'Smoothie bowls, fresh fruit platters, and salads.',
    growingRegions: 'Specialized greenhouses & tropical farms',
    similarCrops: ['Papaya', 'Pineapple', 'Watermelon']
  },
  rice: {
    name: 'Rice',
    category: 'Grains & Cereals',
    description: 'One of the world\'s most important staple food grains. White or brown rice is cultivated in paddies and is the foundation of meals across Africa and Asia.',
    healthBenefits: ['Excellent source of energy and complex carbohydrates', 'Brown rice is rich in fiber, manganese & B-vitamins', 'Naturally gluten-free grain'],
    uses: 'Jollof rice, fried rice, waakye, rice water, porridge, and side dishes.',
    growingRegions: 'Northern Region, Volta Region, Ashanti (Ghana)',
    similarCrops: ['Maize', 'Millet', 'Sorghum']
  },
  mango: {
    name: 'Fresh Mango',
    category: 'Tropical Fruits',
    description: 'A sweet, aromatic tropical stone fruit with golden-orange flesh. One of the most popular fruits in West Africa, enjoyed fresh or processed.',
    healthBenefits: ['Extremely rich in Vitamin C & Vitamin A', 'Contains digestive enzymes (amylases)', 'Boosts immune system and eye health'],
    uses: 'Fresh eating, mango juice, smoothies, dried mango, chutneys, and desserts.',
    growingRegions: 'Tamale, Yendi, Wa, Upper East Region (Ghana)',
    similarCrops: ['Papaya', 'Pineapple', 'Soursop']
  },
  banana: {
    name: 'Fresh Banana',
    category: 'Tropical Fruits',
    description: 'A curved yellow fruit with soft, sweet flesh. Bananas are one of the most widely consumed fruits globally, rich in energy and essential nutrients.',
    healthBenefits: ['High in potassium for heart health', 'Natural energy booster with fast-release sugars', 'Contains prebiotic fiber for gut health'],
    uses: 'Fresh snacking, banana bread, smoothies, plantain chips (when green), and desserts.',
    growingRegions: 'Eastern, Volta, and Ashanti Regions (Ghana)',
    similarCrops: ['Plantain', 'Pineapple', 'Mango']
  },
  pineapple: {
    name: 'Fresh Pineapple',
    category: 'Tropical Fruits',
    description: 'A spiky tropical fruit with juicy, tangy-sweet yellow flesh. Ghana is one of Africa\'s largest pineapple producers.',
    healthBenefits: ['Contains Bromelain enzyme (anti-inflammatory)', 'Very high in Vitamin C & Manganese', 'Aids digestion and reduces bloating'],
    uses: 'Fresh fruit, pineapple juice, sobolo mix, fruit salads, and grilled garnish.',
    growingRegions: 'Nsawam, Akuapem, Central Region (Ghana)',
    similarCrops: ['Mango', 'Papaya', 'Coconut']
  },
  okra: {
    name: 'Fresh Okra',
    category: 'Vegetables',
    description: 'A green, finger-shaped pod vegetable with a distinctive mucilaginous texture when cooked. Essential in West African cuisine.',
    healthBenefits: ['Rich in Vitamin K, C & folate', 'High in dietary fiber for digestive health', 'Contains antioxidants supporting heart health'],
    uses: 'Okra soup/stew, grilled okra, dried okra powder for soups, and pickled okra.',
    growingRegions: 'Northern, Upper West, Ashanti Regions (Ghana)',
    similarCrops: ['Garden Eggs', 'Tomatoes', 'Pepper']
  },
  ginger: {
    name: 'Fresh Ginger Root',
    category: 'Spices & Roots',
    description: 'A pungent, aromatic rhizome used worldwide as a spice and natural remedy. Known for its warming, spicy flavor.',
    healthBenefits: ['Powerful anti-nausea and anti-inflammatory properties', 'Contains Gingerol (bioactive compound)', 'Supports immune function and circulation'],
    uses: 'Ginger tea, sobolo drink, cooking spice, ginger beer, and traditional medicine.',
    growingRegions: 'Kadjebi, Volta Region, Ashanti (Ghana)',
    similarCrops: ['Onion', 'Garlic', 'Pepper']
  },
  carrot: {
    name: 'Fresh Carrots',
    category: 'Root Vegetables',
    description: 'Crisp, sweet, bright orange taproots loaded with beta-carotene, dietary fiber, and essential minerals. Widely grown and sold across Ghanaian markets.',
    healthBenefits: ['Excellent source of Beta-Carotene (Vitamin A) for eye health', 'High fiber aids digestion and weight management', 'Rich in antioxidants supporting radiant skin'],
    uses: 'Salads, fried rice, stews, vegetable soups, coleslaw, or eaten raw as a healthy snack.',
    growingRegions: 'Amakom, Mampong, Kumasi, Highland farms (Ghana)',
    similarCrops: ['Fresh Tomatoes', 'Cabbage', 'Green Pepper']
  },
  'spring oion': {
    name: 'Fresh Spring Onions / Scallions',
    category: 'Vegetables & Herbs',
    description: 'Crisp green scallions with fresh hollow green leaves and tender white bulbs. Adds an aromatic mild onion pungency to West African cuisine.',
    healthBenefits: ['Rich in Vitamin K and Vitamin C', 'Contains Allicin with natural antibacterial properties', 'Low calorie and supports immune defense'],
    uses: 'Garnish for fried rice, waakye, grilled meats (chofi / suya), stir-fries, and stews.',
    growingRegions: 'Accra plains, Volta basin, Kumasi peri-urban vegetable farms',
    similarCrops: ['Onions', 'Garlic', 'Ginger']
  },
  'spring onion': {
    name: 'Fresh Spring Onions / Scallions',
    category: 'Vegetables & Herbs',
    description: 'Crisp green scallions with fresh hollow green leaves and tender white bulbs. Adds an aromatic mild onion pungency to West African cuisine.',
    healthBenefits: ['Rich in Vitamin K and Vitamin C', 'Contains Allicin with natural antibacterial properties', 'Low calorie and supports immune defense'],
    uses: 'Garnish for fried rice, waakye, grilled meats (chofi / suya), stir-fries, and stews.',
    growingRegions: 'Accra plains, Volta basin, Kumasi peri-urban vegetable farms',
    similarCrops: ['Onions', 'Garlic', 'Ginger']
  },
  onion: {
    name: 'Fresh Onions',
    category: 'Bulb Vegetables',
    description: 'Pungent, layered red and white allium bulbs essential for cooking across Ghana and West Africa.',
    healthBenefits: ['Rich in Quercetin (heart antioxidant)', 'High in Vitamin C & Folate', 'Anti-inflammatory and antimicrobial properties'],
    uses: 'Base for jollof rice stew, shito, meat soups, salads, and everyday cooking.',
    growingRegions: 'Bawku, Northern Ghana, Tamale, Accra',
    similarCrops: ['Spring Onion', 'Garlic', 'Ginger']
  }
};

const CROP_SYNONYMS = {
  banana: ['banana', 'bananas', 'musa', 'cooking banana', 'plantain', 'yellow banana', 'green banana', 'fruit'],
  maize: ['maize', 'corn', 'sweet corn', 'yellow maize', 'white maize', 'corn on the cob', 'cereal grain', 'banku'],
  carrot: ['carrot', 'carrots', 'wild carrot', 'daucus carota', 'root vegetable'],
  cassava: ['cassava', 'cassava root', 'yuca', 'manioc', 'tuber', 'tapioca', 'gari'],
  'spring oion': ['spring onion', 'spring oion', 'scallion', 'green onion', 'onion', 'allium', 'shallot'],
  'spring onion': ['spring onion', 'spring oion', 'scallion', 'green onion', 'onion', 'allium', 'shallot'],
  onion: ['onion', 'onions', 'red onion', 'spring onion', 'spring oion', 'shallot'],
  tomato: ['tomato', 'tomatoes', 'fresh tomato', 'red tomato', 'plum tomato', 'cherry tomato', 'solanum lycopersicum'],
  pepper: ['pepper', 'peppers', 'red pepper', 'chili', 'chilli', 'bell pepper', 'habanero', 'capsicum', 'hot pepper', 'green pepper', 'shito'],
  yam: ['yam', 'yams', 'pona', 'white yam', 'yellow yam', 'tuber', 'dioscorea'],
  'garden egg': ['garden egg', 'garden eggs', 'eggplant', 'aubergine', 'african eggplant', 'solanum melongena'],
  cabbage: ['cabbage', 'cabbages', 'brassica', 'green cabbage'],
  lettuce: ['lettuce', 'salad greens', 'leaf vegetable', 'lactuca sativa'],
  mango: ['mango', 'mangoes', 'mangos', 'fresh mango', 'mangifera indica'],
  watermelon: ['watermelon', 'watermelons', 'citrullus lanatus', 'melon'],
  pineapple: ['pineapple', 'pineapples', 'ananas'],
  okra: ['okra', 'ladyfinger', 'okro', 'abelmoschus esculentus'],
  ginger: ['ginger', 'ginger root', 'zingiber'],
  spinach: ['spinach', 'kontomire', 'greens', 'leafy greens']
};

function getCropKnowledge(cropKey, visionLabels = [], webEntities = [], geminiData = null) {
  const normalized = (cropKey || '').toLowerCase();
  
  if (geminiData && geminiData.description) {
    const formattedTitle = geminiData.cropName || (cropKey
      ? cropKey.split(' ').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' ')
      : 'Identified Crop');
    return {
      name: formattedTitle,
      category: geminiData.category || (visionLabels[0] ? `Agricultural Produce (${visionLabels[0]})` : 'Produce & Crops'),
      description: geminiData.description,
      healthBenefits: Array.isArray(geminiData.healthBenefits) && geminiData.healthBenefits.length > 0
        ? geminiData.healthBenefits
        : ['Natural source of essential vitamins, minerals, and dietary fiber', 'Supports healthy digestion and overall wellness', 'Staple nutritious produce in West Africa'],
      uses: geminiData.uses || 'Used in traditional home cooking, stews, soups, or local fresh markets.',
      growingRegions: geminiData.growingRegions || 'Ashanti, Eastern, Volta, and Brong-Ahafo regions (Ghana)',
      similarCrops: Array.isArray(geminiData.similarCrops) && geminiData.similarCrops.length > 0
        ? geminiData.similarCrops
        : ['Cassava', 'Plantain', 'Yam', 'Maize']
    };
  }

  for (const key of Object.keys(CROP_KNOWLEDGE_DB)) {
    if (normalized.includes(key) || key.includes(normalized)) {
      return CROP_KNOWLEDGE_DB[key];
    }
  }

  // Dynamic fallback for any internet crop identified via AI Vision Lens
  const formattedTitle = cropKey
    ? cropKey.split(' ').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' ')
    : 'Identified Crop';

  return {
    name: formattedTitle,
    category: visionLabels[0] ? `Agricultural Produce (${visionLabels[0]})` : 'Produce & Crops',
    description: `A distinctive crop identified via AI Visual Intelligence. Identified labels include: ${visionLabels.slice(0, 5).join(', ')}.`,
    healthBenefits: ['Natural source of plant nutrients and dietary fiber', 'Contains essential vitamins and organic antioxidants', 'Supports balanced dietary health'],
    uses: 'Used in cooking, salads, fresh juices, or traditional culinary recipes.',
    growingRegions: 'Various agricultural regions',
    similarCrops: ['Fresh Tomatoes', 'Red Pepper', 'Cabbage']
  };
}

// ─── LOCAL IMAGE COLOR & VISUAL FEATURE ANALYZER ───
function analyzeImageColor(cleanBase64) {
  try {
    const buf = Buffer.from(cleanBase64, 'base64');
    const decoded = jpeg.decode(buf, { useTArray: true });
    if (!decoded || !decoded.data) return null;

    let rSum = 0, gSum = 0, bSum = 0, count = 0;
    const step = Math.max(4, Math.floor(decoded.data.length / (4 * 4000))) * 4;

    let yellowCount = 0;
    let orangeCount = 0;
    let greenCount = 0;
    let redCount = 0;
    let brownCount = 0;

    for (let i = 0; i < decoded.data.length; i += step) {
      const r = decoded.data[i];
      const g = decoded.data[i + 1];
      const b = decoded.data[i + 2];

      // Exclude near-white backgrounds or deep shadows
      if (r > 248 && g > 248 && b > 248) continue;
      if (r < 25 && g < 25 && b < 25) continue;

      rSum += r; gSum += g; bSum += b; count++;

      // Bright Yellow (Banana / Corn): High R & G, low B
      if (r > 170 && g > 150 && b < 210 && (r + g) > 340) {
        yellowCount++;
      }
      // Orange (Carrot): High R, Med G, low B
      else if (r > 160 && g > 70 && g < 185 && b < 140 && (r - g) > 25) {
        orangeCount++;
      }
      // Green (Spring onion, Leafy): G is dominant
      else if (g > 95 && g > r * 1.05 && g > b * 1.05) {
        greenCount++;
      }
      // Red (Tomato, Pepper): R is dominant
      else if (r > 140 && r > g * 1.25 && r > b * 1.25) {
        redCount++;
      }
      // Brown / Earthy (Cassava, Yam): warm muted tones
      else if (r > 110 && r < 220 && g > 90 && g < 190 && b > 70 && b < 170 && Math.abs(r - g) < 45) {
        brownCount++;
      }
    }

    if (count === 0) return null;
    return {
      avgRGB: [Math.round(rSum / count), Math.round(gSum / count), Math.round(bSum / count)],
      yellowRatio: yellowCount / count,
      orangeRatio: orangeCount / count,
      greenRatio: greenCount / count,
      redRatio: redCount / count,
      brownRatio: brownCount / count,
      totalSampled: count
    };
  } catch (e) {
    return null;
  }
}

const DEFAULT_MARKETPLACE_CROPS = [
  { id: '1ac9cbef-de9f-48bd-9a2f-c285b1790312', name: 'cassava', category: 'Tubers', price: 40, unit: 'kg', location: 'Santasi', status: 'active', quantity: 133 },
  { id: 'a9bddd02-6d5e-4981-85e6-551763ff0411', name: 'banana', category: 'Fruits', price: 12, unit: 'kg', location: 'Accra', status: 'active', quantity: 120 },
  { id: '90e0feff-1d47-4d22-87c4-36b060f206d7', name: 'carrot', category: 'Vegetables', price: 10, unit: 'kg', location: 'Amakom', status: 'active', quantity: 991 },
  { id: 'dd21adb1-fc8f-4641-9dca-d4f66de98272', name: 'maize', category: 'Grains', price: 20, unit: 'kg', location: 'Obuasi', status: 'active', quantity: 200 },
  { id: '223570e8-fd64-418f-9076-7bba892929a5', name: 'spring oion', category: 'Vegetables', price: 10, unit: 'kg', location: 'Accra', status: 'active', quantity: 100 },
  { id: 'demo-1', name: 'Fresh Tomatoes', category: 'Vegetables', price: 12, unit: 'kg', location: 'Kumasi', status: 'active', quantity: 150 },
  { id: 'demo-2', name: 'Red Pepper', category: 'Vegetables', price: 15, unit: 'kg', location: 'Ejisu', status: 'active', quantity: 80 }
];

// ─── VISUAL SEARCH API (Google Cloud Vision API + Local Visual Intelligence Engine) ───
app.post('/api/visual-search', async (req, res) => {
  try {
    const { imageBase64, imageName } = req.body;
    const apiKey = process.env.GOOGLE_VISION_API_KEY || process.env.GOOGLE_CLOUD_KEY;

    let detectedLabels = [];
    let webEntities = [];
    let bestGuessLabel = '';
    let googleVisionError = null;

    const cleanBase64 = imageBase64 ? imageBase64.replace(/^data:image\/\w+;base64,/, '') : '';

    // 1. Fetch active crops from AgriLink Marketplace Database (with robust fallback)
    let activeCrops = [];
    try {
      const { data: allActiveCrops, error: dbErr } = await supabase
        .from('crops')
        .select('*')
        .eq('status', 'active');

      if (allActiveCrops && allActiveCrops.length > 0) {
        activeCrops = allActiveCrops;
      }
    } catch (e) {
      console.warn('[Visual Search] Supabase fetch warning:', e.message);
    }

    if (activeCrops.length === 0) {
      activeCrops = DEFAULT_MARKETPLACE_CROPS;
    }

    // 2. Call Google Gemini Multimodal Vision API if available
    const geminiKey = process.env.GEMINI_API_KEY || process.env.GOOGLE_API_KEY || process.env.GOOGLE_VISION_API_KEY || process.env.GOOGLE_CLOUD_KEY;
    let geminiCropData = null;
    let geminiError = null;

    if (geminiKey && cleanBase64) {
      try {
        const cropNamesList = activeCrops.map(c => c.name).join(', ');
        const promptText = `You are the AI visual recognition system for AgriLink, Ghana's agricultural marketplace.
Carefully examine this photo to identify the crop, produce, fruit, vegetable, tuber, or grain shown.
The crops currently active in our marketplace are: [${cropNamesList}].
Identify what crop this is.
Even if the crop is raw, harvested, peeled, sliced, packaged, dried, or growing in a farm, identify it accurately.
Return your answer strictly in valid JSON format with this structure:
{
  "cropName": "name of the crop (e.g. Cassava, Maize, Carrot, Banana, Spring Onion, Tomato, Pepper, Yam, Plantain, Rice, Onion, Okra, Ginger)",
  "category": "Tubers & Root Crops | Grains & Cereals | Vegetables | Tropical Fruits | Root Vegetables",
  "confidence": 0.95,
  "description": "Short 1-2 sentence description of the crop and its nutritional and culinary value in Ghana and West Africa",
  "healthBenefits": ["Benefit 1", "Benefit 2", "Benefit 3"],
  "uses": "Common Ghanaian dishes and culinary uses (e.g., fufu, banku, jollof, soups, salads, snacking)",
  "synonyms": ["other common names", "local Ghanaian / Twi names like Bankye, Aburoo, Borodee, etc."]
}`;

        const mimeMatch = imageBase64 ? imageBase64.match(/^data:(image\/\w+);base64,/) : null;
        const rawMime = mimeMatch ? mimeMatch[1].toLowerCase() : 'image/jpeg';
        const imageMimeType = rawMime === 'image/jpg' ? 'image/jpeg' : rawMime;

        const geminiRes = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${geminiKey}`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            contents: [
              {
                parts: [
                  {
                    inlineData: {
                      mimeType: imageMimeType,
                      data: cleanBase64
                    }
                  },
                  { text: promptText }
                ]
              }
            ],
            generationConfig: {
              responseMimeType: 'application/json',
              temperature: 0.1
            }
          })
        });

        const geminiJson = await geminiRes.json();
        if (geminiJson.error) {
          geminiError = geminiJson.error.message;
          console.warn('[Visual Search] Gemini API warning:', geminiError);
        } else {
          const candidateText = geminiJson.candidates?.[0]?.content?.parts?.[0]?.text;
          if (candidateText) {
            try {
              let cleaned = candidateText.trim();
              if (cleaned.startsWith('```')) {
                cleaned = cleaned.replace(/^```(?:json)?\s*/i, '').replace(/\s*```$/i, '').trim();
              }
              geminiCropData = JSON.parse(cleaned);
              console.log('[Visual Search] Gemini successfully identified crop:', geminiCropData.cropName);
              if (geminiCropData.cropName) {
                bestGuessLabel = geminiCropData.cropName.toLowerCase().trim();
              }
              if (Array.isArray(geminiCropData.synonyms)) {
                webEntities.push(...geminiCropData.synonyms.map(s => s.toLowerCase().trim()));
              }
              if (geminiCropData.category) {
                detectedLabels.push(geminiCropData.category.toLowerCase().trim());
              }
            } catch (pErr) {
              console.warn('[Visual Search] Gemini JSON parse error:', pErr.message);
            }
          }
        }
      } catch (gErr) {
        geminiError = gErr.message;
        console.warn('[Visual Search] Gemini fetch exception:', gErr.message);
      }
    }

    // 2b. Call Google Cloud Vision API as fallback/supplement if available and Gemini did not resolve
    if (!geminiCropData && apiKey && cleanBase64) {
      try {
        const visionResponse = await fetch(`https://vision.googleapis.com/v1/images:annotate?key=${apiKey}`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            requests: [
              {
                image: { content: cleanBase64 },
                features: [
                  { type: 'LABEL_DETECTION', maxResults: 10 },
                  { type: 'OBJECT_LOCALIZATION', maxResults: 5 },
                  { type: 'WEB_DETECTION', maxResults: 10 }
                ]
              }
            ]
          })
        });

        const visionData = await visionResponse.json();
        if (visionData.error) {
          googleVisionError = visionData.error.message || 'Google Vision method error';
          console.warn('[Visual Search] Google Cloud Vision:', googleVisionError);
        } else {
          const response = visionData.responses?.[0] || {};
          const labels = response.labelAnnotations || [];
          detectedLabels = labels.map(l => l.description.toLowerCase());
          const webDetection = response.webDetection || {};
          bestGuessLabel = (webDetection.bestGuessLabels?.[0]?.label || '').toLowerCase();
          webEntities = (webDetection.webEntities || []).map(e => (e.description || '').toLowerCase()).filter(Boolean);
        }
      } catch (err) {
        googleVisionError = err.message;
        console.warn('[Visual Search] Google Cloud Vision fetch error:', err.message);
      }
    }

    // 3. Analyze Image Color & Visual Signatures (Local Vision Intelligence)
    const colorAnalysis = cleanBase64 ? analyzeImageColor(cleanBase64) : null;

    // 4. Score active marketplace crops to find the best match
    const visionTokens = [bestGuessLabel, ...webEntities, ...detectedLabels].join(' ').toLowerCase();
    const fileHint = (imageName || '').toLowerCase();

    let bestCrop = null;
    let highestScore = 0;

    for (const crop of activeCrops) {
      let score = 0;
      const cropName = crop.name.toLowerCase().trim();
      const cropCategory = (crop.category || '').toLowerCase();
      const synonyms = CROP_SYNONYMS[cropName] || [cropName];

      // A. Direct Match from Gemini Visual AI (Highest Confidence)
      if (geminiCropData && geminiCropData.cropName) {
        const geminiName = geminiCropData.cropName.toLowerCase().trim();
        const geminiSyns = Array.isArray(geminiCropData.synonyms) ? geminiCropData.synonyms.map(s => s.toLowerCase().trim()) : [];
        if (cropName === geminiName || cropName.includes(geminiName) || geminiName.includes(cropName)) {
          score += 300;
        } else if (synonyms.some(s => s === geminiName || geminiSyns.includes(s) || s.includes(geminiName) || geminiName.includes(s))) {
          score += 260;
        }
      }

      // B. Direct Image Hash / Byte Match (Farmer's exact or cropped upload)
      if (crop.image_url && cleanBase64) {
        const cropCleanB64 = crop.image_url.replace(/^data:image\/\w+;base64,/, '');
        if (cleanBase64.startsWith(cropCleanB64.slice(0, 500)) || cropCleanB64.startsWith(cleanBase64.slice(0, 500))) {
          score += 250;
        } else if (Math.abs(cleanBase64.length - cropCleanB64.length) < 200 && cleanBase64.slice(0, 80) === cropCleanB64.slice(0, 80)) {
          score += 200;
        }
      }

      // C. Google Vision Labels / Web Entities Match
      if (visionTokens) {
        for (const syn of synonyms) {
          if (visionTokens.includes(syn)) {
            score += (syn === cropName ? 100 : 70);
            break;
          }
        }
        if (cropCategory && visionTokens.includes(cropCategory)) {
          score += 25;
        }
      }

      // C. Local Color Analysis Matching
      if (colorAnalysis && colorAnalysis.avgRGB) {
        const [r, g, b] = colorAnalysis.avgRGB;

        // Banana: high R and G, high brightness
        if (cropName.includes('banana') && ((r > 220 && g > 190) || colorAnalysis.yellowRatio > 0.25)) {
          score += 85;
        }
        // Maize: warm golden corn, R high, G medium, low B
        if (cropName.includes('maize') && (r > 175 && g < 185 && b < 115 && r - b > 65)) {
          score += 85;
        }
        // Carrot: high R, medium G, low B or orange ratio
        if (cropName.includes('carrot') && ((r > 150 && g > 100 && b < 100 && r > g) || colorAnalysis.orangeRatio > 0.10)) {
          score += 85;
        }
        // Spring onion / Leafy: green dominant
        if ((cropName.includes('spring') || cropName.includes('onion') || cropCategory.includes('vegetable')) && (g >= r && g >= b)) {
          score += 85;
        }
        // Cassava / Yam: warm earthy tones (R: 160-220, G: 140-190, B: 120-180)
        if (cropName.includes('cassava') && (colorAnalysis.brownRatio > 0.08 || (r > 165 && g > 145 && b > 125 && Math.abs(r - g) < 40))) {
          score += 85;
        }
        // Tomato / Pepper: red dominant
        if ((cropName.includes('tomato') || cropName.includes('pepper')) && (r > 130 && r > g * 1.2 && r > b * 1.2)) {
          score += 85;
        }
      }

      // D. Filename Hint Match
      if (fileHint) {
        for (const syn of synonyms) {
          if (fileHint.includes(syn)) {
            score += 90;
            break;
          }
        }
      }

      if (score > highestScore) {
        highestScore = score;
        bestCrop = crop;
      }
    }

    // 5. Determine result
    let identifiedCrop = '';
    let foundInMarketplace = false;
    let matchedCrops = [];

    if (bestCrop && highestScore >= 50) {
      foundInMarketplace = true;
      identifiedCrop = bestCrop.name;
      matchedCrops = activeCrops.filter(c => {
        const cName = c.name.toLowerCase();
        const bName = bestCrop.name.toLowerCase();
        return cName === bName || cName.includes(bName) || bName.includes(cName);
      });
      if (matchedCrops.length === 0) matchedCrops = [bestCrop];
    } else {
      // Crop not in marketplace — determine what it was
      if (bestGuessLabel) {
        identifiedCrop = bestGuessLabel;
      } else if (webEntities.length > 0) {
        identifiedCrop = webEntities[0];
      } else if (detectedLabels.length > 0) {
        const generic = ['food', 'plant', 'produce', 'vegetable', 'fruit', 'natural foods', 'ingredient', 'cuisine'];
        identifiedCrop = detectedLabels.find(l => !generic.includes(l)) || detectedLabels[0];
      } else if (colorAnalysis && colorAnalysis.avgRGB) {
        const [r, g, b] = colorAnalysis.avgRGB;
        if (r > 220 && g > 190) identifiedCrop = 'banana';
        else if (r > 175 && g < 185 && b < 115 && r - b > 65) identifiedCrop = 'maize';
        else if (r > 150 && g > 100 && b < 100 && r > g) identifiedCrop = 'carrot';
        else if (g >= r && g >= b) identifiedCrop = 'spring oion';
        else if (r > 165 && g > 145 && b > 125 && Math.abs(r - g) < 40) identifiedCrop = 'cassava';
        else if (r > 130 && r > g * 1.2 && r > b * 1.2) identifiedCrop = 'tomatoes';
      }

      if (!identifiedCrop) {
        for (const [kw, syns] of Object.entries(CROP_SYNONYMS)) {
          if (fileHint && syns.some(s => fileHint.includes(s))) {
            identifiedCrop = kw;
            break;
          }
        }
      }

      if (!identifiedCrop) identifiedCrop = 'agricultural produce';
    }

    // CRITICAL RE-CHECK: Ensure identified crop (or its synonyms / words) is matched against active marketplace crops!
    if (identifiedCrop) {
      const idLower = identifiedCrop.toLowerCase().trim();
      const syns = CROP_SYNONYMS[idLower] || [idLower];
      const words = idLower.split(/\s+/).filter(w => w.length >= 4);

      const marketplaceMatches = activeCrops.filter(c => {
        const cName = c.name.toLowerCase().trim();
        if (cName === idLower || cName.includes(idLower) || idLower.includes(cName)) return true;
        if (syns.some(s => cName.includes(s) || s.includes(cName))) return true;
        if (words.some(w => cName.includes(w) || w.includes(cName))) return true;
        return false;
      });

      if (marketplaceMatches.length > 0) {
        foundInMarketplace = true;
        matchedCrops = marketplaceMatches;
        bestCrop = marketplaceMatches[0];
        identifiedCrop = marketplaceMatches[0].name;
      }
    }

    // 6. Fetch knowledge card details
    const cropKnowledge = getCropKnowledge(identifiedCrop, detectedLabels, webEntities, geminiCropData);

    const engineName = geminiCropData ? 'google-gemini-vision' : (detectedLabels.length > 0 ? 'google-cloud-vision' : 'local-visual-engine');

    return res.json({
      success: true,
      identified: cropKnowledge.name || (identifiedCrop.charAt(0).toUpperCase() + identifiedCrop.slice(1)),
      identifiedKey: identifiedCrop.toLowerCase(),
      foundInMarketplace: foundInMarketplace,
      count: foundInMarketplace ? matchedCrops.length : 0,
      crops: matchedCrops,
      knowledge: cropKnowledge,
      labels: detectedLabels.length > 0 ? detectedLabels : [identifiedCrop, 'fresh produce', 'food'],
      visionEngine: engineName,
      confidenceScore: highestScore
    });
  } catch (err) {
    console.error('Visual Search API error:', err);
    return res.status(500).json({ error: 'Failed to process visual search image', details: err.message });
  }
});

// ─── CROP REQUESTS API ───
app.post('/api/crop-requests', async (req, res) => {
  try {
    const { crop_name, buyer_id, buyer_email } = req.body;
    if (!crop_name) {
      return res.status(400).json({ error: 'Crop name is required' });
    }

    const { data, error } = await supabase
      .from('crop_requests')
      .insert({
        crop_name,
        buyer_id: buyer_id || null,
        buyer_email: buyer_email || 'guest@agrilink.com',
        created_at: new Date().toISOString()
      })
      .select('*');

    if (error) {
      console.warn('Supabase crop_requests table warning:', error.message);
    }

    return res.json({ success: true, message: `Alert request recorded for ${crop_name}`, data: data ? data[0] : null });
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
});

app.listen(port, () => {
  console.log(`AgriLink backend listening on http://localhost:${port}`);
});
