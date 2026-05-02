export interface YouTubeVideo {
  id: string;
  title: string;
  channelTitle: string;
  thumbnailUrl: string;
  videoUrl: string;
}

export async function searchVideos(query: string): Promise<YouTubeVideo[]> {
  const params = new URLSearchParams({ query });
  const response = await fetch(`/api/youtube-search?${params}`);

  if (!response.ok) {
    throw new Error(`API request failed: ${response.status}`);
  }

  return response.json();
}
