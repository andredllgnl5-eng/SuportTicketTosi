export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', process.env.ALLOWED_ORIGIN || '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,POST,PUT,DELETE,OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  if (req.method === 'OPTIONS') return res.status(204).end();
  const route = req.url || '/api';
  if (route.includes('/health')) return res.status(200).json({ ok:true, service:'Tosi Ticket API', version:'2.0.0' });
  return res.status(200).json({ ok:true, name:'Tosi Ticket API', version:'2.0.0', next:'Conectar Supabase Auth, Storage, JWT HttpOnly e OpenAI.' });
}
