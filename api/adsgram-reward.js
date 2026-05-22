module.exports = async (req, res) => {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const userId = req.query.userid;

  if (!userId) {
    console.log('[AdsGram Reward] missing userid');
    return res.status(200).json({ ok: true });
  }

  console.log('[AdsGram Reward] user completed ad, userid:', userId);

  res.status(200).json({ ok: true });
};