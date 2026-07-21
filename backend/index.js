const express = require('express');
const cors = require('cors');
const dotenv = require('dotenv');
const { createClient } = require('@supabase/supabase-js');

dotenv.config();

const app = express();
app.use(cors({ origin: true }));
app.use(express.json());

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseServiceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
const port = process.env.PORT || 4000;

if (!supabaseUrl || !supabaseServiceRoleKey) {
  console.warn('Missing Supabase environment variables SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY.');
}

const supabase = createClient(supabaseUrl || '', supabaseServiceRoleKey || '');

app.get('/health', (req, res) => {
  res.json({ status: 'ok' });
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

app.listen(port, () => {
  console.log(`AgriLink backend listening on http://localhost:${port}`);
});
