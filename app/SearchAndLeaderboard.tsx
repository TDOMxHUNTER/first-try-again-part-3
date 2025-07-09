
'use client';
import React, { useState, useEffect } from 'react';
import './SearchAndLeaderboard.css';

interface SearchResult {
  name: string;
  title: string;
  handle: string;
  avatarUrl: string;
  searchCount: number;
}

interface SearchAndLeaderboardProps {
  onProfileSelect: (profile: SearchResult) => void;
}

// Default fallback avatar
const DEFAULT_AVATAR = "https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=150&h=150&fit=crop&crop=face";

// Mock database of users - in a real app, this would come from an API
const mockUsers: SearchResult[] = [
  {
    name: "Berzan",
    title: "Co-founder & CEO of monda exchange",
    handle: "berzanorg",
    avatarUrl: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&h=150&fit=crop&crop=face",
    searchCount: 0
  },
  {
    name: "Alex Johnson",
    title: "Full Stack Developer",
    handle: "alexdev",
    avatarUrl: "https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=150&h=150&fit=crop&crop=face",
    searchCount: 0
  },
  {
    name: "Sarah Chen",
    title: "UI/UX Designer",
    handle: "sarahdesigns",
    avatarUrl: "https://images.unsplash.com/photo-1494790108755-2616b612b1fe?w=150&h=150&fit=crop&crop=face",
    searchCount: 0
  },
  {
    name: "Mike Rodriguez",
    title: "Blockchain Engineer",
    handle: "mikechain",
    avatarUrl: "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=150&h=150&fit=crop&crop=face",
    searchCount: 0
  },
  {
    name: "Emma Wilson",
    title: "Product Manager",
    handle: "emmaprod",
    avatarUrl: "https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=150&h=150&fit=crop&crop=face",
    searchCount: 0
  },
  {
    name: "David Kim",
    title: "Data Scientist",
    handle: "daviddata",
    avatarUrl: "https://images.unsplash.com/photo-1507591064344-4c6ce005b128?w=150&h=150&fit=crop&crop=face",
    searchCount: 0
  },
  {
    name: "Lisa Anderson",
    title: "DevOps Engineer",
    handle: "lisaops",
    avatarUrl: "https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=150&h=150&fit=crop&crop=face",
    searchCount: 0
  },
  {
    name: "James Miller",
    title: "Security Expert",
    handle: "jamessec",
    avatarUrl: "https://images.unsplash.com/photo-1519244703995-f4e0f30006d5?w=150&h=150&fit=crop&crop=face",
    searchCount: 0
  },
  {
    name: "Rachel Green",
    title: "Frontend Developer",
    handle: "rachelfrontend",
    avatarUrl: "https://images.unsplash.com/photo-1517841905240-472988babdf9?w=150&h=150&fit=crop&crop=face",
    searchCount: 0
  },
  {
    name: "Tom Brown",
    title: "Backend Developer",
    handle: "tombackend",
    avatarUrl: "https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?w=150&h=150&fit=crop&crop=face",
    searchCount: 0
  },
  {
    name: "Anna Davis",
    title: "Mobile Developer",
    handle: "annamobile",
    avatarUrl: "https://images.unsplash.com/photo-1487412720507-e7ab37603c6f?w=150&h=150&fit=crop&crop=face",
    searchCount: 0
  },
  {
    name: "Chris Taylor",
    title: "AI Engineer",
    handle: "chrisai",
    avatarUrl: "https://images.unsplash.com/photo-1492562080023-ab3db95bfbce?w=150&h=150&fit=crop&crop=face",
    searchCount: 0
  }
];

const SearchAndLeaderboard: React.FC<SearchAndLeaderboardProps> = ({ onProfileSelect }) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<SearchResult[]>([]);
  const [showResults, setShowResults] = useState(false);
  const [showLeaderboard, setShowLeaderboard] = useState(false);
  const [showPanel, setShowPanel] = useState(false);
  const [users, setUsers] = useState<SearchResult[]>([]);

  // Initialize users without any localStorage interaction
  useEffect(() => {
    // Clear any existing localStorage data
    localStorage.removeItem('profileSearchCounts');
    localStorage.removeItem('profileData');
    localStorage.removeItem('userProfiles');
    
    // Reset all users to default state
    const resetUsers = mockUsers.map(user => ({
      ...user,
      searchCount: 0
    }));
    setUsers(resetUsers);
  }, []);

  const handleSearch = (query: string) => {
    setSearchQuery(query);
    if (query.trim()) {
      const filtered = users.filter(user =>
        user.name.toLowerCase().includes(query.toLowerCase()) ||
        user.handle.toLowerCase().includes(query.toLowerCase()) ||
        user.title.toLowerCase().includes(query.toLowerCase())
      );
      setSearchResults(filtered);
      setShowResults(true);
    } else {
      setSearchResults([]);
      setShowResults(false);
    }
  };

  const handleProfileClick = (profile: SearchResult) => {
    // Increment search count
    setUsers(prevUsers =>
      prevUsers.map(user =>
        user.handle === profile.handle
          ? { ...user, searchCount: user.searchCount + 1 }
          : user
      )
    );

    // Update the profile with new search count for the callback
    const updatedProfile = {
      ...profile,
      searchCount: profile.searchCount + 1
    };

    onProfileSelect(updatedProfile);
    setSearchQuery('');
    setShowResults(false);
  };

  const getTopSearchedProfiles = () => {
    return users
      .filter(user => user.searchCount > 0)
      .sort((a, b) => b.searchCount - a.searchCount)
      .slice(0, 10);
  };

  const deleteSavedProfiles = (handles: string[]) => {
    const savedProfiles = JSON.parse(localStorage.getItem('userProfiles') || '[]');

    // Filter out profiles with specified handles
    const updatedProfiles = savedProfiles.filter((profile: SearchResult) =>
      !handles.includes(profile.handle)
    );

    // Update local storage with the new list
    localStorage.setItem('userProfiles', JSON.stringify(updatedProfiles));
  };

  useEffect(() => {
    deleteSavedProfiles(['berzanorg', 'mikechain', 'tombackend', 'annamobile']);
  }, []);

  return (
    <div className="search-leaderboard-container">
      {/* Toggle Button */}
      <button
        className="search-toggle-btn"
        onClick={() => setShowPanel(!showPanel)}
        title="Search & Leaderboard"
      >
        🔍
      </button>

      {/* Search and Leaderboard Panel */}
      {showPanel && (
        <div className="search-leaderboard-panel">
          <div className="panel-header">
            <h3>Search & Leaderboard</h3>
            <button
              className="close-panel"
              onClick={() => setShowPanel(false)}
            >
              ✕
            </button>
          </div>

          {/* Search Section */}
          <div className="search-section">
            <div className="search-input-container">
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => handleSearch(e.target.value)}
                placeholder="Search profiles..."
                className="search-input"
              />
              <div className="search-icon">🔍</div>
            </div>
            
            {showResults && searchResults.length > 0 && (
              <div className="search-results">
                {searchResults.map((profile) => (
                  <div
                    key={profile.handle}
                    className="search-result-item"
                    onClick={() => handleProfileClick(profile)}
                  >
                    <img
                      src={profile.avatarUrl}
                      alt={profile.name}
                      className="search-result-avatar"
                      onError={(e) => {
                        const target = e.target as HTMLImageElement;
                        target.src = DEFAULT_AVATAR;
                      }}
                    />
                    <div className="search-result-info">
                      <div className="search-result-name">{profile.name}</div>
                      <div className="search-result-handle">@{profile.handle}</div>
                      <div className="search-result-title">{profile.title}</div>
                    </div>
                    <div className="search-count">
                      {profile.searchCount} searches
                    </div>
                  </div>
                ))}
              </div>
            )}

            {showResults && searchResults.length === 0 && searchQuery.trim() && (
              <div className="no-results">
                No profiles found for "{searchQuery}"
              </div>
            )}
          </div>

          {/* Leaderboard Toggle Button */}
          <button
            className="leaderboard-toggle"
            onClick={() => setShowLeaderboard(!showLeaderboard)}
          >
            🏆 {showLeaderboard ? 'Hide' : 'Show'} Leaderboard
          </button>

          {/* Leaderboard Section */}
          {showLeaderboard && (
            <div className="leaderboard-section">
              <div className="leaderboard-list">
                {getTopSearchedProfiles().length > 0 ? (
                  getTopSearchedProfiles().map((profile, index) => (
                    <div
                      key={profile.handle}
                      className={`leaderboard-item rank-${index + 1}`}
                      onClick={() => handleProfileClick(profile)}
                    >
                      <div className="rank-number">#{index + 1}</div>
                      <img
                        src={profile.avatarUrl}
                        alt={profile.name}
                        className="leaderboard-avatar"
                        onError={(e) => {
                          const target = e.target as HTMLImageElement;
                          target.src = DEFAULT_AVATAR;
                        }}
                      />
                      <div className="leaderboard-info">
                        <div className="leaderboard-name">{profile.name}</div>
                        <div className="leaderboard-handle">@{profile.handle}</div>
                      </div>
                      <div className="search-count-badge">
                        {profile.searchCount}
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="no-searches">
                    No searches yet. Start searching for profiles!
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default SearchAndLeaderboard;
