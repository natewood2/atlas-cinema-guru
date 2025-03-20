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

export default function WatchLaterPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const userEmail = session?.user?.email;
  const [watchLaterMovies, setWatchLaterMovies] = useState<Movie[]>([]);
  const [favorites, setFavorites] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);

  const [currentPage, setCurrentPage] = useState(1);
  const [moviesPerPage] = useState(6);
  const [hasNextPage, setHasNextPage] = useState(true);
  const [totalPages, setTotalPages] = useState(1);

  const removeWatchLater = async (movieId: string) => {
    if (!userEmail) return;

    try {
      const url = `/api/watch-later/${movieId}`;

      const response = await fetch(url, {
        method: "DELETE",
        headers: {
          "Content-Type": "application/json",
        },
      });

      if (!response.ok) {
        console.error("Error status:", response.status);
        const errorText = await response.text();
        console.error("Error response:", errorText);
        return;
      }

      const result = await response.json();
      setWatchLaterMovies(
        watchLaterMovies.filter((movie) => movie.id !== movieId)
      );
    } catch (error) {
      console.error("Error", error);
    }
  };

  const toggleFavorite = async (movieId: string) => {
    if (!userEmail) return;

    try {
      const isFavorite = favorites.includes(movieId);

      if (isFavorite) {
        await fetch(`/api/favorites/${movieId}`, {
          method: "DELETE",
          headers: {
            "Content-Type": "application/json",
          },
        });
        setFavorites(favorites.filter((id) => id !== movieId));
      } else {
        await fetch("/api/favorites", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ titleId: movieId }),
        });
        setFavorites([...favorites, movieId]);
      }
    } catch (error) {
      console.error("Error updating favorites:", error);
    }
  };

  const fetchWatchLaterForPage = async (pageNumber: number) => {
    if (status !== "authenticated") return;

    try {
      setLoading(true);

      const url = `/api/watch-later?page=${pageNumber}`;
      
      const response = await fetch(url);
      const data = await response.json();

      let moviesArray: Movie[] = [];
      if (data && Array.isArray(data)) {
        moviesArray = data as Movie[];
      } else if (data && Array.isArray(data.watchLater)) {
        moviesArray = data.watchLater as Movie[];
      } else {
        console.error("Unexpected data format:", data);
      }
      setHasNextPage(moviesArray.length === moviesPerPage);
      setWatchLaterMovies(moviesArray);
      setLoading(false);

      return moviesArray;
    } catch (err) {
      console.error("Error fetching watch later movies:", err);
      setLoading(false);
      return [];
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
          await fetchWatchLaterForPage(1);
          const favResponse = await fetch("/api/favorites");
          const favData = await favResponse.json();

          if (Array.isArray(favData)) {
            setFavorites(favData.map((fav) => fav.id));
          } else if (favData && Array.isArray(favData.favorites)) {
            setFavorites(favData.favorites.map((fav: { id: any }) => fav.id));
          }
        } catch (error) {
          setWatchLaterMovies([]);
        } finally {
          setLoading(false);
        }
      };

      fetchUserData();
    }
  }, [status, router]);

  const goToNextPage = async () => {
    if (loading || !hasNextPage) return;

    const nextPage = currentPage + 1;
    const nextMovies = await fetchWatchLaterForPage(nextPage);

    if (nextMovies && nextMovies.length > 0) {
      setCurrentPage(nextPage);
      window.scrollTo({ top: 0, behavior: "smooth" });
    } else {
      setHasNextPage(false);
    }
  };

  const goToPreviousPage = async () => {
    if (loading || currentPage <= 1) return;

    const prevPage = currentPage - 1;
    await fetchWatchLaterForPage(prevPage);
    setCurrentPage(prevPage);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  if (status === "loading" || loading) {
    return (
      <div className="flex justify-center items-center h-full">
        <div className="animate-spin rounded-full h-16 w-16 border-t-2 border-b-2 border-[#1ED2AF]"></div>
      </div>
    );
  }

  return (
    <div className="h-full pb-8">
      <h1 className="text-3xl font-bold mb-8 text-center">Watch Later</h1>
      {watchLaterMovies.length > 0 && (
        <>
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6">
            {watchLaterMovies.map((movie) => (
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
                      <h2 className="text-2xl font-bold mb-1">
                        {movie.title} ({movie.released})
                      </h2>
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
                        toggleFavorite(movie.id);
                      }}
                      className="bg-white rounded-full p-2 shadow-md hover:bg-gray-100"
                    >
                      {favorites.includes(movie.id) || movie.favorited ? (
                        <svg width="24" height="24" viewBox="0 0 33 33" fill="none" xmlns="http://www.w3.org/2000/svg">
                          <path d="M14.9307 6.4796C15.4246 4.95944 17.5753 4.95944 18.0692 6.4796L19.834 11.9111C20.0549 12.5909 20.6884 13.0512 21.4032 13.0512H27.1142C28.7126 13.0512 29.3772 15.0966 28.0841 16.0361L23.4638 19.3929C22.8855 19.8131 22.6435 20.5578 22.8644 21.2376L24.6292 26.6691C25.1231 28.1893 23.3832 29.4534 22.0901 28.5139L17.4698 25.157C16.8915 24.7369 16.1084 24.7369 15.5301 25.157L10.9098 28.5139C9.61671 29.4534 7.87682 28.1893 8.37075 26.6691L10.1355 21.2376C10.3564 20.5578 10.1144 19.8131 9.53614 19.3929L4.91586 16.0361C3.62273 15.0966 4.28731 13.0512 5.88571 13.0512H11.5967C12.3115 13.0512 12.945 12.5909 13.1659 11.9111L14.9307 6.4796Z" 
                            fill="#1ED2AF"/>
                        </svg>
                      ) : (
                        <svg width="24" height="24" viewBox="0 0 30 31" fill="none" xmlns="http://www.w3.org/2000/svg">
                          <g clipPath="url(#clip0_star)">
                            <path d="M14.0461 3.03341C14.3396 2.10007 15.6604 2.10006 15.9539 3.0334L18.1479 10.0098C18.2789 10.4264 18.6651 10.7098 19.1018 10.7098L26.2687 10.7101C27.2294 10.7102 27.6373 11.933 26.869 12.5098L21.0153 16.9049C20.6763 17.1595 20.5346 17.6001 20.6617 18.0045L22.8841 25.0731C23.1755 26.0002 22.1069 26.7562 21.3297 26.1727L15.6004 21.8717C15.2447 21.6047 14.7553 21.6047 14.3996 21.8717L8.67026 26.1727C7.89306 26.7562 6.82446 26.0002 7.11594 25.0731L9.33827 18.0045C9.46542 17.6001 9.32375 17.1595 8.98473 16.9049L3.13095 12.5098C2.36267 11.933 2.77061 10.7102 3.73133 10.7101L10.8982 10.7098C11.3349 10.7098 11.7211 10.4264 11.8521 10.0098L14.0461 3.03341Z" 
                              stroke="#1ED2AF" 
                              strokeWidth="2"/>
                          </g>
                          <defs>
                            <clipPath id="clip0_star">
                              <rect width="30" height="31" fill="white"/>
                            </clipPath>
                          </defs>
                        </svg>
                      )}
                    </button>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        removeWatchLater(movie.id);
                      }}
                      className="bg-white rounded-full p-2 shadow-md hover:bg-gray-100"
                    >
                      <svg width="24" height="24" viewBox="0 0 30 30" fill="none" xmlns="http://www.w3.org/2000/svg">
                        <path fillRule="evenodd" clipRule="evenodd" d="M15 27C21.6274 27 27 21.6274 27 15C27 8.37258 21.6274 3 15 3C8.37258 3 3 8.37258 3 15C3 21.6274 8.37258 27 15 27ZM16 9C16 8.44772 15.5523 8 15 8C14.4477 8 14 8.44772 14 9V15C14 15.2652 14.1054 15.5196 14.2929 15.7071L18.5355 19.9497C18.9261 20.3403 19.5592 20.3403 19.9497 19.9497C20.3403 19.5592 20.3403 18.9261 19.9497 18.5355L16 14.5858V9Z" 
                          fill="#1ED2AF"/>
                      </svg>
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
          <div className="mt-8 pt-8 pb-4">
            <div className="flex justify-center items-center">
              <div className="flex rounded-full overflow-hidden">
                <button
                  onClick={goToPreviousPage}
                  disabled={loading}
                  className="bg-[#1ED2AF] text-[#000030] font-medium text-lg py-3 px-12 rounded-l-full hover:bg-[#19b093] focus:outline-none"
                >
                  Previous
                </button>
                <div className="w-1 bg-[#000030]"></div>
                <button
                  onClick={goToNextPage}
                  disabled={!hasNextPage || loading}
                  className="bg-[#1ED2AF] text-[#000030] font-medium text-lg py-3 px-12 rounded-r-full hover:bg-[#19b093] focus:outline-none"
                >
                  Next
                </button>
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  );
}