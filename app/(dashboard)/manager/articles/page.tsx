/* eslint-disable react-hooks/exhaustive-deps */
/* eslint-disable @typescript-eslint/no-unused-vars */
/* eslint-disable @typescript-eslint/no-explicit-any */
// app/manager/articles/page.tsx (FIXED VERSION)
'use client';

import { useState, useEffect } from 'react';
import { collection, query, getDocs, doc, updateDoc, orderBy, where, increment } from 'firebase/firestore';
import { db } from '@/lib/firebase/config';
import { useAuth } from '@/contexts/AuthContext';
import Link from 'next/link';

type Category = 'Technology' | 'Politics' | 'Business' | 'Lifestyle' | 'Education' | 'Health' | 'Entertainment';

interface Article {
  id: string;
  authorId: string;
  title: string;
  excerpt: string;
  content: string;
  category: Category;
  date: string;
  username: string;
  views: number;
  imageUrl: string;
  audioUrl: string;
  videoUrl: string;
  slug: string;
  status: 'approved' | 'pending' | 'submitted' | 'draft' | 'rejected' | 'deleted';
  isFeatured: boolean;
  isBlog?: boolean;
  likes: number;
  comments: number;
  readTime: number;
  featured: boolean;
  youtubeLink: string;
  authorSocialMedia: {
    twitter?: string;
    facebook?: string;
    instagram?: string;
    linkedin?: string;
    website?: string;
  };
  safetyLevel: 'safe' | 'caution' | 'harmful' | 'warm';
  safetyScore?: number;
  harmfulKeywords?: string[];
  aiScore?: number;
  aiEvaluated?: boolean;
  submittedAt?: any;
  createdAt: any;
  earnings?: number;
  editorNotes?: string;
  rejectionReason?: string;
}

interface Contributor {
  id: string;
  name: string;
  email: string;
  username?: string;
  socialMedia?: {
    twitter?: string;
    facebook?: string;
    instagram?: string;
    linkedin?: string;
    website?: string;
  };
}

interface FilterState {
  search: string;
  status: string;
  category: string;
  author: string;
  featured: string;
  dateRange: {
    start: string;
    end: string;
  };
  sortBy: string;
  sortOrder: 'asc' | 'desc';
}

export default function ManagerArticles() {
  const { user } = useAuth();
  const [articles, setArticles] = useState<Article[]>([]);
  const [contributors, setContributors] = useState<Contributor[]>([]);
  const [loading, setLoading] = useState(true);
  const [processing, setProcessing] = useState<string | null>(null);
  
  // Filter state
  const [filters, setFilters] = useState<FilterState>({
    search: '',
    status: 'all',
    category: 'all',
    author: 'all',
    featured: 'all',
    dateRange: { start: '', end: '' },
    sortBy: 'createdAt',
    sortOrder: 'desc'
  });

  // Pagination
  const [currentPage, setCurrentPage] = useState(1);
  const articlesPerPage = 20;

  // Selected article for details modal
  const [selectedArticle, setSelectedArticle] = useState<Article | null>(null);
  const [showDetails, setShowDetails] = useState(false);

  useEffect(() => {
    fetchArticles();
    fetchContributors();
  }, [user]);

  const formatArticleFromFirestore = (doc: any): Article => {
    const data = doc.data();
    const submittedAt = data.submittedAt?.toDate();
    
    return {
      id: doc.id,
      title: data.title || 'Untitled',
      authorId: data.authorId || '',
      excerpt: data.excerpt || "",
      content: data.content || "",
      category: data.category as Category || 'Technology',
      date: submittedAt ? submittedAt.toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'short',
        day: 'numeric'
      }) : "No date",
      username: data.username || "Anonymous",
      views: data.views || 0,
      imageUrl: data.imageUrl || "",
      audioUrl: data.audioUrl || '',
      videoUrl: data.videoUrl || '',
      slug: data.slug || doc.id,
      status: data.status || "submitted",
      isFeatured: data.isFeatured || false,
      isBlog: data.isBlog || false,
      likes: data.likes || 0,
      comments: data.comments || 0,
      readTime: data.readTime || 0,
      featured: data.featured || false,
      youtubeLink: data.youtubeLink || "",
      authorSocialMedia: data.authorSocialMedia || {},
      safetyLevel: data.safetyLevel || 'warm',
      safetyScore: data.safetyScore,
      harmfulKeywords: data.harmfulKeywords || [],
      aiScore: data.aiScore,
      aiEvaluated: data.aiEvaluated || false,
      submittedAt: data.submittedAt,
      createdAt: data.createdAt,
      earnings: data.earnings || 0,
      editorNotes: data.editorNotes,
      rejectionReason: data.rejectionReason
    };
  };

  const fetchArticles = async () => {
    try {
      setLoading(true);
      
      console.log('📝 Fetching all articles...');
      const articlesQuery = query(
        collection(db, 'articles'),
        where("status", "==", "approved")
      );

      const snapshot = await getDocs(articlesQuery);
      const articlesData = snapshot.docs.map(formatArticleFromFirestore);

      console.log(`✅ Loaded ${articlesData.length} articles`);
      setArticles(articlesData);

    } catch (error) {
      console.error('❌ Error fetching articles:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchContributors = async () => {
    try {
      const contributorsQuery = query(collection(db, 'contributors'));
      const snapshot = await getDocs(contributorsQuery);
      const contributorsData = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as Contributor[];
      
      console.log(`👥 Loaded ${contributorsData.length} contributors`);
      setContributors(contributorsData);
    } catch (error) {
      console.error('❌ Error fetching contributors:', error);
    }
  };

  // Apply filters
  const filteredArticles = articles.filter(article => {
    const matchesSearch = 
      article.title.toLowerCase().includes(filters.search.toLowerCase()) ||
      article.excerpt.toLowerCase().includes(filters.search.toLowerCase()) ||
      article.username.toLowerCase().includes(filters.search.toLowerCase()) ||
      article.content.toLowerCase().includes(filters.search.toLowerCase());

    const matchesStatus = filters.status === 'all' || article.status === filters.status;
    const matchesCategory = filters.category === 'all' || article.category === filters.category;
    const matchesAuthor = filters.author === 'all' || article.authorId === filters.author;
    
    const matchesFeatured = filters.featured === 'all' || 
      (filters.featured === 'featured' && article.featured) ||
      (filters.featured === 'not_featured' && !article.featured);

    // Date range filter
    let matchesDateRange = true;
    if (filters.dateRange.start || filters.dateRange.end) {
      const articleDate = article.createdAt?.toDate?.();
      if (articleDate) {
        if (filters.dateRange.start) {
          const startDate = new Date(filters.dateRange.start);
          if (articleDate < startDate) matchesDateRange = false;
        }
        if (filters.dateRange.end) {
          const endDate = new Date(filters.dateRange.end);
          endDate.setHours(23, 59, 59, 999);
          if (articleDate > endDate) matchesDateRange = false;
        }
      }
    }

    return matchesSearch && matchesStatus && matchesCategory && matchesAuthor && matchesFeatured && matchesDateRange;
  });

  // Sort articles
  const sortedArticles = [...filteredArticles].sort((a, b) => {
    let aValue: any, bValue: any;
    
    switch (filters.sortBy) {
      case 'title':
        aValue = a.title.toLowerCase();
        bValue = b.title.toLowerCase();
        break;
      case 'author':
        aValue = a.username.toLowerCase();
        bValue = b.username.toLowerCase();
        break;
      case 'views':
        aValue = a.views;
        bValue = b.views;
        break;
      case 'likes':
        aValue = a.likes;
        bValue = b.likes;
        break;
      case 'comments':
        aValue = a.comments;
        bValue = b.comments;
        break;
      case 'earnings':
        aValue = a.earnings || 0;
        bValue = b.earnings || 0;
        break;
      case 'createdAt':
      default:
        aValue = a.createdAt?.toDate?.() || new Date(0);
        bValue = b.createdAt?.toDate?.() || new Date(0);
        break;
    }

    if (filters.sortOrder === 'asc') {
      return aValue < bValue ? -1 : aValue > bValue ? 1 : 0;
    } else {
      return aValue > bValue ? -1 : aValue < bValue ? 1 : 0;
    }
  });

  // Pagination
  const indexOfLastArticle = currentPage * articlesPerPage;
  const indexOfFirstArticle = indexOfLastArticle - articlesPerPage;
  const currentArticles = sortedArticles.slice(indexOfFirstArticle, indexOfLastArticle);
  const totalPages = Math.ceil(sortedArticles.length / articlesPerPage);

  const handleStatusUpdate = async (articleId: string, newStatus: Article['status'], notes?: string) => {
    setProcessing(articleId);
    try {
      const updateData: any = {
        status: newStatus,
        updatedAt: new Date()
      };

      if (newStatus === 'approved') {
        updateData.publishedAt = new Date();
      }

      if (notes) {
        if (newStatus === 'rejected') {
          updateData.rejectionReason = notes;
        } else {
          updateData.editorNotes = notes;
        }
      }

      await updateDoc(doc(db, 'articles', articleId), updateData);
      await fetchArticles();
      
      if (selectedArticle?.id === articleId) {
        setShowDetails(false);
      }
      
      alert(`Article ${newStatus} successfully!`);
    } catch (error) {
      console.error('❌ Error updating article status:', error);
      alert('Error updating article status. Please try again.');
    } finally {
      setProcessing(null);
    }
  };

  const handleFeaturedToggle = async (articleId: string, featured: boolean) => {
    setProcessing(articleId);
    try {
      await updateDoc(doc(db, 'articles', articleId), {
        featured: !featured,
        updatedAt: new Date()
      });
      await fetchArticles();
      alert(`Article ${!featured ? 'featured' : 'unfeatured'} successfully!`);
    } catch (error) {
      console.error('❌ Error updating featured status:', error);
      alert('Error updating featured status. Please try again.');
    } finally {
      setProcessing(null);
    }
  };

  const handleDeleteArticle = async (articleId: string) => {
    if (!confirm('Are you sure you want to delete this article? This action cannot be undone.')) return;
    
    setProcessing(articleId);
    try {
      await updateDoc(doc(db, 'articles', articleId), {
        status: 'deleted',
        deletedAt: new Date(),
        deletedBy: user?.id,
        updatedAt: new Date()
      });
      await fetchArticles();
      alert('Article deleted successfully!');
    } catch (error) {
      console.error('❌ Error deleting article:', error);
      alert('Error deleting article. Please try again.');
    } finally {
      setProcessing(null);
    }
  };

  const viewDetails = (article: Article) => {
    setSelectedArticle(article);
    setShowDetails(true);
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 2
    }).format(amount || 0);
  };

  const formatDate = (timestamp: any) => {
    if (!timestamp?.toDate) return 'N/A';
    try {
      return timestamp.toDate().toLocaleDateString();
    } catch (error) {
      return 'Invalid Date';
    }
  };

  const formatDateTime = (timestamp: any) => {
    if (!timestamp?.toDate) return 'N/A';
    try {
      return timestamp.toDate().toLocaleString();
    } catch (error) {
      return 'Invalid Date';
    }
  };

  const getStatusColor = (status: Article['status']) => {
    switch (status) {
      case 'approved': return 'bg-green-100 text-green-800 border border-green-200';
      case 'pending': 
      case 'submitted': return 'bg-yellow-100 text-yellow-800 border border-yellow-200';
      case 'draft': return 'bg-gray-100 text-gray-800 border border-gray-200';
      case 'rejected': return 'bg-red-100 text-red-800 border border-red-200';
      case 'deleted': return 'bg-red-100 text-red-800 border border-red-200 line-through';
      default: return 'bg-gray-100 text-gray-800 border border-gray-200';
    }
  };

  const getStatusDisplayName = (status: Article['status']) => {
    switch (status) {
      case 'approved': return 'Published';
      case 'pending': 
      case 'submitted': return 'Pending Review';
      case 'draft': return 'Draft';
      case 'rejected': return 'Rejected';
      case 'deleted': return 'Deleted';
      default: return status;
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

  const getStatusCounts = () => {
    const counts = {
      approved: 0,
      pending: 0,
      draft: 0,
      rejected: 0,
      deleted: 0,
      total: articles.length
    };

    articles.forEach(article => {
      if (article.status === 'approved') counts.approved++;
      else if (article.status === 'pending' || article.status === 'submitted') counts.pending++;
      else if (article.status === 'draft') counts.draft++;
      else if (article.status === 'rejected') counts.rejected++;
      else if (article.status === 'deleted') counts.deleted++;
    });

    return counts;
  };

  const statusCounts = getStatusCounts();

  const categories: Category[] = ['Technology', 'Politics', 'Business', 'Lifestyle', 'Education', 'Health', 'Entertainment'];

  if (loading && articles.length === 0) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-green-600"></div>
        <span className="ml-3 text-gray-600">Loading articles...</span>
      </div>
    );
  }

  return (
    <div className="p-4">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-2xl md:text-3xl font-bold text-gray-900">Article Management</h1>
        <p className="text-gray-600 mt-2">Manage and monitor all articles from contributors</p>
      </div>

      {/* Stats Overview */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3 mb-6">
        <div className="bg-white p-3 rounded-lg border shadow-sm">
          <div className="text-xl md:text-2xl font-bold text-gray-900">{statusCounts.total}</div>
          <div className="text-xs md:text-sm text-gray-600">Total Articles</div>
        </div>
        <div className="bg-green-50 p-3 rounded-lg border border-green-200">
          <div className="text-xl md:text-2xl font-bold text-green-600">{statusCounts.approved}</div>
          <div className="text-xs md:text-sm text-green-700">Published</div>
        </div>
        <div className="bg-yellow-50 p-3 rounded-lg border border-yellow-200">
          <div className="text-xl md:text-2xl font-bold text-yellow-600">{statusCounts.pending}</div>
          <div className="text-xs md:text-sm text-yellow-700">Pending</div>
        </div>
        <div className="bg-blue-50 p-3 rounded-lg border border-blue-200">
          <div className="text-xl md:text-2xl font-bold text-blue-600">{statusCounts.draft}</div>
          <div className="text-xs md:text-sm text-blue-700">Draft</div>
        </div>
        <div className="bg-purple-50 p-3 rounded-lg border border-purple-200">
          <div className="text-xl md:text-2xl font-bold text-purple-600">
            {articles.reduce((sum, article) => sum + (article.views || 0), 0).toLocaleString()}
          </div>
          <div className="text-xs md:text-sm text-purple-700">Total Views</div>
        </div>
        <div className="bg-orange-50 p-3 rounded-lg border border-orange-200">
          <div className="text-xl md:text-2xl font-bold text-orange-600">
            {formatCurrency(articles.reduce((sum, article) => sum + (article.earnings || 0), 0))}
          </div>
          <div className="text-xs md:text-sm text-orange-700">Total Earnings</div>
        </div>
      </div>

      {/* Advanced Filters */}
      <div className="bg-white rounded-lg shadow-sm border p-4 md:p-6 mb-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Filters & Search</h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-4">
          {/* Search */}
          <div className="sm:col-span-2 lg:col-span-3 xl:col-span-1">
            <label className="block text-sm font-medium text-gray-700 mb-2">Search</label>
            <input
              type="text"
              placeholder="Search articles..."
              value={filters.search}
              onChange={(e) => setFilters(prev => ({ ...prev, search: e.target.value }))}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 text-gray-900 placeholder-gray-500"
            />
          </div>

          {/* Status Filter */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Status</label>
            <select
              value={filters.status}
              onChange={(e) => setFilters(prev => ({ ...prev, status: e.target.value }))}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 text-gray-900"
            >
              <option value="all">All Status</option>
              <option value="approved">Published</option>
              <option value="pending">Pending</option>
              <option value="submitted">Submitted</option>
              <option value="draft">Draft</option>
              <option value="rejected">Rejected</option>
            </select>
          </div>

          {/* Category Filter */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Category</label>
            <select
              value={filters.category}
              onChange={(e) => setFilters(prev => ({ ...prev, category: e.target.value }))}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 text-gray-900"
            >
              <option value="all">All Categories</option>
              {categories.map(category => (
                <option key={category} value={category}>{category}</option>
              ))}
            </select>
          </div>

          {/* Author Filter */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Author</label>
            <select
              value={filters.author}
              onChange={(e) => setFilters(prev => ({ ...prev, author: e.target.value }))}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 text-gray-900"
            >
              <option value="all">All Authors</option>
              {contributors.map(contributor => (
                <option key={contributor.id} value={contributor.id}>
                  {contributor.name}
                </option>
              ))}
            </select>
          </div>

          {/* Featured Filter */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Featured</label>
            <select
              value={filters.featured}
              onChange={(e) => setFilters(prev => ({ ...prev, featured: e.target.value }))}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 text-gray-900"
            >
              <option value="all">All Articles</option>
              <option value="featured">Featured Only</option>
              <option value="not_featured">Not Featured</option>
            </select>
          </div>
        </div>

        {/* Second Row Filters */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-4">
          {/* Sort By */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Sort By</label>
            <select
              value={filters.sortBy}
              onChange={(e) => setFilters(prev => ({ ...prev, sortBy: e.target.value }))}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 text-gray-900"
            >
              <option value="createdAt">Date Created</option>
              <option value="title">Title</option>
              <option value="author">Author</option>
              <option value="views">Views</option>
              <option value="likes">Likes</option>
              <option value="comments">Comments</option>
              <option value="earnings">Earnings</option>
            </select>
          </div>

          {/* Date Range */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Start Date</label>
            <input
              type="date"
              value={filters.dateRange.start}
              onChange={(e) => setFilters(prev => ({ 
                ...prev, 
                dateRange: { ...prev.dateRange, start: e.target.value } 
              }))}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 text-gray-900"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">End Date</label>
            <input
              type="date"
              value={filters.dateRange.end}
              onChange={(e) => setFilters(prev => ({ 
                ...prev, 
                dateRange: { ...prev.dateRange, end: e.target.value } 
              }))}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 text-gray-900"
            />
          </div>
        </div>

        {/* Clear Filters */}
        <div className="flex justify-end mt-4">
          <button
            onClick={() => setFilters({
              search: '',
              status: 'all',
              category: 'all',
              author: 'all',
              featured: 'all',
              dateRange: { start: '', end: '' },
              sortBy: 'createdAt',
              sortOrder: 'desc'
            })}
            className="bg-gray-600 text-white px-4 py-2 rounded-lg hover:bg-gray-700 text-sm"
          >
            Clear All Filters
          </button>
        </div>
      </div>

      {/* Results Summary */}
      <div className="mb-4 text-sm text-gray-600">
        Showing {currentArticles.length} of {sortedArticles.length} articles 
        {filters.search && ` matching "${filters.search}"`}
        {filters.status !== 'all' && ` with status "${filters.status}"`}
        {filters.category !== 'all' && ` in "${filters.category}"`}
      </div>

      {/* Articles Table */}
      <div className="bg-white rounded-lg shadow-sm border">
        {sortedArticles.length === 0 ? (
          <div className="p-8 text-center text-gray-500">
            <div className="text-6xl mb-4">📝</div>
            <p className="text-lg">
              {articles.length === 0 ? 'No articles yet' : 'No articles match your filters'}
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            {/* Mobile Cards View */}
            <div className="block md:hidden">
              {currentArticles.map((article) => (
                <div key={article.id} className="border-b p-4 hover:bg-gray-50">
                  <div className="flex justify-between items-start mb-2">
                    <div className="flex-1">
                      <div className="font-medium text-gray-900 text-sm mb-1">
                        {article.featured && <span className="text-yellow-500 mr-1">⭐</span>}
                        {article.title}
                      </div>
                      <div className="text-xs text-gray-500 mb-2">
                        By {article.username} • {formatDate(article.createdAt)}
                      </div>
                    </div>
                  </div>
                  
                  <div className="flex flex-wrap gap-2 mb-3">
                    <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${getStatusColor(article.status)}`}>
                      {getStatusDisplayName(article.status)}
                    </span>
                    <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                      {article.category}
                    </span>
                  </div>

                  <div className="grid grid-cols-3 gap-2 text-xs mb-3">
                    <div className="text-center">
                      <div className="font-semibold text-gray-900">{(article.views || 0).toLocaleString()}</div>
                      <div className="text-gray-500">Views</div>
                    </div>
                    <div className="text-center">
                      <div className="font-semibold text-gray-900">{(article.likes || 0).toLocaleString()}</div>
                      <div className="text-gray-500">Likes</div>
                    </div>
                    <div className="text-center">
                      <div className="font-semibold text-green-600">{formatCurrency(article.earnings || 0)}</div>
                      <div className="text-gray-500">Earnings</div>
                    </div>
                  </div>

                  <div className="flex space-x-2">
                    <button
                      onClick={() => viewDetails(article)}
                      className="flex-1 px-2 py-1 bg-blue-600 text-white rounded text-xs hover:bg-blue-700"
                    >
                      View
                    </button>
                    
                    {article.status === 'pending' || article.status === 'submitted' ? (
                      <>
                        <button
                          onClick={() => handleStatusUpdate(article.id, 'approved')}
                          disabled={processing === article.id}
                          className="flex-1 px-2 py-1 bg-green-600 text-white rounded text-xs hover:bg-green-700 disabled:opacity-50"
                        >
                          Approve
                        </button>
                        <button
                          onClick={() => {
                            const reason = prompt('Reason for rejection:');
                            if (reason) handleStatusUpdate(article.id, 'rejected', reason);
                          }}
                          disabled={processing === article.id}
                          className="flex-1 px-2 py-1 bg-red-600 text-white rounded text-xs hover:bg-red-700 disabled:opacity-50"
                        >
                          Reject
                        </button>
                      </>
                    ) : article.status === 'approved' && (
                      <>
                        <button
                          onClick={() => handleFeaturedToggle(article.id, article.featured || false)}
                          disabled={processing === article.id}
                          className="flex-1 px-2 py-1 bg-yellow-600 text-white rounded text-xs hover:bg-yellow-700 disabled:opacity-50"
                        >
                          {article.featured ? 'Unfeature' : 'Feature'}
                        </button>
                        <button
                          onClick={() => handleDeleteArticle(article.id)}
                          disabled={processing === article.id}
                          className="flex-1 px-2 py-1 bg-red-600 text-white rounded text-xs hover:bg-red-700 disabled:opacity-50"
                        >
                          Delete
                        </button>
                      </>
                    )}
                  </div>
                </div>
              ))}
            </div>

            {/* Desktop Table View */}
            <table className="min-w-full hidden md:table">
              <thead>
                <tr className="border-b bg-gray-50">
                  <th className="text-left p-4 font-semibold text-gray-700">Article</th>
                  <th className="text-left p-4 font-semibold text-gray-700">Author</th>
                  <th className="text-left p-4 font-semibold text-gray-700">Category</th>
                  <th className="text-left p-4 font-semibold text-gray-700">Status</th>
                  <th className="text-left p-4 font-semibold text-gray-700">Views</th>
                  <th className="text-left p-4 font-semibold text-gray-700">Likes</th>
                  <th className="text-left p-4 font-semibold text-gray-700">Earnings</th>
                  <th className="text-left p-4 font-semibold text-gray-700">Created</th>
                  <th className="text-left p-4 font-semibold text-gray-700">Actions</th>
                </tr>
              </thead>
              <tbody>
                {currentArticles.map((article) => (
                  <tr key={article.id} className="border-b hover:bg-gray-50">
                    <td className="p-4">
                      <div className="max-w-xs">
                        <div className="font-medium text-gray-900 truncate" title={article.title}>
                          {article.featured && <span className="text-yellow-500 mr-1">⭐</span>}
                          {article.title}
                        </div>
                        <div className="text-xs text-gray-500 mt-1 truncate">
                          {article.excerpt || 'No excerpt'}
                        </div>
                      </div>
                    </td>
                    <td className="p-4">
                      <div className="text-gray-900">{article.username}</div>
                      <div className="text-xs text-gray-500">@{article.username}</div>
                    </td>
                    <td className="p-4">
                      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                        {article.category}
                      </span>
                    </td>
                    <td className="p-4">
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusColor(article.status)}`}>
                        {getStatusDisplayName(article.status)}
                      </span>
                      {article.safetyLevel && article.safetyLevel !== 'safe' && (
                        <span className={`ml-1 inline-flex items-center px-1.5 py-0.5 rounded-full text-xs font-medium ${getSafetyLevelColor(article.safetyLevel)}`}>
                          {article.safetyLevel}
                        </span>
                      )}
                    </td>
                    <td className="p-4">
                      <div className="text-gray-900 font-medium">{(article.views || 0).toLocaleString()}</div>
                    </td>
                    <td className="p-4">
                      <div className="text-gray-900 font-medium">{(article.likes || 0).toLocaleString()}</div>
                    </td>
                    <td className="p-4">
                      <div className="text-green-600 font-semibold">
                        {formatCurrency(article.earnings || 0)}
                      </div>
                    </td>
                    <td className="p-4 text-gray-600 text-sm">
                      {formatDate(article.createdAt)}
                    </td>
                    <td className="p-4">
                      <div className="flex flex-wrap gap-2">
                        <button
                          onClick={() => viewDetails(article)}
                          className="px-3 py-1 bg-blue-600 text-white rounded text-sm hover:bg-blue-700"
                        >
                          View
                        </button>
                        
                        {article.status === 'pending' || article.status === 'submitted' ? (
                          <>
                            <button
                              onClick={() => handleStatusUpdate(article.id, 'approved')}
                              disabled={processing === article.id}
                              className="px-3 py-1 bg-green-600 text-white rounded text-sm hover:bg-green-700 disabled:opacity-50"
                            >
                              Approve
                            </button>
                            <button
                              onClick={() => {
                                const reason = prompt('Reason for rejection:');
                                if (reason) handleStatusUpdate(article.id, 'rejected', reason);
                              }}
                              disabled={processing === article.id}
                              className="px-3 py-1 bg-red-600 text-white rounded text-sm hover:bg-red-700 disabled:opacity-50"
                            >
                              Reject
                            </button>
                          </>
                        ) : article.status === 'approved' && (
                          <>
                            <button
                              onClick={() => handleFeaturedToggle(article.id, article.featured || false)}
                              disabled={processing === article.id}
                              className="px-3 py-1 bg-yellow-600 text-white rounded text-sm hover:bg-yellow-700 disabled:opacity-50"
                            >
                              {article.featured ? 'Unfeature' : 'Feature'}
                            </button>
                            <button
                              onClick={() => handleDeleteArticle(article.id)}
                              disabled={processing === article.id}
                              className="px-3 py-1 bg-red-600 text-white rounded text-sm hover:bg-red-700 disabled:opacity-50"
                            >
                              Delete
                            </button>
                          </>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="flex flex-col sm:flex-row justify-between items-center p-4 border-t gap-4">
            <div className="text-sm text-gray-600 text-center sm:text-left">
              Page {currentPage} of {totalPages} • 
              Showing {indexOfFirstArticle + 1}-{Math.min(indexOfLastArticle, sortedArticles.length)} of {sortedArticles.length} articles
            </div>
            <div className="flex flex-wrap justify-center gap-2">
              <button
                onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                disabled={currentPage === 1}
                className="px-3 py-1 border border-gray-300 rounded text-sm hover:bg-gray-50 disabled:opacity-50 text-gray-700"
              >
                Previous
              </button>
              
              {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                const pageNumber = i + 1;
                return (
                  <button
                    key={pageNumber}
                    onClick={() => setCurrentPage(pageNumber)}
                    className={`px-3 py-1 border text-sm rounded ${
                      currentPage === pageNumber
                        ? 'bg-green-600 text-white border-green-600'
                        : 'border-gray-300 text-gray-700 hover:bg-gray-50'
                    }`}
                  >
                    {pageNumber}
                  </button>
                );
              })}

              {totalPages > 5 && <span className="px-2 py-1 text-sm text-gray-500">...</span>}

              <button
                onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
                disabled={currentPage === totalPages}
                className="px-3 py-1 border border-gray-300 rounded text-sm hover:bg-gray-50 disabled:opacity-50 text-gray-700"
              >
                Next
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Article Details Modal */}
      {showDetails && selectedArticle && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-2 sm:p-4 z-50">
          <div className="bg-white rounded-lg max-w-4xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-4 sm:p-6">
              <div className="flex justify-between items-center mb-4 sm:mb-6">
                <h2 className="text-xl sm:text-2xl font-bold text-gray-900">
                  {selectedArticle.title}
                </h2>
                <button
                  onClick={() => setShowDetails(false)}
                  className="text-gray-500 hover:text-gray-700 text-2xl"
                >
                  ✕
                </button>
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6">
                {/* Article Information */}
                <div className="space-y-3 sm:space-y-4">
                  <h3 className="text-lg font-semibold text-gray-900 border-b pb-2">Article Information</h3>
                  <InfoRow label="Title" value={selectedArticle.title} />
                  <InfoRow label="Author" value={`${selectedArticle.username}`} />
                  <InfoRow label="Category" value={selectedArticle.category} />
                  <InfoRow label="Status" value={
                    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusColor(selectedArticle.status)}`}>
                      {getStatusDisplayName(selectedArticle.status)}
                    </span>
                  } />
                  <InfoRow label="Safety Level" value={
                    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getSafetyLevelColor(selectedArticle.safetyLevel)}`}>
                      {selectedArticle.safetyLevel}
                    </span>
                  } />
                  <InfoRow label="AI Score" value={selectedArticle.aiScore ? `${selectedArticle.aiScore}%` : 'Not evaluated'} />
                  <InfoRow label="Created Date" value={formatDateTime(selectedArticle.createdAt)} />
                  {selectedArticle.submittedAt && (
                    <InfoRow label="Submitted Date" value={formatDateTime(selectedArticle.submittedAt)} />
                  )}
                </div>

                {/* Performance Metrics */}
                <div className="space-y-3 sm:space-y-4">
                  <h3 className="text-lg font-semibold text-gray-900 border-b pb-2">Performance Metrics</h3>
                  <InfoRow label="Views" value={selectedArticle.views.toLocaleString()} />
                  <InfoRow label="Likes" value={selectedArticle.likes.toLocaleString()} />
                  <InfoRow label="Comments" value={selectedArticle.comments.toLocaleString()} />
                  <InfoRow label="Earnings" value={formatCurrency(selectedArticle.earnings || 0)} />
                  <InfoRow label="Read Time" value={selectedArticle.readTime ? `${selectedArticle.readTime} min` : 'N/A'} />
                  <InfoRow label="Featured" value={selectedArticle.featured ? 'Yes' : 'No'} />
                  <InfoRow label="Blog Post" value={selectedArticle.isBlog ? 'Yes' : 'No'} />
                </div>
              </div>

              {/* Content Preview */}
              <div className="mt-4 sm:mt-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-2">Content Preview</h3>
                <div className="bg-gray-50 p-3 sm:p-4 rounded-lg max-h-40 overflow-y-auto">
                  <p className="text-gray-700 text-sm">
                    {selectedArticle.excerpt || selectedArticle.content.substring(0, 500) + '...'}
                  </p>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex flex-col sm:flex-row justify-between gap-3 mt-4 sm:mt-6 pt-4 sm:pt-6 border-t">
                <div className="flex flex-wrap gap-2">
                  {selectedArticle.status === 'pending' && (
                    <>
                      <button
                        onClick={() => handleStatusUpdate(selectedArticle.id, 'approved')}
                        disabled={processing === selectedArticle.id}
                        className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50 text-sm"
                      >
                        {processing === selectedArticle.id ? 'Publishing...' : 'Approve & Publish'}
                      </button>
                      <button
                        onClick={() => {
                          const reason = prompt('Reason for rejection:');
                          if (reason) handleStatusUpdate(selectedArticle.id, 'rejected', reason);
                        }}
                        disabled={processing === selectedArticle.id}
                        className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 disabled:opacity-50 text-sm"
                      >
                        {processing === selectedArticle.id ? 'Rejecting...' : 'Reject'}
                      </button>
                    </>
                  )}
                  {selectedArticle.status === 'approved' && (
                    <>
                      <button
                        onClick={() => handleFeaturedToggle(selectedArticle.id, selectedArticle.featured || false)}
                        disabled={processing === selectedArticle.id}
                        className="px-4 py-2 bg-yellow-600 text-white rounded-lg hover:bg-yellow-700 disabled:opacity-50 text-sm"
                      >
                        {selectedArticle.featured ? 'Unfeature' : 'Feature'}
                      </button>
                      <button
                        onClick={() => handleDeleteArticle(selectedArticle.id)}
                        disabled={processing === selectedArticle.id}
                        className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 disabled:opacity-50 text-sm"
                      >
                        Delete
                      </button>
                    </>
                  )}
                </div>
                <button
                  onClick={() => setShowDetails(false)}
                  className="px-6 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 text-sm"
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// Helper component for info rows
const InfoRow = ({ label, value }: { label: string; value: string | React.ReactNode }) => (
  <div>
    <label className="text-sm font-medium text-gray-600">{label}</label>
    <div className="text-gray-900 mt-1 text-sm">{value || 'Not provided'}</div>
  </div>
);