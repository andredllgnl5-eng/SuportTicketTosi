// Proxy Vercel preparado para evoluir com Supabase, Storage, JWT HttpOnly e OpenAI.
// Nesta V1, o front usa localStorage para demonstração visual.
export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', process.env.ALLOWED_ORIGIN || '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,POST,PUT,DELETE,OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  if (req.method === 'OPTIONS') return res.status(204).end();
  return res.status(200).json({
    ok: true,
    name: 'Tosi Ticket API',
    version: '1.0.0',
    message: 'Proxy online. Próxima fase: conectar Supabase e autenticação segura.'
  });
}
