import React, { useState, useEffect, useMemo } from 'react';
import { 
  Plus, 
  Trash2, 
  Edit3, 
  Filter, 
  Search, 
  CheckCircle2, 
  XCircle, 
  Clock, 
  PlayCircle,
  MoreVertical,
  Database,
  Tag,
  ArrowRight
} from 'lucide-react';
import { getAllTestCases, saveTestCase, deleteTestCase, bulkImportTestCases, clearAllTestCases } from './services/db';
import { TestCase, TestStatus } from './types';
import { TestForm } from './components/TestForm';
import { JsonManager } from './components/JsonManager';
import { Button } from './components/ui/Button';
import { ConfirmDialog } from './components/ui/ConfirmDialog';

// Utility for status color
const getStatusColor = (status: TestStatus) => {
  switch (status) {
    case TestStatus.PASSING: return 'text-green-700 bg-green-50 border-green-200';
    case TestStatus.FAILING: return 'text-red-700 bg-red-50 border-red-200';
    case TestStatus.SKIPPED: return 'text-gray-600 bg-gray-100 border-gray-200';
    default: return 'text-amber-700 bg-amber-50 border-amber-200';
  }
};

const getStatusIcon = (status: TestStatus) => {
  switch (status) {
    case TestStatus.PASSING: return <CheckCircle2 size={16} />;
    case TestStatus.FAILING: return <XCircle size={16} />;
    case TestStatus.SKIPPED: return <Clock size={16} />;
    default: return <PlayCircle size={16} />;
  }
};

const App: React.FC = () => {
  const [testCases, setTestCases] = useState<TestCase[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [tagSearchQuery, setTagSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<TestStatus | 'ALL'>('ALL');
  
  // UI State
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingCase, setEditingCase] = useState<TestCase | null>(null);
  const [showJsonManager, setShowJsonManager] = useState(false);

  // Confirmation Dialog State
  const [confirmConfig, setConfirmConfig] = useState<{
    isOpen: boolean;
    title: string;
    description: string;
    variant: 'danger' | 'primary';
    action: () => Promise<void>;
  }>({
    isOpen: false,
    title: '',
    description: '',
    variant: 'danger',
    action: async () => {},
  });
  const [isConfirming, setIsConfirming] = useState(false);

  const refreshData = async () => {
    setLoading(true);
    try {
      const data = await getAllTestCases();
      // Sort by updated recently
      setTestCases(data.sort((a, b) => b.updatedAt - a.updatedAt));
    } catch (error) {
      console.error("Failed to load data", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    refreshData();
  }, []);

  const handleSave = async (testCase: TestCase) => {
    await saveTestCase(testCase);
    await refreshData();
    setIsFormOpen(false);
    setEditingCase(null);
  };

  const handleDeleteClick = (id: string, e: React.MouseEvent) => {
    // Critical: Stop the click from bubbling to the card which would open the edit form
    e.stopPropagation();
    e.preventDefault();

    if (!id) return;

    setConfirmConfig({
      isOpen: true,
      title: 'Delete Test Case',
      description: 'Are you sure you want to delete this test case? This action cannot be undone.',
      variant: 'danger',
      action: async () => {
        try {
          await deleteTestCase(id);
          await refreshData();
        } catch (err) {
          console.error("Delete failed:", err);
        }
      }
    });
  };

  const handleClearDbClick = () => {
    setConfirmConfig({
      isOpen: true,
      title: 'Clear Database',
      description: 'WARNING: This will permanently delete ALL test cases from your local database. This action cannot be undone.',
      variant: 'danger',
      action: async () => {
        await clearAllTestCases();
        await refreshData();
      }
    });
  };

  const executeConfirmAction = async () => {
    setIsConfirming(true);
    try {
      await confirmConfig.action();
    } finally {
      setIsConfirming(false);
      setConfirmConfig(prev => ({ ...prev, isOpen: false }));
    }
  };

  const handleBulkImport = async (newCases: TestCase[]) => {
    await bulkImportTestCases(newCases);
    await refreshData();
    setShowJsonManager(false);
  };

  const filteredCases = useMemo(() => {
    return testCases.filter(tc => {
      // Title or Description Search
      const searchLower = searchQuery.toLowerCase();
      const matchesSearch = !searchQuery || 
                            tc.title.toLowerCase().includes(searchLower) || 
                            (tc.description || '').toLowerCase().includes(searchLower);
      
      // Tag Search
      const tagSearchLower = tagSearchQuery.toLowerCase();
      // Ensure tags exists and is an array before calling some to handle legacy data
      const tags = Array.isArray(tc.tags) ? tc.tags : [];
      const matchesTag = !tagSearchQuery || tags.some(t => t.toLowerCase().includes(tagSearchLower));
      
      const matchesStatus = statusFilter === 'ALL' || tc.status === statusFilter;
      
      return matchesSearch && matchesTag && matchesStatus;
    });
  }, [testCases, searchQuery, tagSearchQuery, statusFilter]);

  const stats = useMemo(() => {
    return {
      total: testCases.length,
      passing: testCases.filter(t => t.status === TestStatus.PASSING).length,
      failing: testCases.filter(t => t.status === TestStatus.FAILING).length,
      draft: testCases.filter(t => t.status === TestStatus.DRAFT).length,
    };
  }, [testCases]);

  return (
    <div className="flex flex-col h-screen bg-gray-50 text-gray-900 font-sans">
      
      {/* Top Navbar */}
      <header className="h-16 border-b border-gray-200 bg-white/80 backdrop-blur-md flex items-center justify-between px-6 shrink-0 z-10 shadow-sm">
        <div className="flex items-center gap-3">
          <div className="bg-blue-600 p-2 rounded-lg shadow-sm">
            <Database size={20} className="text-white" />
          </div>
          <div>
            <h1 className="font-bold text-lg tracking-tight text-gray-900">TDD Nexus</h1>
            <p className="text-xs text-gray-500">Test Driven Development Manager</p>
          </div>
        </div>
        
        <div className="flex items-center gap-3">
          <Button 
            variant="secondary" 
            onClick={() => setShowJsonManager(!showJsonManager)}
            className={showJsonManager ? 'bg-gray-100 border-gray-400' : ''}
          >
            {showJsonManager ? 'Close JSON Tool' : 'Import / Export'}
          </Button>
          <div className="w-px h-6 bg-gray-300 mx-2"></div>
          <Button 
            onClick={() => {
              setEditingCase(null);
              setIsFormOpen(true);
            }} 
            icon={<Plus size={18} />}
          >
            New Test Case
          </Button>
        </div>
      </header>

      {/* Main Content Area */}
      <div className="flex flex-1 overflow-hidden">
        
        {/* Sidebar / Stats */}
        <aside className="w-64 bg-white border-r border-gray-200 flex-col hidden md:flex shrink-0">
          <div className="p-6">
            <h3 className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-4">Dashboard</h3>
            <div className="grid grid-cols-2 gap-3 mb-6">
              <div className="bg-gray-50 p-3 rounded-lg border border-gray-200">
                <div className="text-2xl font-bold text-gray-800">{stats.total}</div>
                <div className="text-xs text-gray-500">Total Cases</div>
              </div>
              <div className="bg-green-50 p-3 rounded-lg border border-green-100">
                <div className="text-2xl font-bold text-green-600">{stats.passing}</div>
                <div className="text-xs text-green-600/80">Passing</div>
              </div>
              <div className="bg-red-50 p-3 rounded-lg border border-red-100">
                <div className="text-2xl font-bold text-red-600">{stats.failing}</div>
                <div className="text-xs text-red-600/80">Failing</div>
              </div>
              <div className="bg-amber-50 p-3 rounded-lg border border-amber-100">
                <div className="text-2xl font-bold text-amber-600">{stats.draft}</div>
                <div className="text-xs text-amber-600/80">Draft</div>
              </div>
            </div>

            <h3 className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-4">Quick Filters</h3>
            <nav className="space-y-1">
              {[
                { label: 'All Cases', value: 'ALL', icon: Database },
                { label: 'Passing', value: TestStatus.PASSING, icon: CheckCircle2, color: 'text-green-600' },
                { label: 'Failing', value: TestStatus.FAILING, icon: XCircle, color: 'text-red-600' },
                { label: 'Drafts', value: TestStatus.DRAFT, icon: Edit3, color: 'text-amber-600' },
              ].map((item) => (
                <button
                  key={item.value}
                  onClick={() => setStatusFilter(item.value as TestStatus | 'ALL')}
                  className={`w-full flex items-center px-3 py-2 text-sm font-medium rounded-lg transition-colors ${
                    statusFilter === item.value 
                      ? 'bg-blue-50 text-blue-600 border border-blue-200' 
                      : 'text-gray-500 hover:bg-gray-100 hover:text-gray-900'
                  }`}
                >
                  <item.icon size={16} className={`mr-3 ${item.color || ''}`} />
                  {item.label}
                </button>
              ))}
            </nav>
          </div>
          
          <div className="mt-auto p-6 border-t border-gray-200">
             <button onClick={handleClearDbClick} className="text-xs text-red-500 hover:text-red-700 flex items-center gap-2 transition-colors font-medium">
                <Trash2 size={12} /> Clear Database
             </button>
          </div>
        </aside>

        {/* Main List Area */}
        <main className="flex-1 flex flex-col min-w-0 bg-gray-50">
          
          {showJsonManager ? (
            <div className="p-6 h-full">
              <JsonManager 
                testCases={testCases} 
                onImport={handleBulkImport} 
                onClose={() => setShowJsonManager(false)} 
              />
            </div>
          ) : (
            <>
              {/* Filter Bar */}
              <div className="h-16 border-b border-gray-200 flex items-center px-6 gap-4 shrink-0 bg-white/50 backdrop-blur-sm">
                
                {/* Text Search */}
                <div className="relative flex-1 max-w-sm">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={16} />
                  <input 
                    type="text" 
                    placeholder="Search title or description..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="w-full bg-white border border-gray-300 text-gray-900 text-sm rounded-full py-1.5 pl-10 pr-4 focus:ring-2 focus:ring-blue-600 focus:border-transparent outline-none transition-all shadow-sm placeholder:text-gray-400"
                  />
                </div>

                {/* Tag Search - NEW */}
                <div className="relative flex-1 max-w-xs">
                  <Tag className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={16} />
                  <input 
                    type="text" 
                    placeholder="Filter by tag..."
                    value={tagSearchQuery}
                    onChange={(e) => setTagSearchQuery(e.target.value)}
                    className="w-full bg-white border border-gray-300 text-gray-900 text-sm rounded-full py-1.5 pl-10 pr-4 focus:ring-2 focus:ring-blue-600 focus:border-transparent outline-none transition-all shadow-sm placeholder:text-gray-400"
                  />
                </div>

                <div className="flex items-center gap-2 md:hidden">
                  <button className="p-2 text-gray-500 hover:bg-gray-100 rounded-lg">
                    <Filter size={18} />
                  </button>
                </div>
              </div>

              {/* Scrollable List */}
              <div className="flex-1 overflow-y-auto p-6 custom-scrollbar">
                {loading ? (
                  <div className="flex items-center justify-center h-64 text-gray-500">
                    Loading database...
                  </div>
                ) : filteredCases.length === 0 ? (
                  <div className="flex flex-col items-center justify-center h-full text-gray-400 opacity-80">
                    <Database size={48} className="mb-4 text-gray-300" />
                    <p className="text-lg font-medium text-gray-600">No test cases found</p>
                    <p className="text-sm">Create a new one or adjust filters</p>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-5">
                    {filteredCases.map(tc => (
                      <div 
                        key={tc.id} 
                        onClick={() => {
                          setEditingCase(tc);
                          setIsFormOpen(true);
                        }}
                        className="group bg-white border border-gray-200 rounded-xl p-5 hover:border-blue-400 transition-all cursor-pointer shadow-sm hover:shadow-md flex flex-col relative h-[320px]"
                      >
                        {/* Header: Status & Actions */}
                        <div className="flex justify-between items-start mb-3">
                          <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold border ${getStatusColor(tc.status)}`}>
                            {getStatusIcon(tc.status)}
                            {tc.status}
                          </span>
                          
                          <div className="flex items-center gap-2">
                             <span className="text-[10px] text-gray-400 font-mono">
                                {new Date(tc.updatedAt).toLocaleDateString()}
                             </span>
                             <button 
                              onClick={(e) => handleDeleteClick(tc.id, e)}
                              title="Delete Test Case"
                              className="p-1.5 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-md transition-colors z-20 opacity-60 hover:opacity-100"
                            >
                              <Trash2 size={14} />
                            </button>
                          </div>
                        </div>
                        
                        {/* Main Content */}
                        <div className="flex-1 min-h-0 flex flex-col">
                            <h3 className="font-semibold text-gray-900 mb-2 leading-snug line-clamp-2 group-hover:text-blue-600 transition-colors text-base">
                              {tc.title}
                            </h3>
                            
                            <p className="text-sm text-gray-500 line-clamp-2 mb-4 h-[40px]">
                              {tc.description || <span className="italic text-gray-400">No description provided</span>}
                            </p>

                            {/* Data Preview Box */}
                            <div className="bg-gray-50 rounded-lg p-3 border border-gray-200 font-mono text-xs space-y-2 mt-auto mb-1">
                                <div className="flex items-start gap-2.5">
                                  <span className="text-blue-600/80 font-bold uppercase tracking-wider text-[10px] min-w-[24px] pt-0.5">In</span>
                                  <span className="text-gray-700 truncate block flex-1 border-b border-dashed border-gray-300 pb-0.5" title={tc.input}>
                                    {tc.input || <span className="text-gray-400 italic">Empty</span>}
                                  </span>
                                </div>
                                <div className="flex items-start gap-2.5">
                                   <span className="text-green-600/80 font-bold uppercase tracking-wider text-[10px] min-w-[24px] pt-0.5">Out</span>
                                   <span className="text-gray-700 truncate block flex-1" title={tc.expectedOutput}>
                                    {tc.expectedOutput || <span className="text-gray-400 italic">Empty</span>}
                                   </span>
                                </div>
                            </div>
                        </div>

                        {/* Footer: Tags */}
                        <div className="flex items-center gap-2 overflow-hidden mt-3 pt-3 border-t border-gray-100">
                          <div className="flex flex-wrap gap-1.5 h-[24px] overflow-hidden content-center">
                            {(tc.tags || []).length > 0 ? (
                                (tc.tags || []).map(tag => (
                                  <span key={tag} className="text-[10px] px-2 py-0.5 bg-gray-100 text-gray-600 rounded-full border border-gray-200 truncate max-w-[100px]">
                                    {tag}
                                  </span>
                                ))
                            ) : (
                              <span className="text-[10px] text-gray-400 italic">No tags</span>
                            )}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </>
          )}
        </main>
      </div>

      {/* Slide-over Form */}
      <TestForm 
        isOpen={isFormOpen} 
        onClose={() => {
          setIsFormOpen(false);
          setEditingCase(null);
        }}
        onSave={handleSave}
        initialData={editingCase}
      />

      {/* Confirmation Dialog */}
      <ConfirmDialog 
        isOpen={confirmConfig.isOpen}
        title={confirmConfig.title}
        description={confirmConfig.description}
        variant={confirmConfig.variant}
        onConfirm={executeConfirmAction}
        onCancel={() => setConfirmConfig(prev => ({ ...prev, isOpen: false }))}
        isLoading={isConfirming}
      />
    </div>
  );
};

export default App;