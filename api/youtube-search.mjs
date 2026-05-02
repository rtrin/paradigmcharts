export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    res.status(200).end();
    return;
  }

  if (req.method !== 'GET') {
    res.status(405).json({ error: 'Method not allowed' });
    return;
  }

  const { query } = req.query;

  if (!query || typeof query !== 'string') {
    res.status(400).json({ error: 'query parameter is required' });
    return;
  }

  const YOUTUBE_API_KEY = process.env.YOUTUBE_API_KEY;

  if (!YOUTUBE_API_KEY || YOUTUBE_API_KEY === 'your_youtube_api_key_here') {
    return res.status(200).json([]);
  }

  try {
    const searchQuery = `Paradigm Reboot ${query} chart view`;

    const response = await fetch(
      `https://www.googleapis.com/youtube/v3/search?` +
      new URLSearchParams({
        part: 'snippet',
        q: searchQuery,
        type: 'video',
        maxResults: '15',
        key: YOUTUBE_API_KEY,
        order: 'relevance'
      }), {
        headers: {
          'Referer': process.env.APP_URL ||
                     (process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : '') ||
                     req.headers.referer ||
                     (req.headers.host ? `https://${req.headers.host}` : '')
        }
      }
    );

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      const isQuotaExceeded = errorData.error?.errors?.some(e => e.reason === 'quotaExceeded');
      if (isQuotaExceeded) {
        return res.status(200).json([]);
      }
      throw new Error(`YouTube API request failed: ${response.status} - ${errorData.error?.message || 'Unknown error'}`);
    }

    const data = await response.json();
    const items = data.items || [];

    const videos = items.map(item => ({
      id: item.id.videoId,
      title: item.snippet.title,
      channelTitle: item.snippet.channelTitle,
      thumbnailUrl: item.snippet.thumbnails.medium.url,
      videoUrl: `https://www.youtube.com/watch?v=${item.id.videoId}`
    }));

    res.status(200).json(videos);
  } catch (error) {
    res.status(500).json({ error: 'Failed to search YouTube videos' });
  }
}
