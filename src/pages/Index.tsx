import { useState } from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { VideoOverlay } from "@/components/VideoOverlay";
import { searchVideos, type YouTubeVideo } from "@/lib/youtube";
import { Search, Loader2 } from "lucide-react";
import { toast } from "sonner";

const Index = () => {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<YouTubeVideo[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [hasSearched, setHasSearched] = useState(false);
  const [selectedVideoId, setSelectedVideoId] = useState<string | null>(null);

  const handleSearch = async () => {
    const trimmed = query.trim();
    if (!trimmed) return;

    setIsLoading(true);
    setHasSearched(true);
    try {
      const videos = await searchVideos(trimmed);
      setResults(videos);
      if (videos.length === 0) {
        toast.info("No results found");
      }
    } catch {
      toast.error("Failed to search videos");
      setResults([]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") handleSearch();
  };

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <div className="min-w-3/4 mx-auto px-4 py-12 flex-1">
        <h1 className="text-4xl font-bold text-center mb-2 text-foreground">
          Paradigm Charts
        </h1>
        <p className="text-center text-muted-foreground mb-8">
          Search for Paradigm Reboot chart videos
        </p>

        <div className="flex gap-2 mb-8">
          <Input
            placeholder="Search song name..."
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onKeyDown={handleKeyDown}
            className="h-11"
          />
          <Button
            onClick={handleSearch}
            disabled={isLoading || !query.trim()}
            className="h-11 px-6"
          >
            {isLoading ? (
              <Loader2 className="size-4 animate-spin" />
            ) : (
              <Search className="size-4" />
            )}
            Search
          </Button>
        </div>

        {isLoading && (
          <div className="text-center text-muted-foreground py-12">
            Searching...
          </div>
        )}

        {!isLoading && hasSearched && results.length === 0 && (
          <div className="text-center text-muted-foreground py-12">
            No videos found. Try a different search.
          </div>
        )}

        {!isLoading && results.length > 0 && (
          <div className="space-y-3">
            {results.map((video) => (
              <button
                key={video.id}
                onClick={() => setSelectedVideoId(video.id)}
                className="w-full flex items-center gap-4 p-3 rounded-lg bg-card hover:bg-accent transition-colors text-left cursor-pointer border border-border"
              >
                <img
                  src={video.thumbnailUrl}
                  alt={video.title}
                  className="w-40 h-[90px] object-cover rounded-md shrink-0"
                />
                <div className="min-w-0">
                  <p className="font-medium text-card-foreground line-clamp-2">
                    {video.title}
                  </p>
                  <p className="text-sm text-muted-foreground mt-1">
                    {video.channelTitle}
                  </p>
                </div>
              </button>
            ))}
          </div>
        )}
      </div>

      <footer className="w-full pb-8 mt-auto text-center text-md text-muted-foreground">
        <div className="flex flex-col items-center gap-3">
          <div className="flex flex-row items-center gap-2">
            <span className="font-medium text-foreground">Paradigm Charts</span>
            <a
              href="https://ko-fi.com/S6S41JCXEZ"
              target="_blank"
              rel="noopener noreferrer"
              className="opacity-80 hover:opacity-100 transition-opacity"
              aria-label="Support on Ko-fi"
            >
              <img
                src="https://storage.ko-fi.com/cdn/kofi5.png?v=6"
                alt="Buy Me a Coffee at ko-fi.com"
                className="border-0 h-8"
              />
            </a>
          </div>
          <p className="text-xs text-muted-foreground mt-2">
            Tip: Use <strong>Guided Access</strong> to prevent accidental exits.
          </p>
        </div>
      </footer>

      <VideoOverlay
        videoId={selectedVideoId ?? ""}
        isOpen={selectedVideoId !== null}
        onClose={() => setSelectedVideoId(null)}
      />
    </div>
  );
};

export default Index;
