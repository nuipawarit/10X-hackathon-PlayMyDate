import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { getMatches, findMatches } from '../services/api';

interface Match {
  match: {
    id: string;
    compatibility_score: number;
    status: string;
    created_at: string;
  };
  partner: {
    id: string;
    display_name: string | null;
    playing_style: string[];
    interests: string[];
    bio: string | null;
  };
}

function SkeletonCard() {
  return (
    <div className="card">
      <div className="flex items-center gap-4">
        <div className="skeleton w-16 h-16 rounded-full" />
        <div className="flex-1 space-y-3">
          <div className="skeleton h-5 w-32" />
          <div className="skeleton h-4 w-48" />
          <div className="flex gap-2">
            <div className="skeleton h-6 w-16 rounded-full" />
            <div className="skeleton h-6 w-16 rounded-full" />
          </div>
        </div>
        <div className="text-right space-y-2">
          <div className="skeleton h-6 w-12 ml-auto" />
          <div className="skeleton h-3 w-16" />
        </div>
      </div>
    </div>
  );
}

export default function Matches() {
  const [matches, setMatches] = useState<Match[]>([]);
  const [loading, setLoading] = useState(true);
  const [finding, setFinding] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'info'; text: string } | null>(null);

  useEffect(() => {
    loadMatches();
  }, []);

  useEffect(() => {
    if (message) {
      const timer = setTimeout(() => setMessage(null), 4000);
      return () => clearTimeout(timer);
    }
  }, [message]);

  const loadMatches = async () => {
    try {
      const response = await getMatches();
      setMatches(response.data);
    } catch (error) {
      console.error('Failed to load matches:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleFindMatches = async () => {
    setFinding(true);
    setMessage(null);
    try {
      const prevCount = matches.length;
      const response = await findMatches();
      await loadMatches();

      const newMatchCount = response.data.length;
      if (newMatchCount > 0) {
        setMessage({ type: 'success', text: `Found ${newMatchCount} new match${newMatchCount > 1 ? 'es' : ''}!` });
      } else if (prevCount === matches.length) {
        setMessage({ type: 'info', text: 'No new matches found. Try updating your profile!' });
      }
    } catch (error) {
      console.error('Failed to find matches:', error);
      setMessage({ type: 'info', text: 'Failed to search for matches. Please try again.' });
    } finally {
      setFinding(false);
    }
  };

  if (loading) {
    return (
      <div>
        <div className="flex items-center justify-between mb-6">
          <div className="skeleton h-8 w-40" />
          <div className="skeleton h-10 w-40 rounded-xl" />
        </div>
        <div className="space-y-4">
          <SkeletonCard />
          <SkeletonCard />
          <SkeletonCard />
        </div>
      </div>
    );
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-800">Your Matches</h1>
          <p className="text-sm text-gray-500 mt-1">Connect through shared activities</p>
        </div>
        <button
          onClick={handleFindMatches}
          disabled={finding}
          className="btn-accent flex items-center gap-2"
        >
          {finding ? (
            <>
              <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none"/>
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"/>
              </svg>
              Finding...
            </>
          ) : (
            <>
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
              Find Matches
            </>
          )}
        </button>
      </div>

      {message && (
        <div
          className={`mb-6 p-4 rounded-xl flex items-center gap-3 animate-slide-up ${
            message.type === 'success'
              ? 'bg-green-50 text-green-700 border border-green-100'
              : 'bg-blue-50 text-blue-700 border border-blue-100'
          }`}
        >
          {message.type === 'success' ? (
            <svg className="w-5 h-5 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd"/>
            </svg>
          ) : (
            <svg className="w-5 h-5 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd"/>
            </svg>
          )}
          {message.text}
        </div>
      )}

      {matches.length === 0 ? (
        <div className="card text-center py-16 animate-fade-in">
          <div className="w-20 h-20 mx-auto mb-6 rounded-full bg-gradient-to-br from-primary-100 to-secondary-100 flex items-center justify-center">
            <svg className="w-10 h-10 text-primary-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
            </svg>
          </div>
          <h3 className="text-lg font-semibold text-gray-800 mb-2">No matches yet</h3>
          <p className="text-gray-500 mb-6 max-w-sm mx-auto">
            Click "Find Matches" to discover people who share your interests and playing style
          </p>
          <button onClick={handleFindMatches} className="btn-primary">
            Start Discovering
          </button>
        </div>
      ) : (
        <div className="space-y-4">
          {matches.map(({ match, partner }, index) => (
            <Link
              key={match.id}
              to={`/matches/${match.id}`}
              className="card-hover block animate-slide-up"
              style={{ animationDelay: `${index * 0.1}s` }}
            >
              <div className="flex items-center gap-4">
                <div className="avatar w-16 h-16 text-2xl">
                  {partner.display_name?.[0]?.toUpperCase() || '?'}
                </div>
                <div className="flex-1 min-w-0">
                  <h3 className="font-semibold text-lg text-gray-800">
                    {partner.display_name || 'Anonymous'}
                  </h3>
                  <p className="text-sm text-gray-500 line-clamp-1">
                    {partner.bio || 'Ready to connect through activities'}
                  </p>
                  <div className="flex flex-wrap gap-2 mt-2">
                    {partner.interests.slice(0, 3).map((interest) => (
                      <span
                        key={interest}
                        className="text-xs bg-primary-50 text-primary-600 px-2.5 py-1 rounded-full"
                      >
                        {interest}
                      </span>
                    ))}
                    {partner.interests.length > 3 && (
                      <span className="text-xs text-gray-400">
                        +{partner.interests.length - 3} more
                      </span>
                    )}
                  </div>
                </div>
                <div className="text-right flex-shrink-0">
                  <div className="relative w-14 h-14">
                    <svg className="w-14 h-14 transform -rotate-90">
                      <circle
                        cx="28"
                        cy="28"
                        r="24"
                        stroke="currentColor"
                        strokeWidth="4"
                        fill="none"
                        className="text-gray-100"
                      />
                      <circle
                        cx="28"
                        cy="28"
                        r="24"
                        stroke="url(#gradient)"
                        strokeWidth="4"
                        fill="none"
                        strokeLinecap="round"
                        strokeDasharray={`${(Math.round(Number(match.compatibility_score)) / 100) * 150.8} 150.8`}
                        className="transition-all duration-1000"
                      />
                      <defs>
                        <linearGradient id="gradient" x1="0%" y1="0%" x2="100%" y2="0%">
                          <stop offset="0%" stopColor="#a855f7" />
                          <stop offset="100%" stopColor="#14b8a6" />
                        </linearGradient>
                      </defs>
                    </svg>
                    <div className="absolute inset-0 flex items-center justify-center">
                      <span className="text-sm font-bold text-gray-700">
                        {Math.round(Number(match.compatibility_score))}%
                      </span>
                    </div>
                  </div>
                  <div className="text-xs text-gray-400 mt-1">match</div>
                </div>
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
