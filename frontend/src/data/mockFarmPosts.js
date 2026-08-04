// Mock Farmers and Farm Blog Posts Data for AgriLink

export const MOCK_FARMERS = [
  {
    id: 'farmer-1',
    name: 'Kofi Mensah',
    farmName: 'Green Valley Organic Farms',
    location: 'Kumasi, Ashanti Region',
    avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=200&q=80',
    verified: true,
    rating: 4.9,
    reviewsCount: 142,
    bio: 'Pioneering organic greenhouse farming in Kumasi. Specialized in sweet peppers, vine tomatoes, and crisp lettuce grown with zero chemical pesticides.',
    phone: '+233 24 412 3456',
    crops: [
      {
        id: 'crop-101',
        name: 'Organic Greenhouse Tomatoes',
        category: 'vegetables',
        price: 15,
        unit: 'kg',
        image: 'https://images.unsplash.com/photo-1567306226416-28f0efdc88ce?auto=format&fit=crop&w=500&q=80',
        inStock: true,
        description: 'Juicy, vine-ripened organic tomatoes harvested daily.'
      },
      {
        id: 'crop-102',
        name: 'Vibrant Bell Peppers Mix',
        category: 'vegetables',
        price: 20,
        unit: 'kg',
        image: 'https://images.unsplash.com/photo-1562967916-eb82221dfb35?auto=format&fit=crop&w=500&q=80',
        inStock: true,
        description: 'Crisp green, red, and yellow bell peppers packed with vitamins.'
      },
      {
        id: 'crop-103',
        name: 'Fresh English Cucumber',
        category: 'vegetables',
        price: 12,
        unit: 'kg',
        image: 'https://images.unsplash.com/photo-1449300079323-02e209d9d3a6?auto=format&fit=crop&w=500&q=80',
        inStock: true,
        description: 'Hydrating, seedless greenhouse cucumbers.'
      }
    ]
  },
  {
    id: 'farmer-2',
    name: 'Ama Serwaa',
    farmName: 'SunGolden Fruit Orchards',
    location: 'Nsawam, Eastern Region',
    avatar: 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?auto=format&fit=crop&w=200&q=80',
    verified: true,
    rating: 4.8,
    reviewsCount: 98,
    bio: 'Family-owned orchard in Nsawam delivering sweet pineapples, ripe papayas, and citrus fresh from the trees to Accra & Kumasi buyers.',
    phone: '+233 20 811 2233',
    crops: [
      {
        id: 'crop-201',
        name: 'Sugarloaf Sweet Pineapples',
        category: 'fruits',
        price: 10,
        unit: 'piece',
        image: 'https://images.unsplash.com/photo-1550258987-190a2d41a8ba?auto=format&fit=crop&w=500&q=80',
        inStock: true,
        description: 'Ultra-sweet Sugarloaf pineapples freshly picked at peak ripeness.'
      },
      {
        id: 'crop-202',
        name: 'Golden Papayas',
        category: 'fruits',
        price: 8,
        unit: 'kg',
        image: 'https://images.unsplash.com/photo-1617112848923-cc2234396a8d?auto=format&fit=crop&w=500&q=80',
        inStock: true,
        description: 'Soft, aromatic golden papayas rich in natural antioxidants.'
      }
    ]
  },
  {
    id: 'farmer-3',
    name: 'Kwaku Addo',
    farmName: 'Volta Basin Grain Fields',
    location: 'Akuse, Eastern Region',
    avatar: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&w=200&q=80',
    verified: true,
    rating: 4.7,
    reviewsCount: 115,
    bio: 'Large scale grain farming along the Volta basin. Producing premium yellow corn, white maize, and scented local rice for wholesalers and retailers.',
    phone: '+233 55 900 4455',
    crops: [
      {
        id: 'crop-301',
        name: 'Golden Yellow Sweet Corn',
        category: 'grains',
        price: 8,
        unit: 'kg',
        image: 'https://images.unsplash.com/photo-1501004318641-b39e6451bec6?auto=format&fit=crop&w=500&q=80',
        inStock: true,
        description: 'Freshly harvested yellow maize, clean dried and ready for processing or cooking.'
      },
      {
        id: 'crop-302',
        name: 'Volta Perfumed Rice',
        category: 'grains',
        price: 25,
        unit: '5kg bag',
        image: 'https://images.unsplash.com/photo-1586201375761-83865001e31c?auto=format&fit=crop&w=500&q=80',
        inStock: true,
        description: 'Aromatic long-grain rice cultivated in the rich Volta soil.'
      }
    ]
  },
  {
    id: 'farmer-4',
    name: 'Grace Osei',
    farmName: 'Ashanti Root Harvest',
    location: 'Ejisu, Ashanti Region',
    avatar: 'https://images.unsplash.com/photo-1567532939604-b6b5b0db2604?auto=format&fit=crop&w=200&q=80',
    verified: true,
    rating: 4.9,
    reviewsCount: 204,
    bio: 'Specializing in high-starch white yams, yellow cassava roots, and plantains harvested directly from fertile Ejisu soils.',
    phone: '+233 24 988 7766',
    crops: [
      {
        id: 'crop-401',
        name: 'Pona White Yam (Tubers)',
        category: 'tubers',
        price: 35,
        unit: 'tuber',
        image: 'https://images.unsplash.com/photo-1596040033229-a9821ebd058d?auto=format&fit=crop&w=500&q=80',
        inStock: true,
        description: 'Premium Pona variety white yams, soft texture and rich flavor.'
      },
      {
        id: 'crop-402',
        name: 'High Starch Cassava Roots',
        category: 'tubers',
        price: 6,
        unit: 'kg',
        image: 'https://images.unsplash.com/photo-1524592412331-4fe04e37381d?auto=format&fit=crop&w=500&q=80',
        inStock: true,
        description: 'Freshly dug cassava tubers ideal for gari, fufu, or industrial processing.'
      }
    ]
  },
  {
    id: 'farmer-5',
    name: 'Emmanuel Tetteh',
    farmName: 'Ada Legume & Bean Estate',
    location: 'Ada Foah, Greater Accra',
    avatar: 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?auto=format&fit=crop&w=200&q=80',
    verified: true,
    rating: 4.6,
    reviewsCount: 86,
    bio: 'Sustainable legume farmer in Ada. Cultivating red beans, black-eyed cowpeas, groundnuts, and soybean crops with organic soil enrichment.',
    phone: '+233 27 334 5566',
    crops: [
      {
        id: 'crop-501',
        name: 'Organic Black-Eyed Cowpeas',
        category: 'legumes',
        price: 18,
        unit: 'kg',
        image: 'https://images.unsplash.com/photo-1515543904379-3d757afe72e3?auto=format&fit=crop&w=500&q=80',
        inStock: true,
        description: 'Protein-rich cowpeas, sorted and cleaned with zero stones.'
      },
      {
        id: 'crop-502',
        name: 'Raw Red Beans',
        category: 'legumes',
        price: 22,
        unit: 'kg',
        image: 'https://images.unsplash.com/photo-1551462147-ff29053bfc14?auto=format&fit=crop&w=500&q=80',
        inStock: true,
        description: 'Nutritious red kidney beans fresh from Ada harvest.'
      }
    ]
  },
  {
    id: 'farmer-6',
    name: 'Yaa Asantewaa Farms',
    farmName: 'Golden Tropics Plantain & Fruit Hub',
    location: 'Goaso, Ahafo Region',
    avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=200&q=80',
    verified: true,
    rating: 5.0,
    reviewsCount: 173,
    bio: 'Highland plantain and exotic fruit hub in Goaso. Supplying bulk plantains, sweet bananas, and avocados to major markets in Ghana.',
    phone: '+233 24 555 9900',
    crops: [
      {
        id: 'crop-601',
        name: 'Green & Ripe Plantain Bunch',
        category: 'fruits',
        price: 45,
        unit: 'bunch',
        image: 'https://images.unsplash.com/photo-1603833665858-e61d17a86224?auto=format&fit=crop&w=500&q=80',
        inStock: true,
        description: 'Heavy, firm plantain bunches fresh from Ahafo highlands.'
      },
      {
        id: 'crop-602',
        name: 'Creamy Butter Avocados',
        category: 'fruits',
        price: 16,
        unit: 'kg',
        image: 'https://images.unsplash.com/photo-1523049673857-eb18f1d7b578?auto=format&fit=crop&w=500&q=80',
        inStock: true,
        description: 'Rich, smooth avocados with thick buttery flesh.'
      }
    ]
  }
];

export const MOCK_BLOG_POSTS = [
  {
    id: 'post-1',
    farmer_id: 'farmer-1',
    farmer: MOCK_FARMERS[0],
    media_type: 'video',
    media_url: 'https://assets.mixkit.co/videos/preview/mixkit-farmer-walking-through-a-greenhouse-41544-large.mp4',
    poster_image: 'https://images.unsplash.com/photo-1585320806297-9794b3e4eeae?auto=format&fit=crop&w=800&q=80',
    caption: '🌅 Good morning from Green Valley Farms! Today we are inspecting our hydroponic tomato vines. Every tomato is hand-nurtured without synthetic pesticides. Ready for orders starting this afternoon!',
    crop_type: 'vegetables',
    views: 3420,
    time_ago: '2 hours ago',
    likes: 248
  },
  {
    id: 'post-2',
    farmer_id: 'farmer-2',
    farmer: MOCK_FARMERS[1],
    media_type: 'image',
    media_url: 'https://images.unsplash.com/photo-1550258987-190a2d41a8ba?auto=format&fit=crop&w=1000&q=80',
    caption: '🍍 Fresh Sugarloaf Pineapples harvested right here in Nsawam! Super juicy, naturally sweet, and perfect for fruit bars or fresh juice. We deliver straight to your doorstep in Accra & Kumasi.',
    crop_type: 'fruits',
    views: 2890,
    time_ago: '4 hours ago',
    likes: 194
  },
  {
    id: 'post-3',
    farmer_id: 'farmer-3',
    farmer: MOCK_FARMERS[2],
    media_type: 'video',
    media_url: 'https://assets.mixkit.co/videos/preview/mixkit-tractor-harvesting-a-corn-field-41542-large.mp4',
    poster_image: 'https://images.unsplash.com/photo-1501004318641-b39e6451bec6?auto=format&fit=crop&w=800&q=80',
    caption: '🌾 Combined harvester in action at Volta Basin Fields! Golden sweet corn harvest is in full swing. High starch, bright grain, and available in bulk bags at wholesale rates.',
    crop_type: 'grains',
    views: 5120,
    time_ago: '6 hours ago',
    likes: 412
  },
  {
    id: 'post-4',
    farmer_id: 'farmer-4',
    farmer: MOCK_FARMERS[3],
    media_type: 'image',
    media_url: 'https://images.unsplash.com/photo-1596040033229-a9821ebd058d?auto=format&fit=crop&w=1000&q=80',
    caption: '🥔 Fresh Pona Yams harvested from Ejisu soil! Check out the size of these tubers — thick skin, rich white flesh, ideal for fufu or fried yam chips. Order now before stock runs out!',
    crop_type: 'tubers',
    views: 1840,
    time_ago: '1 day ago',
    likes: 165
  },
  {
    id: 'post-5',
    farmer_id: 'farmer-5',
    farmer: MOCK_FARMERS[4],
    media_type: 'video',
    media_url: 'https://assets.mixkit.co/videos/preview/mixkit-hands-holding-fresh-harvested-tomatoes-41549-large.mp4',
    poster_image: 'https://images.unsplash.com/photo-1515543904379-3d757afe72e3?auto=format&fit=crop&w=800&q=80',
    caption: '🫘 Hand-sorted Black-Eyed Cowpeas and Red Beans from Ada Foah! Moisture tested and stone-free guarantee. Tap "View Crops" to order direct from our estate.',
    crop_type: 'legumes',
    views: 2310,
    time_ago: '1 day ago',
    likes: 210
  },
  {
    id: 'post-6',
    farmer_id: 'farmer-6',
    farmer: MOCK_FARMERS[5],
    media_type: 'image',
    media_url: 'https://images.unsplash.com/photo-1603833665858-e61d17a86224?auto=format&fit=crop&w=1000&q=80',
    caption: '🍌 Huge plantain harvest from Goaso highlands! Firm green bunches for long storage or rich ripe yellow bunches for ampesi and dodo. Direct farmer pricing for AgriLink buyers!',
    crop_type: 'fruits',
    views: 4290,
    time_ago: '2 days ago',
    likes: 380
  }
];
