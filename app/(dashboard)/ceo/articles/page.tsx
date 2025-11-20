/* eslint-disable @typescript-eslint/no-explicit-any */
// app/ceo/articles/page.tsx
'use client';

import { useState, useEffect } from 'react';
import { collection, getDocs, query, orderBy, where, limit } from 'firebase/firestore';
import { db } from '@/lib/firebase/config';

interface Article {
  id: string;
  title: string;
  authorName: string;
  authorId: string;
  views: number;
  likes: number;
  comments: number;
  earnings: number;
  category: string;
  status: string;
  createdAt: Date;
  featured: boolean;
  isBlog: boolean;
  safetyLevel: string;
}

interface Contributor {
  id: string;
  name: string;
  email: string;
  totalArticles: number;
  totalViews: number;
  totalEarnings: number;
  joinDate: Date;
  followers: number;
  contributionCount: number;
}

// Format article from Firestore (same as newsenn.com)
const formatArticleFromFirestore = (doc: any): Article => {
  const data = doc.data();
  const submittedAt = data.submittedAt?.toDate();
  
  return {
    id: doc.id,
    title: data.title,
    authorName: data.username || "Anonymous",
    authorId: data.authorId,
    views: data.views || 0,
    likes: data.likes || 0,
    comments: data.comments || 0,
    earnings: data.earnings || 0,
    category: data.category || "General",
    status: data.status || "submitted",
    createdAt: submittedAt || data.createdAt?.toDate() || new Date(),
    featured: data.featured || data.isFeatured || false,
    isBlog: data.isBlog || false,
    safetyLevel: data.safetyLevel || 'warm'
  };
};

// Get approved articles (same as newsenn.com)
const getApprovedArticles = async (): Promise<Article[]> => {
  const articlesRef = collection(db, "articles");
  const q = query(
    articlesRef,
    where("status", "==", "approved"),
    orderBy("submittedAt", "desc")
  );
  
  const articlesSnap = await getDocs(q);
  return articlesSnap.docs.map(formatArticleFromFirestore);
};

// Get top contributors (same as newsenn.com)
const getTopContributors = async (limitCount: number = 50): Promise<Contributor[]> => {
  try {
    const contributorsRef = collection(db, "contributors");
    const q = query(
      contributorsRef,
      where("status", "==", "active"),
      orderBy("contributionCount", "desc"),
      limit(limitCount)
    );
    
    const contributorsSnap = await getDocs(q);
    const contributors: Contributor[] = [];

    for (const doc of contributorsSnap.docs) {
      const data = doc.data();
      
      // Get contributor's articles
      const articlesRef = collection(db, "articles");
      const articlesQuery = query(
        articlesRef,
        where("authorId", "==", doc.id),
        where("status", "==", "approved")
      );
      
      const articlesSnap = await getDocs(articlesQuery);
      const articles = articlesSnap.docs.map(formatArticleFromFirestore);
      
      const totalViews = articles.reduce((sum, article) => sum + (article.views || 0), 0);
      const totalEarnings = articles.reduce((sum, article) => sum + (article.earnings || 0), 0);
      const contributionCount = articles.length;
      
      contributors.push({
        id: doc.id,
        name: data.username || data.name || "Anonymous Contributor",
        email: data.email,
        totalArticles: contributionCount,
        totalViews,
        totalEarnings,
        joinDate: data.createdAt?.toDate() || new Date(),
        followers: data.followers || 0,
        contributionCount
      });
    }

    return contributors.sort((a, b) => b.totalEarnings - a.totalEarnings);
  } catch (error) {
    console.error('Error fetching top contributors:', error);
    return [];
  }
};

export default function CEOArticles() {
  const [articles, setArticles] = useState<Article[]>([]);
  const [contributors, setContributors] = useState<Contributor[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'articles' | 'contributors'>('articles');

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const [articlesData, contributorsData] = await Promise.all([
        getApprovedArticles(),
        getTopContributors(50)
      ]);

      setArticles(articlesData);
      setContributors(contributorsData);
    } catch (error) {
      console.error('Error fetching data:', error);
    } finally {
      setLoading(false);
    }
  };

  const getSafetyLevelColor = (level: string) => {
    switch (level) {
      case 'safe': return 'bg-green-100 text-green-800';
      case 'warm': return 'bg-yellow-100 text-yellow-800';
      case 'caution': return 'bg-orange-100 text-orange-800';
      case 'harmful': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div>
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900">Content & Contributors</h1>
        <p className="text-gray-600 mt-2">Manage articles and track contributor performance</p>
      </div>

      {/* Tabs */}
      <div className="bg-white rounded-lg shadow-sm border mb-6">
        <div className="flex border-b">
          <button
            onClick={() => setActiveTab('articles')}
            className={`flex-1 py-4 font-semibold text-center ${
              activeTab === 'articles'
                ? 'text-blue-600 border-b-2 border-blue-600'
                : 'text-gray-500 hover:text-gray-700'
            }`}
          >
            All Articles ({articles.length})
          </button>
          <button
            onClick={() => setActiveTab('contributors')}
            className={`flex-1 py-4 font-semibold text-center ${
              activeTab === 'contributors'
                ? 'text-blue-600 border-b-2 border-blue-600'
                : 'text-gray-500 hover:text-gray-700'
            }`}
          >
            Top Contributors ({contributors.length})
          </button>
        </div>

        <div className="p-6">
          {activeTab === 'articles' && (
            <div className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
                <div className="bg-blue-50 p-4 rounded-lg">
                  <div className="text-2xl font-bold text-blue-600">{articles.length}</div>
                  <div className="text-sm text-blue-800">Total Articles</div>
                </div>
                <div className="bg-green-50 p-4 rounded-lg">
                  <div className="text-2xl font-bold text-green-600">
                    {articles.reduce((sum, article) => sum + (article.views || 0), 0).toLocaleString()}
                  </div>
                  <div className="text-sm text-green-800">Total Views</div>
                </div>
                <div className="bg-purple-50 p-4 rounded-lg">
                  <div className="text-2xl font-bold text-purple-600">
                    {articles.reduce((sum, article) => sum + (article.likes || 0), 0).toLocaleString()}
                  </div>
                  <div className="text-sm text-purple-800">Total Likes</div>
                </div>
                <div className="bg-yellow-50 p-4 rounded-lg">
                  <div className="text-2xl font-bold text-yellow-600">
                    ${articles.reduce((sum, article) => sum + (article.earnings || 0), 0).toLocaleString()}
                  </div>
                  <div className="text-sm text-yellow-800">Total Earnings</div>
                </div>
              </div>

              <div className="overflow-x-auto">
                <table className="min-w-full">
                  <thead>
                    <tr className="border-b bg-gray-50">
                      <th className="text-left p-4 font-semibold text-gray-700">Article</th>
                      <th className="text-left p-4 font-semibold text-gray-700">Author</th>
                      <th className="text-left p-4 font-semibold text-gray-700">Category</th>
                      <th className="text-left p-4 font-semibold text-gray-700">Views</th>
                      <th className="text-left p-4 font-semibold text-gray-700">Likes</th>
                      <th className="text-left p-4 font-semibold text-gray-700">Earnings</th>
                      <th className="text-left p-4 font-semibold text-gray-700">Safety</th>
                      <th className="text-left p-4 font-semibold text-gray-700">Date</th>
                    </tr>
                  </thead>
                  <tbody>
                    {articles.map((article) => (
                      <tr key={article.id} className="border-b hover:bg-gray-50">
                        <td className="p-4">
                          <div className="font-medium text-gray-900 line-clamp-2 max-w-xs">
                            {article.title}
                            {article.featured && (
                              <span className="ml-2 text-xs bg-yellow-100 text-yellow-800 px-2 py-1 rounded-full">
                                Featured
                              </span>
                            )}
                            {article.isBlog && (
                              <span className="ml-2 text-xs bg-blue-100 text-blue-800 px-2 py-1 rounded-full">
                                Blog
                              </span>
                            )}
                          </div>
                        </td>
                        <td className="p-4 text-gray-600">{article.authorName}</td>
                        <td className="p-4">
                          <span className="capitalize text-sm text-gray-600">{article.category}</span>
                        </td>
                        <td className="p-4 text-gray-600 font-medium">{article.views?.toLocaleString() || 0}</td>
                        <td className="p-4 text-gray-600">{article.likes?.toLocaleString() || 0}</td>
                        <td className="p-4 font-semibold text-green-600">
                          ${article.earnings?.toLocaleString() || 0}
                        </td>
                        <td className="p-4">
                          <span className={`capitalize px-2 py-1 rounded-full text-xs ${getSafetyLevelColor(article.safetyLevel)}`}>
                            {article.safetyLevel}
                          </span>
                        </td>
                        <td className="p-4 text-gray-600 text-sm">
                          {new Date(article.createdAt).toLocaleDateString()}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {activeTab === 'contributors' && (
            <div className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
                <div className="bg-blue-50 p-4 rounded-lg">
                  <div className="text-2xl font-bold text-blue-600">{contributors.length}</div>
                  <div className="text-sm text-blue-800">Active Contributors</div>
                </div>
                <div className="bg-green-50 p-4 rounded-lg">
                  <div className="text-2xl font-bold text-green-600">
                    {contributors.reduce((sum, contributor) => sum + contributor.totalArticles, 0)}
                  </div>
                  <div className="text-sm text-green-800">Total Articles</div>
                </div>
                <div className="bg-purple-50 p-4 rounded-lg">
                  <div className="text-2xl font-bold text-purple-600">
                    {contributors.reduce((sum, contributor) => sum + contributor.totalViews, 0).toLocaleString()}
                  </div>
                  <div className="text-sm text-purple-800">Total Views</div>
                </div>
                <div className="bg-yellow-50 p-4 rounded-lg">
                  <div className="text-2xl font-bold text-yellow-600">
                    ${contributors.reduce((sum, contributor) => sum + contributor.totalEarnings, 0).toLocaleString()}
                  </div>
                  <div className="text-sm text-yellow-800">Total Paid Out</div>
                </div>
              </div>

              <div className="overflow-x-auto">
                <table className="min-w-full">
                  <thead>
                    <tr className="border-b bg-gray-50">
                      <th className="text-left p-4 font-semibold text-gray-700">Rank</th>
                      <th className="text-left p-4 font-semibold text-gray-700">Contributor</th>
                      <th className="text-left p-4 font-semibold text-gray-700">Articles</th>
                      <th className="text-left p-4 font-semibold text-gray-700">Total Views</th>
                      <th className="text-left p-4 font-semibold text-gray-700">Total Earnings</th>
                      <th className="text-left p-4 font-semibold text-gray-700">Avg per Article</th>
                      <th className="text-left p-4 font-semibold text-gray-700">Followers</th>
                      <th className="text-left p-4 font-semibold text-gray-700">Joined</th>
                    </tr>
                  </thead>
                  <tbody>
                    {contributors.map((contributor, index) => (
                      <tr key={contributor.id} className="border-b hover:bg-gray-50">
                        <td className="p-4">
                          <div className={`w-8 h-8 rounded-full flex items-center justify-center text-white text-sm font-bold ${
                            index === 0 ? 'bg-yellow-500' :
                            index === 1 ? 'bg-gray-400' :
                            index === 2 ? 'bg-orange-500' : 'bg-blue-500'
                          }`}>
                            {index + 1}
                          </div>
                        </td>
                        <td className="p-4">
                          <div className="font-medium text-gray-900">{contributor.name}</div>
                          <div className="text-sm text-gray-500">{contributor.email}</div>
                        </td>
                        <td className="p-4 text-gray-600 font-medium">{contributor.totalArticles}</td>
                        <td className="p-4 text-gray-600">{contributor.totalViews.toLocaleString()}</td>
                        <td className="p-4 font-semibold text-green-600">
                          ${contributor.totalEarnings.toLocaleString()}
                        </td>
                        <td className="p-4 text-gray-600">
                          ${contributor.totalArticles > 0 
                            ? (contributor.totalEarnings / contributor.totalArticles).toFixed(2)
                            : '0.00'
                          }
                        </td>
                        <td className="p-4 text-gray-600">{contributor.followers.toLocaleString()}</td>
                        <td className="p-4 text-gray-600 text-sm">
                          {new Date(contributor.joinDate).toLocaleDateString()}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}