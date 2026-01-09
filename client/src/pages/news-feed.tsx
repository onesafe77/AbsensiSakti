import { useState, useEffect, useRef } from "react";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { ScrollArea } from "@/components/ui/scroll-area";
import { useToast } from "@/hooks/use-toast";
import { format, differenceInHours } from "date-fns";
import { id } from "date-fns/locale";
import { Newspaper, Clock, User, AlertTriangle, Loader2, Megaphone, ChevronRight, X, ImageIcon } from "lucide-react";

interface News {
  id: string;
  title: string;
  content: string;
  imageUrl?: string | null;
  imageUrls?: string[] | null;
  isImportant: boolean;
  createdBy: string;
  createdByName: string;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export default function NewsFeed() {
  const { toast } = useToast();
  const [selectedNews, setSelectedNews] = useState<News | null>(null);
  const [lastNewsCount, setLastNewsCount] = useState<number>(0);
  const isFirstLoad = useRef(true);

  const { data: newsList = [], isLoading } = useQuery<News[]>({
    queryKey: ["/api/news/active"],
    refetchInterval: 30000, // Poll every 30 seconds for new news
  });

  // Check for new news and show toast
  useEffect(() => {
    if (isFirstLoad.current) {
      setLastNewsCount(newsList.length);
      isFirstLoad.current = false;
    } else if (newsList.length > lastNewsCount) {
      const newCount = newsList.length - lastNewsCount;
      const latestNews = newsList[0];
      toast({
        title: `${newCount} Berita Baru`,
        description: latestNews.title,
        duration: 5000,
      });
      setLastNewsCount(newsList.length);
    } else if (newsList.length !== lastNewsCount) {
      // Sync count when list decreases (deleted/inactivated news)
      setLastNewsCount(newsList.length);
    }
  }, [newsList.length, lastNewsCount, toast, newsList]);

  const isNew = (createdAt: string) => {
    return differenceInHours(new Date(), new Date(createdAt)) <= 24;
  };

  const getImages = (news: News): string[] => {
    if (news.imageUrls && news.imageUrls.length > 0) {
      return news.imageUrls;
    }
    if (news.imageUrl) {
      return [news.imageUrl];
    }
    return [];
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <div className="max-w-4xl mx-auto p-4 md:p-6 space-y-6">
        <div className="flex items-center gap-3 mb-6">
          <div className="p-3 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-xl shadow-lg">
            <Newspaper className="h-6 w-6 text-white" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Berita Perusahaan</h1>
            <p className="text-sm text-gray-500 dark:text-gray-400">Informasi terbaru dari PT. GECL</p>
          </div>
        </div>

        {isLoading ? (
          <div className="flex flex-col items-center justify-center py-16">
            <Loader2 className="h-10 w-10 animate-spin text-blue-500 mb-4" />
            <p className="text-gray-500">Memuat berita...</p>
          </div>
        ) : newsList.length > 0 ? (
          <Card className="overflow-hidden">
            <CardContent className="p-0">
              <div className="divide-y divide-gray-100 dark:divide-gray-700">
                {newsList.map((news) => {
                  const images = getImages(news);
                  return (
                    <div
                      key={news.id}
                      onClick={() => setSelectedNews(news)}
                      className={`flex items-center gap-3 p-4 cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors ${
                        news.isImportant ? "bg-amber-50/50 dark:bg-amber-900/10" : ""
                      }`}
                      data-testid={`news-item-${news.id}`}
                    >
                      {/* Thumbnail or icon */}
                      <div className="flex-shrink-0">
                        {images.length > 0 ? (
                          <div className="relative">
                            <img
                              src={images[0]}
                              alt=""
                              className="w-14 h-14 rounded-lg object-cover"
                            />
                            {images.length > 1 && (
                              <div className="absolute -bottom-1 -right-1 bg-blue-500 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center">
                                +{images.length - 1}
                              </div>
                            )}
                          </div>
                        ) : (
                          <div className="w-14 h-14 bg-gray-100 dark:bg-gray-700 rounded-lg flex items-center justify-center">
                            <Newspaper className="h-6 w-6 text-gray-400" />
                          </div>
                        )}
                      </div>

                      {/* Content */}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1">
                          {news.isImportant && (
                            <Badge className="bg-amber-500 text-white text-xs px-1.5 py-0">
                              <AlertTriangle className="h-3 w-3 mr-0.5" />
                              Penting
                            </Badge>
                          )}
                          {isNew(news.createdAt) && (
                            <Badge className="bg-green-500 text-white text-xs px-1.5 py-0">
                              BARU
                            </Badge>
                          )}
                        </div>
                        <h3 className="font-semibold text-gray-900 dark:text-white truncate">
                          {news.title}
                        </h3>
                        <div className="flex items-center gap-3 text-xs text-gray-500 dark:text-gray-400 mt-1">
                          <span className="flex items-center gap-1">
                            <User className="h-3 w-3" />
                            {news.createdByName}
                          </span>
                          <span className="flex items-center gap-1">
                            <Clock className="h-3 w-3" />
                            {format(new Date(news.createdAt), "dd MMM yyyy HH:mm", { locale: id })}
                          </span>
                        </div>
                      </div>

                      {/* Arrow */}
                      <ChevronRight className="h-5 w-5 text-gray-400 flex-shrink-0" />
                    </div>
                  );
                })}
              </div>
            </CardContent>
          </Card>
        ) : (
          <Card className="border-dashed">
            <CardContent className="flex flex-col items-center justify-center py-16">
              <div className="w-16 h-16 bg-gray-100 dark:bg-gray-800 rounded-full flex items-center justify-center mb-4">
                <Megaphone className="h-8 w-8 text-gray-400" />
              </div>
              <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-1">
                Belum Ada Berita
              </h3>
              <p className="text-sm text-gray-500 dark:text-gray-400 text-center max-w-sm">
                Belum ada berita yang dipublikasikan. Berita terbaru akan muncul di sini.
              </p>
            </CardContent>
          </Card>
        )}
      </div>

      {/* News Detail Dialog */}
      <Dialog open={!!selectedNews} onOpenChange={(open) => !open && setSelectedNews(null)}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-hidden p-0">
          <ScrollArea className="max-h-[90vh]">
            {selectedNews && (
              <>
                {/* Images Gallery */}
                {getImages(selectedNews).length > 0 && (
                  <div className="relative">
                    {getImages(selectedNews).length === 1 ? (
                      <img
                        src={getImages(selectedNews)[0]}
                        alt={selectedNews.title}
                        className="w-full h-64 object-cover"
                      />
                    ) : (
                      <div className="grid grid-cols-2 gap-1">
                        {getImages(selectedNews).slice(0, 4).map((img, idx) => (
                          <div key={idx} className="relative">
                            <img
                              src={img}
                              alt={`${selectedNews.title} ${idx + 1}`}
                              className="w-full h-32 object-cover"
                            />
                            {idx === 3 && getImages(selectedNews).length > 4 && (
                              <div className="absolute inset-0 bg-black/50 flex items-center justify-center">
                                <span className="text-white text-lg font-bold">
                                  +{getImages(selectedNews).length - 4}
                                </span>
                              </div>
                            )}
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                )}

                <div className="p-6">
                  <DialogHeader className="mb-4">
                    <div className="flex items-center gap-2 mb-2">
                      {selectedNews.isImportant && (
                        <Badge className="bg-amber-500 text-white">
                          <AlertTriangle className="h-3 w-3 mr-1" />
                          Penting
                        </Badge>
                      )}
                      {isNew(selectedNews.createdAt) && (
                        <Badge className="bg-green-500 text-white">
                          BARU
                        </Badge>
                      )}
                    </div>
                    <DialogTitle className="text-xl font-bold">
                      {selectedNews.title}
                    </DialogTitle>
                  </DialogHeader>

                  <div className="flex items-center gap-4 text-sm text-gray-500 dark:text-gray-400 mb-4 pb-4 border-b">
                    <span className="flex items-center gap-1">
                      <User className="h-4 w-4" />
                      {selectedNews.createdByName}
                    </span>
                    <span className="flex items-center gap-1">
                      <Clock className="h-4 w-4" />
                      {format(new Date(selectedNews.createdAt), "EEEE, dd MMMM yyyy 'pukul' HH:mm", { locale: id })}
                    </span>
                  </div>

                  <div className="prose prose-sm dark:prose-invert max-w-none">
                    <p className="text-gray-700 dark:text-gray-300 whitespace-pre-wrap leading-relaxed">
                      {selectedNews.content}
                    </p>
                  </div>
                </div>
              </>
            )}
          </ScrollArea>
        </DialogContent>
      </Dialog>
    </div>
  );
}
