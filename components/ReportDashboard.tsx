import React, { useState, useMemo } from 'react';
import { 
  Clipboard, 
  Check, 
  CheckCircle2, 
  XCircle, 
  Clock, 
  PlayCircle, 
  PieChart, 
  Download 
} from 'lucide-react';
import { TestCase, TestStatus } from '../types';
import { Button } from './ui/Button';

interface ReportDashboardProps {
  testCases: TestCase[];
  iterationName: string;
}

export const ReportDashboard: React.FC<ReportDashboardProps> = ({ testCases, iterationName }) => {
  const [copied, setCopied] = useState(false);

  const stats = useMemo(() => {
    const total = testCases.length;
    const passing = testCases.filter(t => t.status === TestStatus.PASSING).length;
    const failing = testCases.filter(t => t.status === TestStatus.FAILING).length;
    const skipped = testCases.filter(t => t.status === TestStatus.SKIPPED).length;
    const draft = testCases.filter(t => t.status === TestStatus.DRAFT).length;
    
    const passRate = total > 0 ? Math.round((passing / total) * 100) : 0;

    return { total, passing, failing, skipped, draft, passRate };
  }, [testCases]);

  const generateMarkdown = () => {
    const date = new Date().toLocaleDateString();
    
    // Group cases
    const grouped = {
      [TestStatus.FAILING]: testCases.filter(t => t.status === TestStatus.FAILING),
      [TestStatus.PASSING]: testCases.filter(t => t.status === TestStatus.PASSING),
      [TestStatus.SKIPPED]: testCases.filter(t => t.status === TestStatus.SKIPPED),
      [TestStatus.DRAFT]: testCases.filter(t => t.status === TestStatus.DRAFT),
    };

    const md = `
# 📊 Test Report: ${iterationName}
**Date:** ${date}
**Progress:** ${stats.passRate}% Passing (${stats.passing}/${stats.total})

## 📈 Summary
| Total | ✅ Passing | 🔴 Failing | ⏭️ Skipped | 📝 Draft |
|:-----:|:---------:|:----------:|:----------:|:--------:|
| **${stats.total}** | ${stats.passing} | ${stats.failing} | ${stats.skipped} | ${stats.draft} |

## 🚨 Blocking Issues (Failing)
${grouped[TestStatus.FAILING].length === 0 ? '_No failing tests._' : grouped[TestStatus.FAILING].map(t => `- [ ] **${t.title}**\n  - ${t.description || 'No description'}${t.failureReason ? `\n  - ❌ **Reason:** ${t.failureReason}` : ''}`).join('\n')}

## ✅ Passing Features
${grouped[TestStatus.PASSING].map(t => `- [x] ${t.title}`).join('\n')}

## 🚧 Pending / Drafts
${[...grouped[TestStatus.DRAFT], ...grouped[TestStatus.SKIPPED]].map(t => `- [ ] ${t.title} _(${t.status})_`).join('\n')}
    `.trim();

    return md;
  };

  const handleCopy = () => {
    const md = generateMarkdown();
    navigator.clipboard.writeText(md);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="flex flex-col h-full overflow-hidden bg-gray-50">
      {/* Header */}
      <div className="flex items-center justify-between px-8 py-6 bg-white border-b border-gray-200">
        <div>
          <h2 className="text-2xl font-bold text-gray-900 flex items-center gap-3">
            <PieChart className="text-blue-600" />
            {iterationName} Overview
          </h2>
          <p className="text-gray-500 mt-1">Real-time metrics and status distribution</p>
        </div>
        <Button onClick={handleCopy} variant="secondary" icon={copied ? <Check size={16} className="text-green-600"/> : <Clipboard size={16} />}>
          {copied ? 'Copied Markdown' : 'Copy Report as Markdown'}
        </Button>
      </div>

      <div className="flex-1 overflow-y-auto p-8 custom-scrollbar">
        <div className="max-w-6xl mx-auto space-y-8">
          
          {/* Top Stats Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <StatCard 
              label="Pass Rate" 
              value={`${stats.passRate}%`} 
              icon={<CheckCircle2 size={24} />} 
              color="blue" 
              subtext={`${stats.passing} / ${stats.total} tests`}
            />
             <StatCard 
              label="Failing" 
              value={stats.failing} 
              icon={<XCircle size={24} />} 
              color="red" 
              subtext="Requires attention"
            />
            <StatCard 
              label="Draft / Todo" 
              value={stats.draft} 
              icon={<PlayCircle size={24} />} 
              color="amber" 
            />
             <StatCard 
              label="Skipped" 
              value={stats.skipped} 
              icon={<Clock size={24} />} 
              color="gray" 
            />
          </div>

          {/* Progress Bar */}
          <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm">
            <h3 className="text-sm font-semibold text-gray-700 mb-4 uppercase tracking-wider">Overall Progress</h3>
            <div className="h-6 w-full bg-gray-100 rounded-full overflow-hidden flex">
              <div style={{ width: `${(stats.passing / stats.total) * 100}%` }} className="h-full bg-green-500 transition-all duration-500" title="Passing"/>
              <div style={{ width: `${(stats.failing / stats.total) * 100}%` }} className="h-full bg-red-500 transition-all duration-500" title="Failing"/>
              <div style={{ width: `${(stats.skipped / stats.total) * 100}%` }} className="h-full bg-gray-400 transition-all duration-500" title="Skipped"/>
              <div style={{ width: `${(stats.draft / stats.total) * 100}%` }} className="h-full bg-amber-400 transition-all duration-500" title="Draft"/>
            </div>
            <div className="flex items-center justify-between mt-3 text-xs text-gray-500 font-medium">
                <div className="flex items-center gap-2"><span className="w-2 h-2 rounded-full bg-green-500"></span> Passing ({stats.passing})</div>
                <div className="flex items-center gap-2"><span className="w-2 h-2 rounded-full bg-red-500"></span> Failing ({stats.failing})</div>
                <div className="flex items-center gap-2"><span className="w-2 h-2 rounded-full bg-amber-400"></span> Draft ({stats.draft})</div>
                <div className="flex items-center gap-2"><span className="w-2 h-2 rounded-full bg-gray-400"></span> Skipped ({stats.skipped})</div>
            </div>
          </div>

          {/* Detailed List */}
          <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
             <div className="px-6 py-4 border-b border-gray-200 bg-gray-50">
                <h3 className="font-semibold text-gray-900">Detailed Status</h3>
             </div>
             <div className="divide-y divide-gray-100">
                {testCases.length === 0 ? (
                  <div className="p-8 text-center text-gray-500">No test cases in this iteration.</div>
                ) : (
                  testCases.sort((a,b) => {
                      // Sort failing first
                      if(a.status === TestStatus.FAILING && b.status !== TestStatus.FAILING) return -1;
                      if(a.status !== TestStatus.FAILING && b.status === TestStatus.FAILING) return 1;
                      return 0;
                  }).map(tc => (
                    <div key={tc.id} className="px-6 py-3 hover:bg-gray-50 transition-colors flex flex-col gap-2">
                        <div className="flex items-center justify-between">
                            <div className="flex items-center gap-3 min-w-0">
                                <StatusBadge status={tc.status} />
                                <span className="font-medium text-gray-700 truncate">{tc.title}</span>
                            </div>
                            <div className="flex items-center gap-4 text-sm text-gray-500 flex-shrink-0">
                                {tc.tags.length > 0 && (
                                    <span className="px-2 py-0.5 bg-gray-100 rounded-full text-xs">
                                        {tc.tags[0]} {tc.tags.length > 1 && `+${tc.tags.length - 1}`}
                                    </span>
                                )}
                            </div>
                        </div>
                        {tc.status === TestStatus.FAILING && tc.failureReason && (
                             <div className="ml-10 text-xs text-red-700 bg-red-50 border border-red-100 px-3 py-1.5 rounded-md inline-block self-start">
                                <strong>Reason:</strong> {tc.failureReason}
                             </div>
                        )}
                    </div>
                  ))
                )}
             </div>
          </div>

        </div>
      </div>
    </div>
  );
};

const StatCard = ({ label, value, icon, color, subtext }: any) => {
    const colors: any = {
        blue: "bg-blue-50 text-blue-600 border-blue-100",
        red: "bg-red-50 text-red-600 border-red-100",
        green: "bg-green-50 text-green-600 border-green-100",
        amber: "bg-amber-50 text-amber-600 border-amber-100",
        gray: "bg-gray-100 text-gray-600 border-gray-200",
    };

    return (
        <div className={`p-5 rounded-xl border ${colors[color]} shadow-sm flex flex-col`}>
            <div className="flex items-center justify-between mb-3">
                <span className="font-medium opacity-80">{label}</span>
                {icon}
            </div>
            <div className="text-3xl font-bold mb-1">{value}</div>
            {subtext && <div className="text-xs opacity-70 mt-auto">{subtext}</div>}
        </div>
    );
};

const StatusBadge = ({ status }: { status: TestStatus }) => {
    const config = {
        [TestStatus.PASSING]: { icon: CheckCircle2, class: 'text-green-600 bg-green-50' },
        [TestStatus.FAILING]: { icon: XCircle, class: 'text-red-600 bg-red-50' },
        [TestStatus.SKIPPED]: { icon: Clock, class: 'text-gray-500 bg-gray-100' },
        [TestStatus.DRAFT]: { icon: PlayCircle, class: 'text-amber-600 bg-amber-50' },
    };
    const C = config[status];
    return (
        <span className={`p-1 rounded-full ${C.class}`}>
            <C.icon size={16} />
        </span>
    );
};