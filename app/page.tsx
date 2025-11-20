/* eslint-disable @next/next/no-img-element */
// app/page.tsx (Corporate Homepage)
'use client';

import { useState } from 'react';
import Link from 'next/link';

export default function CorporateHomepage() {
  const [activeTab, setActiveTab] = useState<'about' | 'investors' | 'partners'>('about');

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-blue-50">
      {/* Navigation */}
      <nav className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-20">
            <div className="flex items-center">
              <div className="w-12 h-12 bg-blue-600 rounded-full flex items-center justify-center">
                <span className="text-white font-bold text-xl">N</span>
              </div>
              <div className="ml-4">
                <span className="text-2xl font-bold text-gray-900">Newsenn</span>
                <p className="text-sm text-gray-600">Corporate Portal</p>
              </div>
            </div>
            <div className="hidden md:block">
              <div className="flex items-center space-x-8">
                <a href="#about" className="text-gray-700 hover:text-blue-600 font-medium">About</a>
                <a href="#investors" className="text-gray-700 hover:text-blue-600 font-medium">Investors</a>
                <a href="#partners" className="text-gray-700 hover:text-blue-600 font-medium">Business Partners</a>
                <a href="#contact" className="text-gray-700 hover:text-blue-600 font-medium">Contact</a>
                <Link href="/admin" className="bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 transition-colors font-medium">
                  Admin Portal
                </Link>
              </div>
            </div>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="py-24 bg-gradient-to-r from-blue-600 to-purple-700 text-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h1 className="text-5xl md:text-7xl font-bold mb-6">
            Revolutionizing
            <span className="block text-blue-200">News Monetization</span>
          </h1>
          <p className="text-xl md:text-2xl text-blue-100 mb-8 max-w-4xl mx-auto">
            Newsenn is building the future of content creation - a platform where contributors earn real value 
            for their work and businesses reach engaged audiences through targeted promotions.
          </p>
          <div className="flex flex-col sm:flex-row gap-6 justify-center">
            <a href="#investors" className="bg-white text-blue-600 px-8 py-4 rounded-lg hover:bg-blue-50 transition-colors font-semibold text-lg">
              Investor Information
            </a>
            <a href="#partners" className="border-2 border-white text-white px-8 py-4 rounded-lg hover:bg-white hover:text-blue-600 transition-colors font-semibold text-lg">
              Partner With Us
            </a>
          </div>
        </div>
      </section>

      {/* Stats Section */}
      <section className="py-20 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8 text-center">
            <div>
              <div className="text-3xl md:text-4xl font-bold text-blue-600 mb-2">$2.5M+</div>
              <div className="text-gray-600">Total Contributor Payouts</div>
            </div>
            <div>
              <div className="text-3xl md:text-4xl font-bold text-green-600 mb-2">15K+</div>
              <div className="text-gray-600">Active Contributors</div>
            </div>
            <div>
              <div className="text-3xl md:text-4xl font-bold text-purple-600 mb-2">750+</div>
              <div className="text-gray-600">Business Partners</div>
            </div>
            <div>
              <div className="text-3xl md:text-4xl font-bold text-orange-600 mb-2">5M+</div>
              <div className="text-gray-600">Monthly Readers</div>
            </div>
          </div>
        </div>
      </section>

      {/* Tabbed Content Section */}
      <section className="py-20 bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          {/* Tab Navigation */}
          <div className="flex border-b border-gray-200 mb-12">
            <button
              onClick={() => setActiveTab('about')}
              className={`px-8 py-4 font-semibold text-lg ${
                activeTab === 'about'
                  ? 'text-blue-600 border-b-2 border-blue-600'
                  : 'text-gray-500 hover:text-gray-700'
              }`}
            >
              About Newsenn
            </button>
            <button
              onClick={() => setActiveTab('investors')}
              className={`px-8 py-4 font-semibold text-lg ${
                activeTab === 'investors'
                  ? 'text-blue-600 border-b-2 border-blue-600'
                  : 'text-gray-500 hover:text-gray-700'
              }`}
            >
              For Investors
            </button>
            <button
              onClick={() => setActiveTab('partners')}
              className={`px-8 py-4 font-semibold text-lg ${
                activeTab === 'partners'
                  ? 'text-blue-600 border-b-2 border-blue-600'
                  : 'text-gray-500 hover:text-gray-700'
              }`}
            >
              For Partners
            </button>
          </div>

          {/* About Tab */}
          {activeTab === 'about' && (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
              <div>
                <h2 className="text-4xl font-bold text-gray-900 mb-6">Our Vision</h2>
                <p className="text-lg text-gray-600 mb-6">
                  Newsenn is transforming how news content is created, distributed, and monetized. 
                  We believe that content creators should be fairly compensated for their work, 
                  and businesses should have access to engaged, targeted audiences.
                </p>
                <div className="space-y-4">
                  <div className="flex items-start">
                    <div className="w-6 h-6 bg-green-500 rounded-full flex items-center justify-center mt-1 mr-4 flex-shrink-0">
                      <span className="text-white text-sm">✓</span>
                    </div>
                    <div>
                      <h4 className="font-semibold text-gray-900">Fair Compensation Model</h4>
                      <p className="text-gray-600">Revolutionary payout system for contributors</p>
                    </div>
                  </div>
                  <div className="flex items-start">
                    <div className="w-6 h-6 bg-green-500 rounded-full flex items-center justify-center mt-1 mr-4 flex-shrink-0">
                      <span className="text-white text-sm">✓</span>
                    </div>
                    <div>
                      <h4 className="font-semibold text-gray-900">AI-Powered Platform</h4>
                      <p className="text-gray-600">Advanced content distribution and analytics</p>
                    </div>
                  </div>
                  <div className="flex items-start">
                    <div className="w-6 h-6 bg-green-500 rounded-full flex items-center justify-center mt-1 mr-4 flex-shrink-0">
                      <span className="text-white text-sm">✓</span>
                    </div>
                    <div>
                      <h4 className="font-semibold text-gray-900">Scalable Infrastructure</h4>
                      <p className="text-gray-600">Built to handle millions of users and articles</p>
                    </div>
                  </div>
                </div>
              </div>
              <div className="bg-white rounded-2xl p-8 shadow-xl">
                <img 
                  src="/api/placeholder/600/400" 
                  alt="Newsenn Platform"
                  className="w-full h-64 object-cover rounded-lg mb-6"
                />
                <h3 className="text-2xl font-bold text-gray-900 mb-4">Platform Ecosystem</h3>
                <p className="text-gray-600">
                  Our three-sided marketplace connects contributors, readers, and businesses 
                  in a seamless ecosystem that creates value for all participants.
                </p>
              </div>
            </div>
          )}

          {/* Investors Tab */}
          {activeTab === 'investors' && (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
              <div>
                <h2 className="text-4xl font-bold text-gray-900 mb-6">Investment Opportunity</h2>
                <p className="text-lg text-gray-600 mb-6">
                  Newsenn is positioned to disrupt the $XX billion content creation market. 
                  We&apos;re seeking strategic investors to accelerate our growth and expand into new markets.
                </p>
                <div className="space-y-6">
                  <div className="bg-blue-50 rounded-xl p-6">
                    <h4 className="font-bold text-blue-900 mb-2">Market Opportunity</h4>
                    <p className="text-blue-800">
                      $XX billion content creation market growing at XX% annually
                    </p>
                  </div>
                  <div className="bg-green-50 rounded-xl p-6">
                    <h4 className="font-bold text-green-900 mb-2">Growth Metrics</h4>
                    <p className="text-green-800">
                      XX% month-over-month user growth, XX% revenue increase
                    </p>
                  </div>
                  <div className="bg-purple-50 rounded-xl p-6">
                    <h4 className="font-bold text-purple-900 mb-2">Funding Round</h4>
                    <p className="text-purple-800">
                      Seeking $X million Series A to scale operations and expand teams
                    </p>
                  </div>
                </div>
              </div>
              <div className="bg-white rounded-2xl p-8 shadow-xl">
                <h3 className="text-2xl font-bold text-gray-900 mb-6">Financial Highlights</h3>
                <div className="space-y-4">
                  <div className="flex justify-between items-center py-3 border-b">
                    <span className="text-gray-600">Annual Recurring Revenue</span>
                    <span className="font-bold text-green-600">$X.XXM</span>
                  </div>
                  <div className="flex justify-between items-center py-3 border-b">
                    <span className="text-gray-600">Customer Acquisition Cost</span>
                    <span className="font-bold text-blue-600">$X.XX</span>
                  </div>
                  <div className="flex justify-between items-center py-3 border-b">
                    <span className="text-gray-600">Lifetime Value</span>
                    <span className="font-bold text-purple-600">$XXX</span>
                  </div>
                  <div className="flex justify-between items-center py-3 border-b">
                    <span className="text-gray-600">Gross Margin</span>
                    <span className="font-bold text-orange-600">XX%</span>
                  </div>
                </div>
                <button className="w-full bg-blue-600 text-white py-4 rounded-lg hover:bg-blue-700 transition-colors font-semibold mt-6">
                  Download Investor Deck
                </button>
              </div>
            </div>
          )}

          {/* Partners Tab */}
          {activeTab === 'partners' && (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
              <div>
                <h2 className="text-4xl font-bold text-gray-900 mb-6">Strategic Partnerships</h2>
                <p className="text-lg text-gray-600 mb-6">
                  Join our network of premium partners and leverage our platform to reach 
                  highly engaged audiences and drive business growth.
                </p>
                <div className="space-y-6">
                  <div className="border-l-4 border-blue-500 pl-4">
                    <h4 className="font-bold text-gray-900 mb-2">Content Distribution</h4>
                    <p className="text-gray-600">
                      Partner with us to distribute your content to millions of engaged readers
                    </p>
                  </div>
                  <div className="border-l-4 border-green-500 pl-4">
                    <h4 className="font-bold text-gray-900 mb-2">Advertising Solutions</h4>
                    <p className="text-gray-600">
                      Premium advertising placements with advanced targeting capabilities
                    </p>
                  </div>
                  <div className="border-l-4 border-purple-500 pl-4">
                    <h4 className="font-bold text-gray-900 mb-2">Technology Integration</h4>
                    <p className="text-gray-600">
                      API access and custom integration solutions for enterprise partners
                    </p>
                  </div>
                </div>
              </div>
              <div className="bg-white rounded-2xl p-8 shadow-xl">
                <h3 className="text-2xl font-bold text-gray-900 mb-6">Partnership Benefits</h3>
                <div className="space-y-4">
                  <div className="flex items-center">
                    <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center mr-4">
                      <span className="text-blue-600">👥</span>
                    </div>
                    <span className="text-gray-700">Access to 5M+ monthly readers</span>
                  </div>
                  <div className="flex items-center">
                    <div className="w-8 h-8 bg-green-100 rounded-full flex items-center justify-center mr-4">
                      <span className="text-green-600">🎯</span>
                    </div>
                    <span className="text-gray-700">Advanced audience targeting</span>
                  </div>
                  <div className="flex items-center">
                    <div className="w-8 h-8 bg-purple-100 rounded-full flex items-center justify-center mr-4">
                      <span className="text-purple-600">📊</span>
                    </div>
                    <span className="text-gray-700">Comprehensive analytics dashboard</span>
                  </div>
                  <div className="flex items-center">
                    <div className="w-8 h-8 bg-orange-100 rounded-full flex items-center justify-center mr-4">
                      <span className="text-orange-600">💼</span>
                    </div>
                    <span className="text-gray-700">Dedicated account management</span>
                  </div>
                </div>
                <button className="w-full bg-green-600 text-white py-4 rounded-lg hover:bg-green-700 transition-colors font-semibold mt-6">
                  Request Partnership Info
                </button>
              </div>
            </div>
          )}
        </div>
      </section>

      {/* Platform Links Section */}
      <section className="py-20 bg-white">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-6">
            Access Our Platforms
          </h2>
          <p className="text-xl text-gray-600 mb-12 max-w-2xl mx-auto">
            Explore our consumer-facing platforms for contributors and businesses
          </p>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            <div className="bg-blue-50 rounded-2xl p-8">
              <div className="w-16 h-16 bg-blue-600 rounded-full flex items-center justify-center mx-auto mb-6">
                <span className="text-white text-2xl">✍️</span>
              </div>
              <h3 className="text-2xl font-bold text-gray-900 mb-4">For Contributors</h3>
              <p className="text-gray-600 mb-6">
                Join our platform and start earning money for your news articles and content
              </p>
              <a 
                href="https://www.newsenn.com/sign-up/" 
                target="_blank" 
                rel="noopener noreferrer"
                className="inline-block bg-blue-600 text-white px-8 py-3 rounded-lg hover:bg-blue-700 transition-colors font-semibold"
              >
                Sign Up as Contributor
              </a>
            </div>
            <div className="bg-green-50 rounded-2xl p-8">
              <div className="w-16 h-16 bg-green-600 rounded-full flex items-center justify-center mx-auto mb-6">
                <span className="text-white text-2xl">🏢</span>
              </div>
              <h3 className="text-2xl font-bold text-gray-900 mb-4">For Promoters</h3>
              <p className="text-gray-600 mb-6">
                Promote your business to our engaged audience through targeted campaigns
              </p>
              <a 
                href="https://www.newsenn.com/promoter-signin/" 
                target="_blank" 
                rel="noopener noreferrer"
                className="inline-block bg-green-600 text-white px-8 py-3 rounded-lg hover:bg-green-700 transition-colors font-semibold"
              >
                Sign Up as Promoter
              </a>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 bg-gray-900">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-3xl md:text-4xl font-bold text-white mb-6">
            Ready to Transform Content Monetization?
          </h2>
          <p className="text-xl text-gray-300 mb-8 max-w-2xl mx-auto">
            Join us in building the future of fair content compensation and targeted business promotions.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <a 
              href="#contact" 
              className="bg-blue-600 text-white px-8 py-4 rounded-lg hover:bg-blue-700 transition-colors font-semibold"
            >
              Contact Our Team
            </a>
            <Link 
              href="/admin" 
              className="border border-white text-white px-8 py-4 rounded-lg hover:bg-white hover:text-gray-900 transition-colors font-semibold"
            >
              Admin Portal
            </Link>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-gray-800 text-white py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
            <div>
              <div className="flex items-center mb-4">
                <div className="w-10 h-10 bg-blue-600 rounded-full flex items-center justify-center">
                  <span className="text-white font-bold">N</span>
                </div>
                <span className="ml-3 text-xl font-bold">Newsenn</span>
              </div>
              <p className="text-gray-400">
                Building the future of content monetization and business promotion.
              </p>
            </div>
            <div>
              <h3 className="font-semibold mb-4">Company</h3>
              <ul className="space-y-2 text-gray-400">
                <li><a href="#about" className="hover:text-white">About</a></li>
                <li><a href="#team" className="hover:text-white">Team</a></li>
                <li><a href="#careers" className="hover:text-white">Careers</a></li>
                <li><a href="#press" className="hover:text-white">Press</a></li>
              </ul>
            </div>
            <div>
              <h3 className="font-semibold mb-4">Investors</h3>
              <ul className="space-y-2 text-gray-400">
                <li><a href="#financials" className="hover:text-white">Financials</a></li>
                <li><a href="#strategy" className="hover:text-white">Strategy</a></li>
                <li><a href="#governance" className="hover:text-white">Governance</a></li>
                <li><a href="#contact" className="hover:text-white">Investor Relations</a></li>
              </ul>
            </div>
            <div>
              <h3 className="font-semibold mb-4">Partners</h3>
              <ul className="space-y-2 text-gray-400">
                <li><a href="#partnerships" className="hover:text-white">Partnerships</a></li>
                <li><a href="#api" className="hover:text-white">API Access</a></li>
                <li><a href="#enterprise" className="hover:text-white">Enterprise</a></li>
                <li><a href="#contact" className="hover:text-white">Contact Sales</a></li>
              </ul>
            </div>
          </div>
          <div className="border-t border-gray-700 mt-12 pt-8 text-center text-gray-400">
            <p>&copy; 2024 Newsenn. All rights reserved.</p>
          </div>
        </div>
      </footer>
    </div>
  );
}