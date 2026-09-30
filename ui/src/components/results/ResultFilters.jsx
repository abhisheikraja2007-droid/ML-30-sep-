import React from 'react';
import { Search, Filter, RefreshCw } from 'lucide-react';

export function ResultFilters({
  searchQuery,
  onSearchChange,
  statusFilter,
  onStatusChange,
  countryFilter,
  onCountryChange,
  onReset
}) {
  return (
    <div className="bg-[#E6E0D4] border border-[#C7C0B4] rounded-xl p-5 shadow-xs flex flex-col md:flex-row gap-4 items-center justify-between font-sans">
      {/* Search Input */}
      <div className="relative w-full md:w-96">
        <Search className="w-4 h-4 text-[#7E796E] absolute left-3.5 top-3.5" />
        <input
          type="text"
          value={searchQuery}
          onChange={(e) => onSearchChange(e.target.value)}
          placeholder="Search by ID, business name, or country..."
          className="w-full pl-10 pr-4 py-2.5 text-base bg-[#F1EBDD] border border-[#B8B2A5] rounded-lg focus:outline-none focus:ring-2 focus:ring-[#C6A15B]/40 focus:border-[#C6A15B] text-[#252522] placeholder-[#7E796E]"
        />
      </div>

      {/* Select Filters */}
      <div className="flex flex-wrap items-center gap-3 w-full md:w-auto">
        <div className="flex items-center gap-2 text-sm font-bold text-[#5E5A51] uppercase tracking-wider">
          <Filter className="w-4 h-4" />
          <span>Filters:</span>
        </div>

        {/* Status Filter */}
        <select
          value={statusFilter}
          onChange={(e) => onStatusChange(e.target.value)}
          className="px-3.5 py-2 text-sm bg-[#F1EBDD] border border-[#B8B2A5] rounded-lg text-[#252522] font-semibold focus:outline-none focus:ring-2 focus:ring-[#C6A15B]/40"
        >
          <option value="ALL">All Match Statuses</option>
          <option value="Matched">Matched</option>
          <option value="Singleton">Singleton (No Match)</option>
          <option value="Review">Review Needed</option>
        </select>

        {/* Country Filter */}
        <select
          value={countryFilter}
          onChange={(e) => onCountryChange(e.target.value)}
          className="px-3.5 py-2 text-sm bg-[#F1EBDD] border border-[#B8B2A5] rounded-lg text-[#252522] font-semibold focus:outline-none focus:ring-2 focus:ring-[#C6A15B]/40"
        >
          <option value="ALL">All Countries</option>
          <option value="India">India</option>
          <option value="US">US</option>
          <option value="France">France</option>
          <option value="United Kingdom">United Kingdom</option>
        </select>

        {(searchQuery || statusFilter !== 'ALL' || countryFilter !== 'ALL') && (
          <button
            onClick={onReset}
            className="px-3 py-1.5 text-sm font-bold text-[#A34B40] hover:underline flex items-center gap-1.5 cursor-pointer"
          >
            <RefreshCw className="w-4 h-4" />
            <span>Reset</span>
          </button>
        )}
      </div>
    </div>
  );
}

