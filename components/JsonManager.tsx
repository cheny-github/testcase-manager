import React, { useState } from 'react';
import { Upload, Download, Copy, Check, AlertTriangle, FileJson, Tag, Bot, Sparkles } from 'lucide-react';
import { Button } from './ui/Button';
import { TestCase, TestStatus } from '../types';

interface JsonManagerProps {
  testCases: TestCase[];
  onImport: (newCases: TestCase[]) => Promise<void>;
  onClose: () => void;
}

const AI_SYSTEM_PROMPT = `Act as a Senior QA Engineer. I will provide product documentation or requirements. You must generate a list of Test Cases based on this information.

Output format: A raw JSON array of objects (no markdown code blocks, no explanations).
Each object must adhere strictly to this structure:

[
  {
    "title": "String (Required) - Concise summary of the test",
    "description": "String - Detailed scenario (Given/When/Then)",
    "input": "String - The specific input data or setup conditions (text format)",
    "expectedOutput": "String - The expected result (text format)",
    "status": "DRAFT"
  }
]

Please generate the test cases now based on the requirements I provide next.`;

export const JsonManager: React.FC<JsonManagerProps> = ({ testCases, onImport, onClose }) => {
  const [activeTab, setActiveTab] = useState<'import' | 'export'>('import');
  const [importText, setImportText] = useState('');
  const [globalTags, setGlobalTags] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);
  const [promptCopied, setPromptCopied] = useState(false);

  const handleImport = async () => {
    setError(null);
    setSuccessMsg(null);
    
    try {
      if (!importText.trim()) throw new Error("JSON is empty");
      
      const parsed = JSON.parse(importText);
      const array = Array.isArray(parsed) ? parsed : [parsed];
      
      // Process global tags
      const extraTags = globalTags.split(',').map(t => t.trim()).filter(Boolean);

      // Basic validation and transformation
      const validatedCases: TestCase[] = array.map((item: any) => {
        if (!item.title) throw new Error("A test case is missing a 'title' field.");
        
        const existingTags = Array.isArray(item.tags) ? item.tags : [];
        // Combine existing tags with global tags, removing duplicates
        const finalTags = Array.from(new Set([...existingTags, ...extraTags]));

        return {
          id: item.id || crypto.randomUUID(),
          title: item.title,
          description: item.description || '',
          input: typeof item.input === 'object' ? JSON.stringify(item.input, null, 2) : (item.input || ''),
          expectedOutput: typeof item.expectedOutput === 'object' ? JSON.stringify(item.expectedOutput, null, 2) : (item.expectedOutput || ''),
          status: Object.values(TestStatus).includes(item.status) ? item.status : TestStatus.DRAFT,
          tags: finalTags,
          createdAt: item.createdAt || Date.now(),
          updatedAt: Date.now()
        };
      });

      await onImport(validatedCases);
      setSuccessMsg(`Successfully imported ${validatedCases.length} test cases.`);
      setImportText('');
      setGlobalTags('');
    } catch (e: any) {
      setError(`Invalid JSON: ${e.message}`);
    }
  };

  const handleCopy = () => {
    navigator.clipboard.writeText(JSON.stringify(testCases, null, 2));
    setSuccessMsg("Copied to clipboard!");
    setTimeout(() => setSuccessMsg(null), 2000);
  };

  const handleCopyPrompt = () => {
    navigator.clipboard.writeText(AI_SYSTEM_PROMPT);
    setPromptCopied(true);
    setTimeout(() => setPromptCopied(false), 2000);
  };

  return (
    <div className="flex flex-col h-full bg-white rounded-xl border border-gray-200 overflow-hidden shadow-sm">
      <div className="flex border-b border-gray-200">
        <button
          onClick={() => setActiveTab('import')}
          className={`flex-1 py-4 text-sm font-medium text-center transition-colors ${
            activeTab === 'import' ? 'bg-gray-50 text-blue-600 border-b-2 border-blue-600' : 'text-gray-500 hover:text-gray-800 hover:bg-gray-50'
          }`}
        >
          <Upload className="w-4 h-4 inline-block mr-2" />
          Import JSON
        </button>
        <button
          onClick={() => setActiveTab('export')}
          className={`flex-1 py-4 text-sm font-medium text-center transition-colors ${
            activeTab === 'export' ? 'bg-gray-50 text-blue-600 border-b-2 border-blue-600' : 'text-gray-500 hover:text-gray-800 hover:bg-gray-50'
          }`}
        >
          <Download className="w-4 h-4 inline-block mr-2" />
          Export JSON
        </button>
      </div>

      <div className="flex-1 p-6 overflow-hidden flex flex-col">
        {error && (
          <div className="mb-4 bg-red-50 border border-red-200 text-red-700 p-3 rounded-lg flex items-center text-sm">
            <AlertTriangle className="w-4 h-4 mr-2 flex-shrink-0" />
            {error}
          </div>
        )}
        {successMsg && (
          <div className="mb-4 bg-green-50 border border-green-200 text-green-700 p-3 rounded-lg flex items-center text-sm">
            <Check className="w-4 h-4 mr-2 flex-shrink-0" />
            {successMsg}
          </div>
        )}

        {activeTab === 'import' ? (
          <div className="flex flex-col h-full space-y-4">
             {/* AI Helper Section */}
             <div className="bg-gradient-to-r from-blue-50 to-purple-50 border border-blue-100 rounded-lg p-4 flex items-start justify-between gap-4">
                <div className="flex items-start gap-3">
                  <div className="p-2 bg-blue-100 text-blue-600 rounded-lg">
                    <Bot size={18} />
                  </div>
                  <div>
                    <h4 className="text-sm font-medium text-gray-900 flex items-center gap-2">
                      Generate from Documentation
                      <Sparkles size={12} className="text-amber-500" />
                    </h4>
                    <p className="text-xs text-gray-600 mt-1">
                      Copy our system prompt, paste it into an AI (like ChatGPT), then paste your product requirements. The AI will generate compatible JSON.
                    </p>
                  </div>
                </div>
                <button 
                  onClick={handleCopyPrompt}
                  className="flex items-center gap-2 px-3 py-1.5 bg-white hover:bg-gray-50 border border-gray-300 text-gray-600 text-xs rounded transition-colors whitespace-nowrap shadow-sm"
                >
                  {promptCopied ? <Check size={14} className="text-green-600" /> : <Copy size={14} />}
                  {promptCopied ? 'Copied!' : 'Copy Prompt'}
                </button>
             </div>

            <div className="flex-1 flex flex-col min-h-0">
              <label className="block text-sm font-medium text-gray-600 mb-2">
                Paste JSON Array
              </label>
              <textarea
                value={importText}
                onChange={(e) => setImportText(e.target.value)}
                placeholder={`[\n  {\n    "title": "My Test Case",\n    "description": "...",\n    "input": "...",\n    "expectedOutput": "..."\n  }\n]`}
                className="flex-1 w-full bg-gray-50 border border-gray-300 rounded-lg p-4 font-mono text-sm text-gray-800 focus:ring-2 focus:ring-blue-600 outline-none resize-none custom-scrollbar"
              />
            </div>
            
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1.5 flex items-center gap-2">
                <Tag size={12} />
                Add tags to all imported items (optional)
              </label>
              <input
                type="text"
                value={globalTags}
                onChange={(e) => setGlobalTags(e.target.value)}
                placeholder="e.g. sprint-42, regression, payment-api (comma separated)"
                className="w-full bg-white border border-gray-300 rounded-lg px-4 py-2 text-gray-900 text-sm focus:ring-2 focus:ring-blue-600 outline-none"
              />
            </div>

            <div className="flex justify-end gap-3 pt-2">
              <Button variant="ghost" onClick={onClose}>Cancel</Button>
              <Button onClick={handleImport} icon={<FileJson size={16} />}>
                Parse & Import
              </Button>
            </div>
          </div>
        ) : (
          <div className="flex flex-col h-full">
            <p className="text-gray-500 text-sm mb-3">
              Current database state as JSON. Useful for backups or version control.
            </p>
            <div className="relative flex-1">
              <textarea
                readOnly
                value={JSON.stringify(testCases, null, 2)}
                className="absolute inset-0 w-full h-full bg-gray-50 border border-gray-300 rounded-lg p-4 font-mono text-sm text-gray-800 focus:ring-2 focus:ring-blue-600 outline-none resize-none custom-scrollbar"
              />
            </div>
            <div className="mt-4 flex justify-end gap-3">
              <Button variant="ghost" onClick={onClose}>Close</Button>
              <Button onClick={handleCopy} variant="secondary" icon={<Copy size={16} />}>
                Copy to Clipboard
              </Button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};