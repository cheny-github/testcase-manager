import React, { useState, useEffect } from 'react';
import { X, Save, AlertCircle } from 'lucide-react';
import { TestCase, TestStatus, NewTestCase } from '../types';
import { Button } from './ui/Button';

interface TestFormProps {
  initialData?: TestCase | null;
  isOpen: boolean;
  onClose: () => void;
  onSave: (testCase: TestCase) => Promise<void>;
}

export const TestForm: React.FC<TestFormProps> = ({ initialData, isOpen, onClose, onSave }) => {
  const [formData, setFormData] = useState<NewTestCase>({
    title: '',
    description: '',
    input: '',
    expectedOutput: '',
    status: TestStatus.DRAFT,
    tags: []
  });
  const [tagInput, setTagInput] = useState('');
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (isOpen && initialData) {
      setFormData({
        title: initialData.title,
        description: initialData.description,
        input: initialData.input,
        expectedOutput: initialData.expectedOutput,
        status: initialData.status,
        tags: initialData.tags || []
      });
    } else if (isOpen) {
      // Reset for new entry
      setFormData({
        title: '',
        description: '',
        input: '',
        expectedOutput: '',
        status: TestStatus.DRAFT,
        tags: []
      });
    }
    setError(null);
  }, [isOpen, initialData]);

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

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/30 backdrop-blur-sm p-4 sm:p-6 transition-all duration-200">
      <div className="bg-white border border-gray-200 w-full max-w-4xl rounded-xl shadow-2xl flex flex-col max-h-[90vh]">
        
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-100">
          <h2 className="text-xl font-bold text-gray-900">
            {initialData ? 'Edit Test Case' : 'New Test Case'}
          </h2>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-900 transition-colors">
            <X size={24} />
          </button>
        </div>

        {/* Scrollable Content */}
        <div className="flex-1 overflow-y-auto p-6 custom-scrollbar">
          {error && (
            <div className="mb-6 bg-red-50 border border-red-200 text-red-700 p-4 rounded-lg flex items-center">
              <AlertCircle className="w-5 h-5 mr-3 flex-shrink-0" />
              {error}
            </div>
          )}

          <form id="test-case-form" onSubmit={handleSubmit} className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-600 mb-1">Title</label>
                  <input
                    type="text"
                    value={formData.title}
                    onChange={e => setFormData({ ...formData, title: e.target.value })}
                    className="w-full bg-white border border-gray-300 rounded-lg px-4 py-2 text-gray-900 focus:ring-2 focus:ring-blue-600 focus:border-transparent outline-none shadow-sm placeholder:text-gray-400"
                    placeholder="e.g. Calculate cart total with discount"
                    autoFocus
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-600 mb-1">Status</label>
                  <div className="flex space-x-2">
                    {Object.values(TestStatus).map(status => (
                      <button
                        key={status}
                        type="button"
                        onClick={() => setFormData({ ...formData, status })}
                        className={`px-3 py-1.5 rounded-md text-xs font-bold border transition-colors ${
                          formData.status === status
                            ? status === TestStatus.PASSING ? 'bg-green-100 border-green-300 text-green-800'
                            : status === TestStatus.FAILING ? 'bg-red-100 border-red-300 text-red-800'
                            : status === TestStatus.SKIPPED ? 'bg-gray-200 border-gray-300 text-gray-700'
                            : 'bg-amber-100 border-amber-300 text-amber-800'
                            : 'bg-white border-gray-200 text-gray-500 hover:border-gray-400 hover:text-gray-700'
                        }`}
                      >
                        {status}
                      </button>
                    ))}
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-600 mb-1">Description / Scenario</label>
                  <textarea
                    value={formData.description}
                    onChange={e => setFormData({ ...formData, description: e.target.value })}
                    className="w-full bg-white border border-gray-300 rounded-lg px-4 py-2 text-gray-900 focus:ring-2 focus:ring-blue-600 focus:border-transparent outline-none shadow-sm min-h-[120px] placeholder:text-gray-400"
                    placeholder="As a user, when I apply a 10% coupon..."
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-600 mb-1">Tags (Press Enter)</label>
                  <div className="flex flex-wrap gap-2 mb-2">
                    {formData.tags.map(tag => (
                      <span key={tag} className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-50 text-blue-700 border border-blue-200">
                        {tag}
                        <button type="button" onClick={() => removeTag(tag)} className="ml-1.5 hover:text-blue-900">
                          <X size={12} />
                        </button>
                      </span>
                    ))}
                  </div>
                  <input
                    type="text"
                    value={tagInput}
                    onChange={e => setTagInput(e.target.value)}
                    onKeyDown={handleAddTag}
                    className="w-full bg-white border border-gray-300 rounded-lg px-4 py-2 text-gray-900 focus:ring-2 focus:ring-blue-600 focus:border-transparent outline-none shadow-sm placeholder:text-gray-400"
                    placeholder="Add tags..."
                  />
                </div>
              </div>

              <div className="space-y-4">
                <div className="h-1/2 flex flex-col">
                  <label className="block text-sm font-medium text-gray-600 mb-1">Input Data</label>
                  <textarea
                    value={formData.input}
                    onChange={e => setFormData({ ...formData, input: e.target.value })}
                    className="flex-1 w-full bg-gray-50 border border-gray-300 rounded-lg px-4 py-2 text-gray-900 font-mono text-sm focus:ring-2 focus:ring-blue-600 focus:border-transparent outline-none shadow-inner placeholder:text-gray-400"
                    spellCheck={false}
                    placeholder="e.g. User ID: 12345, Action: Login"
                  />
                </div>
                <div className="h-1/2 flex flex-col">
                  <label className="block text-sm font-medium text-gray-600 mb-1">Expected Output</label>
                  <textarea
                    value={formData.expectedOutput}
                    onChange={e => setFormData({ ...formData, expectedOutput: e.target.value })}
                    className="flex-1 w-full bg-gray-50 border border-gray-300 rounded-lg px-4 py-2 text-gray-900 font-mono text-sm focus:ring-2 focus:ring-blue-600 focus:border-transparent outline-none shadow-inner placeholder:text-gray-400"
                    spellCheck={false}
                    placeholder="e.g. 200 OK, Token generated"
                  />
                </div>
              </div>
            </div>
          </form>
        </div>

        {/* Footer */}
        <div className="p-6 border-t border-gray-100 flex justify-end gap-3 bg-gray-50 rounded-b-xl">
          <Button variant="ghost" onClick={onClose} type="button">Cancel</Button>
          <Button variant="primary" type="submit" form="test-case-form" icon={<Save size={18} />}>
            Save Test Case
          </Button>
        </div>
      </div>
    </div>
  );
};