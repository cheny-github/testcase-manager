import React, { useState, useEffect, useMemo } from 'react';
import { 
  Plus, 
  Trash2, 
  Search, 
  CheckCircle2, 
  XCircle, 
  Clock, 
  PlayCircle,
  Database,
  Layers,
  FolderOpen,
  LayoutDashboard,
  ListTodo,
  ChevronRight,
  Tag as TagIcon
} from 'lucide-react';
import { getAllTestCases, saveTestCase, deleteTestCase, bulkImportTestCases, clearAllTestCases } from './services/db';
import { TestCase, TestStatus } from './types';
import { TestForm } from './components/TestForm';
import { JsonManager } from './components/JsonManager';
import { ReportDashboard } from './components/ReportDashboard';
import { Button } from './components/ui/Button';
import { ConfirmDialog } from './components/ui/ConfirmDialog';

// Utility for status color
const getStatusColor = (status: TestStatus) => {
  switch (status) {
    case TestStatus.PASSING: return 'text-green-600 bg-green-50 border-green-200';
    case TestStatus.FAILING: return 'text-red-600 bg-red-50 border-red-200';
    case TestStatus.SKIPPED: return 'text-slate-500 bg-slate-50 border-slate-200';
    default: return 'text-amber-600 bg-amber-50 border-amber-200';
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
  
  // Tag Filter State (Multi-select)
  const [selectedTags, setSelectedTags] = useState<string[]>([]);
  
  const [statusFilter, setStatusFilter] = useState<TestStatus | 'ALL'>('ALL');
  
  // Iteration Filter State
  const [iterationFilter, setIterationFilter] = useState<string>('ALL');
  
  // View Mode State
  const [viewMode, setViewMode] = useState<'list' | 'report'>('list');

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

  // Derive unique iterations from the dataset
  const uniqueIterations = useMemo(() => {
    const iterations = new Set<string>();
    testCases.forEach(tc => {
        iterations.add(tc.iteration || 'Unassigned');
    });
    return Array.from(iterations).sort();
  }, [testCases]);

  // Derive unique tags from the dataset
  const uniqueTags = useMemo(() => {
    const tags = new Set<string>();
    testCases.forEach(tc => {
        if (Array.isArray(tc.tags)) {
            tc.tags.forEach(t => tags.add(t));
        }
    });
    return Array.from(tags).sort();
  }, [testCases]);

  const toggleTag = (tag: string) => {
    setSelectedTags(prev => 
      prev.includes(tag) 
        ? prev.filter(t => t !== tag) 
        : [...prev, tag]
    );
  };

  // Filtered cases for LIST VIEW
  const listFilteredCases = useMemo(() => {
    return testCases.filter(tc => {
      const searchLower = searchQuery.toLowerCase();
      const matchesSearch = !searchQuery || 
                            tc.title.toLowerCase().includes(searchLower) || 
                            (tc.description || '').toLowerCase().includes(searchLower);
      
      const caseTags = Array.isArray(tc.tags) ? tc.tags : [];
      const matchesTags = selectedTags.length === 0 || selectedTags.every(t => caseTags.includes(t));
      
      const matchesStatus = statusFilter === 'ALL' || tc.status === statusFilter;

      const tcIteration = tc.iteration || 'Unassigned';
      const matchesIteration = iterationFilter === 'ALL' || tcIteration === iterationFilter;
      
      return matchesSearch && matchesTags && matchesStatus && matchesIteration;
    });
  }, [testCases, searchQuery, selectedTags, statusFilter, iterationFilter]);

  const reportFilteredCases = useMemo(() => {
    return testCases.filter(tc => {
       const tcIteration = tc.iteration || 'Unassigned';
       return iterationFilter === 'ALL' || tcIteration === iterationFilter;
    });
  }, [testCases, iterationFilter]);

  const stats = useMemo(() => {
    return {
      total: listFilteredCases.length,
      passing: listFilteredCases.filter(t => t.status === TestStatus.PASSING).length,
      failing: listFilteredCases.filter(t => t.status === TestStatus.FAILING).length,
      draft: listFilteredCases.filter(t => t.status === TestStatus.DRAFT).length,
    };
  }, [listFilteredCases]);

  return (
    <div className="flex flex-col h-screen bg-slate-50 text-slate-900 font-sans">
      
      {/* Top Navbar */}
      <header className="h-14 border-b border-slate-200 bg-white flex items-center justify-between px-6 shrink-0 z-10">
        <div className="flex items-center gap-3">
          <div className="bg-blue-600 p-1.5 rounded-lg shadow-sm">
            <Database size={18} className="text-white" />
          </div>
          <div>
            <h1 className="font-extrabold text-base tracking-tight text-slate-900 leading-none">TestCase Hub</h1>
            <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider mt-0.5">TDD Management System</p>
          </div>
        </div>
        
        <div className="flex items-center gap-2">
          <Button 
            variant="secondary" 
            onClick={() => setShowJsonManager(!showJsonManager)}
            className={`text-xs px-3 py-1.5 ${showJsonManager ? 'bg-slate-100' : ''}`}
          >
            {showJsonManager ? 'Back to List' : 'Data Operations'}
          </Button>
          <div className="w-px h-5 bg-slate-200 mx-1"></div>
          <Button 
            onClick={() => {
              setEditingCase(null);
              setIsFormOpen(true);
            }} 
            icon={<Plus size={16} />}
            className="text-xs px-4 py-1.5 font-bold"
          >
            Create Case
          </Button>
        </div>
      </header>

      {/* Main Content Area */}
      <div className="flex flex-1 overflow-hidden">
        
        {/* Sidebar */}
        <aside className="w-56 bg-white border-r border-slate-200 flex-col hidden md:flex shrink-0 shadow-[1px_0_0_0_rgba(0,0,0,0.03)]">
          <div className="p-4 flex-1 overflow-y-auto custom-scrollbar space-y-6">
            
            {/* View Mode Toggle */}
            <div className="bg-slate-100 p-1 rounded-lg flex gap-1">
                <button 
                  onClick={() => setViewMode('list')}
                  className={`flex-1 py-1.5 px-2 text-xs font-bold rounded flex items-center justify-center gap-1.5 transition-all ${viewMode === 'list' ? 'bg-white text-blue-600 shadow-sm border border-slate-200/50' : 'text-slate-500 hover:text-slate-900'}`}
                >
                    <ListTodo size={14} /> Cards
                </button>
                <button 
                  onClick={() => setViewMode('report')}
                  className={`flex-1 py-1.5 px-2 text-xs font-bold rounded flex items-center justify-center gap-1.5 transition-all ${viewMode === 'report' ? 'bg-white text-blue-600 shadow-sm border border-slate-200/50' : 'text-slate-500 hover:text-slate-900'}`}
                >
                    <LayoutDashboard size={14} /> Metrics
                </button>
            </div>

            {/* Version Scopes */}
            <div>
              <h3 className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-3 px-2">Project Version</h3>
              <nav className="space-y-0.5">
                  <button
                      onClick={() => setIterationFilter('ALL')}
                      className={`w-full flex items-center px-3 py-2 text-xs font-bold rounded-lg transition-colors ${
                          iterationFilter === 'ALL'
                          ? 'bg-blue-50 text-blue-700'
                          : 'text-slate-500 hover:bg-slate-50'
                      }`}
                  >
                      <FolderOpen size={14} className="mr-3 opacity-70" />
                      All Iterations
                  </button>
                  {uniqueIterations.map(iter => (
                      <button
                          key={iter}
                          onClick={() => setIterationFilter(iter)}
                          className={`w-full flex items-center px-3 py-2 text-xs font-bold rounded-lg transition-colors ${
                              iterationFilter === iter
                              ? 'bg-blue-50 text-blue-700'
                              : 'text-slate-500 hover:bg-slate-50'
                          }`}
                      >
                          <Layers size={14} className="mr-3 opacity-40" />
                          <span className="truncate">{iter}</span>
                      </button>
                  ))}
              </nav>
            </div>

            {/* Status Filters */}
            {viewMode === 'list' && (
                <div>
                <h3 className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-3 px-2">Test State</h3>
                <nav className="space-y-0.5">
                  {[
                    { label: 'All Cases', value: 'ALL', icon: Database },
                    { label: 'Passing', value: TestStatus.PASSING, icon: CheckCircle2, color: 'text-green-600' },
                    { label: 'Failing', value: TestStatus.FAILING, icon: XCircle, color: 'text-red-600' },
                    { label: 'Skipped', value: TestStatus.SKIPPED, icon: Clock, color: 'text-slate-500' },
                    { label: 'In Draft', value: TestStatus.DRAFT, icon: PlayCircle, color: 'text-amber-600' },
                  ].map((item) => (
                    <button
                      key={item.value}
                      onClick={() => setStatusFilter(item.value as TestStatus | 'ALL')}
                      className={`w-full flex items-center px-3 py-2 text-xs font-bold rounded-lg transition-colors ${
                        statusFilter === item.value 
                          ? 'bg-slate-100 text-slate-900' 
                          : 'text-slate-500 hover:bg-slate-50'
                      }`}
                    >
                      <item.icon size={14} className={`mr-3 ${item.color || 'opacity-40'}`} />
                      {item.label}
                    </button>
                  ))}
                </nav>
                </div>
            )}

            {/* Tags Filters */}
            {viewMode === 'list' && uniqueTags.length > 0 && (
                <div>
                <div className="flex items-center justify-between mb-3 px-2">
                    <h3 className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Tags</h3>
                    {selectedTags.length > 0 && (
                        <button onClick={() => setSelectedTags([])} className="text-[9px] text-blue-600 font-black hover:underline">
                            CLEAR
                        </button>
                    )}
                </div>
                <div className="flex flex-wrap gap-1 px-1">
                    {uniqueTags.map(tag => (
                        <button
                            key={tag}
                            onClick={() => toggleTag(tag)}
                            className={`px-2 py-1 text-[10px] font-bold rounded-md transition-all border ${
                                selectedTags.includes(tag)
                                ? 'bg-blue-600 text-white border-blue-600'
                                : 'bg-white text-slate-500 border-slate-200 hover:bg-slate-50'
                            }`}
                        >
                            {tag}
                        </button>
                    ))}
                </div>
                </div>
            )}
          </div>
          
          <div className="mt-auto p-4 border-t border-slate-100">
             <button onClick={handleClearDbClick} className="w-full py-2 text-[10px] text-slate-300 hover:text-red-500 flex items-center justify-center gap-2 transition-colors font-black uppercase tracking-tighter">
                <Trash2 size={12} /> Clear Database
             </button>
          </div>
        </aside>

        {/* Main Area */}
        <main className="flex-1 flex flex-col min-w-0 bg-slate-50/50">
          
          {showJsonManager ? (
            <div className="p-6 h-full bg-slate-50/30">
              <JsonManager 
                testCases={testCases} 
                onImport={handleBulkImport} 
                onClose={() => setShowJsonManager(false)} 
              />
            </div>
          ) : viewMode === 'report' ? (
             <ReportDashboard 
                testCases={reportFilteredCases} 
                iterationName={iterationFilter === 'ALL' ? 'Entire Project' : iterationFilter}
             />
          ) : (
            <>
              {/* Toolbar */}
              <div className="h-12 border-b border-slate-200 flex items-center px-6 gap-4 shrink-0 bg-white shadow-[0_1px_2px_rgba(0,0,0,0.02)]">
                <div className="relative flex-1 max-w-sm">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={13} />
                  <input 
                    type="text" 
                    placeholder="Search titles, scenarios..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-100 text-xs font-medium text-slate-900 rounded-lg py-1.5 pl-9 pr-4 focus:ring-1 focus:ring-blue-500 focus:bg-white outline-none transition-all placeholder:text-slate-300"
                  />
                </div>
                
                <div className="flex items-center gap-4 text-[10px] font-bold text-slate-400 ml-auto uppercase tracking-widest">
                    <span>{listFilteredCases.length} Cases</span>
                    <div className="flex items-center gap-3">
                        <span className="flex items-center gap-1.5"><span className="w-1.5 h-1.5 rounded-full bg-green-500"></span> {stats.passing}</span>
                        <span className="flex items-center gap-1.5"><span className="w-1.5 h-1.5 rounded-full bg-red-500"></span> {stats.failing}</span>
                    </div>
                </div>
              </div>

              {/* Grid Layout for Cards */}
              <div className="flex-1 overflow-y-auto custom-scrollbar p-6">
                {loading ? (
                  <div className="flex flex-col items-center justify-center h-64 text-slate-400 text-sm">
                    <Loader2 className="w-6 h-6 animate-spin mb-4" />
                    <span>Synchronizing database...</span>
                  </div>
                ) : listFilteredCases.length === 0 ? (
                  <div className="flex flex-col items-center justify-center h-full text-slate-300">
                    <div className="w-20 h-20 bg-slate-100 rounded-3xl flex items-center justify-center mb-4">
                        <Database size={32} className="opacity-20" />
                    </div>
                    <p className="text-sm font-bold">No test cases found in this view</p>
                    <p className="text-xs mt-1">Adjust filters or create a new case</p>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                    {listFilteredCases.map(tc => (
                      <div 
                        key={tc.id} 
                        onClick={() => {
                          setEditingCase(tc);
                          setIsFormOpen(true);
                        }}
                        className="group relative bg-white border border-slate-200 rounded-xl p-4 shadow-sm hover:shadow-md hover:border-blue-200 transition-all cursor-pointer flex flex-col min-h-[160px]"
                      >
                        {/* Status Icon & Version */}
                        <div className="flex items-center justify-between mb-3">
                            <div className={`w-8 h-8 rounded-lg flex items-center justify-center border shadow-sm transition-transform group-hover:scale-105 ${getStatusColor(tc.status)}`}>
                                {getStatusIcon(tc.status)}
                            </div>
                            <span className="text-[9px] font-black text-slate-500 bg-slate-50 px-2 py-0.5 rounded border border-slate-100 uppercase tracking-tighter">
                                {tc.iteration || 'v1.0'}
                            </span>
                        </div>

                        {/* Title & Description */}
                        <div className="flex-1">
                            <h3 className="font-bold text-slate-900 line-clamp-2 text-sm mb-1 group-hover:text-blue-600 transition-colors">
                                {tc.title}
                            </h3>
                            <p className="text-[11px] text-slate-400 line-clamp-2 font-medium leading-relaxed">
                                {tc.description || <span className="italic opacity-50">No scenario details provided</span>}
                            </p>
                        </div>

                        {/* Footer: Tags & Actions */}
                        <div className="mt-4 pt-3 border-t border-slate-50 flex items-center justify-between gap-2">
                            <div className="flex flex-wrap gap-1 overflow-hidden h-5">
                                {(tc.tags || []).slice(0, 2).map(tag => (
                                    <span key={tag} className="inline-flex items-center gap-1 text-[9px] px-1.5 py-0.5 bg-blue-50 text-blue-600 rounded font-bold uppercase whitespace-nowrap">
                                        <TagIcon size={8} />
                                        {tag}
                                    </span>
                                ))}
                                {tc.tags.length > 2 && <span className="text-[9px] text-slate-300 font-bold">+{tc.tags.length - 2}</span>}
                            </div>
                            
                            <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-all">
                                <button 
                                    onClick={(e) => handleDeleteClick(tc.id, e)}
                                    className="p-1.5 text-slate-300 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors"
                                    title="Delete Case"
                                >
                                    <Trash2 size={13} />
                                </button>
                                <div className="p-1 text-slate-300">
                                    <ChevronRight size={14} />
                                </div>
                            </div>
                        </div>
                        
                        {tc.status === TestStatus.FAILING && (
                            <div className="absolute -top-1.5 -right-1.5 flex h-4 items-center bg-red-600 text-white text-[8px] px-1.5 rounded-full font-black uppercase tracking-widest shadow-lg shadow-red-100">
                                ERROR
                            </div>
                        )}
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
        defaultIteration={iterationFilter}
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

const Loader2 = ({ className, size }: { className?: string, size?: number }) => (
    <svg 
        xmlns="http://www.w3.org/2000/svg" 
        width={size || 24} 
        height={size || 24} 
        viewBox="0 0 24 24" 
        fill="none" 
        stroke="currentColor" 
        strokeWidth="2.5" 
        strokeLinecap="round" 
        strokeLinejoin="round" 
        className={className}
    >
        <path d="M21 12a9 9 0 1 1-6.219-8.56" />
    </svg>
);

export default App;