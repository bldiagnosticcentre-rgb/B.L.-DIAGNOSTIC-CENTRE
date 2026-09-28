import React, { useState, useEffect } from 'react';
import { 
  RateRecord, 
  PaginationParams, 
  PaginatedResult 
} from '../../types/catalogue';
import { 
  queryTestsPaginated, 
  getCatalogueFilters 
} from '../../services/catalogueService';
import { PublicPage } from '../layout/Header';
import { 
  Search, 
  Filter, 
  ArrowUpDown, 
  Clock, 
  Droplet, 
  Check, 
  Plus, 
  ChevronLeft, 
  ChevronRight, 
  AlertCircle,
  HelpCircle,
  FlaskConical,
  RefreshCw
} from 'lucide-react';
import { Badge, Button } from '../ui/DesignSystem';

interface TestsCatalogueProps {
  onNavigate: (page: PublicPage, param?: string) => void;
  selectedTestIds: string[];
  onToggleTestById: (record: RateRecord) => void;
  onProceedToBooking: () => void;
}

export const TestsCatalogue: React.FC<TestsCatalogueProps> = ({
  onNavigate,
  selectedTestIds,
  onToggleTestById,
  onProceedToBooking,
}) => {
  // Query parameters state
  const [page, setPage] = useState<number>(1);
  const [pageSize] = useState<number>(9);
  const [search, setSearch] = useState<string>('');
  const [category, setCategory] = useState<string>('All');
  const [method, setMethod] = useState<string>('All');
  const [sortBy, setSortBy] = useState<PaginationParams['sortBy']>('name');
  const [activeOnly, setActiveOnly] = useState<boolean>(true);

  // Available filter options fetched from database
  const [availableCategories, setAvailableCategories] = useState<string[]>([]);
  const [availableMethods, setAvailableMethods] = useState<string[]>([]);

  // Results state
  const [result, setResult] = useState<PaginatedResult<RateRecord>>({
    items: [],
    total: 0,
    page: 1,
    pageSize: 9,
    totalPages: 1
  });
  const [loading, setLoading] = useState<boolean>(true);

  // Load available filters on mount
  useEffect(() => {
    getCatalogueFilters().then(filters => {
      setAvailableCategories(filters.categories);
      setAvailableMethods(filters.methods);
    });
  }, []);

  // Fetch paginated results whenever query params change
  useEffect(() => {
    let isCancelled = false;
    setLoading(true);

    const timer = setTimeout(() => {
      queryTestsPaginated({
        page,
        pageSize,
        search,
        category,
        method,
        sortBy,
        activeOnly
      }).then(res => {
        if (!isCancelled) {
          setResult(res);
          setLoading(false);
        }
      });
    }, 200); // 200ms debounce for search input

    return () => {
      isCancelled = true;
      clearTimeout(timer);
    };
  }, [page, pageSize, search, category, method, sortBy, activeOnly]);

  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearch(e.target.value);
    setPage(1); // reset to page 1 on new search
  };

  const handleCategoryChange = (cat: string) => {
    setCategory(cat);
    setPage(1);
  };

  const handleMethodChange = (m: string) => {
    setMethod(m);
    setPage(1);
  };

  const handleSortChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    setSortBy(e.target.value as PaginationParams['sortBy']);
    setPage(1);
  };

  return (
    <div className="space-y-6 pb-24">
      {/* Page Title & Context */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
            Diagnostic Test Catalogue
          </h1>
          <p className="text-xs text-slate-500 mt-1">
            Database-backed rate directory with sample requirements and clinical details.
          </p>
        </div>
        <div className="flex items-center gap-2 self-start md:self-auto">
          <label className="text-xs text-slate-600 font-medium flex items-center gap-1.5 cursor-pointer bg-white px-3 py-1.5 rounded-lg border border-slate-200">
            <input
              type="checkbox"
              checked={activeOnly}
              onChange={(e) => { setActiveOnly(e.target.checked); setPage(1); }}
              className="rounded text-[#0F294A] focus:ring-0"
            />
            Active Tests Only
          </label>
        </div>
      </div>

      {/* Database Query & Filtering Console */}
      <div className="bg-white p-4 sm:p-5 rounded-2xl border border-slate-200 shadow-xs space-y-4">
        {/* Row 1: Search & Sorting */}
        <div className="flex flex-col sm:flex-row gap-3">
          <div className="relative flex-1">
            <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              placeholder="Search by test name, test code, or clinical condition..."
              value={search}
              onChange={handleSearchChange}
              className="w-full pl-10 pr-4 py-2 text-xs rounded-xl border border-slate-300 focus:outline-hidden focus:ring-2 focus:ring-[#0F294A]"
            />
            {search && (
              <button
                onClick={() => { setSearch(''); setPage(1); }}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-[10px] text-slate-400 hover:text-slate-700 bg-slate-100 rounded px-1.5 py-0.5"
              >
                Clear
              </button>
            )}
          </div>

          <div className="flex items-center gap-2">
            <div className="relative">
              <select
                value={sortBy}
                onChange={handleSortChange}
                className="pl-3 pr-8 py-2 text-xs rounded-xl border border-slate-300 bg-white font-medium text-slate-700 focus:outline-hidden"
              >
                <option value="name">Sort: Name (A-Z)</option>
                <option value="price_asc">Sort: Price (Low to High)</option>
                <option value="price_desc">Sort: Price (High to Low)</option>
                <option value="reporting_time">Sort: Reporting Time</option>
              </select>
            </div>
          </div>
        </div>

        {/* Row 2: Category Filter Bar */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 text-xs">
          <span className="text-slate-400 font-semibold uppercase tracking-wider text-[10px] shrink-0 mr-1">
            Category:
          </span>
          <button
            onClick={() => handleCategoryChange('All')}
            className={`px-3 py-1 rounded-full whitespace-nowrap font-medium transition-colors ${
              category === 'All' ? 'bg-[#0F294A] text-white' : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
            }`}
          >
            All Categories
          </button>
          {availableCategories.map(cat => (
            <button
              key={cat}
              onClick={() => handleCategoryChange(cat)}
              className={`px-3 py-1 rounded-full whitespace-nowrap font-medium transition-colors ${
                category === cat ? 'bg-[#0F294A] text-white' : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
              }`}
            >
              {cat}
            </button>
          ))}
        </div>

        {/* Row 3: Method Filter Pills if available */}
        {availableMethods.length > 0 && (
          <div className="flex items-center gap-1.5 overflow-x-auto pb-1 text-xs pt-1 border-t border-slate-100">
            <span className="text-slate-400 font-semibold uppercase tracking-wider text-[10px] shrink-0 mr-1 flex items-center gap-1">
              <FlaskConical className="w-3 h-3" /> Method:
            </span>
            <button
              onClick={() => handleMethodChange('All')}
              className={`px-2.5 py-0.5 rounded-md text-[11px] whitespace-nowrap ${
                method === 'All' ? 'bg-emerald-700 text-white font-bold' : 'text-slate-600 hover:bg-slate-100'
              }`}
            >
              Any Method
            </button>
            {availableMethods.map(m => (
              <button
                key={m}
                onClick={() => handleMethodChange(m)}
                className={`px-2.5 py-0.5 rounded-md text-[11px] whitespace-nowrap ${
                  method === m ? 'bg-emerald-700 text-white font-bold' : 'text-slate-600 hover:bg-slate-100'
                }`}
              >
                {m}
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Query Status & Pagination Count */}
      <div className="flex justify-between items-center text-xs text-slate-500 px-1">
        <span>
          Showing <strong className="text-slate-800">{result.items.length}</strong> of{' '}
          <strong className="text-slate-800">{result.total}</strong> database records
        </span>
        <span>
          Page <strong className="text-slate-800">{result.page}</strong> of{' '}
          <strong className="text-slate-800">{result.totalPages}</strong>
        </span>
      </div>

      {/* Tests Grid (Server-side paginated items) */}
      {loading ? (
        <div className="py-20 text-center space-y-3 bg-white rounded-2xl border border-slate-200">
          <RefreshCw className="w-6 h-6 animate-spin text-[#0F294A] mx-auto" />
          <p className="text-xs font-semibold text-slate-600">Querying PostgreSQL database...</p>
        </div>
      ) : result.items.length === 0 ? (
        <div className="py-16 text-center bg-white rounded-2xl border border-dashed border-slate-300 p-8 space-y-3">
          <AlertCircle className="w-8 h-8 text-slate-400 mx-auto" />
          <h4 className="text-sm font-bold text-slate-800">No diagnostic tests match your criteria</h4>
          <p className="text-xs text-slate-500 max-w-sm mx-auto">
            Try adjusting your search terms, changing the category, or clearing method filters.
          </p>
          <button
            onClick={() => { setSearch(''); setCategory('All'); setMethod('All'); setPage(1); }}
            className="text-xs font-bold text-emerald-700 hover:underline pt-2 block mx-auto"
          >
            Reset All Filters
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {result.items.map((record) => {
            const isSelected = selectedTestIds.includes(record.test_id);

            return (
              <div
                key={record.test_id}
                className={`p-5 rounded-2xl border flex flex-col justify-between transition-all ${
                  isSelected
                    ? 'bg-emerald-50/50 border-emerald-500 ring-1 ring-emerald-500 shadow-sm'
                    : 'bg-white border-slate-200 hover:border-slate-300 hover:shadow-xs'
                }`}
              >
                <div className="space-y-3">
                  {/* Category & Test Code */}
                  <div className="flex items-center justify-between gap-2">
                    <Badge variant="green">{record.category}</Badge>
                    <span className="font-mono text-[11px] text-slate-400 font-semibold">
                      {record.test_id}
                    </span>
                  </div>

                  {/* Test Name */}
                  <h3 
                    onClick={() => onNavigate('test-details', record.test_id)}
                    className="text-base font-bold text-slate-900 leading-snug hover:text-[#0F294A] cursor-pointer"
                  >
                    {record.test_name}
                  </h3>

                  {/* Method if present */}
                  {record.method && (
                    <p className="text-[11px] text-slate-500 flex items-center gap-1 font-mono">
                      <span className="text-slate-400">Method:</span> {record.method}
                    </p>
                  )}

                  {/* Clinical Information */}
                  {record.clinical_information ? (
                    <p className="text-xs text-slate-600 line-clamp-2 leading-relaxed">
                      {record.clinical_information}
                    </p>
                  ) : (
                    <p className="text-xs text-amber-700 font-mono">[CONTENT REQUIRED]</p>
                  )}

                  {/* Sample details */}
                  <div className="flex flex-wrap items-center gap-2 pt-1 text-[11px] text-slate-500">
                    {record.sample && (
                      <span className="inline-flex items-center gap-1 bg-slate-100 px-2 py-0.5 rounded">
                        <Droplet className="w-3 h-3 text-red-500" />
                        {record.sample}
                      </span>
                    )}
                    {record.reporting_time && (
                      <span className="inline-flex items-center gap-1 bg-slate-100 px-2 py-0.5 rounded">
                        <Clock className="w-3 h-3 text-slate-400" />
                        {record.reporting_time}
                      </span>
                    )}
                  </div>
                </div>

                {/* Pricing & Actions */}
                <div className="pt-4 mt-4 border-t border-slate-100 flex items-center justify-between">
                  <div>
                    <div className="flex items-baseline gap-1.5">
                      <span className="text-xl font-black text-[#0F294A]">
                        {record.general_price !== null ? `₹${record.general_price}` : '[CONTENT REQUIRED]'}
                      </span>
                      {record.corporate_price !== null && (
                        <span className="text-[11px] text-slate-400 line-through">
                          ₹{record.corporate_price} Corp
                        </span>
                      )}
                    </div>
                    <span className="text-[10px] text-slate-400 font-medium block">
                      Pay at Collection / Visit
                    </span>
                  </div>

                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => onNavigate('test-details', record.test_id)}
                      className="text-xs font-semibold text-slate-600 hover:text-slate-900 underline px-1"
                    >
                      Details
                    </button>

                    <button
                      onClick={() => onToggleTestById(record)}
                      className={`text-xs font-bold px-3 py-1.5 rounded-lg border transition-colors flex items-center gap-1 ${
                        isSelected
                          ? 'bg-emerald-600 text-white border-emerald-600 shadow-xs'
                          : 'bg-white text-slate-700 border-slate-300 hover:bg-slate-50'
                      }`}
                    >
                      {isSelected ? (
                        <>
                          <Check className="w-3.5 h-3.5" />
                          Selected
                        </>
                      ) : (
                        <>
                          <Plus className="w-3.5 h-3.5" />
                          Add
                        </>
                      )}
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Pagination Controls */}
      {result.totalPages > 1 && (
        <div className="flex items-center justify-center gap-3 pt-6">
          <button
            onClick={() => setPage(p => Math.max(1, p - 1))}
            disabled={page === 1}
            className="p-2 rounded-lg border border-slate-300 bg-white text-slate-700 disabled:opacity-40 disabled:cursor-not-allowed hover:bg-slate-50 text-xs font-medium flex items-center gap-1"
          >
            <ChevronLeft className="w-4 h-4" />
            Previous
          </button>

          <div className="flex items-center gap-1">
            {Array.from({ length: result.totalPages }, (_, i) => i + 1).map(p => (
              <button
                key={p}
                onClick={() => setPage(p)}
                className={`w-8 h-8 rounded-lg text-xs font-bold transition-colors ${
                  page === p
                    ? 'bg-[#0F294A] text-white'
                    : 'bg-white text-slate-700 border border-slate-200 hover:bg-slate-50'
                }`}
              >
                {p}
              </button>
            ))}
          </div>

          <button
            onClick={() => setPage(p => Math.min(result.totalPages, p + 1))}
            disabled={page === result.totalPages}
            className="p-2 rounded-lg border border-slate-300 bg-white text-slate-700 disabled:opacity-40 disabled:cursor-not-allowed hover:bg-slate-50 text-xs font-medium flex items-center gap-1"
          >
            Next
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* Floating Selection Banner */}
      {selectedTestIds.length > 0 && (
        <div className="fixed bottom-4 left-4 right-4 z-40 max-w-xl mx-auto">
          <div className="bg-[#0F294A] text-white p-3.5 rounded-2xl shadow-2xl border border-slate-600 flex items-center justify-between">
            <span className="text-xs font-bold">
              {selectedTestIds.length} {selectedTestIds.length === 1 ? 'Test' : 'Tests'} Selected for Appointment
            </span>
            <button
              onClick={onProceedToBooking}
              className="bg-emerald-500 hover:bg-emerald-600 text-slate-950 font-bold px-4 py-2 rounded-xl text-xs transition-all shadow-sm"
            >
              Continue to Book
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
