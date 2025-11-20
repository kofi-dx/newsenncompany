/* eslint-disable @next/next/no-img-element */
/* eslint-disable @typescript-eslint/no-explicit-any */
// app/contributors/[id]/articles/page.tsx
'use client';

import { useState, useEffect } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import { collection, query, where, orderBy, getDocs, doc, getDoc } from 'firebase/firestore';
import { db } from '@/lib/firebase/config';

interface Article {
  id: string;
  title: string;
  views: number;
  author: string;
  authorName: string;
  createdAt: any;
  category: string;
  likes: number;
  comments: number;
  imageUrl: string;
  excerpt: string;
  status: string;
  isFeatured: boolean;
}

interface Contributor {
  id: string;
  displayName: string;
  email: string;
  contributionCount: number;
  totalViews: number;
  earnings: number;
  followers: number;
  joinedDate: string;
}

export default function ContributorArticlesPage() {
  const params = useParams();
  const contributorId = params.id as string;
  
  const [contributor, setContributor] = useState<Contributor | null>(null);
  const [articles, setArticles] = useState<Article[]>([]);
  const [loading, setLoading] = useState(true);
  const [sortBy, setSortBy] = useState<'date' | 'views' | 'likes'>('date');

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      try {
        // Fetch contributor details
        const contributorDoc = await getDoc(doc(db, 'contributors', contributorId));
        if (contributorDoc.exists()) {
          setContributor({ id: contributorDoc.id, ...contributorDoc.data() } as Contributor);
        }

        // Fetch contributor's articles
        let articlesQuery;
        
        switch (sortBy) {
          case 'views':
            articlesQuery = query(
              collection(db, 'articles'),
              where('authorId', '==', contributorId),
              orderBy('views', 'desc')
            );
            break;
          case 'likes':
            articlesQuery = query(
              collection(db, 'articles'),
              where('authorId', '==', contributorId),
              orderBy('likes', 'desc')
            );
            break;
          default:
            articlesQuery = query(
              collection(db, 'articles'),
              where('authorId', '==', contributorId),
              orderBy('createdAt', 'desc')
            );
        }

        const articlesSnapshot = await getDocs(articlesQuery);
        const articlesData = articlesSnapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data()
        })) as Article[];
        
        setArticles(articlesData);
      } catch (error) {
        console.error('Error fetching data:', error);
      } finally {
        setLoading(false);
      }
    };

    if (contributorId) {
      fetchData();
    }
  }, [contributorId, sortBy]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-gray-50 to-gray-100">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  if (!contributor) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-gray-50 to-gray-100">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-gray-900 mb-4">Contributor not found</h2>
          <Link href="/contributors" className="text-blue-600 hover:text-blue-700">
            ← Back to Contributors
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 p-6">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <Link href="/contributors" className="text-blue-600 hover:text-blue-700 mb-4 inline-block">
            ← Back to Contributors
          </Link>
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">{contributor.displayName}&apos;s Articles</h1>
              <p className="text-gray-600 mt-2">{contributor.contributionCount} articles • {contributor.totalViews} views</p>
            </div>
            <div className="flex items-center space-x-4">
              <span className="px-3 py-1 bg-green-100 text-green-800 rounded-full text-sm font-medium">
                ${contributor.earnings} earned
              </span>
              <span className="px-3 py-1 bg-purple-100 text-purple-800 rounded-full text-sm font-medium">
                {contributor.followers} followers
              </span>
            </div>
          </div>
        </div>

        {/* Sort Controls */}
        <div className="bg-white rounded-xl p-6 shadow-lg border border-gray-100 mb-6">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-semibold text-gray-800">Sort Articles By</h2>
            <div className="flex space-x-2">
              <button
                onClick={() => setSortBy('date')}
                className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                  sortBy === 'date'
                    ? 'bg-blue-100 text-blue-700'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                Date
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
                onClick={() => setSortBy('likes')}
                className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                  sortBy === 'likes'
                    ? 'bg-blue-100 text-blue-700'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                Likes
              </button>
            </div>
          </div>
        </div>

        {/* Articles List */}
        <div className="space-y-4">
          {articles.map((article) => (
            <div key={article.id} className="bg-white rounded-xl p-6 shadow-lg border border-gray-100 hover:shadow-xl transition-shadow">
              <div className="flex items-start">
                {article.imageUrl && (
                  <img 
                    src={article.imageUrl} 
                    alt={article.title}
                    className="w-24 h-24 object-cover rounded-lg"
                  />
                )}
                <div className="ml-6 flex-1">
                  <div className="flex items-start justify-between">
                    <div>
                      <h2 className="text-xl font-semibold text-gray-900 mb-2">{article.title}</h2>
                      <p className="text-gray-600 mb-4 line-clamp-2">{article.excerpt}</p>
                    </div>
                    <div className="flex items-center space-x-4">
                      <span className="px-2 py-1 bg-blue-100 text-blue-800 text-xs font-medium rounded-full">
                        {article.category}
                      </span>
                      {article.isFeatured && (
                        <span className="px-2 py-1 bg-yellow-100 text-yellow-800 text-xs font-medium rounded-full">
                          Featured
                        </span>
                      )}
                    </div>
                  </div>
                  
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-6 text-sm text-gray-600">
                      <span>{article.views} views</span>
                      <span>{article.likes} likes</span>
                      <span>{article.comments} comments</span>
                      <span className={`px-2 py-1 rounded-full text-xs ${
                        article.status === 'published' 
                          ? 'bg-green-100 text-green-800'
                          : article.status === 'draft'
                          ? 'bg-gray-100 text-gray-800'
                          : 'bg-yellow-100 text-yellow-800'
                      }`}>
                        {article.status}
                      </span>
                    </div>
                    <div className="text-sm text-gray-500">
                      {article.createdAt?.toDate?.()?.toLocaleDateString() || 'Unknown date'}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>

        {articles.length === 0 && (
          <div className="text-center py-12">
            <div className="text-gray-400 text-6xl mb-4">📝</div>
            <h3 className="text-lg font-medium text-gray-900 mb-2">No articles found</h3>
            <p className="text-gray-600">This contributor hasn&apos;t published any articles yet.</p>
          </div>
        )}
      </div>
    </div>
  );
}