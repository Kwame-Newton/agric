import { supabase } from '../supabaseClient';

const LOCAL_MESSAGES_KEY = 'agrilink_realtime_messages';

// Get local stored messages
function getLocalMessages() {
  try {
    const raw = localStorage.getItem(LOCAL_MESSAGES_KEY);
    if (raw) return JSON.parse(raw);
  } catch (e) {
    console.error('Error reading local messages:', e);
  }
  return [];
}

// Save local messages
function saveLocalMessages(messages) {
  try {
    localStorage.setItem(LOCAL_MESSAGES_KEY, JSON.stringify(messages));
  } catch (e) {
    console.error('Error saving local messages:', e);
  }
}

// ─── Fetch all messages between user and partner ───
export async function fetchMessagesBetweenUsers(currentUserId, otherUserId) {
  if (!currentUserId || !otherUserId) return [];

  try {
    const { data, error } = await supabase
      .from('messages')
      .select('*')
      .or(
        `and(sender_id.eq.${currentUserId},receiver_id.eq.${otherUserId}),and(sender_id.eq.${otherUserId},receiver_id.eq.${currentUserId})`
      )
      .order('created_at', { ascending: true });

    if (!error && data) {
      return data.map((m) => ({
        id: m.id,
        side: m.sender_id === currentUserId ? 'sent' : 'received',
        senderId: m.sender_id,
        receiverId: m.receiver_id,
        senderName: m.sender_name || (m.sender_id === currentUserId ? 'You' : 'Buyer'),
        text: m.text,
        timestamp: new Date(m.created_at),
        read: m.read || false,
      }));
    }
  } catch (err) {
    console.warn('Supabase fetch messages error, falling back to local:', err);
  }

  // Fallback to local storage
  const local = getLocalMessages();
  return local
    .filter(
      (m) =>
        (m.senderId === currentUserId && m.receiverId === otherUserId) ||
        (m.senderId === otherUserId && m.receiverId === currentUserId)
    )
    .map((m) => ({
      ...m,
      side: m.senderId === currentUserId ? 'sent' : 'received',
      timestamp: new Date(m.timestamp),
    }));
}

// ─── Send a message ───
export async function sendMessage({ senderId, receiverId, senderName, receiverName, text }) {
  if (!text || !senderId || !receiverId) return null;

  const newMsgObj = {
    sender_id: senderId,
    receiver_id: receiverId,
    sender_name: senderName || 'User',
    receiver_name: receiverName || 'User',
    text: text.trim(),
    read: false,
    created_at: new Date().toISOString(),
  };

  const localMsgObj = {
    id: `msg-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
    senderId,
    receiverId,
    senderName: senderName || 'User',
    receiverName: receiverName || 'User',
    text: text.trim(),
    timestamp: new Date().toISOString(),
    read: false,
  };

  try {
    const { data, error } = await supabase
      .from('messages')
      .insert([newMsgObj])
      .select()
      .single();

    if (!error && data) {
      // Save local backup
      const local = getLocalMessages();
      saveLocalMessages([
        ...local,
        {
          ...localMsgObj,
          id: data.id,
          timestamp: data.created_at,
        },
      ]);

      return {
        id: data.id,
        side: 'sent',
        senderId,
        receiverId,
        senderName: senderName || 'You',
        text: data.text,
        timestamp: new Date(data.created_at),
        read: false,
      };
    }
  } catch (err) {
    console.warn('Supabase insert message error, using local fallback:', err);
  }

  // Fallback save to local storage
  const local = getLocalMessages();
  saveLocalMessages([...local, localMsgObj]);

  return {
    id: localMsgObj.id,
    side: 'sent',
    senderId,
    receiverId,
    senderName: senderName || 'You',
    text: localMsgObj.text,
    timestamp: new Date(localMsgObj.timestamp),
    read: false,
  };
}

// ─── Fetch Conversations for a User (Farmer or Buyer) ───
export async function fetchUserConversations(currentUserId) {
  if (!currentUserId) return [];

  let rawMessages = [];

  try {
    const { data, error } = await supabase
      .from('messages')
      .select('*')
      .or(`sender_id.eq.${currentUserId},receiver_id.eq.${currentUserId}`)
      .order('created_at', { ascending: true });

    if (!error && data && data.length > 0) {
      rawMessages = data.map((m) => ({
        id: m.id,
        senderId: m.sender_id,
        receiverId: m.receiver_id,
        senderName: m.sender_name,
        receiverName: m.receiver_name,
        text: m.text,
        timestamp: new Date(m.created_at),
        read: m.read,
      }));
    }
  } catch (err) {
    console.warn('Supabase conversations fetch fallback:', err);
  }

  // Merge with local storage messages
  const local = getLocalMessages();
  const localFormatted = local.map((m) => ({
    ...m,
    timestamp: new Date(m.timestamp),
  }));

  const allMessages = [...rawMessages];
  for (const lm of localFormatted) {
    if (!allMessages.some((m) => m.id === lm.id)) {
      allMessages.push(lm);
    }
  }

  // Group by the other user ID
  const conversationsMap = {};

  for (const m of allMessages) {
    const isSender = m.senderId === currentUserId;
    const otherId = isSender ? m.receiverId : m.senderId;
    const otherName = isSender ? m.receiverName : m.senderName;

    if (!otherId) continue;

    if (!conversationsMap[otherId]) {
      conversationsMap[otherId] = {
        id: otherId,
        buyer: {
          id: otherId,
          name: otherName || 'AgriLink User',
          avatarColor: '#2D6A4F',
          phone: '+233 24 000 0000',
          region: 'Ghana',
          online: true,
        },
        messages: [],
      };
    }

    conversationsMap[otherId].messages.push({
      id: m.id,
      side: isSender ? 'sent' : 'received',
      senderName: m.senderName || (isSender ? 'You' : 'Buyer'),
      text: m.text,
      timestamp: m.timestamp,
      read: m.read || false,
    });
  }

  return Object.values(conversationsMap);
}

// ─── Realtime Subscription for Messages ───
export function subscribeToRealtimeMessages(currentUserId, onNewMessage) {
  const channel = supabase
    .channel(`public:messages:${currentUserId}`)
    .on(
      'postgres_changes',
      {
        event: 'INSERT',
        schema: 'public',
        table: 'messages',
      },
      (payload) => {
        const newMsg = payload.new;
        if (newMsg.sender_id === currentUserId || newMsg.receiver_id === currentUserId) {
          onNewMessage({
            id: newMsg.id,
            side: newMsg.sender_id === currentUserId ? 'sent' : 'received',
            senderId: newMsg.sender_id,
            receiverId: newMsg.receiver_id,
            senderName: newMsg.sender_name,
            text: newMsg.text,
            timestamp: new Date(newMsg.created_at),
            read: newMsg.read,
          });
        }
      }
    )
    .subscribe();

  return () => {
    supabase.removeChannel(channel);
  };
}

// ─── Contact Form Messages for Admin ───
const LOCAL_CONTACT_MSGS_KEY = 'agrilink_contact_messages';

export function getLocalContactMessages() {
  try {
    const raw = localStorage.getItem(LOCAL_CONTACT_MSGS_KEY);
    if (raw) return JSON.parse(raw);
  } catch (e) {
    console.error('Error reading local contact messages:', e);
  }
  return [];
}

export function saveLocalContactMessages(msgs) {
  try {
    localStorage.setItem(LOCAL_CONTACT_MSGS_KEY, JSON.stringify(msgs));
  } catch (e) {
    console.error('Error saving local contact messages:', e);
  }
}

export async function submitContactFormMessage({ fullName, email, subject, message }) {
  const newMsg = {
    full_name: fullName,
    email: email,
    subject: subject || 'General Enquiry',
    message: message,
    status: 'pending',
    created_at: new Date().toISOString(),
  };

  const localMsg = {
    id: `contact-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
    fullName,
    email,
    subject: subject || 'General Enquiry',
    message,
    status: 'pending',
    createdAt: new Date().toISOString(),
  };

  try {
    const { data, error } = await supabase
      .from('contact_messages')
      .insert([newMsg])
      .select()
      .single();

    if (!error && data) {
      const local = getLocalContactMessages();
      saveLocalContactMessages([{ ...localMsg, id: data.id }, ...local]);
      return { success: true, message: data };
    }
  } catch (err) {
    console.warn('Supabase contact message error, saving locally:', err);
  }

  const local = getLocalContactMessages();
  saveLocalContactMessages([localMsg, ...local]);
  return { success: true, message: localMsg };
}

export async function fetchAdminContactMessages() {
  let dbMsgs = [];
  try {
    const { data, error } = await supabase
      .from('contact_messages')
      .select('*')
      .order('created_at', { ascending: false });

    if (!error && data) {
      dbMsgs = data.map((m) => ({
        id: m.id,
        fullName: m.full_name || 'AgriLink User',
        email: m.email || 'user@agrilink.com',
        subject: m.subject || 'General Enquiry',
        message: m.message || '',
        status: m.status || 'pending',
        createdAt: m.created_at || new Date().toISOString(),
      }));
    }
  } catch (err) {
    console.warn('Supabase fetch contact messages error:', err);
  }

  const local = getLocalContactMessages();
  const all = [...dbMsgs];
  for (const lm of local) {
    if (!all.some((m) => m.id === lm.id)) {
      all.push(lm);
    }
  }
  return all;
}
