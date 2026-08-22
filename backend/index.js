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

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseServiceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
const port = process.env.PORT || 4000;

if (!supabaseUrl || !supabaseServiceRoleKey) {
  console.warn('Missing Supabase environment variables SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY.');
}

const supabase = createClient(supabaseUrl || '', supabaseServiceRoleKey || '');

const paymentsRoutes = require('./routes/payments');
const ordersRoutes = require('./routes/orders');

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
  res.json({ farmer: data });
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
  }
};

function getCropKnowledge(cropKey, visionLabels = [], webEntities = []) {
  const normalized = (cropKey || '').toLowerCase();
  
  for (const key of Object.keys(CROP_KNOWLEDGE_DB)) {
    if (normalized.includes(key) || key.includes(normalized)) {
      return CROP_KNOWLEDGE_DB[key];
    }
  }

  // Dynamic fallback for any internet crop identified via Google Vision Lens
  const formattedTitle = cropKey
    ? cropKey.split(' ').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' ')
    : 'Identified Crop';

  return {
    name: formattedTitle,
    category: visionLabels[0] ? `Agricultural Produce (${visionLabels[0]})` : 'Produce & Crops',
    description: `A distinctive crop identified via Google Vision Lens. Identified labels include: ${visionLabels.slice(0, 5).join(', ')}.`,
    healthBenefits: ['Natural source of plant nutrients and dietary fiber', 'Contains essential vitamins and organic antioxidants', 'Supports balanced dietary health'],
    uses: 'Used in cooking, salads, fresh juices, or traditional culinary recipes.',
    growingRegions: 'Various agricultural regions',
    similarCrops: ['Fresh Tomatoes', 'Red Pepper', 'Cabbage']
  };
}

// ─── VISUAL SEARCH API (Google Cloud Vision API + Marketplace Matching) ───
app.post('/api/visual-search', async (req, res) => {
  try {
    const { imageBase64, imageName } = req.body;
    const apiKey = process.env.GOOGLE_VISION_API_KEY || process.env.GOOGLE_CLOUD_KEY;

    let detectedLabels = [];
    let webEntities = [];
    let bestGuessLabel = '';
    let identifiedCrop = '';

    if (apiKey && imageBase64) {
      const cleanBase64 = imageBase64.replace(/^data:image\/\w+;base64,/, '');

      // Call Google Cloud Vision API with LABEL_DETECTION, OBJECT_LOCALIZATION & WEB_DETECTION
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
      const response = visionData.responses?.[0] || {};
      
      const labels = response.labelAnnotations || [];
      detectedLabels = labels.map(l => l.description.toLowerCase());

      const webDetection = response.webDetection || {};
      bestGuessLabel = webDetection.bestGuessLabels?.[0]?.label || '';
      webEntities = (webDetection.webEntities || []).map(e => (e.description || '').toLowerCase()).filter(Boolean);

      // Check best guess label first or label keywords
      const allText = [bestGuessLabel, ...webEntities, ...detectedLabels].join(' ');

      const cropKeywords = ['tomato', 'tomatoes', 'pepper', 'chili', 'maize', 'corn', 'cassava', 'cabbage', 'broccoli', 'lettuce', 'garden egg', 'yam', 'onion', 'carrot', 'plantain', 'soursop', 'dragon fruit', 'pitaya', 'avocado', 'rice', 'mango', 'banana', 'pineapple', 'watermelon', 'orange', 'pawpaw', 'papaya', 'cocoyam', 'ginger', 'okra', 'spinach', 'cucumber', 'bean', 'groundnut', 'peanut', 'soybean', 'sorghum', 'millet', 'coconut', 'sweet potato', 'potato', 'wheat', 'sugarcane', 'cocoa', 'coffee', 'cashew', 'shea', 'mushroom', 'garlic', 'lemon', 'lime', 'grape', 'strawberry', 'apple', 'pear', 'guava', 'passion fruit'];
      for (const kw of cropKeywords) {
        if (allText.includes(kw)) {
          identifiedCrop = kw === 'tomato' ? 'tomatoes' : kw;
          break;
        }
      }

      // If no keyword matched, use the best guess label or the top web entity from Google Vision
      if (!identifiedCrop && bestGuessLabel) {
        identifiedCrop = bestGuessLabel;
      }
      if (!identifiedCrop && webEntities.length > 0) {
        identifiedCrop = webEntities[0];
      }
      if (!identifiedCrop && detectedLabels.length > 0) {
        // Use the first non-generic label
        const genericTerms = ['food', 'plant', 'produce', 'ingredient', 'natural foods', 'vegetable', 'fruit', 'leaf', 'cuisine'];
        identifiedCrop = detectedLabels.find(l => !genericTerms.includes(l)) || detectedLabels[0];
      }
    }

    // Final fallback — use filename hints, but NEVER default to 'tomatoes' if Vision returned something
    if (!identifiedCrop) {
      const nameLower = (imageName || '').toLowerCase();
      if (nameLower.includes('rice')) identifiedCrop = 'rice';
      else if (nameLower.includes('broccoli')) identifiedCrop = 'broccoli';
      else if (nameLower.includes('maize') || nameLower.includes('corn')) identifiedCrop = 'maize';
      else if (nameLower.includes('pepper') || nameLower.includes('chili')) identifiedCrop = 'pepper';
      else if (nameLower.includes('cassava')) identifiedCrop = 'cassava';
      else if (nameLower.includes('cabbage')) identifiedCrop = 'cabbage';
      else if (nameLower.includes('mango')) identifiedCrop = 'mango';
      else if (nameLower.includes('banana')) identifiedCrop = 'banana';
      else identifiedCrop = 'unknown crop';
    }

    // 1. Check AgriLink Marketplace Database first
    const { data: matchedCrops } = await supabase
      .from('crops')
      .select('*')
      .ilike('name', `%${identifiedCrop}%`)
      .eq('status', 'active');

    const foundInMarketplace = matchedCrops && matchedCrops.length > 0;

    // 2. Fetch Internet Crop Knowledge Card details
    const cropKnowledge = getCropKnowledge(identifiedCrop, detectedLabels, webEntities);

    return res.json({
      success: true,
      identified: cropKnowledge.name || identifiedCrop,
      identifiedKey: identifiedCrop,
      foundInMarketplace: foundInMarketplace,
      count: foundInMarketplace ? matchedCrops.length : 0,
      crops: matchedCrops || [],
      knowledge: cropKnowledge,
      labels: detectedLabels.length > 0 ? detectedLabels : [identifiedCrop, 'fresh produce', 'food']
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
