"use client";

import { useState, useEffect, useMemo } from "react";
import { useSession } from "next-auth/react";

interface Movie {
  id: string;
  title: string;
  synopsis: string;
  released: number;
  genre: string;
}

interface FilterOptions {
  title: string;
  minYear: number | null;
  maxYear: number | null;
  selectedGenres: string[];
}

export default function MoviesPage() {
  const { data: session, status } = useSession();
  const userId = session?.user?.id;

  const [movies, setMovies] = useState<Movie[]>([]);
  const [favorites, setFavorites] = useState<string[]>([]);
  const [watchLater, setWatchLater] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);

  const [filters, setFilters] = useState<FilterOptions>({
    title: "",
    minYear: null,
    maxYear: null,
    selectedGenres: [],
  });

  const [availableGenres, setAvailableGenres] = useState<string[]>([]);
  const [minAvailableYear, setMinAvailableYear] = useState<number | null>(null);
  const [maxAvailableYear, setMaxAvailableYear] = useState<number | null>(null);

  const [currentPage, setCurrentPage] = useState(1);
  const moviesPerPage = 12;

  useEffect(() => {
    if (status === "unauthenticated") {
      window.location.href = "/login";
    }
  }, [status]);

  useEffect(() => {
    const fetchData = async () => {
      if (status !== "authenticated") return;

      try {
        setLoading(true);

        const moviesResponse = await fetch('/api/titles');
        const moviesData = await moviesResponse.json();

        const genresResponse = await fetch('/api/genres');
        const genresData = await genresResponse.json();
        
        if (userId) {
          const favoritesResponse = await fetch(`/api/favorites`);
          const favoritesData = await favoritesResponse.json();
          setFavorites(favoritesData.map((fav: any) => fav.title_id));
          const watchLaterResponse = await fetch(`/api/watch-later`);
          const watchLaterData = await watchLaterResponse.json();
          setWatchLater(watchLaterData.map((item: any) => item.title_id));
        }
        setMovies(moviesData);
        setAvailableGenres(genresData);

        const years = moviesData.map((movie: Movie) => movie.released);
        setMinAvailableYear(Math.min(...years));
        setMaxAvailableYear(Math.max(...years));

        setLoading(false);
      } catch (error) {
        console.error("Error fetching data:", error);
        setLoading(false);
      }
    };

    fetchData();
  }, [userId, status]);

  const filteredMovies = useMemo(() => {
    return movies.filter((movie) => {
      const titleMatch = movie.title.toLowerCase().includes(filters.title.toLowerCase());

      const yearMatch = (
        (!filters.minYear || movie.released >= filters.minYear) &&
        (!filters.maxYear || movie.released <= filters.maxYear)
      );

      const genreMatch = filters.selectedGenres.length === 0 || 
        filters.selectedGenres.includes(movie.genre);
      
      return titleMatch && yearMatch && genreMatch;
    });
  }, [movies, filters]);

  const currentMovies = useMemo(() => {
    const indexOfLastMovie = currentPage * moviesPerPage;
    const indexOfFirstMovie = indexOfLastMovie - moviesPerPage;
    return filteredMovies.slice(indexOfFirstMovie, indexOfLastMovie);
  }, [filteredMovies, currentPage, moviesPerPage]);

  const totalPages = Math.ceil(filteredMovies.length / moviesPerPage);

  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFilters({ ...filters, title: e.target.value });
    setCurrentPage(1);
  };

  const handleMinYearChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value ? parseInt(e.target.value) : null;
    setFilters({ ...filters, minYear: value });
    setCurrentPage(1);
  };

  const handleMaxYearChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value ? parseInt(e.target.value) : null;
    setFilters({ ...filters, maxYear: value });
    setCurrentPage(1);
  };

  const handleGenreToggle = (genre: string) => {
    setFilters(prev => {
      const newSelectedGenres = prev.selectedGenres.includes(genre)
        ? prev.selectedGenres.filter(g => g !== genre)
        : [...prev.selectedGenres, genre];
      
      return { ...prev, selectedGenres: newSelectedGenres };
    });
    setCurrentPage(1);
  };

  const clearFilters = () => {
    setFilters({
      title: "",
      minYear: null,
      maxYear: null,
      selectedGenres: [],
    });
    setCurrentPage(1);
  };

  const toggleFavorite = async (movieId: string) => {
    if (!userId) return;
    
    try {
      if (favorites.includes(movieId)) {
        await fetch(`/api/favorites/${movieId}`, {
          method: 'DELETE',
        });
        setFavorites(favorites.filter(id => id !== movieId));
      } else {
        await fetch('/api/favorites', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ titleId: movieId }),
        });
        setFavorites([...favorites, movieId]);
      }

      await fetch('/api/activities', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          titleId: movieId,
          activity: favorites.includes(movieId) ? 'remove_favorite' : 'add_favorite'
        }),
      });
    } catch (error) {
      console.error("Error updating favorites:", error);
    }
  };

  const toggleWatchLater = async (movieId: string) => {
    if (!userId) return;
    
    try {
      if (watchLater.includes(movieId)) {
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

      await fetch('/api/activities', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          titleId: movieId,
          activity: watchLater.includes(movieId) ? 'remove_watchlater' : 'add_watchlater'
        }),
      });
    } catch (error) {
      console.error("Error", error);
    }
  };

  const goToNextPage = () => {
    if (currentPage < totalPages) {
      setCurrentPage(currentPage + 1);
    }
  };

  const goToPreviousPage = () => {
    if (currentPage > 1) {
      setCurrentPage(currentPage - 1);
    }
  };

  if (status === "loading" || loading) {
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
    <div className="h-full">
      <div className="mb-8 p-6 bg-[#000050] rounded-lg">
        <h2 className="text-xl font-bold mb-4">Filter Movies</h2>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div>
            <label htmlFor="title-search" className="block mb-2">Title</label>
            <input
              id="title-search"
              type="text"
              value={filters.title}
              onChange={handleSearchChange}
              placeholder="Search by title..."
              className="w-full p-2 rounded-full bg-[#000030] border border-[#1ED2AF] focus:outline-none focus:ring-2 focus:ring-[#1ED2AF]"
            />
          </div>
          <div>
            <label className="block mb-2">Release Year</label>
            <div className="flex space-x-2">
              <input
                type="number"
                value={filters.minYear || ''}
                onChange={handleMinYearChange}
                placeholder="Min year"
                min={minAvailableYear || undefined}
                max={maxAvailableYear || undefined}
                className="w-full p-2 rounded-full bg-[#000030] border border-[#1ED2AF] focus:outline-none focus:ring-2 focus:ring-[#1ED2AF]"
              />
              <input
                type="number"
                value={filters.maxYear || ''}
                onChange={handleMaxYearChange}
                placeholder="Max year"
                min={minAvailableYear || undefined}
                max={maxAvailableYear || undefined}
                className="w-full p-2 rounded-full bg-[#000030] border border-[#1ED2AF] focus:outline-none focus:ring-2 focus:ring-[#1ED2AF]"
              />
            </div>
          </div>
          <div className="flex items-end">
            <button
              onClick={clearFilters}
              className="p-2 bg-[#1ED2AF] text-[#000030] rounded hover:bg-[#19b093] focus:outline-none focus:ring-2 focus:ring-[#1ED2AF]"
            >
              Clear Filters
            </button>
          </div>
        </div>
        <div className="mt-4">
          <label className="block mb-2">Genres</label>
          <div className="flex flex-wrap gap-2">
            {availableGenres.map((genre) => (
              <button
                key={genre}
                onClick={() => handleGenreToggle(genre)}
                className={`px-3 py-1 rounded-full text-sm ${
                  filters.selectedGenres.includes(genre)
                    ? 'bg-[#1ED2AF] text-[#000030]'
                    : 'bg-[#000030] text-white border border-[#1ED2AF]'
                }`}
              >
                {genre}
              </button>
            ))}
          </div>
        </div>
        <div className="mt-4 text-sm text-gray-400">
          Showing {filteredMovies.length} of {movies.length} movies
        </div>
      </div>
      <div>
        <h2 className="text-2xl font-bold mb-6">Movies</h2>
        
        {currentMovies.length === 0 ? (
          <div className="text-center py-12">
            <p className="text-lg text-gray-400">No movies match your search criteria.</p>
            <button 
              onClick={clearFilters}
              className="mt-4 p-2 bg-[#1ED2AF] text-[#000030] rounded hover:bg-[#19b093]"
            >
              Clear filters
            </button>
          </div>
        ) : (
          <>
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
              {currentMovies.map((movie) => (
                <div 
                  key={movie.id} 
                  className="group relative bg-[#000050] rounded-lg overflow-hidden shadow-lg hover:shadow-xl transition-shadow duration-300"
                >
                  <div className="aspect-w-2 aspect-h-3 relative">
                    <div className="w-full h-full bg-gradient-to-br from-[#000070] to-[#000030] flex items-center justify-center">
                      <span className="text-lg font-bold text-center px-4">{movie.title}</span>
                    </div>
                    <div className="absolute inset-0 bg-black bg-opacity-80 opacity-0 group-hover:opacity-100 transition-opacity duration-300 p-4 flex flex-col justify-between">
                      <div>
                        <h3 className="font-bold text-lg mb-2">{movie.title}</h3>
                        <p className="text-sm mb-2">{movie.released}</p>
                        <p className="text-sm mb-2">{movie.genre}</p>
                        <p className="text-sm text-gray-300 line-clamp-4">{movie.synopsis}</p>
                      </div>
                      <div className="flex justify-center space-x-4 mt-4">
                        <button 
                          onClick={(e) => {
                            e.stopPropagation();
                            toggleFavorite(movie.id);
                          }}
                          className="p-2 rounded-full bg-[#000040] hover:bg-[#000060]"
                          aria-label={favorites.includes(movie.id) ? "Remove from favorites" : "Add to favorites"}
                        >
                          <svg 
                            xmlns="http://www.w3.org/2000/svg" 
                            viewBox="0 0 24 24" 
                            fill={favorites.includes(movie.id) ? "#1ED2AF" : "none"} 
                            stroke="#1ED2AF" 
                            className="w-6 h-6"
                          >
                            <path 
                              strokeLinecap="round" 
                              strokeLinejoin="round" 
                              strokeWidth={2} 
                              d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z" 
                            />
                          </svg>
                        </button>
                        
                        <button 
                          onClick={(e) => {
                            e.stopPropagation();
                            toggleWatchLater(movie.id);
                          }}
                          className="p-2 rounded-full bg-[#000040] hover:bg-[#000060]"
                          aria-label={watchLater.includes(movie.id) ? "Remove from watch later" : "Add to watch later"}
                        >
                          <svg 
                            xmlns="http://www.w3.org/2000/svg" 
                            viewBox="0 0 24 24" 
                            fill={watchLater.includes(movie.id) ? "#1ED2AF" : "none"} 
                            stroke="#1ED2AF" 
                            className="w-6 h-6"
                          >
                            <path 
                              strokeLinecap="round" 
                              strokeLinejoin="round" 
                              strokeWidth={2} 
                              d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" 
                            />
                          </svg>
                        </button>
                      </div>
                    </div>
                  </div>
                  <div className="p-4">
                    <h3 className="font-bold text-lg mb-1 truncate">{movie.title}</h3>
                    <p className="text-sm text-gray-300">{movie.released} • {movie.genre}</p>
                  </div>
                </div>
              ))}
            </div>
            <div className="mt-8 flex justify-between items-center">
              <div className="text-sm text-gray-400">
                Showing {(currentPage - 1) * moviesPerPage + 1} to {Math.min(currentPage * moviesPerPage, filteredMovies.length)} of {filteredMovies.length} movies
              </div>
              
              <div className="flex space-x-2">
                <button
                  onClick={goToPreviousPage}
                  disabled={currentPage === 1}
                  className={`px-4 py-2 rounded ${
                    currentPage === 1
                      ? 'bg-[#000040] text-gray-500 cursor-not-allowed'
                      : 'bg-[#1ED2AF] text-[#000030] hover:bg-[#19b093]'
                  }`}
                >
                  Previous
                </button>
                
                <button
                  onClick={goToNextPage}
                  disabled={currentPage === totalPages}
                  className={`px-4 py-2 rounded ${
                    currentPage === totalPages
                      ? 'bg-[#000040] text-gray-500 cursor-not-allowed'
                      : 'bg-[#1ED2AF] text-[#000030] hover:bg-[#19b093]'
                  }`}
                >
                  Next
                </button>
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
