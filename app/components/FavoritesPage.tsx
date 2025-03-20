"use client";

import { useState, useEffect } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";

interface Movie {
  id: string;
  title: string;
  synopsis: string;
  released: number;
  genre: string;
  image?: string;
  favorited?: boolean;
  watchLater?: boolean;
}

export default function FavoritesPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const userEmail = session?.user?.email;
  const [favorites, setFavorites] = useState<Movie[]>([]);
  const [watchLater, setWatchLater] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);

  const removeFavorite = async (movieId: string) => {
    if (!userEmail) return;
    
    try {
      const url = `/api/favorites/${movieId}`;
      const response = await fetch(url, {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json'
        }
      });
      
      const result = await response.json();

      setFavorites(favorites.filter(movie => movie.id !== movieId));
    } catch (error) {
      console.error("Error", error);
    }
  };

  const toggleWatchLater = async (movieId: string) => {
    if (!userEmail) return;
    
    try {
      const isWatchLater = watchLater.includes(movieId);
      
      if (isWatchLater) {
        await fetch(`/api/watch-later/${movieId}`, {
          method: 'DELETE',
        });
        setWatchLater(watchLater.filter(id => id !== movieId));
      } else {
        await fetch('/api/watch-later', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ titleId: movieId }),
        });
        setWatchLater([...watchLater, movieId]);
      }
    } catch (error) {
      console.error("Error updating watch later:", error);
    }
  };

  useEffect(() => {
    if (status === "unauthenticated") {
      router.push("/login");
      return;
    }

    if (status === "authenticated") {
      const fetchUserData = async () => {
        try {
          setLoading(true);

          const favResponse = await fetch('/api/favorites');
          const favData = await favResponse.json();

          if (favData && Array.isArray(favData)) {
            setFavorites(favData as Movie[]); 
          } else if (favData && Array.isArray(favData.favorites)) {
            setFavorites(favData.favorites as Movie[]); 
          } else {
            setFavorites([]);
          }

          const watchResponse = await fetch('/api/watch-later');
          const watchData = await watchResponse.json();
          if (Array.isArray(watchData)) {
            setWatchLater(watchData.map(item => item.title_id));
          }
        } catch (error) {
          console.error("Error", error);
          setFavorites([]);
        } finally {
          setLoading(false);
        }
      };

      fetchUserData();
    }
  }, [status, router]);

  if (status === "loading" || loading) {
    return (
      <div className="flex justify-center items-center h-full">
        <div className="animate-spin rounded-full h-16 w-16 border-t-2 border-b-2 border-[#1ED2AF]"></div>
      </div>
    );
  }

  return (
    <div className="h-full pb-8">
      <h1 className="text-3xl font-bold mb-8 text-center">Favorites</h1>
  
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6">
          {favorites.map((movie) => (
            <div
            key={movie.id}
            className="group relative rounded-lg overflow-hidden shadow-lg hover:shadow-xl transition-shadow duration-300 border-2 border-[#1ED2AF]"
          >
            <div className="relative">
              <div className="aspect-[2/3] bg-[#000050] overflow-hidden">
                {movie.image ? (
                  <img
                    src={movie.image}
                    alt={movie.title}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center">
                    <div className="p-4 text-center">
                      <h3 className="text-xl font-bold">{movie.title}</h3>
                    </div>
                  </div>
                )}
              </div>
              <div className="absolute inset-0 flex flex-col opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                <div className="flex-grow"></div>
                <div className="bg-[#00003c] p-4 flex flex-col">
                  <h2 className="text-2xl font-bold mb-1">{movie.title} ({movie.released})</h2>
                  <p className="text-base mb-3">{movie.synopsis}</p>
                  <div className="mb-2">
                    <span className="inline-block bg-[#1ED2AF] text-[#00003c] px-3 py-1 rounded-full text-sm font-medium">
                      {movie.genre}
                    </span>
                  </div>
                </div>
              </div>
              <div className="absolute top-2 right-2 flex space-x-2 opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                <button 
                  onClick={(e) => {
                    e.stopPropagation();
                    removeFavorite(movie.id);
                  }}
                  className="bg-white rounded-full p-2 shadow-md hover:bg-gray-100"
                >
                  <svg width="24" height="24" viewBox="0 0 33 33" fill="none" xmlns="http://www.w3.org/2000/svg">
                    <path d="M14.9307 6.4796C15.4246 4.95944 17.5753 4.95944 18.0692 6.4796L19.834 11.9111C20.0549 12.5909 20.6884 13.0512 21.4032 13.0512H27.1142C28.7126 13.0512 29.3772 15.0966 28.0841 16.0361L23.4638 19.3929C22.8855 19.8131 22.6435 20.5578 22.8644 21.2376L24.6292 26.6691C25.1231 28.1893 23.3832 29.4534 22.0901 28.5139L17.4698 25.157C16.8915 24.7369 16.1084 24.7369 15.5301 25.157L10.9098 28.5139C9.61671 29.4534 7.87682 28.1893 8.37075 26.6691L10.1355 21.2376C10.3564 20.5578 10.1144 19.8131 9.53614 19.3929L4.91586 16.0361C3.62273 15.0966 4.28731 13.0512 5.88571 13.0512H11.5967C12.3115 13.0512 12.945 12.5909 13.1659 11.9111L14.9307 6.4796Z" 
                      fill="#1ED2AF"/>
                  </svg>
                </button>
                
                <button 
                  onClick={(e) => {
                    e.stopPropagation();
                    toggleWatchLater(movie.id);
                  }}
                  className="bg-white rounded-full p-2 shadow-md hover:bg-gray-100"
                >
                  {watchLater.includes(movie.id) || movie.watchLater ? (
                    <svg width="24" height="24" viewBox="0 0 30 30" fill="none" xmlns="http://www.w3.org/2000/svg">
                      <path fillRule="evenodd" clipRule="evenodd" d="M15 27C21.6274 27 27 21.6274 27 15C27 8.37258 21.6274 3 15 3C8.37258 3 3 8.37258 3 15C3 21.6274 8.37258 27 15 27ZM16 9C16 8.44772 15.5523 8 15 8C14.4477 8 14 8.44772 14 9V15C14 15.2652 14.1054 15.5196 14.2929 15.7071L18.5355 19.9497C18.9261 20.3403 19.5592 20.3403 19.9497 19.9497C20.3403 19.5592 20.3403 18.9261 19.9497 18.5355L16 14.5858V9Z" 
                        fill="#1ED2AF"/>
                    </svg>
                  ) : (
                    <svg width="24" height="24" viewBox="0 0 34 34" fill="none" xmlns="http://www.w3.org/2000/svg">
                      <path d="M17 11.3333V17L21.25 21.25M29.75 17C29.75 24.0416 24.0416 29.75 17 29.75C9.95837 29.75 4.25 24.0416 4.25 17C4.25 9.95837 9.95837 4.25 17 4.25C24.0416 4.25 29.75 9.95837 29.75 17Z" 
                        stroke="#1ED2AF" 
                        strokeWidth="2" 
                        strokeLinecap="round" 
                        strokeLinejoin="round"/>
                    </svg>
                  )}
                </button>
              </div>
            </div>
          </div>
          ))}
        </div>
    </div>
  );
}
