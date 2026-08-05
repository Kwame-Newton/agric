import { supabase } from '../supabaseClient';

const LOCAL_POSTS_KEY = 'agrilink_real_farm_posts';

// Helper to convert Image file to optimized Data URL
export function fileToDataUrl(file, maxWidth = 1000, maxHeight = 1000) {
  return new Promise((resolve) => {
    if (!file) return resolve(null);
    const reader = new FileReader();
    reader.onload = (e) => {
      if (file.type.startsWith('image/')) {
        const img = new Image();
        img.onload = () => {
          const canvas = document.createElement('canvas');
          let width = img.width;
          let height = img.height;

          if (width > maxWidth || height > maxHeight) {
            if (width / height > maxWidth / maxHeight) {
              height = Math.round((height * maxWidth) / width);
              width = maxWidth;
            } else {
              width = Math.round((width * maxHeight) / height);
              height = maxHeight;
            }
          }

          canvas.width = width;
          canvas.height = height;
          const ctx = canvas.getContext('2d');
          ctx.drawImage(img, 0, 0, width, height);
          resolve(canvas.toDataURL('image/jpeg', 0.85));
        };
        img.onerror = () => resolve(e.target.result);
        img.src = e.target.result;
      } else {
        resolve(e.target.result);
      }
    };
    reader.onerror = () => resolve(null);
    reader.readAsDataURL(file);
  });
}

// Get stored local posts (returns empty array if none created yet)
export function getLocalPosts() {
  try {
    const raw = localStorage.getItem(LOCAL_POSTS_KEY);
    if (raw) return JSON.parse(raw);
  } catch (e) {
    console.error('Error reading local farm posts:', e);
  }
  return [];
}

export function saveLocalPosts(posts) {
  try {
    localStorage.setItem(LOCAL_POSTS_KEY, JSON.stringify(posts));
  } catch (e) {
    console.error('Error saving local farm posts:', e);
  }
}

// ─── Fetch All Farm Posts for Buyers Feed ───
export async function fetchAllFarmPosts() {
  try {
    const { data: dbPosts, error } = await supabase
      .from('farm_posts')
      .select(`
        id,
        farmer_id,
        media_type,
        media_url,
        caption,
        crop_type,
        views,
        created_at,
        updated_at,
        profiles:farmer_id ( full_name, phone ),
        farmers:farmer_id ( farm_name, farm_location, farm_bio )
      `)
      .order('created_at', { ascending: false });

    if (!error && dbPosts && dbPosts.length > 0) {
      // Transform database records into clean feed objects
      return dbPosts.map((post) => {
        const farmerInfo = post.farmers || {};
        const profileInfo = post.profiles || {};

        return {
          id: post.id,
          farmer_id: post.farmer_id,
          farmer: {
            id: post.farmer_id,
            name: profileInfo.full_name || 'AgriLink Farmer',
            farmName: farmerInfo.farm_name || 'Green Acres Farm',
            location: farmerInfo.farm_location || 'Kumasi, Ghana',
            avatar: `https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=200&q=80`,
            verified: true,
            rating: 4.8,
            bio: farmerInfo.farm_bio || 'Sustainable local farming.',
            phone: profileInfo.phone || '+233 24 000 0000',
            crops: []
          },
          media_type: post.media_type,
          media_url: post.media_url,
          caption: post.caption,
          crop_type: post.crop_type || 'vegetables',
          views: post.views || 0,
          time_ago: formatRelativeTime(post.created_at),
          created_at: post.created_at
        };
      });
    }
  } catch (err) {
    console.warn('Supabase farm_posts fetch error, falling back to local persistent store:', err);
  }

  // Fallback to local persistent storage
  return getLocalPosts();
}

// ─── Fetch Posts for a Specific Farmer ───
export async function fetchFarmerPosts(farmerId) {
  if (!farmerId) return [];

  try {
    const { data: dbPosts, error } = await supabase
      .from('farm_posts')
      .select('*')
      .eq('farmer_id', farmerId)
      .order('created_at', { ascending: false });

    if (!error && dbPosts) {
      return dbPosts.map(p => ({
        id: p.id,
        type: p.media_type,
        mediaUrl: p.media_url,
        caption: p.caption,
        cropType: p.crop_type,
        views: p.views || 0,
        createdAt: p.created_at
      }));
    }
  } catch (err) {
    console.warn('Supabase fetch error for farmer posts:', err);
  }

  // Local fallback filter
  const local = getLocalPosts();
  return local
    .filter(p => p.farmer_id === farmerId || p.farmer?.id === farmerId)
    .map(p => ({
      id: p.id,
      type: p.media_type || p.type,
      mediaUrl: p.media_url || p.mediaUrl,
      caption: p.caption,
      cropType: p.crop_type || p.cropType || 'vegetables',
      views: p.views || 0,
      createdAt: p.created_at || p.createdAt
    }));
}

// ─── Create a New Post ───
export async function createFarmPost({ farmerId, mediaType, mediaUrl, caption, cropType, farmerDetails }) {
  const newPostObj = {
    farmer_id: farmerId,
    media_type: mediaType,
    media_url: mediaUrl,
    caption: caption,
    crop_type: cropType || 'vegetables',
    views: 0,
    created_at: new Date().toISOString()
  };

  try {
    const { data, error } = await supabase
      .from('farm_posts')
      .insert([newPostObj])
      .select()
      .single();

    if (!error && data) {
      // Sync local storage copy
      const local = getLocalPosts();
      saveLocalPosts([
        {
          ...newPostObj,
          id: data.id,
          type: mediaType,
          mediaUrl: mediaUrl,
          farmer: farmerDetails
        },
        ...local
      ]);
      return { success: true, post: data };
    }
  } catch (err) {
    console.warn('Supabase create post fallback to local:', err);
  }

  // Local fallback save
  const fallbackPost = {
    ...newPostObj,
    id: `post-${Date.now()}`,
    type: mediaType,
    mediaUrl: mediaUrl,
    time_ago: 'Just now',
    farmer: farmerDetails
  };

  const local = getLocalPosts();
  saveLocalPosts([fallbackPost, ...local]);

  return { success: true, post: fallbackPost };
}

// ─── Update an Existing Post ───
export async function updateFarmPost(postId, { caption, cropType, mediaUrl, mediaType }) {
  const updates = {};
  if (caption !== undefined) updates.caption = caption;
  if (cropType !== undefined) updates.crop_type = cropType;
  if (mediaUrl !== undefined) updates.media_url = mediaUrl;
  if (mediaType !== undefined) updates.media_type = mediaType;
  updates.updated_at = new Date().toISOString();

  try {
    const { data, error } = await supabase
      .from('farm_posts')
      .update(updates)
      .eq('id', postId)
      .select()
      .single();

    if (!error) {
      // Update local storage copy
      const local = getLocalPosts();
      const updatedLocal = local.map(p => {
        if (p.id === postId) {
          return {
            ...p,
            ...updates,
            mediaUrl: mediaUrl || p.mediaUrl || p.media_url,
            type: mediaType || p.type || p.media_type
          };
        }
        return p;
      });
      saveLocalPosts(updatedLocal);
      return { success: true, post: data };
    }
  } catch (err) {
    console.warn('Supabase update post fallback to local:', err);
  }

  // Local update fallback
  const local = getLocalPosts();
  const updatedLocal = local.map(p => {
    if (p.id === postId) {
      return {
        ...p,
        ...updates,
        mediaUrl: mediaUrl || p.mediaUrl || p.media_url,
        type: mediaType || p.type || p.media_type
      };
    }
    return p;
  });
  saveLocalPosts(updatedLocal);

  return { success: true };
}

// ─── Delete a Post ───
export async function deleteFarmPost(postId) {
  try {
    const { error } = await supabase
      .from('farm_posts')
      .delete()
      .eq('id', postId);

    if (!error) {
      const local = getLocalPosts();
      saveLocalPosts(local.filter(p => p.id !== postId));
      return { success: true };
    }
  } catch (err) {
    console.warn('Supabase delete post fallback to local:', err);
  }

  // Local delete fallback
  const local = getLocalPosts();
  saveLocalPosts(local.filter(p => p.id !== postId));

  return { success: true };
}

// ─── Realtime Subscription Listener ───
export function subscribeToFarmPosts(onPostsChanged) {
  const channel = supabase
    .channel('public:farm_posts')
    .on(
      'postgres_changes',
      { event: '*', schema: 'public', table: 'farm_posts' },
      async (payload) => {
        // Fetch updated list on any realtime payload
        const updatedPosts = await fetchAllFarmPosts();
        onPostsChanged(updatedPosts);
      }
    )
    .subscribe();

  return () => {
    supabase.removeChannel(channel);
  };
}

// Helper: Format relative timestamp
function formatRelativeTime(dateString) {
  if (!dateString) return 'Just now';
  const date = new Date(dateString);
  const now = new Date();
  const diffSecs = Math.floor((now - date) / 1000);

  if (diffSecs < 60) return 'Just now';
  if (diffSecs < 3600) return `${Math.floor(diffSecs / 60)} mins ago`;
  if (diffSecs < 86400) return `${Math.floor(diffSecs / 3600)} hours ago`;
  const days = Math.floor(diffSecs / 86400);
  if (days === 1) return '1 day ago';
  return `${days} days ago`;
}

// ─── Fetch Farmer Profile Details ───
export async function fetchFarmerProfile(farmerId) {
  if (!farmerId) return null;

  try {
    const { data: profileData, error: profileError } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', farmerId)
      .single();

    const { data: farmerData, error: farmerError } = await supabase
      .from('farmers')
      .select('*')
      .eq('id', farmerId)
      .single();

    const { data: cropsData, error: cropsError } = await supabase
      .from('crops')
      .select('*')
      .eq('farmer_id', farmerId);

    if (!profileError && !farmerError && profileData && farmerData) {
      const fetchedCrops = (!cropsError && cropsData) 
        ? cropsData.map(c => ({ ...c, image: c.image_url })) 
        : [];

      return {
        id: farmerId,
        name: profileData.full_name || 'AgriLink Farmer',
        farmName: farmerData.farm_name || 'Green Acres Farm',
        location: farmerData.farm_location || 'Ghana',
        avatar: profileData.avatar_url || 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=200&q=80',
        verified: true,
        rating: 4.8,
        reviewsCount: 12,
        bio: farmerData.farm_bio || 'Sustainable local farming.',
        phone: profileData.phone || '+233 24 000 0000',
        crops: fetchedCrops
      };
    }
  } catch (err) {
    console.warn('Supabase fetch error for farmer profile:', err);
  }

  // Fallback: try to extract from local posts
  const local = getLocalPosts();
  const postWithFarmer = local.find(p => (p.farmer_id === farmerId || p.farmer?.id === farmerId) && p.farmer);
  if (postWithFarmer && postWithFarmer.farmer) {
    return {
      ...postWithFarmer.farmer,
      reviewsCount: 12,
      crops: postWithFarmer.farmer.crops || []
    };
  }

  // Final fallback if farmer profile can't be found anywhere
  return {
    id: farmerId,
    name: 'AgriLink Farmer',
    farmName: 'Unknown Farm',
    location: 'Ghana',
    avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=200&q=80',
    verified: false,
    rating: 0,
    reviewsCount: 0,
    bio: 'This farmer has not set up their profile yet.',
    phone: '',
    crops: []
  };
}

