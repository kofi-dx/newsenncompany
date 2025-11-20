/* eslint-disable @typescript-eslint/no-unused-vars */
/* eslint-disable react-hooks/exhaustive-deps */
/* eslint-disable @typescript-eslint/no-explicit-any */
// app/ceo/earnings/page.tsx
'use client';

import { useState, useEffect } from 'react';
import { collection, getDocs, query, where } from 'firebase/firestore';
import { db } from '@/lib/firebase/config';

interface EarningsData {
  totalEarnings: number;
  contributorPayouts: number;
  promotionRevenue: number;
  netProfit: number;
  topEarners: { name: string; earnings: number; contributorId: string; articles: number }[];
  monthlyTrend: { month: string; earnings: number }[];
  platformRevenue: number;
  affiliateEarnings: number;
  videoEarnings: number;
  totalContributors: number;
  promoterStats: {
    totalPromoters: number;
    activePromoters: number;
    totalPromotions: number;
    revenueByPlan: { plan: string; revenue: number; count: number; averagePrice: number }[];
  };
}

interface ArticleData {
  id: string;
  title: string;
  authorId: string;
  views: number;
  earnings: number;
  status: string;
  publishedAt?: any;
}

interface ContributorData {
  id: string;
  name: string;
  email: string;
  balance: number;
  totalEarnings: number;
  affiliateEarnings?: number;
  referralEarnings?: number;
  status: string;
}

interface VideoData {
  id: string;
  authorId: string;
  views: number;
  earnings: number;
  status: string;
  publishedAt?: any;
}

interface PromoterData {
  id: string;
  companyName: string;
  email: string;
  plan: string;
  planPrice: number; // This is the ACTUAL price paid in GHS
  status: string;
  paymentStatus: string;
  createdAt?: any;
  currency?: string;
}

// CORRECTED Currency conversion rates
const CURRENCY_RATES = {
  GHS_TO_USD: 0.10,    // CORRECT: 1 GHS = 0.10 USD (10 cents)
  USD_TO_GHS: 10.0     // CORRECT: 1 USD = 10 GHS
};

export default function CEOEarnings() {
  const [earnings, setEarnings] = useState<EarningsData>({
    totalEarnings: 0,
    contributorPayouts: 0,
    promotionRevenue: 0,
    netProfit: 0,
    topEarners: [],
    monthlyTrend: [],
    platformRevenue: 0,
    affiliateEarnings: 0,
    videoEarnings: 0,
    totalContributors: 0,
    promoterStats: {
      totalPromoters: 0,
      activePromoters: 0,
      totalPromotions: 0,
      revenueByPlan: []
    }
  });
  const [loading, setLoading] = useState(true);
  const [timeRange, setTimeRange] = useState<'all' | 'month' | 'quarter'>('all');
  const [currency, setCurrency] = useState<'USD' | 'GHS'>('USD');

  // Currency conversion functions
  const convertToUSD = (ghsAmount: number): number => {
    return ghsAmount * CURRENCY_RATES.GHS_TO_USD;
  };

  const convertToGHS = (usdAmount: number): number => {
    return usdAmount * CURRENCY_RATES.USD_TO_GHS;
  };

  const formatCurrency = (amount: number, useCurrency: 'USD' | 'GHS' = currency): string => {
    const finalAmount = useCurrency === 'USD' ? amount : convertToGHS(amount);
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: useCurrency,
      minimumFractionDigits: 2
    }).format(finalAmount);
  };

  useEffect(() => {
    fetchEarningsData();
  }, [timeRange]);

  const fetchEarningsData = async () => {
    try {
      console.log('🔍 Fetching earnings data...');
      
      // Fetch ALL contributors first
      const contributorsSnapshot = await getDocs(collection(db, 'contributors'));
      const contributorsData: ContributorData[] = contributorsSnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as ContributorData[];

      console.log(`📊 Found ${contributorsData.length} contributors`);

      // Fetch approved articles
      const articlesQuery = query(collection(db, 'articles'), where('status', '==', 'approved'));
      const articlesSnapshot = await getDocs(articlesQuery);
      const articlesData: ArticleData[] = articlesSnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as ArticleData[];

      console.log(`📝 Found ${articlesData.length} approved articles`);

      // Fetch ALL promoters and their ACTUAL payments
      const promotersSnapshot = await getDocs(collection(db, 'promoters'));
      const promotersData: PromoterData[] = promotersSnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as PromoterData[];

      console.log(`🎯 Found ${promotersData.length} promoters`);

      // Calculate promotion revenue from ACTUAL promoter payments (IN GHS)
      const activePromoters = promotersData.filter(p => p.status === 'active' && p.paymentStatus === 'completed');
      
      // Promotion revenue in GHS (original currency) - using ACTUAL planPrice
      const promotionRevenueGHS = activePromoters.reduce((sum, promoter) => sum + (promoter.planPrice || 0), 0);
      
      // Convert to USD for consistent calculations using CORRECT RATE
      const promotionRevenueUSD = convertToUSD(promotionRevenueGHS);

      console.log(`💰 Promotion Revenue: GHS ${promotionRevenueGHS.toLocaleString()} = $${promotionRevenueUSD.toLocaleString()}`);
      console.log(`💵 Using CORRECT rate: 1 GHS = $${CURRENCY_RATES.GHS_TO_USD} USD`);

      // Calculate revenue by plan (in original GHS amounts) using ACTUAL prices
      const revenueByPlan: { [key: string]: { revenue: number; count: number; prices: number[] } } = {};

      activePromoters.forEach(promoter => {
        const plan = promoter.plan || 'basic';
        const price = promoter.planPrice || 0; // This is the ACTUAL price paid in GHS
        
        if (!revenueByPlan[plan]) {
          revenueByPlan[plan] = { revenue: 0, count: 0, prices: [] };
        }
        
        revenueByPlan[plan].revenue += price;
        revenueByPlan[plan].count += 1;
        revenueByPlan[plan].prices.push(price);
      });

      // Convert to array format with average price
      const revenueByPlanArray = Object.entries(revenueByPlan).map(([plan, data]) => ({
        plan,
        revenue: data.revenue,
        count: data.count,
        averagePrice: data.count > 0 ? data.revenue / data.count : 0
      }));

      console.log('📊 Revenue by plan:', revenueByPlanArray);

      // Fetch published videos
      const videosQuery = query(collection(db, 'videos'), where('status', '==', 'published'));
      const videosSnapshot = await getDocs(videosQuery);
      const videosData: VideoData[] = videosSnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as VideoData[];

      console.log(`🎥 Found ${videosData.length} published videos`);

      // Fetch affiliate earnings data (assuming USD)
      let affiliateEarningsTotal = 0;
      try {
        const affiliateSnapshot = await getDocs(collection(db, 'affiliateEarnings'));
        affiliateEarningsTotal = affiliateSnapshot.docs.reduce((sum, doc) => {
          const data = doc.data();
          return sum + (data.amount || 0);
        }, 0);
        console.log(`🤝 Found affiliate earnings: $${affiliateEarningsTotal}`);
      } catch (error) {
        console.log('No affiliate earnings data found');
      }

      // Calculate platform revenue (money coming IN to the platform)
      // Convert everything to USD for consistent calculations
      const platformRevenue = promotionRevenueUSD + affiliateEarningsTotal;

      console.log(`💰 Platform Revenue: $${platformRevenue.toLocaleString()} (Promotions: $${promotionRevenueUSD.toLocaleString()}, Affiliate: $${affiliateEarningsTotal.toLocaleString()})`);

      // Calculate TOTAL contributor payouts (money going OUT to contributors - in USD)
      const articlePayouts = articlesData.reduce((sum, article) => sum + (article.earnings || 0), 0);
      const videoPayouts = videosData.reduce((sum, video) => sum + (video.earnings || 0), 0);
      
      const contributorTotalEarnings = contributorsData.reduce((sum, contributor) => 
        sum + (contributor.totalEarnings || 0), 0
      );

      // Use the higher value to ensure we capture all payouts
      const contributorPayouts = Math.max(articlePayouts + videoPayouts, contributorTotalEarnings);

      console.log(`💸 Contributor Payouts: $${contributorPayouts.toLocaleString()} (Articles: $${articlePayouts.toLocaleString()}, Videos: $${videoPayouts.toLocaleString()}, Contributor Total: $${contributorTotalEarnings.toLocaleString()})`);

      // Calculate individual contributor earnings for top earners
      const contributorEarningsMap: { 
        [key: string]: { 
          earnings: number; 
          name: string; 
          articleCount: number;
          affiliateEarnings: number;
        } 
      } = {};

      // Initialize with contributor data
      contributorsData.forEach(contributor => {
        contributorEarningsMap[contributor.id] = {
          earnings: contributor.totalEarnings || 0,
          name: contributor.name || `Contributor ${contributor.id.slice(0, 8)}`,
          articleCount: 0,
          affiliateEarnings: contributor.affiliateEarnings || contributor.referralEarnings || 0
        };
      });

      // Add article earnings
      articlesData.forEach(article => {
        if (article.authorId && contributorEarningsMap[article.authorId]) {
          contributorEarningsMap[article.authorId].earnings += article.earnings || 0;
          contributorEarningsMap[article.authorId].articleCount += 1;
        }
      });

      // Add video earnings
      videosData.forEach(video => {
        if (video.authorId && contributorEarningsMap[video.authorId]) {
          contributorEarningsMap[video.authorId].earnings += video.earnings || 0;
        }
      });

      // Create top earners list
      const topEarners = Object.entries(contributorEarningsMap)
        .filter(([, data]) => data.earnings > 0)
        .sort(([,a], [,b]) => b.earnings - a.earnings)
        .slice(0, 10)
        .map(([contributorId, data]) => ({
          name: data.name,
          earnings: data.earnings,
          contributorId,
          articles: data.articleCount
        }));

      console.log(`🏆 Top ${topEarners.length} earners calculated`);

      // Calculate net profit (Platform Revenue - Contributor Payouts)
      const netProfit = platformRevenue - contributorPayouts;

      console.log(`📈 Net Profit: $${netProfit.toLocaleString()}`);

      // Calculate promoter stats
      const totalPromoters = promotersData.length;
      const activePromotersCount = activePromoters.length;
      
      // Count total promotions
      let totalPromotions = 0;
      try {
        const promotionsCollection = await getDocs(collection(db, 'promotions'));
        totalPromotions = promotionsCollection.size;
      } catch (error) {
        console.log('No promotions collection found');
      }

      setEarnings({
        totalEarnings: platformRevenue,
        contributorPayouts,
        promotionRevenue: promotionRevenueUSD, // Store in USD for calculations
        netProfit,
        topEarners,
        monthlyTrend: await generateMonthlyTrend(articlesData, promotersData, videosData),
        platformRevenue,
        affiliateEarnings: affiliateEarningsTotal,
        videoEarnings: videoPayouts,
        totalContributors: contributorsData.length,
        promoterStats: {
          totalPromoters,
          activePromoters: activePromotersCount,
          totalPromotions,
          revenueByPlan: revenueByPlanArray // This uses ACTUAL prices
        }
      });

      console.log('✅ Earnings data loaded successfully');

    } catch (error) {
      console.error('❌ Error fetching earnings data:', error);
    } finally {
      setLoading(false);
    }
  };

  const generateMonthlyTrend = async (
    articles: ArticleData[], 
    promoters: PromoterData[], 
    videos: VideoData[]
  ) => {
    const monthlyData: { [key: string]: number } = {};
    const currentDate = new Date();
    
    // Generate last 6 months
    for (let i = 5; i >= 0; i--) {
      const date = new Date(currentDate.getFullYear(), currentDate.getMonth() - i, 1);
      const monthKey = `${date.getFullYear()}-${(date.getMonth() + 1).toString().padStart(2, '0')}`;
      monthlyData[monthKey] = 0;
    }

    // Add article earnings by month (USD)
    articles.forEach(article => {
      if (article.publishedAt) {
        try {
          const date = article.publishedAt.toDate();
          const monthKey = `${date.getFullYear()}-${(date.getMonth() + 1).toString().padStart(2, '0')}`;
          if (monthlyData[monthKey] !== undefined) {
            monthlyData[monthKey] += article.earnings || 0;
          }
        } catch (error) {
          console.warn('Invalid article date:', article.id);
        }
      }
    });

    // Add promoter revenue by month (Convert GHS to USD using CORRECT RATE)
    promoters.forEach(promoter => {
      if (promoter.createdAt && promoter.status === 'active' && promoter.paymentStatus === 'completed') {
        try {
          const date = promoter.createdAt.toDate();
          const monthKey = `${date.getFullYear()}-${(date.getMonth() + 1).toString().padStart(2, '0')}`;
          if (monthlyData[monthKey] !== undefined) {
            const promoterRevenueUSD = convertToUSD(promoter.planPrice || 0);
            monthlyData[monthKey] += promoterRevenueUSD;
          }
        } catch (error) {
          console.warn('Invalid promoter date:', promoter.id);
        }
      }
    });

    // Add video earnings by month (USD)
    videos.forEach(video => {
      if (video.publishedAt) {
        try {
          const date = video.publishedAt.toDate();
          const monthKey = `${date.getFullYear()}-${(date.getMonth() + 1).toString().padStart(2, '0')}`;
          if (monthlyData[monthKey] !== undefined) {
            monthlyData[monthKey] += video.earnings || 0;
          }
        } catch (error) {
          console.warn('Invalid video date:', video.id);
        }
      }
    });

    // Convert to array and format
    const monthlyTrend = Object.entries(monthlyData)
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([monthKey, earnings]) => {
        const [year, month] = monthKey.split('-');
        const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
        return {
          month: `${monthNames[parseInt(month) - 1]} '${year.slice(2)}`,
          earnings
        };
      });

    return monthlyTrend;
  };

  const getProfitMargin = () => {
    if (earnings.platformRevenue === 0) return 0;
    return (earnings.netProfit / earnings.platformRevenue) * 100;
  };

  const getPlanName = (plan: string) => {
    const planNames: { [key: string]: string } = {
      basic: 'Starter',
      standard: 'Growth', 
      premium: 'Enterprise'
    };
    return planNames[plan] || plan;
  };

  // Example calculations for clarity
  const exampleCalculations = [
    { ghs: 10, usd: convertToUSD(10) },
    { ghs: 15, usd: convertToUSD(15) },
    { ghs: 30, usd: convertToUSD(30) },
    { ghs: 100, usd: convertToUSD(100) }
  ];

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
        <span className="ml-3 text-gray-600">Loading earnings data...</span>
      </div>
    );
  }

  return (
    <div>
      <div className="mb-8">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Earnings & Finance</h1>
            <p className="text-gray-600 mt-2">Complete financial overview with proper currency conversion</p>
          </div>
          
          {/* Currency Toggle */}
          <div className="flex items-center gap-4">
            <span className="text-sm font-medium text-gray-700">Currency:</span>
            <div className="flex bg-gray-100 rounded-lg p-1">
              <button
                onClick={() => setCurrency('USD')}
                className={`px-3 py-1 rounded-md text-sm font-medium transition-colors ${
                  currency === 'USD' 
                    ? 'bg-blue-600 text-white' 
                    : 'text-gray-600 hover:text-gray-900'
                }`}
              >
                USD
              </button>
              <button
                onClick={() => setCurrency('GHS')}
                className={`px-3 py-1 rounded-md text-sm font-medium transition-colors ${
                  currency === 'GHS' 
                    ? 'bg-blue-600 text-white' 
                    : 'text-gray-600 hover:text-gray-900'
                }`}
              >
                GHS
              </button>
            </div>
          </div>
        </div>
        
        {/* Time Range Filter */}
        <div className="flex space-x-2 mt-4">
          {['all', 'month', 'quarter'].map((range) => (
            <button
              key={range}
              onClick={() => setTimeRange(range as any)}
              className={`px-4 py-2 rounded-lg text-sm font-medium ${
                timeRange === range
                  ? 'bg-blue-600 text-white'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              {range.charAt(0).toUpperCase() + range.slice(1)}
            </button>
          ))}
        </div>
      </div>

      {/* Currency Notice */}
      <div className="mb-6 p-4 bg-green-50 border border-green-200 rounded-lg">
        <div className="flex items-center">
          <div className="text-green-600 mr-3">💹</div>
          <div>
            <p className="text-green-800 font-medium">
              Using CORRECT Currency Conversion Rates
            </p>
            <p className="text-green-600 text-sm mt-1">
              <strong>1 GHS = ${CURRENCY_RATES.GHS_TO_USD} USD</strong> • <strong>1 USD = {CURRENCY_RATES.USD_TO_GHS} GHS</strong>
            </p>
            <div className="text-green-500 text-xs mt-2 grid grid-cols-2 gap-1">
              {exampleCalculations.map((calc, index) => (
                <div key={index} className="flex justify-between">
                  <span>GHS {calc.ghs} =</span>
                  <span>${calc.usd.toFixed(2)} USD</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Financial Summary */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <div className="bg-white p-6 rounded-lg shadow-sm border">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-lg font-semibold text-gray-800">Platform Revenue</h3>
              <p className="text-3xl font-bold text-green-600">
                {formatCurrency(earnings.platformRevenue)}
              </p>
              <p className="text-sm text-gray-500 mt-1">Total money in</p>
              {currency === 'USD' && (
                <p className="text-xs text-gray-400 mt-1">
                  GHS {convertToGHS(earnings.platformRevenue).toLocaleString()}
                </p>
              )}
            </div>
            <div className="p-3 rounded-lg bg-green-100">
              <span className="text-2xl">💰</span>
            </div>
          </div>
        </div>

        <div className="bg-white p-6 rounded-lg shadow-sm border">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-lg font-semibold text-gray-800">Contributor Payouts</h3>
              <p className="text-3xl font-bold text-blue-600">
                {formatCurrency(earnings.contributorPayouts)}
              </p>
              <p className="text-sm text-gray-500 mt-1">To {earnings.totalContributors} contributors</p>
              {currency === 'GHS' && (
                <p className="text-xs text-gray-400 mt-1">
                  ${earnings.contributorPayouts.toLocaleString()}
                </p>
              )}
            </div>
            <div className="p-3 rounded-lg bg-blue-100">
              <span className="text-2xl">👥</span>
            </div>
          </div>
        </div>

        <div className="bg-white p-6 rounded-lg shadow-sm border">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-lg font-semibold text-gray-800">Promotion Revenue</h3>
              <p className="text-3xl font-bold text-purple-600">
                {formatCurrency(earnings.promotionRevenue)}
              </p>
              <p className="text-sm text-gray-500 mt-1">{earnings.promoterStats.activePromoters} active promoters</p>
              <p className="text-xs text-gray-400 mt-1">
                Original: GHS {convertToGHS(earnings.promotionRevenue).toLocaleString()}
              </p>
            </div>
            <div className="p-3 rounded-lg bg-purple-100">
              <span className="text-2xl">🎯</span>
            </div>
          </div>
        </div>

        <div className="bg-white p-6 rounded-lg shadow-sm border">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-lg font-semibold text-gray-800">Net Profit</h3>
              <p className={`text-3xl font-bold ${
                earnings.netProfit >= 0 ? 'text-green-600' : 'text-red-600'
              }`}>
                {formatCurrency(earnings.netProfit)}
              </p>
              <p className="text-sm text-gray-500 mt-1">
                {getProfitMargin().toFixed(1)}% margin
              </p>
            </div>
            <div className="p-3 rounded-lg bg-yellow-100">
              <span className="text-2xl">📈</span>
            </div>
          </div>
        </div>
      </div>

      {/* Promoter Statistics */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <div className="bg-white p-6 rounded-lg shadow-sm border">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-lg font-semibold text-gray-800">Total Promoters</h3>
              <p className="text-3xl font-bold text-indigo-600">
                {earnings.promoterStats.totalPromoters}
              </p>
              <p className="text-sm text-gray-500 mt-1">Registered accounts</p>
            </div>
            <div className="p-3 rounded-lg bg-indigo-100">
              <span className="text-2xl">👔</span>
            </div>
          </div>
        </div>

        <div className="bg-white p-6 rounded-lg shadow-sm border">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-lg font-semibold text-gray-800">Active Promoters</h3>
              <p className="text-3xl font-bold text-green-600">
                {earnings.promoterStats.activePromoters}
              </p>
              <p className="text-sm text-gray-500 mt-1">Paid and active</p>
            </div>
            <div className="p-3 rounded-lg bg-green-100">
              <span className="text-2xl">✅</span>
            </div>
          </div>
        </div>

        <div className="bg-white p-6 rounded-lg shadow-sm border">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-lg font-semibold text-gray-800">Total Promotions</h3>
              <p className="text-3xl font-bold text-orange-600">
                {earnings.promoterStats.totalPromotions}
              </p>
              <p className="text-sm text-gray-500 mt-1">Campaigns run</p>
            </div>
            <div className="p-3 rounded-lg bg-orange-100">
              <span className="text-2xl">📢</span>
            </div>
          </div>
        </div>

        <div className="bg-white p-6 rounded-lg shadow-sm border">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-lg font-semibold text-gray-800">Avg. Revenue/Promoter</h3>
              <p className="text-3xl font-bold text-teal-600">
                {earnings.promoterStats.activePromoters > 0 
                  ? formatCurrency(earnings.promotionRevenue / earnings.promoterStats.activePromoters)
                  : formatCurrency(0)
                }
              </p>
              <p className="text-sm text-gray-500 mt-1">Per active promoter</p>
            </div>
            <div className="p-3 rounded-lg bg-teal-100">
              <span className="text-2xl">📊</span>
            </div>
          </div>
        </div>
      </div>

      {/* Revenue by Plan */}
      <div className="bg-white rounded-lg shadow-sm border p-6 mb-8">
        <h2 className="text-xl font-semibold text-gray-800 mb-4">Revenue by Plan Type (Actual Prices)</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {earnings.promoterStats.revenueByPlan.map((planData) => {
            const planRevenueUSD = convertToUSD(planData.revenue);
            const totalPromotionRevenueGHS = convertToGHS(earnings.promotionRevenue);
            const averagePriceUSD = convertToUSD(planData.averagePrice);
            
            return (
              <div key={planData.plan} className="border rounded-lg p-4">
                <h3 className="font-semibold text-gray-800 mb-2">
                  {getPlanName(planData.plan)}
                </h3>
                
                {/* Average Price Info */}
                <div className="mb-3 p-2 bg-gray-50 rounded">
                  <p className="text-sm font-medium text-gray-700">Average Price Paid:</p>
                  <p className="text-lg font-bold text-green-600">
                    GHS {planData.averagePrice.toFixed(0)}
                  </p>
                  <p className="text-sm text-gray-600">
                    = {formatCurrency(averagePriceUSD, 'USD')}
                  </p>
                </div>

                <div className="flex justify-between items-center mb-2">
                  <span className="text-2xl font-bold text-purple-600">
                    {formatCurrency(planRevenueUSD)}
                  </span>
                  <span className="text-sm text-gray-500">
                    {planData.count} promoter{planData.count !== 1 ? 's' : ''}
                  </span>
                </div>
                
                <div className="text-sm text-gray-600 mb-2">
                  Original: GHS {planData.revenue.toLocaleString()}
                </div>
                
                <div className="w-full bg-gray-200 rounded-full h-2">
                  <div 
                    className="bg-purple-600 h-2 rounded-full"
                    style={{ 
                      width: `${totalPromotionRevenueGHS > 0 ? (planData.revenue / totalPromotionRevenueGHS) * 100 : 0}%` 
                    }}
                  ></div>
                </div>
                <p className="text-xs text-gray-500 mt-1">
                  {totalPromotionRevenueGHS > 0 ? ((planData.revenue / totalPromotionRevenueGHS) * 100).toFixed(1) : 0}% of promotion revenue
                </p>
              </div>
            );
          })}
        </div>

        {/* Show message if no plan data */}
        {earnings.promoterStats.revenueByPlan.length === 0 && (
          <div className="text-center py-8 text-gray-500">
            <div className="text-4xl mb-2">📊</div>
            <p>No promoter revenue data yet</p>
            <p className="text-sm">Revenue will appear when promoters start signing up</p>
          </div>
        )}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Top Earners */}
        <div className="bg-white rounded-lg shadow-sm border p-6">
          <h2 className="text-xl font-semibold text-gray-800 mb-4">
            Top Contributors ({earnings.topEarners.length})
          </h2>
          <div className="space-y-3">
            {earnings.topEarners.map((earner, index) => (
              <div key={earner.contributorId} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                <div className="flex items-center">
                  <div className={`w-8 h-8 rounded-full flex items-center justify-center text-white text-sm font-bold ${
                    index === 0 ? 'bg-yellow-500' :
                    index === 1 ? 'bg-gray-400' :
                    index === 2 ? 'bg-orange-500' : 'bg-blue-600'
                  }`}>
                    {index + 1}
                  </div>
                  <div className="ml-3">
                    <div className="font-medium text-gray-900">{earner.name}</div>
                    <div className="text-sm text-gray-500">
                      {earner.articles} articles • ID: {earner.contributorId.slice(0, 8)}
                    </div>
                  </div>
                </div>
                <div className="text-right">
                  <div className="font-semibold text-green-600">
                    {formatCurrency(earner.earnings)}
                  </div>
                  <div className="text-sm text-gray-500">
                    {((earner.earnings / earnings.contributorPayouts) * 100).toFixed(1)}% of total
                  </div>
                </div>
              </div>
            ))}
            {earnings.topEarners.length === 0 && (
              <div className="text-center py-8 text-gray-500">
                <div className="text-4xl mb-2">💸</div>
                <p>No contributor earnings yet</p>
                <p className="text-sm">Earnings will appear when contributors start earning</p>
              </div>
            )}
          </div>
        </div>

        {/* Monthly Trend */}
        <div className="bg-white rounded-lg shadow-sm border p-6">
          <h2 className="text-xl font-semibold text-gray-800 mb-4">Revenue Trend (Last 6 Months)</h2>
          <div className="space-y-4">
            {earnings.monthlyTrend.map((month) => {
              const maxEarnings = Math.max(...earnings.monthlyTrend.map(m => m.earnings));
              const percentage = maxEarnings > 0 ? (month.earnings / maxEarnings) * 100 : 0;
              
              return (
                <div key={month.month} className="flex items-center justify-between">
                  <span className="text-gray-600 w-16 text-sm">{month.month}</span>
                  <div className="flex items-center space-x-3 flex-1 max-w-md">
                    <div className="w-full bg-gray-200 rounded-full h-3">
                      <div 
                        className="bg-green-600 h-3 rounded-full transition-all duration-500"
                        style={{ width: `${percentage}%` }}
                      ></div>
                    </div>
                    <span className="font-semibold text-gray-900 w-20 text-right text-sm">
                      {formatCurrency(month.earnings)}
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* Revenue Model Explanation */}
      <div className="mt-8 bg-blue-50 rounded-lg p-6 border border-blue-200">
        <h3 className="text-lg font-semibold text-blue-800 mb-2">💰 Correct Revenue Model</h3>
        <div className="text-sm text-blue-700">
          <p className="mb-3"><strong>CORRECT Currency Conversion:</strong></p>
          <ul className="list-disc list-inside space-y-1 mb-4">
            <li><strong>1 GHS = ${CURRENCY_RATES.GHS_TO_USD} USD</strong> (10 cents)</li>
            <li><strong>1 USD = {CURRENCY_RATES.USD_TO_GHS} GHS</strong></li>
          </ul>
          
          <p className="mb-3"><strong>Money IN (Platform Revenue):</strong></p>
          <ul className="list-disc list-inside space-y-1 mb-4">
            <li><strong>Promoter Payments:</strong> Uses ACTUAL amounts paid by promoters in GHS</li>
            <li><strong>Affiliate Earnings:</strong> Commission from referral programs (USD)</li>
          </ul>
          
          <p className="mb-3"><strong>Money OUT (Expenses):</strong></p>
          <ul className="list-disc list-inside space-y-1">
            <li><strong>Contributor Payouts:</strong> 55% of article/video earnings (USD)</li>
            <li><strong>Platform Costs:</strong> Hosting, maintenance, and operational expenses</li>
          </ul>
          
          <p className="mt-4 font-semibold">
            Net Profit = Platform Revenue - Contributor Payouts - Platform Costs
          </p>
        </div>
      </div>
    </div>
  );
}