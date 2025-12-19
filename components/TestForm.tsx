import React, { useState, useEffect } from 'react';
import { X, Save, AlertCircle, Layers, CheckCircle2, XCircle, Clock, PlayCircle, Edit3, Eye, Calendar, Terminal, Target, Info } from 'lucide-react';
import { TestCase, TestStatus, NewTestCase } from '../types';
import { Button } from './ui/Button';

interface TestFormProps {
  initialData?: TestCase | null;
  isOpen: boolean;
  onClose: () => void;
  onSave: (testCase: TestCase) => Promise<void>;
  defaultIteration?: string; 
}

const STATUS_CONFIG = {
  [TestStatus.DRAFT]: { label: 'Draft', icon: PlayCircle, color: 'amber' },
  [TestStatus.PASSING]: { label: 'Passing', icon: CheckCircle2, color: 'green' },
  [TestStatus.FAILING]: { label: 'Failing', icon: XCircle, color: 'red' },
  [TestStatus.SKIPPED]: { label: 'Skipped', icon: Clock, color: 'gray' },
};

export const TestForm: React.FC<TestFormProps> = ({ initialData, isOpen, onClose, onSave, defaultIteration }) => {
  const [isEditing, setIsEditing] = useState(false);
  const [formData, setFormData] = useState<NewTestCase>({
    title: '',
    description: '',
    input: '',
    expectedOutput: '',
    status: TestStatus.DRAFT,
    failureReason: '',
    tags: [],
    iteration: ''
  });
  const [tagInput, setTagInput] = useState('');
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (isOpen) {
      if (initialData) {
        setFormData({
          title: initialData.title,
          description: initialData.description,
          input: initialData.input,
          expectedOutput: initialData.expectedOutput,
          status: initialData.status,
          failureReason: initialData.failureReason || '',
          tags: initialData.tags || [],
          iteration: initialData.iteration || 'Unassigned'
        });
        setIsEditing(false);
      } else {
        setFormData({
          title: '',
          description: '',
          input: '',
          expectedOutput: '',
          status: TestStatus.DRAFT,
          failureReason: '',
          tags: [],
          iteration: defaultIteration && defaultIteration !== 'ALL' ? defaultIteration : 'v1.0'
        });
        setIsEditing(true);
      }
    }
    setError(null);
  }, [isOpen, initialData, defaultIteration]);

  useEffect(() => {
    const handleEscKey = (event: KeyboardEvent) => {
      if (event.key === 'Escape') onClose();
    };
    if (isOpen) document.addEventListener('keydown', handleEscKey);
    return () => document.removeEventListener('keydown', handleEscKey);
  }, [isOpen, onClose]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!formData.title.trim()) {
      setError("Title is required");
      return;
    }

    try {
      const now = Date.now();
      const testCase: TestCase = {
        id: initialData ? initialData.id : crypto.randomUUID(),
        ...formData,
        iteration: formData.iteration.trim() || 'Unassigned',
        createdAt: initialData ? initialData.createdAt : now,
        updatedAt: now,
      };
      await onSave(testCase);
      onClose();
    } catch (err) {
      setError("Failed to save test case.");
    }
  };

  const handleAddTag = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && tagInput.trim()) {
      e.preventDefault();
      if (!formData.tags.includes(tagInput.trim())) {
        setFormData(prev => ({ ...prev, tags: [...prev.tags, tagInput.trim()] }));
      }
      setTagInput('');
    }
  };

  const removeTag = (tagToRemove: string) => {
    setFormData(prev => ({ ...prev, tags: prev.tags.filter(t => t !== tagToRemove) }));
  };

  const setStatus = (status: TestStatus) => {
    setFormData(prev => ({ ...prev, status }));
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 backdrop-blur-sm p-4 sm:p-6 transition-all duration-300">
      <div className="bg-white border border-slate-200 w-full max-w-5xl rounded-xl shadow-2xl flex flex-col max-h-[92vh] overflow-hidden">
        
        {/* Header - Clean & Focused */}
        <div className="flex items-center justify-between px-6 py-3 border-b border-slate-100 bg-white sticky top-0 z-10">
          <div className="flex items-center gap-3">
            <div className={`w-10 h-10 rounded-lg flex items-center justify-center transition-colors shadow-sm ${formData.status === TestStatus.FAILING ? 'bg-red-50 text-red-600 border border-red-100' : 'bg-blue-50 text-blue-600 border border-blue-100'}`}>
              <Layers size={20} />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-lg font-bold text-slate-900 tracking-tight leading-tight">
                  {isEditing ? (initialData ? 'Edit Test Case' : 'New Test Case') : 'Preview Case'}
                </h2>
                {!isEditing && <span className="text-[10px] text-slate-400 font-bold uppercase tracking-widest bg-slate-50 px-1.5 py-0.5 rounded border border-slate-100">#{initialData?.id.slice(0, 8)}</span>}
              </div>
              <p className="text-[11px] text-slate-400 font-semibold flex items-center gap-1.5 mt-0.5">
                <span className={`w-1.5 h-1.5 rounded-full ${isEditing ? 'bg-amber-500 animate-pulse' : 'bg-blue-500'}`}></span>
                {isEditing ? 'MODIFYING DATA' : 'READ-ONLY VIEW'}
              </p>
            </div>
          </div>
          
          <div className="flex items-center gap-2">
            {initialData && (
              <button 
                type="button"
                onClick={() => setIsEditing(!isEditing)} 
                className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-bold transition-all border ${isEditing ? 'bg-blue-600 text-white border-blue-600' : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-50'}`}
              >
                {isEditing ? <Eye size={14} /> : <Edit3 size={14} />}
                {isEditing ? 'View Mode' : 'Edit Fields'}
              </button>
            )}
            <div className="w-px h-6 bg-slate-100 mx-1"></div>
            <button onClick={onClose} className="text-slate-400 hover:text-slate-900 transition-colors p-2 hover:bg-slate-50 rounded-full">
              <X size={20} />
            </button>
          </div>
        </div>

        {/* Scrollable Content */}
        <div className="flex-1 overflow-y-auto p-6 md:p-8 custom-scrollbar bg-slate-50/10">
          {error && (
            <div className="mb-6 bg-red-50 border border-red-100 text-red-700 p-4 rounded-lg flex items-center text-sm font-medium shadow-sm">
              <AlertCircle className="w-5 h-5 mr-3 flex-shrink-0" />
              {error}
            </div>
          )}

          <form id="test-case-form" onSubmit={handleSubmit} className="space-y-6">
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
              
              {/* Left Column: Metadata & Status Control */}
              <div className="lg:col-span-5 space-y-6">
                
                {/* Title Section */}
                <div>
                  <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-[0.15em] mb-2">Test Name</label>
                  {isEditing ? (
                    <input
                      type="text"
                      value={formData.title}
                      onChange={e => setFormData({ ...formData, title: e.target.value })}
                      className="w-full bg-white border border-slate-200 rounded-lg px-4 py-2 text-slate-900 font-bold text-base focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all placeholder:text-slate-200 shadow-sm"
                      placeholder="Enter a descriptive title..."
                      autoFocus
                    />
                  ) : (
                    <div className="text-xl font-extrabold text-slate-900 leading-tight">{formData.title}</div>
                  )}
                </div>

                {/* Status Switcher - Priority Visual */}
                <div>
                  <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-[0.15em] mb-2">Result Status</label>
                  <div className="flex items-center gap-1 bg-white p-1 rounded-xl border border-slate-200 shadow-sm">
                    {(Object.entries(STATUS_CONFIG) as [TestStatus, typeof STATUS_CONFIG[TestStatus]][]).map(([status, config]) => {
                      const isActive = formData.status === status;
                      const Icon = config.icon;
                      
                      const colorStyles = {
                        amber: isActive ? 'bg-amber-500 text-white shadow-sm' : 'text-amber-700 hover:bg-slate-50',
                        green: isActive ? 'bg-green-600 text-white shadow-sm' : 'text-green-700 hover:bg-slate-50',
                        red: isActive ? 'bg-red-600 text-white shadow-sm' : 'text-red-700 hover:bg-slate-50',
                        gray: isActive ? 'bg-slate-600 text-white shadow-sm' : 'text-slate-500 hover:bg-slate-50',
                      }[config.color];

                      return (
                        <button
                          key={status}
                          type="button"
                          onClick={() => setStatus(status)}
                          className={`flex-1 flex flex-col items-center justify-center gap-1 py-2 rounded-lg text-[10px] font-black transition-all ${isActive ? '' : 'text-slate-400'} ${colorStyles}`}
                        >
                          <Icon size={14} />
                          {config.label}
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* Info Grid */}
                <div className="grid grid-cols-2 gap-4">
                  <div className="bg-white p-3 rounded-xl border border-slate-100 shadow-sm">
                    <label className="flex items-center gap-2 text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1.5">
                      <Layers size={11} /> Version
                    </label>
                    {isEditing ? (
                      <input
                        type="text"
                        value={formData.iteration}
                        onChange={e => setFormData({ ...formData, iteration: e.target.value })}
                        className="w-full bg-slate-50 border border-slate-100 rounded-lg px-3 py-1 text-xs text-slate-900 focus:ring-1 focus:ring-blue-500 outline-none"
                        placeholder="v1.0"
                      />
                    ) : (
                      <div className="text-sm font-bold text-slate-700 truncate">{formData.iteration || 'Unassigned'}</div>
                    )}
                  </div>
                  <div className="bg-white p-3 rounded-xl border border-slate-100 shadow-sm">
                    <label className="flex items-center gap-2 text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1.5">
                      <Calendar size={11} /> Modified
                    </label>
                    <div className="text-sm font-bold text-slate-700">
                      {initialData ? new Date(initialData.updatedAt).toLocaleDateString() : 'N/A'}
                    </div>
                  </div>
                </div>

                {/* Description Block */}
                <div>
                  <label className="flex items-center gap-2 text-[10px] font-bold text-slate-400 uppercase tracking-[0.15em] mb-2">
                    <Info size={12} /> Scenario Context
                  </label>
                  {isEditing ? (
                    <textarea
                      value={formData.description}
                      onChange={e => setFormData({ ...formData, description: e.target.value })}
                      className="w-full bg-white border border-slate-200 rounded-lg px-4 py-2 text-slate-900 focus:ring-2 focus:ring-blue-500 outline-none min-h-[120px] text-sm leading-relaxed shadow-sm"
                      placeholder="What is this test trying to prove?"
                    />
                  ) : (
                    <div className="text-[15px] text-slate-600 leading-relaxed whitespace-pre-wrap p-4 bg-white rounded-xl border border-slate-100 shadow-sm">
                        {formData.description || <span className="text-slate-300 italic">No scenario description provided.</span>}
                    </div>
                  )}
                </div>

                {/* Categorization */}
                <div>
                  <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-[0.15em] mb-2">Tags</label>
                  <div className="flex flex-wrap gap-1.5 min-h-[24px]">
                    {formData.tags.map(tag => (
                      <span key={tag} className="inline-flex items-center px-2 py-0.5 rounded-md text-[10px] font-bold bg-blue-50 text-blue-700 border border-blue-100">
                        {tag}
                        {isEditing && (
                          <button type="button" onClick={() => removeTag(tag)} className="ml-1.5 hover:text-red-500 transition-colors">
                            <X size={10} />
                          </button>
                        )}
                      </span>
                    ))}
                    {!isEditing && formData.tags.length === 0 && <span className="text-xs text-slate-300 italic">No tags assigned</span>}
                  </div>
                  {isEditing && (
                    <input
                      type="text"
                      value={tagInput}
                      onChange={(e) => setTagInput(e.target.value)}
                      onKeyDown={handleAddTag}
                      className="mt-2 w-full bg-white border border-slate-200 rounded-lg px-3 py-1.5 text-xs text-slate-900 focus:ring-1 focus:ring-blue-500 outline-none"
                      placeholder="Add tag and press Enter..."
                    />
                  )}
                </div>
              </div>

              {/* Right Column: Technical & Failure Details */}
              <div className="lg:col-span-7 space-y-6">
                
                {/* Input Panel - Light Background, Wrapped Text */}
                <div className="flex flex-col bg-white rounded-xl overflow-hidden shadow-sm border border-slate-200">
                  <div className="bg-slate-50 px-4 py-2 border-b border-slate-200 flex items-center gap-3">
                      <Terminal size={14} className="text-slate-500" />
                      <span className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">Input / Setup</span>
                  </div>
                  {isEditing ? (
                    <textarea
                      value={formData.input}
                      onChange={e => setFormData({ ...formData, input: e.target.value })}
                      className="w-full bg-white text-slate-800 p-4 font-mono text-sm focus:outline-none min-h-[140px] resize-none"
                      spellCheck={false}
                      placeholder="// e.g. curl -X POST ... or JSON"
                    />
                  ) : (
                    <div className="p-4 font-mono text-sm text-slate-600 whitespace-pre-wrap leading-relaxed min-h-[100px]">
                      {formData.input || <span className="text-slate-300 italic">// No input data documented</span>}
                    </div>
                  )}
                </div>
                
                {/* Expected Outcome Panel - Light Background, Wrapped Text */}
                <div className="flex flex-col bg-white rounded-xl overflow-hidden shadow-sm border border-emerald-100">
                  <div className="bg-emerald-50 px-4 py-2 border-b border-emerald-100 flex items-center gap-3">
                      <Target size={14} className="text-emerald-600" />
                      <span className="text-[10px] font-bold text-emerald-700 uppercase tracking-widest">Expected Outcome</span>
                  </div>
                  {isEditing ? (
                    <textarea
                      value={formData.expectedOutput}
                      onChange={e => setFormData({ ...formData, expectedOutput: e.target.value })}
                      className="w-full bg-white text-emerald-900 p-4 font-mono text-sm focus:outline-none min-h-[140px] resize-none"
                      spellCheck={false}
                      placeholder="// Success criteria..."
                    />
                  ) : (
                    <div className="p-4 font-mono text-sm text-emerald-800 whitespace-pre-wrap leading-relaxed min-h-[100px]">
                      {formData.expectedOutput || <span className="text-emerald-200 italic">// No expected result defined</span>}
                    </div>
                  )}
                </div>

                {/* Failure Analysis - Integrated into Preview if FAILING */}
                {(formData.status === TestStatus.FAILING || isEditing) && (
                  <div className={`rounded-xl border transition-all duration-300 overflow-hidden ${formData.status === TestStatus.FAILING ? 'bg-red-50 border-red-200 shadow-sm' : 'bg-slate-50 border-slate-100 opacity-50'}`}>
                    <div className={`px-4 py-2 border-b flex items-center gap-3 ${formData.status === TestStatus.FAILING ? 'bg-red-100/50 border-red-200' : 'bg-slate-100 border-slate-100'}`}>
                        <XCircle size={14} className={formData.status === TestStatus.FAILING ? 'text-red-600' : 'text-slate-400'} />
                        <span className={`text-[10px] font-bold uppercase tracking-widest ${formData.status === TestStatus.FAILING ? 'text-red-800' : 'text-slate-500'}`}>
                          Failure Analysis / Root Cause
                        </span>
                    </div>
                    <div className="p-4 bg-white">
                        {/* Interactive even in preview mode to allow quick logging of test failures */}
                        {(isEditing || formData.status === TestStatus.FAILING) ? (
                          <textarea
                            value={formData.failureReason}
                            onChange={e => setFormData({ ...formData, failureReason: e.target.value })}
                            className="w-full bg-white border border-red-100 rounded-lg p-3 text-red-900 font-mono text-sm focus:ring-2 focus:ring-red-400 outline-none min-h-[120px]"
                            placeholder="Why did this test fail? Document the logs or cause..."
                          />
                        ) : (
                          <div className="text-red-900 font-mono text-sm whitespace-pre-wrap leading-relaxed min-h-[80px] p-2">
                            {formData.failureReason || 'Failing status chosen but no analysis documented yet.'}
                          </div>
                        )}
                    </div>
                  </div>
                )}
              </div>
            </div>
          </form>
        </div>

        {/* Action Footer */}
        <div className="px-6 py-4 border-t border-slate-100 flex items-center justify-end gap-3 bg-white sticky bottom-0 z-10">
          <Button variant="ghost" onClick={onClose} type="button" className="text-slate-500 font-bold px-6">
            Discard
          </Button>
          <Button 
            variant="primary" 
            type="submit" 
            form="test-case-form" 
            icon={<Save size={18} />} 
            className={`px-8 rounded-lg font-bold text-sm transition-all shadow-md active:scale-95 ${formData.status === TestStatus.FAILING ? 'bg-red-600 hover:bg-red-700 ring-red-100' : 'bg-blue-600 hover:bg-blue-700 ring-blue-100'}`}
          >
            {initialData && !isEditing ? 'Save Status & Analysis' : 'Commit Changes'}
          </Button>
        </div>
      </div>
    </div>
  );
};