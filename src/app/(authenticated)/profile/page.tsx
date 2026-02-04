'use client';

import { useState } from 'react';
import { useAuth } from '@/components/AuthProvider';
import { updateProfile, updatePrivateData } from '@/lib/api';
import { PhotoUploader } from '@/components/profile';

const PLAYING_STYLES = [
  { id: 'adventurous', icon: '🏔️', label: 'Adventurous' },
  { id: 'chill', icon: '😌', label: 'Chill' },
  { id: 'spontaneous', icon: '✨', label: 'Spontaneous' },
  { id: 'creative', icon: '🎨', label: 'Creative' },
  { id: 'competitive', icon: '🏆', label: 'Competitive' },
  { id: 'romantic', icon: '💕', label: 'Romantic' },
];

const INTERESTS = [
  { id: 'movies', icon: '🎬', label: 'Movies' },
  { id: 'music', icon: '🎵', label: 'Music' },
  { id: 'gaming', icon: '🎮', label: 'Gaming' },
  { id: 'coffee', icon: '☕', label: 'Coffee' },
  { id: 'hiking', icon: '🥾', label: 'Hiking' },
  { id: 'photography', icon: '📸', label: 'Photography' },
  { id: 'travel', icon: '✈️', label: 'Travel' },
  { id: 'food', icon: '🍜', label: 'Food' },
  { id: 'art', icon: '🖼️', label: 'Art' },
  { id: 'reading', icon: '📚', label: 'Reading' },
  { id: 'fitness', icon: '💪', label: 'Fitness' },
  { id: 'cooking', icon: '👨‍🍳', label: 'Cooking' },
];

export default function Profile() {
  const { user, updateUser } = useAuth();
  const [displayName, setDisplayName] = useState(user?.display_name || '');
  const [bio, setBio] = useState(user?.bio || '');
  const [playingStyle, setPlayingStyle] = useState<string[]>(user?.playing_style || []);
  const [interests, setInterests] = useState<string[]>(user?.interests || []);
  const [realName, setRealName] = useState(user?.real_name || '');
  const [occupation, setOccupation] = useState(user?.occupation || '');
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState('');

  const toggleItem = (item: string, list: string[], setList: (items: string[]) => void) => {
    if (list.includes(item)) {
      setList(list.filter((i) => i !== item));
    } else {
      setList([...list, item]);
    }
  };

  const handleSave = async () => {
    setSaving(true);
    setMessage('');

    try {
      await updateProfile({
        display_name: displayName,
        bio,
        playing_style: playingStyle,
        interests,
      });

      const privateRes = await updatePrivateData({
        real_name: realName,
        occupation,
      });

      updateUser(privateRes.data);
      setMessage('Profile saved successfully!');
    } catch (error) {
      setMessage('Failed to save profile');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="max-w-2xl mx-auto">
      <div className="mb-8 animate-slide-up">
        <h1 className="text-3xl font-extrabold gradient-text">Your Profile</h1>
        <p className="text-gray-500 mt-2">Customize how others see you ✨</p>
      </div>

      {message && (
        <div
          className={`p-4 rounded-xl mb-6 flex items-center gap-3 animate-bounce-in ${
            message.includes('success')
              ? 'bg-green-50 text-green-600 border border-green-100'
              : 'bg-red-50 text-red-600 border border-red-100'
          }`}
        >
          {message.includes('success') ? (
            <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd"/>
            </svg>
          ) : (
            <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd"/>
            </svg>
          )}
          {message}
        </div>
      )}

      <div className="card mb-6 animate-slide-up-elastic" style={{ animationDelay: '0.1s' }}>
        <div className="flex items-center gap-4 mb-6">
          <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-purple-500 to-rose-500 flex items-center justify-center shadow-lg">
            <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
            </svg>
          </div>
          <div>
            <h2 className="font-bold text-xl text-gray-800">Public Profile</h2>
            <p className="text-sm text-gray-500">Visible to your matches</p>
          </div>
        </div>

        <div className="space-y-5">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Display Name
            </label>
            <input
              type="text"
              value={displayName}
              onChange={(e) => setDisplayName(e.target.value)}
              className="input"
              placeholder="Your display name"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Bio
            </label>
            <textarea
              value={bio}
              onChange={(e) => setBio(e.target.value)}
              className="input min-h-[100px] resize-none"
              placeholder="Tell others about yourself..."
            />
          </div>

          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-3">
              Playing Style 🎮
            </label>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
              {PLAYING_STYLES.map((style) => (
                <button
                  key={style.id}
                  type="button"
                  onClick={() => toggleItem(style.id, playingStyle, setPlayingStyle)}
                  className={`flex items-center gap-2 px-4 py-3.5 rounded-2xl text-sm font-semibold transition-all duration-300 border-2 ${
                    playingStyle.includes(style.id)
                      ? 'bg-gradient-to-r from-purple-500 to-rose-500 text-white border-transparent shadow-lg scale-105'
                      : 'bg-gray-50/80 text-gray-700 border-transparent hover:bg-purple-50 hover:border-purple-200 hover:text-purple-700 hover:scale-[1.02]'
                  }`}
                >
                  <span className="text-xl">{style.icon}</span>
                  {style.label}
                </button>
              ))}
            </div>
          </div>

          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-3">
              Interests 💫
            </label>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
              {INTERESTS.map((interest) => (
                <button
                  key={interest.id}
                  type="button"
                  onClick={() => toggleItem(interest.id, interests, setInterests)}
                  className={`flex items-center gap-2 px-4 py-3.5 rounded-2xl text-sm font-semibold transition-all duration-300 border-2 ${
                    interests.includes(interest.id)
                      ? 'bg-gradient-to-r from-rose-500 to-orange-500 text-white border-transparent shadow-lg scale-105'
                      : 'bg-gray-50/80 text-gray-700 border-transparent hover:bg-rose-50 hover:border-rose-200 hover:text-rose-700 hover:scale-[1.02]'
                  }`}
                >
                  <span className="text-xl">{interest.icon}</span>
                  {interest.label}
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>

      <div className="mb-6 animate-slide-up" style={{ animationDelay: '0.15s' }}>
        <PhotoUploader
          currentPhotoUrl={user?.photo_url}
          onSave={(url) => updateUser({ ...user!, photo_url: url })}
          onDelete={() => updateUser({ ...user!, photo_url: null })}
        />
      </div>

      <div className="card mb-6 animate-slide-up-elastic" style={{ animationDelay: '0.2s' }}>
        <div className="flex items-center gap-4 mb-6">
          <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-amber-400 to-orange-500 flex items-center justify-center shadow-lg">
            <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
            </svg>
          </div>
          <div>
            <h2 className="font-bold text-xl text-gray-800">Private Information 🔐</h2>
            <p className="text-sm text-gray-500">Unlocked through intimacy levels</p>
          </div>
        </div>

        <div className="space-y-5">
          <div>
            <div className="flex items-center gap-2 mb-2">
              <label className="text-sm font-semibold text-gray-700">Real Name</label>
              <span className="unlock-badge">🔓 Level 1</span>
            </div>
            <input
              type="text"
              value={realName}
              onChange={(e) => setRealName(e.target.value)}
              className="input"
              placeholder="Your real name"
            />
          </div>

          <div>
            <div className="flex items-center gap-2 mb-2">
              <label className="text-sm font-semibold text-gray-700">Occupation</label>
              <span className="badge-paradise">🔓 Level 3</span>
            </div>
            <input
              type="text"
              value={occupation}
              onChange={(e) => setOccupation(e.target.value)}
              className="input"
              placeholder="What do you do?"
            />
          </div>
        </div>
      </div>

      <button
        onClick={handleSave}
        disabled={saving}
        className="btn-primary w-full animate-slide-up-elastic"
        style={{ animationDelay: '0.3s' }}
      >
        {saving ? (
          <span className="flex items-center justify-center gap-2">
            <svg className="animate-spin h-5 w-5" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none"/>
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"/>
            </svg>
            Saving...
          </span>
        ) : (
          <span className="flex items-center justify-center gap-2">
            ✨ Save Profile
          </span>
        )}
      </button>
    </div>
  );
}
