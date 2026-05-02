import { defineConfig, loadEnv } from 'vite'
import type { Plugin } from 'vite'
import react from '@vitejs/plugin-react-swc'
import path from "path"
import tailwindcss from "@tailwindcss/vite"

interface YouTubeAPIResponse {
  items: Array<{
    id: { videoId: string };
    snippet: {
      title: string;
      channelTitle: string;
      thumbnails: { medium: { url: string } };
    };
  }>;
}

function apiPlugin(env: Record<string, string>): Plugin {
  return {
    name: 'api-plugin',
    configureServer(server) {
      server.middlewares.use('/api/youtube-search', async (req, res) => {
        res.setHeader('Access-Control-Allow-Origin', '*');
        res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
        res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

        if (req.method === 'OPTIONS') {
          res.statusCode = 200;
          res.end();
          return;
        }

        if (req.method !== 'GET') {
          res.statusCode = 405;
          res.setHeader('Content-Type', 'application/json');
          res.end(JSON.stringify({ error: 'Method not allowed' }));
          return;
        }

        const url = new URL(req.url!, `http://${req.headers.host}`);
        const query = url.searchParams.get('query');

        if (!query) {
          res.statusCode = 400;
          res.setHeader('Content-Type', 'application/json');
          res.end(JSON.stringify({ error: 'query parameter is required' }));
          return;
        }

        const YOUTUBE_API_KEY = env.YOUTUBE_API_KEY;

        if (!YOUTUBE_API_KEY || YOUTUBE_API_KEY === 'your_youtube_api_key_here') {
          res.statusCode = 200;
          res.setHeader('Content-Type', 'application/json');
          res.end(JSON.stringify([]));
          return;
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
                'Referer': env.APP_URL || 'http://localhost:5173'
              }
            }
          );

          if (!response.ok) {
            const errorData = await response.json().catch(() => ({})) as Record<string, unknown>;
            const error = errorData.error as { errors?: Array<{ reason: string }>; message?: string } | undefined;
            const isQuotaExceeded = error?.errors?.some((e) => e.reason === 'quotaExceeded');
            if (isQuotaExceeded) {
              res.statusCode = 200;
              res.setHeader('Content-Type', 'application/json');
              res.end(JSON.stringify([]));
              return;
            }
            throw new Error(`YouTube API request failed: ${response.status} - ${error?.message || 'Unknown error'}`);
          }

          const data = await response.json() as YouTubeAPIResponse;
          const items = data.items || [];

          const videos = items.map((item) => ({
            id: item.id.videoId,
            title: item.snippet.title,
            channelTitle: item.snippet.channelTitle,
            thumbnailUrl: item.snippet.thumbnails.medium.url,
            videoUrl: `https://www.youtube.com/watch?v=${item.id.videoId}`
          }));

          res.statusCode = 200;
          res.setHeader('Content-Type', 'application/json');
          res.end(JSON.stringify(videos));
        } catch {
          res.statusCode = 500;
          res.setHeader('Content-Type', 'application/json');
          res.end(JSON.stringify({ error: 'Failed to search YouTube videos' }));
        }
      });
    }
  }
}

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '');

  return {
    plugins: [react(), tailwindcss(), apiPlugin(env)],
    resolve: {
      alias: {
        "@": path.resolve(__dirname, "./src"),
      },
    },
    server: {
      port: 5173,
    }
  }
})
