// app/contributors/page.tsx
'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { collection, query, orderBy, getDocs } from 'firebase/firestore';
import { db } from '@/lib/firebase/config';

interface Contributor {
  id: string;
  displayName: string;
  email: string;
  contributionCount: number;
  totalViews: number;
  earnings: number;
  followers: number;
  joinedDate: string;
  lastActive: string;
  socialMedia?: {
    twitter?: string;
    facebook?: string;
    instagram?: string;
    linkedin?: string;
    website?: string;
  };
}

export default function ContributorsPage() {
  const [contributors, setContributors] = useState<Contributor[]>([]);
  const [sortBy, setSortBy] = useState<'articles' | 'views' | 'earnings' | 'followers'>('articles');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchContributors = async () => {
      setLoading(true);
      try {
        let contributorsQuery;
        
        switch (sortBy) {
          case 'views':
            contributorsQuery = query(collection(db, 'contributors'), orderBy('totalViews', 'desc'));
            break;
          case 'earnings':
            contributorsQuery = query(collection(db, 'contributors'), orderBy('earnings', 'desc'));
            break;
          case 'followers':
            contributorsQuery = query(collection(db, 'contributors'), orderBy('followers', 'desc'));
            break;
          default:
            contributorsQuery = query(collection(db, 'contributors'), orderBy('contributionCount', 'desc'));
        }

        const contributorsSnapshot = await getDocs(contributorsQuery);
        const contributorsData = contributorsSnapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data()
        })) as Contributor[];
        
        setContributors(contributorsData);
      } catch (error) {
        console.error('Error fetching contributors:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchContributors();
  }, [sortBy]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-gray-50 to-gray-100">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">Contributors</h1>
          <p className="text-gray-600 mt-2">Manage and view all content contributors</p>
        </div>

        {/* Sort Controls */}
        <div className="bg-white rounded-xl p-6 shadow-lg border border-gray-100 mb-6">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-semibold text-gray-800">Sort By</h2>
            <div className="flex space-x-2">
              <button
                onClick={() => setSortBy('articles')}
                className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                  sortBy === 'articles'
                    ? 'bg-blue-100 text-blue-700'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                Articles
              </button>
              <button
                onClick={() => setSortBy('views')}
                className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                  sortBy === 'views'
                    ? 'bg-blue-100 text-blue-700'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                Views
              </button>
              <button
                onClick={() => setSortBy('earnings')}
                className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                  sortBy === 'earnings'
                    ? 'bg-blue-100 text-blue-700'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                Earnings
              </button>
              <button
                onClick={() => setSortBy('followers')}
                className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                  sortBy === 'followers'
                    ? 'bg-blue-100 text-blue-700'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                Followers
              </button>
            </div>
          </div>
        </div>

        {/* Contributors Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {contributors.map((contributor) => (
            <div key={contributor.id} className="bg-white rounded-xl p-6 shadow-lg border border-gray-100 hover:shadow-xl transition-shadow">
              <div className="text-center">
                <div className="w-20 h-20 bg-gradient-to-r from-blue-400 to-purple-500 rounded-full flex items-center justify-center text-white text-2xl font-bold mx-auto mb-4">
                  {contributor.displayName?.[0]?.toUpperCase() || 'C'}
                </div>
                <h2 className="text-xl font-semibold text-gray-900 mb-2">{contributor.displayName}</h2>
                <p className="text-gray-600 text-sm mb-4">{contributor.email}</p>
                
                <div className="grid grid-cols-2 gap-4 mb-4">
                  <div className="text-center">
                    <div className="text-2xl font-bold text-blue-600">{contributor.contributionCount}</div>
                    <div className="text-sm text-gray-600">Articles</div>
                  </div>
                  <div className="text-center">
                    <div className="text-2xl font-bold text-green-600">{contributor.totalViews?.toLocaleString()}</div>
                    <div className="text-sm text-gray-600">Views</div>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4 mb-6">
                  <div className="text-center">
                    <div className="text-xl font-bold text-yellow-600">${contributor.earnings?.toLocaleString()}</div>
                    <div className="text-sm text-gray-600">Earnings</div>
                  </div>
                  <div className="text-center">
                    <div className="text-xl font-bold text-purple-600">{contributor.followers?.toLocaleString()}</div>
                    <div className="text-sm text-gray-600">Followers</div>
                  </div>
                </div>

                <div className="flex justify-center space-x-3 mb-4">
                  {contributor.socialMedia?.twitter && (
                    <a href={contributor.socialMedia.twitter} className="text-gray-400 hover:text-blue-400">
                      <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                        <path d="M8.29 20.251c7.547 0 11.675-6.253 11.675-11.675 0-.178 0-.355-.012-.53A8.348 8.348 0 0022 5.92a8.19 8.19 0 01-2.357.646 4.118 4.118 0 001.804-2.27 8.224 8.224 0 01-2.605.996 4.107 4.107 0 00-6.993 3.743 11.65 11.65 0 01-8.457-4.287 4.106 4.106 0 001.27 5.477A4.072 4.072 0 012.8 9.713v.052a4.105 4.105 0 003.292 4.022 4.095 4.095 0 01-1.853.07 4.108 4.108 0 003.834 2.85A8.233 8.233 0 012 18.407a11.616 11.616 0 006.29 1.84"/>
                      </svg>
                    </a>
                  )}
                  {contributor.socialMedia?.linkedin && (
                    <a href={contributor.socialMedia.linkedin} className="text-gray-400 hover:text-blue-600">
                      <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                        <path d="M19 0h-14c-2.761 0-5 2.239-5 5v14c0 2.761 2.239 5 5 5h14c2.762 0 5-2.239 5-5v-14c0-2.761-2.238-5-5-5zm-11 19h-3v-11h3v11zm-1.5-12.268c-.966 0-1.75-.79-1.75-1.764s.784-1.764 1.75-1.764 1.75.79 1.75 1.764-.783 1.764-1.75 1.764zm13.5 12.268h-3v-5.604c0-3.368-4-3.113-4 0v5.604h-3v-11h3v1.765c1.396-2.586 7-2.777 7 2.476v6.759z"/>
                      </svg>
                    </a>
                  )}
                </div>

                <Link
                  href={`/contributors/${contributor.id}/articles`}
                  className="inline-block px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-sm font-medium"
                >
                  View Articles
                </Link>
              </div>
            </div>
          ))}
        </div>

        {contributors.length === 0 && (
          <div className="text-center py-12">
            <div className="text-gray-400 text-6xl mb-4">👥</div>
            <h3 className="text-lg font-medium text-gray-900 mb-2">No contributors found</h3>
            <p className="text-gray-600">There are no contributors in the system yet.</p>
          </div>
        )}
      </div>
    </div>
  );
}