"use client";

import { useState, useEffect } from "react";
import { useSession } from "next-auth/react";

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

const COMMON_GENRES = [
  "Romance",
  "Horror",
  "Drama",
  "Action",
  "Mystery",
  "Fantasy",
  "Thriller",
  "Western",
  "Sci-Fi",
  "Adventure"
];

export default function MoviesPage() {
  const { data: session, status } = useSession();
  const userEmail = session?.user?.email;

  const [movies, setMovies] = useState<Movie[]>([]);
  const [filteredMovies, setFilteredMovies] = useState<Movie[]>([]);
  const [favorites, setFavorites] = useState<string[]>([]);
  const [watchLater, setWatchLater] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);

  const [searchTitle, setSearchTitle] = useState("");
  const [minYear, setMinYear] = useState("");
  const [maxYear, setMaxYear] = useState("");
  const [selectedGenres, setSelectedGenres] = useState<string[]>([]);
  const [availableGenres, setAvailableGenres] =
    useState<string[]>(COMMON_GENRES);

  const [currentPage, setCurrentPage] = useState(1);
  const [moviesPerPage] = useState(6);
  const [hasNextPage, setHasNextPage] = useState(true);

  const fetchMoviesForPage = async (pageNumber: number, filters?: any) => {
    if (status !== "authenticated") return;

    try {
      setLoading(true);

      let url = `/api/titles?page=${pageNumber}`;

      if (filters) {
        if (filters.minYear) url += `&minYear=${filters.minYear}`;
        if (filters.maxYear) url += `&maxYear=${filters.maxYear}`;
        if (filters.title && filters.title.trim() !== "")
          url += `&query=${encodeURIComponent(filters.title.trim())}`;
        if (filters.genres && filters.genres.length > 0) {
          url += `&genres=${encodeURIComponent(filters.genres.join(","))}`;
        }
      }

      console.log("Fetching movies with URL:", url);

      const response = await fetch(url);

      if (!response.ok) {
        throw new Error(`API request failed with status ${response.status}`);
      }

      const data = await response.json();
      console.log("API Response data:", data);

      let moviesArray: Movie[] = [];
      if (data.title && Array.isArray(data.title)) {
        moviesArray = data.title;
      } else if (Array.isArray(data)) {
        moviesArray = data;
      } else {
        moviesArray = [];
      }

      setHasNextPage(moviesArray.length === moviesPerPage);

      setMovies(moviesArray);
      setFilteredMovies(moviesArray);
      setLoading(false);

      return moviesArray;
    } catch (err) {
      console.error("Error fetching movies:", err);
      setLoading(false);
      return [];
    }
  };

  useEffect(() => {
    if (status === "authenticated") {
      fetchMoviesForPage(1);

      const fetchUserPreferences = async () => {
        try {
          const favResponse = await fetch("/api/favorites");
          const favData = await favResponse.json();
          if (Array.isArray(favData)) {
            setFavorites(favData.map((fav) => fav.title_id));
          }

          const watchResponse = await fetch("/api/watch-later");
          const watchData = await watchResponse.json();
          if (Array.isArray(watchData)) {
            setWatchLater(watchData.map((item) => item.title_id));
          }
        } catch (error) {
          console.error("Error", error);
        }
      };

      fetchUserPreferences();
    }
  }, [status]);

  useEffect(() => {
    if (status === "authenticated" && !loading && movies.length > 0) {
      const timer = setTimeout(() => {
        applyFilters();
      }, 500);

      return () => clearTimeout(timer);
    }
  }, [searchTitle, minYear, maxYear, selectedGenres]);

  const goToNextPage = async () => {
    if (loading) return;

    const nextPage = currentPage + 1;
    const nextMovies = await fetchMoviesForPage(nextPage);

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
    await fetchMoviesForPage(prevPage);
    setCurrentPage(prevPage);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchTitle(e.target.value);
  };

  const handleMinYearChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setMinYear(e.target.value);
  };

  const handleMaxYearChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setMaxYear(e.target.value);
  };

  const handleGenreToggle = (genre: string) => {
    setSelectedGenres((prev) =>
      prev.includes(genre) ? prev.filter((g) => g !== genre) : [...prev, genre]
    );
  };

  const applyFilters = async () => {
    try {
      setCurrentPage(1);
      const filterObj = {
        title: searchTitle.trim(),
        minYear: minYear ? parseInt(minYear) : null,
        maxYear: maxYear ? parseInt(maxYear) : null,
        genres: selectedGenres,
      };

      await fetchMoviesForPage(1, filterObj);
    } catch (error) {
      console.error("Error", error);
    }
  };

  const clearFilters = async () => {
    setSearchTitle("");
    setMinYear("");
    setMaxYear("");
    setSelectedGenres([]);
    setCurrentPage(1);
    await fetchMoviesForPage(1);
  };

  const toggleFavorite = async (movieId: string) => {
    if (!userEmail) return;

    try {
      const isFavorite = favorites.includes(movieId);

      if (isFavorite) {
        await fetch(`/api/favorites/${movieId}`, {
          method: "DELETE",
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
      console.error("Error", error);
    }
  };

  const toggleWatchLater = async (movieId: string) => {
    if (!userEmail) return;

    try {
      const isWatchLater = watchLater.includes(movieId);
      if (isWatchLater) {
        await fetch(`/api/watch-later/${movieId}`, {
          method: "DELETE",
        });
        setWatchLater(watchLater.filter((id) => id !== movieId));
      } else {
        await fetch("/api/watch-later", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ titleId: movieId }),
        });
        setWatchLater([...watchLater, movieId]);
      }
    } catch (error) {
      console.error("Error", error);
    }
  };

  if (status === "loading" || (loading && movies.length === 0)) {
    return (
      <div className="flex justify-center items-center h-full">
        <div className="animate-spin rounded-full h-16 w-16 border-t-2 border-b-2 border-[#1ED2AF]"></div>
      </div>
    );
  }

  if (status === "unauthenticated") {
    return null;
  }

  return (
    <div className="h-full pb-8">
      <div className="flex flex-col md:flex-row justify-between mb-8 gap-8">
        <div className="md:w-1/2">
          <div className="mb-4">
            <h2 className="text-lg font-semibold mb-2">Search</h2>
            <input
              type="text"
              value={searchTitle}
              onChange={handleSearchChange}
              placeholder="Search Movies..."
              className="w-full p-3 rounded-full bg-[#000030] border border-[#1ED2AF] focus:outline-none focus:ring-2 focus:ring-[#1ED2AF]"
            />
          </div>
          <div className="flex gap-4">
            <div className="w-1/2">
              <h2 className="text-lg font-semibold mb-2">Min Year</h2>
              <input
                type="number"
                value={minYear}
                onChange={handleMinYearChange}
                placeholder="1990"
                className="w-full p-3 rounded-full bg-[#000030] border border-[#1ED2AF] focus:outline-none focus:ring-2 focus:ring-[#1ED2AF] no-spinners"
              />
            </div>
            <div className="w-1/2">
              <h2 className="text-lg font-semibold mb-2">Max Year</h2>
              <input
                type="number"
                value={maxYear}
                onChange={handleMaxYearChange}
                placeholder="2024"
                className="w-full p-3 rounded-full bg-[#000030] border border-[#1ED2AF] focus:outline-none focus:ring-2 focus:ring-[#1ED2AF] no-spinners"
              />
            </div>
          </div>
        </div>
        <div className="md:w-1/2">
          <h2 className="text-lg font-semibold mb-2">Genres</h2>
          <div className="flex flex-wrap gap-2">
            {COMMON_GENRES.map((genre) => (
              <button
                key={genre}
                onClick={() => handleGenreToggle(genre)}
                className={`px-4 py-2 rounded-full ${
                  selectedGenres.includes(genre)
                    ? "bg-[#1ED2AF] text-[#000030]"
                    : "bg-[#000030] text-white border border-[#1ED2AF] hover:bg-[#000050]"
                }`}
              >
                {genre}
              </button>
            ))}
          </div>
        </div>
      </div>
      {loading && movies.length === 0 ? (
        <div className="flex justify-center items-center h-64">
          <div className="animate-spin rounded-full h-16 w-16 border-t-2 border-b-2 border-[#1ED2AF]"></div>
        </div>
      ) : filteredMovies.length === 0 ? (
        <div className="text-center py-12">
          <p className="text-lg text-gray-400">
            No movies match your search criteria.
          </p>
          <button
            onClick={clearFilters}
            className="mt-4 px-4 py-2 bg-[#1ED2AF] text-[#000030] rounded-md hover:bg-[#19b093]"
          >
            Clear Filters
          </button>
        </div>
      ) : (
        <>
          {loading && (
            <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
              <div className="animate-spin rounded-full h-16 w-16 border-t-2 border-b-2 border-[#1ED2AF]"></div>
            </div>
          )}
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6">
            {filteredMovies.map((movie, index) => (
              <div
                key={movie.id || index}
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
                      onClick={async (e) => {
                        e.stopPropagation();
                        await toggleFavorite(movie.id);
                      }}
                      className="bg-white rounded-full p-2 shadow-md hover:bg-gray-100"
                    >
                      {favorites.includes(movie.id) || movie.favorited ? (
                        <svg
                          width="24"
                          height="24"
                          viewBox="0 0 33 33"
                          fill="none"
                          xmlns="http://www.w3.org/2000/svg"
                        >
                          <path
                            d="M14.9307 6.4796C15.4246 4.95944 17.5753 4.95944 18.0692 6.4796L19.834 11.9111C20.0549 12.5909 20.6884 13.0512 21.4032 13.0512H27.1142C28.7126 13.0512 29.3772 15.0966 28.0841 16.0361L23.4638 19.3929C22.8855 19.8131 22.6435 20.5578 22.8644 21.2376L24.6292 26.6691C25.1231 28.1893 23.3832 29.4534 22.0901 28.5139L17.4698 25.157C16.8915 24.7369 16.1084 24.7369 15.5301 25.157L10.9098 28.5139C9.61671 29.4534 7.87682 28.1893 8.37075 26.6691L10.1355 21.2376C10.3564 20.5578 10.1144 19.8131 9.53614 19.3929L4.91586 16.0361C3.62273 15.0966 4.28731 13.0512 5.88571 13.0512H11.5967C12.3115 13.0512 12.945 12.5909 13.1659 11.9111L14.9307 6.4796Z"
                            fill="#1ED2AF"
                          />
                        </svg>
                      ) : (
                        <svg
                          width="24"
                          height="24"
                          viewBox="0 0 30 31"
                          fill="none"
                          xmlns="http://www.w3.org/2000/svg"
                        >
                          <g clipPath="url(#clip0_star)">
                            <path
                              d="M14.0461 3.03341C14.3396 2.10007 15.6604 2.10006 15.9539 3.0334L18.1479 10.0098C18.2789 10.4264 18.6651 10.7098 19.1018 10.7098L26.2687 10.7101C27.2294 10.7102 27.6373 11.933 26.869 12.5098L21.0153 16.9049C20.6763 17.1595 20.5346 17.6001 20.6617 18.0045L22.8841 25.0731C23.1755 26.0002 22.1069 26.7562 21.3297 26.1727L15.6004 21.8717C15.2447 21.6047 14.7553 21.6047 14.3996 21.8717L8.67026 26.1727C7.89306 26.7562 6.82446 26.0002 7.11594 25.0731L9.33827 18.0045C9.46542 17.6001 9.32375 17.1595 8.98473 16.9049L3.13095 12.5098C2.36267 11.933 2.77061 10.7102 3.73133 10.7101L10.8982 10.7098C11.3349 10.7098 11.7211 10.4264 11.8521 10.0098L14.0461 3.03341Z"
                              stroke="#1ED2AF"
                              strokeWidth="2"
                            />
                          </g>
                          <defs>
                            <clipPath id="clip0_star">
                              <rect width="30" height="31" fill="white" />
                            </clipPath>
                          </defs>
                        </svg>
                      )}
                    </button>

                    <button
                      onClick={async (e) => {
                        e.stopPropagation();
                        await toggleWatchLater(movie.id);
                      }}
                      className="bg-white rounded-full p-2 shadow-md hover:bg-gray-100"
                    >
                      {watchLater.includes(movie.id) || movie.watchLater ? (
                        <svg
                          width="24"
                          height="24"
                          viewBox="0 0 30 30"
                          fill="none"
                          xmlns="http://www.w3.org/2000/svg"
                        >
                          <path
                            fillRule="evenodd"
                            clipRule="evenodd"
                            d="M15 27C21.6274 27 27 21.6274 27 15C27 8.37258 21.6274 3 15 3C8.37258 3 3 8.37258 3 15C3 21.6274 8.37258 27 15 27ZM16 9C16 8.44772 15.5523 8 15 8C14.4477 8 14 8.44772 14 9V15C14 15.2652 14.1054 15.5196 14.2929 15.7071L18.5355 19.9497C18.9261 20.3403 19.5592 20.3403 19.9497 19.9497C20.3403 19.5592 20.3403 18.9261 19.9497 18.5355L16 14.5858V9Z"
                            fill="#1ED2AF"
                          />
                        </svg>
                      ) : (
                        <svg
                          width="24"
                          height="24"
                          viewBox="0 0 34 34"
                          fill="none"
                          xmlns="http://www.w3.org/2000/svg"
                        >
                          <path
                            d="M17 11.3333V17L21.25 21.25M29.75 17C29.75 24.0416 24.0416 29.75 17 29.75C9.95837 29.75 4.25 24.0416 4.25 17C4.25 9.95837 9.95837 4.25 17 4.25C24.0416 4.25 29.75 9.95837 29.75 17Z"
                            stroke="#1ED2AF"
                            strokeWidth="2"
                            strokeLinecap="round"
                            strokeLinejoin="round"
                          />
                        </svg>
                      )}
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
