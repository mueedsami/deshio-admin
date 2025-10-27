'use client';

import { useState, useEffect } from 'react';
import { Plus, Calendar, Tag, TrendingDown, TrendingUp, Receipt, Search, ShoppingBag, Store, Package, RefreshCw, ArrowUpDown, Image as ImageIcon } from 'lucide-react';
import Header from '@/components/Header';
import Sidebar from '@/components/Sidebar';
import Link from 'next/link';

interface Transaction {
  id: string;
  name: string;
  description: string;
  type: 'income' | 'expense';
  amount: number;
  category: string;
  date: string;
  comment?: string;
  receiptImage?: string;
  createdAt: string;
  source: 'manual' | 'sale' | 'order' | 'batch' | 'return' | 'exchange';
  referenceId?: string;
}

export default function TransactionsPage() {
  const [darkMode, setDarkMode] = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [filterType, setFilterType] = useState<'all' | 'income' | 'expense'>('all');
  const [filterSource, setFilterSource] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [dateFilter, setDateFilter] = useState<'all' | 'today' | 'week' | 'month'>('all');

  useEffect(() => {
    loadTransactions();
  }, []);

  const loadTransactions = async () => {
    setIsLoading(true);
    try {
      const response = await fetch('/api/transactions');
      const data = await response.json();
      setTransactions(data.transactions || []);
    } catch (error) {
      console.error('Failed to load transactions:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const formatCurrency = (amount: number) => {
    return `৳${Math.abs(amount).toLocaleString('en-BD', {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2
    })}`;
  };

  const getTransactionIcon = (transaction: Transaction) => {
    if (transaction.source === 'sale') return <Store className="w-5 h-5" />;
    if (transaction.source === 'order') return <ShoppingBag className="w-5 h-5" />;
    if (transaction.source === 'batch') return <Package className="w-5 h-5" />;
    if (transaction.source === 'return') return <RefreshCw className="w-5 h-5" />;
    if (transaction.source === 'exchange') return <ArrowUpDown className="w-5 h-5" />;
    if (transaction.type === 'income') return <TrendingUp className="w-5 h-5" />;
    return <TrendingDown className="w-5 h-5" />;
  };

  const getSourceBadge = (source: string) => {
    const badges: Record<string, { label: string; color: string }> = {
      manual: { label: 'Manual Entry', color: 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300' },
      sale: { label: 'POS Sale', color: 'bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300' },
      order: { label: 'Social Order', color: 'bg-purple-100 dark:bg-purple-900/30 text-purple-700 dark:text-purple-300' },
      batch: { label: 'Inventory Purchase', color: 'bg-orange-100 dark:bg-orange-900/30 text-orange-700 dark:text-orange-300' },
      return: { label: 'Return Refund', color: 'bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-300' },
      exchange: { label: 'Exchange Adjustment', color: 'bg-yellow-100 dark:bg-yellow-900/30 text-yellow-700 dark:text-yellow-300' }
    };
    return badges[source] || badges.manual;
  };

  const filterTransactions = () => {
    let filtered = transactions;

    if (filterType !== 'all') {
      filtered = filtered.filter(t => t.type === filterType);
    }

    if (filterSource !== 'all') {
      filtered = filtered.filter(t => t.source === filterSource);
    }

    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(t =>
        t.name.toLowerCase().includes(query) ||
        t.description?.toLowerCase().includes(query) ||
        t.category.toLowerCase().includes(query) ||
        t.comment?.toLowerCase().includes(query)
      );
    }

    if (dateFilter !== 'all') {
      const now = new Date();
      const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
      
      filtered = filtered.filter(t => {
        const transDate = new Date(t.createdAt);
        
        switch (dateFilter) {
          case 'today':
            return transDate >= today;
          case 'week':
            const weekAgo = new Date(today);
            weekAgo.setDate(weekAgo.getDate() - 7);
            return transDate >= weekAgo;
          case 'month':
            const monthAgo = new Date(today);
            monthAgo.setMonth(monthAgo.getMonth() - 1);
            return transDate >= monthAgo;
          default:
            return true;
        }
      });
    }

    return filtered;
  };

  const filteredTransactions = filterTransactions();

  const totalIncome = filteredTransactions
    .filter(t => t.type === 'income')
    .reduce((sum, t) => sum + t.amount, 0);
  
  const totalExpense = filteredTransactions
    .filter(t => t.type === 'expense')
    .reduce((sum, t) => sum + t.amount, 0);
  
  const netBalance = totalIncome - totalExpense;

  // Get unique sources for filter
  const uniqueSources = ['all', ...new Set(transactions.map(t => t.source))];

  return (
    <div className={darkMode ? 'dark' : ''}>
      <div className="flex h-screen bg-gray-50 dark:bg-gray-900 overflow-hidden">
        <Sidebar isOpen={sidebarOpen} setIsOpen={setSidebarOpen} />
        
        <div className="flex-1 flex flex-col overflow-hidden">
          <Header 
            darkMode={darkMode} 
            setDarkMode={setDarkMode}
            toggleSidebar={() => setSidebarOpen(!sidebarOpen)}
          />
          
          <main className="flex-1 overflow-y-auto p-6">
            {/* Header Section */}
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
              <div>
                <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Transactions</h1>
                <p className="text-gray-600 dark:text-gray-400">All financial activities from your ERP system</p>
              </div>
              <div className="flex gap-3">
                <button
                  onClick={loadTransactions}
                  className="flex items-center gap-2 px-4 py-2 bg-gray-100 dark:bg-gray-800 text-gray-900 dark:text-white rounded-lg hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors border border-gray-300 dark:border-gray-700"
                >
                  <RefreshCw className="w-4 h-4" />
                  Refresh
                </button>
                <Link
                  href="/transaction/new"
                  className="flex items-center gap-2 px-4 py-2 bg-black dark:bg-white text-white dark:text-black rounded-lg hover:bg-gray-800 dark:hover:bg-gray-100 transition-colors font-medium"
                >
                  <Plus className="w-4 h-4" />
                  Manual Entry
                </Link>
              </div>
            </div>

            {/* Summary Cards */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
              <div className="bg-white dark:bg-gray-800 p-6 rounded-lg border border-gray-200 dark:border-gray-700">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm font-medium text-gray-600 dark:text-gray-400">Total Income</span>
                  <div className="p-2 bg-green-100 dark:bg-green-900/30 rounded-lg">
                    <TrendingUp className="w-5 h-5 text-green-600 dark:text-green-400" />
                  </div>
                </div>
                <div className="text-2xl font-bold text-green-600 dark:text-green-400">
                  {formatCurrency(totalIncome)}
                </div>
                <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                  From sales, orders & other sources
                </p>
              </div>

              <div className="bg-white dark:bg-gray-800 p-6 rounded-lg border border-gray-200 dark:border-gray-700">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm font-medium text-gray-600 dark:text-gray-400">Total Expense</span>
                  <div className="p-2 bg-red-100 dark:bg-red-900/30 rounded-lg">
                    <TrendingDown className="w-5 h-5 text-red-600 dark:text-red-400" />
                  </div>
                </div>
                <div className="text-2xl font-bold text-red-600 dark:text-red-400">
                  {formatCurrency(totalExpense)}
                </div>
                <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                  Inventory, returns & operating costs
                </p>
              </div>

              <div className="bg-white dark:bg-gray-800 p-6 rounded-lg border border-gray-200 dark:border-gray-700">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm font-medium text-gray-600 dark:text-gray-400">Net Balance</span>
                  <div className="p-2 bg-gray-100 dark:bg-gray-700 rounded-lg">
                    <Receipt className="w-5 h-5 text-gray-600 dark:text-gray-400" />
                  </div>
                </div>
                <div className={`text-2xl font-bold ${
                  netBalance >= 0 
                    ? 'text-green-600 dark:text-green-400' 
                    : 'text-red-600 dark:text-red-400'
                }`}>
                  {netBalance >= 0 ? '+' : '-'}{formatCurrency(netBalance)}
                </div>
                <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                  {netBalance >= 0 ? 'Profit' : 'Loss'} for selected period
                </p>
              </div>
            </div>

            {/* Filters */}
            <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-4 mb-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                {/* Search */}
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
                  <input
                    type="text"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder="Search transactions..."
                    className="w-full pl-10 pr-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-black dark:focus:ring-white bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                  />
                </div>

                {/* Type Filter */}
                <select
                  value={filterType}
                  onChange={(e) => setFilterType(e.target.value as any)}
                  className="px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-black dark:focus:ring-white bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                >
                  <option value="all">All Types</option>
                  <option value="income">Income Only</option>
                  <option value="expense">Expenses Only</option>
                </select>

                {/* Source Filter */}
                <select
                  value={filterSource}
                  onChange={(e) => setFilterSource(e.target.value)}
                  className="px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-black dark:focus:ring-white bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                >
                  <option value="all">All Sources</option>
                  {uniqueSources.filter(s => s !== 'all').map(source => (
                    <option key={source} value={source}>
                      {getSourceBadge(source).label}
                    </option>
                  ))}
                </select>

                {/* Date Filter */}
                <select
                  value={dateFilter}
                  onChange={(e) => setDateFilter(e.target.value as any)}
                  className="px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-black dark:focus:ring-white bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                >
                  <option value="all">All Time</option>
                  <option value="today">Today</option>
                  <option value="week">This Week</option>
                  <option value="month">This Month</option>
                </select>
              </div>

              {/* Active Filters Display */}
              {(filterType !== 'all' || filterSource !== 'all' || searchQuery || dateFilter !== 'all') && (
                <div className="flex items-center gap-2 mt-3 pt-3 border-t border-gray-200 dark:border-gray-700">
                  <span className="text-sm text-gray-600 dark:text-gray-400">Active filters:</span>
                  <div className="flex flex-wrap gap-2">
                    {filterType !== 'all' && (
                      <span className="px-2 py-1 bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 text-xs rounded">
                        {filterType === 'income' ? 'Income' : 'Expense'}
                      </span>
                    )}
                    {filterSource !== 'all' && (
                      <span className="px-2 py-1 bg-purple-100 dark:bg-purple-900/30 text-purple-700 dark:text-purple-300 text-xs rounded">
                        {getSourceBadge(filterSource).label}
                      </span>
                    )}
                    {searchQuery && (
                      <span className="px-2 py-1 bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-300 text-xs rounded">
                        Search: "{searchQuery}"
                      </span>
                    )}
                    {dateFilter !== 'all' && (
                      <span className="px-2 py-1 bg-orange-100 dark:bg-orange-900/30 text-orange-700 dark:text-orange-300 text-xs rounded">
                        {dateFilter.charAt(0).toUpperCase() + dateFilter.slice(1)}
                      </span>
                    )}
                  </div>
                  <button
                    onClick={() => {
                      setFilterType('all');
                      setFilterSource('all');
                      setSearchQuery('');
                      setDateFilter('all');
                    }}
                    className="ml-auto text-sm text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white"
                  >
                    Clear all
                  </button>
                </div>
              )}
            </div>

            {/* Transactions List */}
            <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 overflow-hidden">
              {isLoading ? (
                <div className="text-center py-12">
                  <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900 dark:border-white"></div>
                  <p className="text-gray-600 dark:text-gray-400 mt-4">Loading transactions...</p>
                </div>
              ) : filteredTransactions.length === 0 ? (
                <div className="text-center py-12">
                  <Receipt className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                  <div className="text-gray-600 dark:text-gray-400 mb-2">No transactions found</div>
                  <p className="text-sm text-gray-500 dark:text-gray-400 mb-4">
                    {filterType !== 'all' || filterSource !== 'all' || searchQuery || dateFilter !== 'all'
                      ? 'Try adjusting your filters'
                      : 'Transactions from sales, orders, and batches will appear here automatically'}
                  </p>
                  <Link
                    href="/transaction/new"
                    className="inline-flex items-center gap-2 px-4 py-2 bg-black dark:bg-white text-white dark:text-black rounded-lg hover:bg-gray-800 dark:hover:bg-gray-100 transition-colors"
                  >
                    <Plus className="w-4 h-4" />
                    Add Manual Entry
                  </Link>
                </div>
              ) : (
                <div className="divide-y divide-gray-200 dark:divide-gray-700">
                  {filteredTransactions.map((transaction) => {
                    const sourceBadge = getSourceBadge(transaction.source);
                    
                    return (
                      <div 
                        key={transaction.id} 
                        className="p-4 hover:bg-gray-50 dark:hover:bg-gray-750 transition-colors"
                      >
                        <div className="flex items-start gap-4">
                          {/* Icon */}
                          <div className={`p-3 rounded-lg ${
                            transaction.type === 'income'
                              ? 'text-green-600 dark:text-green-400 bg-green-50 dark:bg-green-900/20'
                              : 'text-red-600 dark:text-red-400 bg-red-50 dark:bg-red-900/20'
                          }`}>
                            {getTransactionIcon(transaction)}
                          </div>

                          {/* Content */}
                          <div className="flex-1 min-w-0">
                            <div className="flex items-start justify-between gap-4 mb-2">
                              <div className="flex-1">
                                <h3 className="font-semibold text-gray-900 dark:text-white mb-1">
                                  {transaction.name}
                                </h3>
                                {transaction.description && (
                                  <p className="text-sm text-gray-600 dark:text-gray-400 mb-2">
                                    {transaction.description}
                                  </p>
                                )}
                                <div className="flex flex-wrap items-center gap-3 text-sm text-gray-500 dark:text-gray-400">
                                  <div className="flex items-center gap-1">
                                    <Calendar className="w-4 h-4" />
                                    {formatDate(transaction.createdAt)}
                                  </div>
                                  <div className="flex items-center gap-1">
                                    <Tag className="w-4 h-4" />
                                    {transaction.category}
                                  </div>
                                  <span className={`px-2 py-0.5 text-xs rounded-full ${sourceBadge.color}`}>
                                    {sourceBadge.label}
                                  </span>
                                  {transaction.receiptImage && (
                                    <div className="flex items-center gap-1 text-blue-600 dark:text-blue-400">
                                      <ImageIcon className="w-4 h-4" />
                                      <span className="text-xs">Receipt</span>
                                    </div>
                                  )}
                                </div>
                              </div>

                              {/* Amount */}
                              <div className="text-right">
                                <div className={`text-lg font-bold ${
                                  transaction.type === 'income'
                                    ? 'text-green-600 dark:text-green-400' 
                                    : 'text-red-600 dark:text-red-400'
                                }`}>
                                  {transaction.type === 'income' ? '+' : '-'}{formatCurrency(transaction.amount)}
                                </div>
                              </div>
                            </div>

                            {transaction.comment && (
                              <p className="text-sm text-gray-500 dark:text-gray-400 italic mt-2 pl-4 border-l-2 border-gray-200 dark:border-gray-700">
                                {transaction.comment}
                              </p>
                            )}

                            {transaction.referenceId && (
                              <p className="text-xs text-gray-400 dark:text-gray-500 mt-2">
                                Ref: {transaction.referenceId}
                              </p>
                            )}
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>

            {/* Summary Footer */}
            {!isLoading && filteredTransactions.length > 0 && (
              <div className="mt-4 bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-4">
                <div className="flex items-center justify-between text-sm">
                  <span className="text-gray-600 dark:text-gray-400">
                    Showing {filteredTransactions.length} transaction{filteredTransactions.length !== 1 ? 's' : ''}
                  </span>
                  <div className="flex items-center gap-4">
                    <span className="text-green-600 dark:text-green-400 font-medium">
                      Income: {formatCurrency(totalIncome)}
                    </span>
                    <span className="text-red-600 dark:text-red-400 font-medium">
                      Expense: {formatCurrency(totalExpense)}
                    </span>
                    <span className={`font-bold ${netBalance >= 0 ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'}`}>
                      Net: {netBalance >= 0 ? '+' : '-'}{formatCurrency(netBalance)}
                    </span>
                  </div>
                </div>
              </div>
            )}
          </main>
        </div>
      </div>
    </div>
  );
}