'use client';

import { useState, useEffect } from 'react';
import {  FileText, BookOpen, TrendingUp, Download, Filter, Calendar, Search } from 'lucide-react';
import Header from '@/components/Header';
import Sidebar from '@/components/Sidebar';

// TypeScript interfaces
interface AccountEntry {
  account: string;
  debit: number;
  credit: number;
}

interface JournalEntry {
  id: string;
  date: string;
  type: string;
  description: string;
  accounts: AccountEntry[];
  createdAt?: string;
}

interface LedgerEntry {
  date: string;
  ref: string;
  debit: number;
  credit: number;
  balance?: number;
}

interface LedgerAccount {
  debit: number;
  credit: number;
  balance: number;
  entries: LedgerEntry[];
}

interface IncomeStatement {
  revenue: number;
  cogs: number;
  grossProfit: number;
  expenses: number;
  netIncome: number;
}

export default function AccountingSystem() {
  const [darkMode, setDarkMode] = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [activeTab, setActiveTab] = useState('journal');
  const [dateRange, setDateRange] = useState({ start: '', end: '' });
  const [searchTerm, setSearchTerm] = useState('');
  
  // State for accounting data with proper types
  const [journalEntries, setJournalEntries] = useState<JournalEntry[]>([]);
  const [ledgerAccounts, setLedgerAccounts] = useState<Record<string, LedgerAccount>>({});
  const [incomeStatement, setIncomeStatement] = useState<IncomeStatement>({
    revenue: 0,
    cogs: 0,
    grossProfit: 0,
    expenses: 0,
    netIncome: 0
  });

  useEffect(() => {
    fetchAccountingData();
  }, []);

  const fetchAccountingData = async () => {
    try {
      // Fetch from accounting API - it auto-regenerates from all sources
      const response = await fetch('/api/accounting');
      const data = await response.json();
      
      if (data.journalEntries && data.ledgerAccounts) {
        setJournalEntries(data.journalEntries);
        setLedgerAccounts(data.ledgerAccounts);
        
        // Calculate income statement
        const revenue = data.ledgerAccounts['Sales Revenue']?.credit || 0;
        const cogs = data.ledgerAccounts['Cost of Goods Sold']?.debit || 0;
        const returns = data.ledgerAccounts['Sales Returns']?.debit || 0;
        const netRevenue = revenue - returns;
        const grossProfit = netRevenue - cogs;
        
        setIncomeStatement({
          revenue: netRevenue,
          cogs,
          grossProfit,
          expenses: 0,
          netIncome: grossProfit
        });
      }
    } catch (error) {
      console.error('Error fetching accounting data:', error);
    }
  };

  // Refresh button handler
  const handleRefresh = async () => {
    await fetchAccountingData();
  };

  const formatCurrency = (amount: number): string => {
    return new Intl.NumberFormat('en-BD', { style: 'currency', currency: 'BDT' }).format(amount);
  };

  const formatDate = (date: string | Date): string => {
    return new Date(date).toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' });
  };

  const filteredJournalEntries = journalEntries.filter((entry: JournalEntry) => {
    const matchesSearch = entry.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         entry.type.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesDate = (!dateRange.start || new Date(entry.date) >= new Date(dateRange.start)) &&
                       (!dateRange.end || new Date(entry.date) <= new Date(dateRange.end));
    return matchesSearch && matchesDate;
  });

  return (
    <div className={darkMode ? 'dark' : ''}>
      <div className="flex h-screen bg-gray-50 dark:bg-gray-900">
        <Sidebar isOpen={sidebarOpen} setIsOpen={setSidebarOpen} />
        <div className="flex-1 flex flex-col overflow-hidden">
          <Header darkMode={darkMode} setDarkMode={setDarkMode} toggleSidebar={() => setSidebarOpen(!sidebarOpen)} />
          
          <main className="flex-1 overflow-auto p-6">
            <div className="max-w-7xl mx-auto">
              {/* Header */}
              <div className="mb-6">
                <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">Accounting</h1>
                <p className="text-gray-600 dark:text-gray-400">Manage journals, ledgers, and financial statements</p>
              </div>

              {/* Tabs */}
              <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 mb-6">
                <div className="flex border-b border-gray-200 dark:border-gray-700">
                  <button
                    onClick={() => setActiveTab('journal')}
                    className={`flex items-center gap-2 px-6 py-3 font-medium transition-colors ${
                      activeTab === 'journal'
                        ? 'text-blue-600 dark:text-blue-400 border-b-2 border-blue-600 dark:border-blue-400'
                        : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-200'
                    }`}
                  >
                    <FileText className="w-5 h-5" />
                    Journal Entries
                  </button>
                  <button
                    onClick={() => setActiveTab('ledger')}
                    className={`flex items-center gap-2 px-6 py-3 font-medium transition-colors ${
                      activeTab === 'ledger'
                        ? 'text-blue-600 dark:text-blue-400 border-b-2 border-blue-600 dark:border-blue-400'
                        : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-200'
                    }`}
                  >
                    <BookOpen className="w-5 h-5" />
                    General Ledger
                  </button>
                  <button
                    onClick={() => setActiveTab('income')}
                    className={`flex items-center gap-2 px-6 py-3 font-medium transition-colors ${
                      activeTab === 'income'
                        ? 'text-blue-600 dark:text-blue-400 border-b-2 border-blue-600 dark:border-blue-400'
                        : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-200'
                    }`}
                  >
                    <TrendingUp className="w-5 h-5" />
                    Income Statement
                  </button>
                </div>
              </div>

              {/* Filters */}
              <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-4 mb-6">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-sm font-medium text-gray-700 dark:text-gray-300">Filters</h3>
                  <button 
                    onClick={handleRefresh}
                    className="flex items-center gap-2 px-3 py-1.5 bg-black hover:bg-gray-900 text-white text-sm rounded-lg transition-colors"
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                    </svg>
                    Refresh Data
                  </button>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      Search
                    </label>
                    <div className="relative">
                      <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
                      <input
                        type="text"
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        placeholder="Search entries..."
                        className="w-full pl-10 pr-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                      />
                    </div>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      Start Date
                    </label>
                    <input
                      type="date"
                      value={dateRange.start}
                      onChange={(e) => setDateRange({ ...dateRange, start: e.target.value })}
                      className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      End Date
                    </label>
                    <input
                      type="date"
                      value={dateRange.end}
                      onChange={(e) => setDateRange({ ...dateRange, end: e.target.value })}
                      className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                    />
                  </div>
                </div>
              </div>

              {/* Content */}
              {activeTab === 'journal' && (
                <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 overflow-hidden">
                  <div className="p-4 border-b border-gray-200 dark:border-gray-700 flex items-center justify-between">
                    <h2 className="text-lg font-semibold text-gray-900 dark:text-white">Journal Entries</h2>
                    <button className="flex items-center gap-2 px-4 py-2 bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-600">
                      <Download className="w-4 h-4" />
                      Export
                    </button>
                  </div>
                  <div className="overflow-x-auto">
                    {filteredJournalEntries.length === 0 ? (
                      <div className="p-8 text-center text-gray-500 dark:text-gray-400">
                        No journal entries found
                      </div>
                    ) : (
                      filteredJournalEntries.map((entry: JournalEntry) => (
                        <div key={entry.id} className="border-b border-gray-200 dark:border-gray-700 p-4 hover:bg-gray-50 dark:hover:bg-gray-750">
                          <div className="flex items-center justify-between mb-2">
                            <div className="flex items-center gap-3">
                              <span className="text-sm font-medium text-gray-900 dark:text-white">{entry.id}</span>
                              <span className="px-2 py-1 text-xs font-medium bg-blue-100 dark:bg-blue-900 text-blue-700 dark:text-blue-300 rounded">
                                {entry.type}
                              </span>
                            </div>
                            <span className="text-sm text-gray-600 dark:text-gray-400">{formatDate(entry.date)}</span>
                          </div>
                          <p className="text-sm text-gray-600 dark:text-gray-400 mb-3">{entry.description}</p>
                          <div className="overflow-x-auto">
                            <table className="w-full">
                              <thead>
                                <tr className="text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">
                                  <th className="pb-2">Account</th>
                                  <th className="pb-2 text-right">Debit</th>
                                  <th className="pb-2 text-right">Credit</th>
                                </tr>
                              </thead>
                              <tbody>
                                {entry.accounts.map((acc: AccountEntry, idx: number) => (
                                  <tr key={idx} className="text-sm">
                                    <td className="py-1 text-gray-900 dark:text-white">{acc.account}</td>
                                    <td className="py-1 text-right text-gray-900 dark:text-white">
                                      {acc.debit > 0 ? formatCurrency(acc.debit) : '-'}
                                    </td>
                                    <td className="py-1 text-right text-gray-900 dark:text-white">
                                      {acc.credit > 0 ? formatCurrency(acc.credit) : '-'}
                                    </td>
                                  </tr>
                                ))}
                                <tr className="border-t border-gray-200 dark:border-gray-700 font-medium">
                                  <td className="pt-2 text-sm text-gray-900 dark:text-white">Total</td>
                                  <td className="pt-2 text-right text-sm text-gray-900 dark:text-white">
                                    {formatCurrency(entry.accounts.reduce((sum: number, acc: AccountEntry) => sum + acc.debit, 0))}
                                  </td>
                                  <td className="pt-2 text-right text-sm text-gray-900 dark:text-white">
                                    {formatCurrency(entry.accounts.reduce((sum: number, acc: AccountEntry) => sum + acc.credit, 0))}
                                  </td>
                                </tr>
                              </tbody>
                            </table>
                          </div>
                        </div>
                      ))
                    )}
                  </div>
                </div>
              )}

              {activeTab === 'ledger' && (
                <div className="space-y-4">
                  {Object.entries(ledgerAccounts).map(([accountName, account]: [string, LedgerAccount]) => (
                    <div key={accountName} className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 overflow-hidden">
                      <div className="p-4 bg-gray-50 dark:bg-gray-750 border-b border-gray-200 dark:border-gray-700">
                        <div className="flex items-center justify-between">
                          <h3 className="text-lg font-semibold text-gray-900 dark:text-white">{accountName}</h3>
                          <div className="flex items-center gap-6">
                            <div className="text-right">
                              <p className="text-xs text-gray-500 dark:text-gray-400">Balance</p>
                              <p className={`text-lg font-bold ${account.balance >= 0 ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'}`}>
                                {formatCurrency(Math.abs(account.balance))}
                              </p>
                            </div>
                          </div>
                        </div>
                      </div>
                      <div className="overflow-x-auto">
                        <table className="w-full">
                          <thead className="bg-gray-50 dark:bg-gray-750">
                            <tr className="text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">
                              <th className="px-4 py-3">Date</th>
                              <th className="px-4 py-3">Reference</th>
                              <th className="px-4 py-3 text-right">Debit</th>
                              <th className="px-4 py-3 text-right">Credit</th>
                              <th className="px-4 py-3 text-right">Balance</th>
                            </tr>
                          </thead>
                          <tbody>
                            {account.entries.map((entry: LedgerEntry, idx: number) => {
                              let runningBalance = 0;
                              if (idx === 0) {
                                runningBalance = entry.debit - entry.credit;
                              } else {
                                const prevBalance = account.entries.slice(0, idx).reduce((sum: number, e: LedgerEntry) => sum + e.debit - e.credit, 0);
                                runningBalance = prevBalance + entry.debit - entry.credit;
                              }
                              
                              return (
                                <tr key={idx} className="border-t border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-750">
                                  <td className="px-4 py-3 text-sm text-gray-900 dark:text-white">{formatDate(entry.date)}</td>
                                  <td className="px-4 py-3 text-sm text-gray-600 dark:text-gray-400">{entry.ref}</td>
                                  <td className="px-4 py-3 text-sm text-right text-gray-900 dark:text-white">
                                    {entry.debit > 0 ? formatCurrency(entry.debit) : '-'}
                                  </td>
                                  <td className="px-4 py-3 text-sm text-right text-gray-900 dark:text-white">
                                    {entry.credit > 0 ? formatCurrency(entry.credit) : '-'}
                                  </td>
                                  <td className={`px-4 py-3 text-sm text-right font-medium ${runningBalance >= 0 ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'}`}>
                                    {formatCurrency(Math.abs(runningBalance))}
                                  </td>
                                </tr>
                              );
                            })}
                          </tbody>
                        </table>
                      </div>
                    </div>
                  ))}
                </div>
              )}

              {activeTab === 'income' && (
                <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 overflow-hidden relative">
                  <div className="p-6 border-b border-gray-200 dark:border-gray-700">
                    <h2 className="text-xl font-bold text-gray-900 dark:text-white">Income Statement</h2>
                    <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">For the period</p>
                  </div>
                  <div className="p-6 space-y-6">
                    {/* Revenue Section */}
                    <div>
                      <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Revenue</h3>
                      <div className="space-y-3">
                        <div className="flex justify-between items-center">
                          <span className="text-gray-700 dark:text-gray-300">Sales Revenue</span>
                          <span className="text-gray-900 dark:text-white font-medium">{formatCurrency(incomeStatement.revenue)}</span>
                        </div>
                        <div className="flex justify-between items-center pt-3 border-t border-gray-200 dark:border-gray-700">
                          <span className="font-semibold text-gray-900 dark:text-white">Total Revenue</span>
                          <span className="font-semibold text-gray-900 dark:text-white">{formatCurrency(incomeStatement.revenue)}</span>
                        </div>
                      </div>
                    </div>

                    {/* Cost of Goods Sold Section */}
                    <div>
                      <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Cost of Goods Sold</h3>
                      <div className="space-y-3">
                        <div className="flex justify-between items-center">
                          <span className="text-gray-700 dark:text-gray-300">Cost of Goods Sold</span>
                          <span className="text-red-600 dark:text-red-400 font-medium">({formatCurrency(incomeStatement.cogs)})</span>
                        </div>
                        <div className="flex justify-between items-center pt-3 border-t border-gray-200 dark:border-gray-700">
                          <span className="font-semibold text-gray-900 dark:text-white">Total COGS</span>
                          <span className="font-semibold text-red-600 dark:text-red-400">({formatCurrency(incomeStatement.cogs)})</span>
                        </div>
                      </div>
                    </div>

                    {/* Gross Profit */}
                    <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4">
                      <div className="flex justify-between items-center">
                        <span className="text-lg font-bold text-gray-900 dark:text-white">Gross Profit</span>
                        <span className="text-lg font-bold text-blue-600 dark:text-blue-400">{formatCurrency(incomeStatement.grossProfit)}</span>
                      </div>
                      <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                        Margin: {incomeStatement.revenue > 0 ? ((incomeStatement.grossProfit / incomeStatement.revenue) * 100).toFixed(2) : 0}%
                      </p>
                    </div>

                    {/* Operating Expenses Section */}
                    <div>
                      <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Operating Expenses</h3>
                      <div className="space-y-3">
                        <div className="flex justify-between items-center">
                          <span className="text-gray-700 dark:text-gray-300">Total Expenses</span>
                          <span className="text-red-600 dark:text-red-400 font-medium">({formatCurrency(incomeStatement.expenses)})</span>
                        </div>
                      </div>
                    </div>

                    {/* Net Income */}
                    <div className={`${incomeStatement.netIncome >= 0 ? 'bg-green-50 dark:bg-green-900/20 border-green-200 dark:border-green-800' : 'bg-red-50 dark:bg-red-900/20 border-red-200 dark:border-red-800'} border rounded-lg p-6`}>
                      <div className="flex justify-between items-center">
                        <span className="text-xl font-bold text-gray-900 dark:text-white">Net Income</span>
                        <span className={`text-2xl font-bold ${incomeStatement.netIncome >= 0 ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'}`}>
                          {incomeStatement.netIncome >= 0 ? formatCurrency(incomeStatement.netIncome) : `(${formatCurrency(Math.abs(incomeStatement.netIncome))})`}
                        </span>
                      </div>
                      <p className="text-sm text-gray-600 dark:text-gray-400 mt-2">
                        Net Margin: {incomeStatement.revenue > 0 ? ((incomeStatement.netIncome / incomeStatement.revenue) * 100).toFixed(2) : 0}%
                      </p>
                    </div>

                    {/* Summary Cards */}
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-6 border-t border-gray-200 dark:border-gray-700">
                      <div className="bg-gray-50 dark:bg-gray-750 rounded-lg p-4">
                        <p className="text-xs text-gray-500 dark:text-gray-400 uppercase mb-1">Total Revenue</p>
                        <p className="text-2xl font-bold text-gray-900 dark:text-white">{formatCurrency(incomeStatement.revenue)}</p>
                      </div>
                      <div className="bg-gray-50 dark:bg-gray-750 rounded-lg p-4">
                        <p className="text-xs text-gray-500 dark:text-gray-400 uppercase mb-1">Total COGS</p>
                        <p className="text-2xl font-bold text-red-600 dark:text-red-400">{formatCurrency(incomeStatement.cogs)}</p>
                      </div>
                      <div className="bg-gray-50 dark:bg-gray-750 rounded-lg p-4">
                        <p className="text-xs text-gray-500 dark:text-gray-400 uppercase mb-1">Gross Margin</p>
                        <p className="text-2xl font-bold text-blue-600 dark:text-blue-400">
                          {incomeStatement.revenue > 0 ? ((incomeStatement.grossProfit / incomeStatement.revenue) * 100).toFixed(1) : 0}%
                        </p>
                      </div>
                    </div>

                    {/* Export Button */}
                    <div className="pt-6 border-t border-gray-200 dark:border-gray-700">
                      <div>
                        <button className="absolute bottom-6 right-6 z-50 flex items-center gap-2 px-3 py-2 bg-gray-900 dark:bg-white text-white dark:text-gray-900 text-sm rounded-md shadow hover:bg-gray-800 dark:hover:bg-gray-100">
                          <Download className="w-4 h-4" />
                          Export Income Statement
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </main>
        </div>
      </div>
    </div>
  );
}