'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { Sidebar } from '../components/Sidebar';
import { AgentCard } from '../components/AgentCard';
import { Search, LayoutGrid, List, Plus } from 'lucide-react';
import { AI_ARCHITECT_PROMPT } from '../lib/prompts';

export default function Dashboard() {
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [modalMode, setModalMode] = useState<'ai' | 'manual'>('ai');
    const [prompt, setPrompt] = useState('');
    const [manualJson, setManualJson] = useState('');
    const [isGenerating, setIsGenerating] = useState(false);

    const [agents, setAgents] = useState<any[]>([]);
    const [loadingAgents, setLoadingAgents] = useState(true);

    // New State for View and Sort
    const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
    const [sortOrder, setSortOrder] = useState<'date' | 'name' | 'status'>('date');
    const [searchQuery, setSearchQuery] = useState('');

    // Fetch Agents (Workflows) from n8n
    useEffect(() => {
        const fetchAgents = async () => {
            try {
                const res = await fetch('/api/n8n/workflows');
                const data = await res.json();
                if (data && data.data) {
                    // Map n8n workflows to our UI format
                    const mapped = data.data.map((wf: any) => ({
                        id: wf.id,
                        name: wf.name,
                        status: wf.active ? 'Published' : 'Not Published',
                        description: `Workflow ID: ${wf.id}`,
                        lastRun: wf.updatedAt ? new Date(wf.updatedAt).toLocaleDateString() : 'Unknown',
                        updatedAt: wf.updatedAt ? new Date(wf.updatedAt).getTime() : 0,
                        createdAt: wf.createdAt ? new Date(wf.createdAt).getTime() : 0,
                        icons: ['⚡']
                    }));
                    setAgents(mapped);
                }
            } catch (e) {
                console.error("Failed to fetch agents", e);
            } finally {
                setLoadingAgents(false);
            }
        };

        fetchAgents();
    }, [isModalOpen]);

    // Filter and Sort Agents
    const filteredAgents = agents
        .filter(agent => agent.name.toLowerCase().includes(searchQuery.toLowerCase()))
        .sort((a, b) => {
            if (sortOrder === 'date') return b.createdAt - a.createdAt; // Newest first
            if (sortOrder === 'name') return a.name.localeCompare(b.name);
            if (sortOrder === 'status') return a.status === 'Published' ? -1 : 1;
            return 0;
        });

    const handleGenerate = async () => {
        setIsGenerating(true);
        let payload: any = {};

        try {
            if (modalMode === 'ai') {
                const res = await fetch('/api/ai/generate', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ prompt })
                });
                const data = await res.json();
                if (data.error) throw new Error(data.details || 'AI generation failed');
                payload = data;
            } else {
                // Manual Mode
                try {
                    payload = JSON.parse(manualJson);
                } catch (e) {
                    alert('Invalid JSON');
                    setIsGenerating(false);
                    return;
                }
            }

            // Sanitize
            if (payload.active !== undefined) delete payload.active;
            if (payload.id !== undefined) delete payload.id;

            // Create in n8n
            const n8nRes = await fetch('/api/n8n/workflows', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(payload)
            });
            const n8nData = await n8nRes.json();

            if (n8nData.id) {
                alert('Agent created successfully!');
                setIsModalOpen(false);
            } else {
                alert('Failed to create agent in n8n');
            }

        } catch (e) {
            console.error(e);
            alert(e instanceof Error ? e.message : 'An error occurred');
        } finally {
            setIsGenerating(false);
            setPrompt('');
            setManualJson('');
        }
    };

    return (
        <div className="flex h-screen bg-slate-50">
            <Sidebar />
            <main className="flex-1 overflow-auto">
                <header className="px-10 py-8 flex justify-between items-center bg-white border-b border-gray-100 shadow-sm sticky top-0 z-10">
                    <div className="flex items-center gap-3">
                        <h2 className="text-2xl font-bold text-slate-900 tracking-tight">My agents</h2>
                        <span className="bg-gray-100 text-gray-500 text-xs px-2 py-1 rounded-full">{agents.length}</span>
                    </div>
                    <button
                        onClick={() => { setIsModalOpen(true); setModalMode('ai'); }}
                        className="bg-indigo-600 hover:bg-indigo-700 text-white px-5 py-2.5 rounded-lg font-medium text-sm flex items-center gap-2 transition-all shadow-md hover:shadow-lg active:scale-95"
                    >
                        <Plus className="w-4 h-4" /> New agent
                    </button>
                </header>

                <div className="p-10 max-w-7xl mx-auto">
                    {/* Toolbar */}
                    <div className="flex items-center justify-between mb-10">
                        <div className="relative w-96 group">
                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 w-4 h-4 group-focus-within:text-indigo-500 transition-colors" />
                            <input
                                type="text"
                                placeholder="Search agents..."
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                                className="w-full pl-10 pr-4 py-2.5 bg-white border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all placeholder:text-slate-400 shadow-sm"
                            />
                        </div>

                        <div className="flex items-center gap-3">
                            <div
                                onClick={() => setSortOrder('date')}
                                className={`hidden md:flex items-center gap-2 border rounded-lg px-4 py-2 cursor-pointer transition-colors shadow-sm text-sm font-medium ${sortOrder === 'date' ? 'bg-indigo-50 border-indigo-200 text-indigo-700' : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-50'}`}
                            >
                                Date created
                            </div>
                            <div
                                onClick={() => setSortOrder('status')}
                                className={`hidden md:flex items-center gap-2 border rounded-lg px-4 py-2 cursor-pointer transition-colors shadow-sm text-sm font-medium ${sortOrder === 'status' ? 'bg-indigo-50 border-indigo-200 text-indigo-700' : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-50'}`}
                            >
                                Status
                            </div>

                            <div className="w-px h-8 bg-slate-200 mx-2"></div>

                            <div className="flex bg-slate-100/50 rounded-lg p-1 border border-slate-200">
                                <button
                                    onClick={() => setViewMode('grid')}
                                    className={`p-2 rounded-md transition-all ${viewMode === 'grid' ? 'bg-white shadow-sm text-indigo-600' : 'text-slate-400 hover:text-slate-600'}`}
                                >
                                    <LayoutGrid className="w-4 h-4" />
                                </button>
                                <button
                                    onClick={() => setViewMode('list')}
                                    className={`p-2 rounded-md transition-all ${viewMode === 'list' ? 'bg-white shadow-sm text-indigo-600' : 'text-slate-400 hover:text-slate-600'}`}
                                >
                                    <List className="w-4 h-4" />
                                </button>
                            </div>
                        </div>
                    </div>

                    {/* Content Area */}
                    {loadingAgents ? (
                        <div className="flex justify-center py-20">
                            <span className="animate-spin text-indigo-600 text-2xl">⏳</span>
                        </div>
                    ) : (
                        <>
                            {viewMode === 'grid' ? (
                                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-3 gap-8">
                                    {filteredAgents.map((agent, idx) => (
                                        <AgentCard
                                            key={idx}
                                            name={agent.name}
                                            status={agent.status as any}
                                            description={agent.description}
                                            lastRun={agent.lastRun}
                                            icons={agent.icons?.map((i: string) => <span key={i}>{i}</span>)}
                                            workflowUrl={`http://localhost:5678/workflow/${agent.id}`}
                                            agentId={agent.id}
                                        />
                                    ))}
                                </div>
                            ) : (
                                <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
                                    <table className="w-full text-left text-sm text-gray-500">
                                        <thead className="bg-gray-50 border-b border-gray-100 text-xs uppercase text-gray-400 font-semibold">
                                            <tr>
                                                <th className="px-6 py-4">Name</th>
                                                <th className="px-6 py-4">Status</th>
                                                <th className="px-6 py-4">Last Run</th>
                                                <th className="px-6 py-4 text-right">Actions</th>
                                            </tr>
                                        </thead>
                                        <tbody className="divide-y divide-gray-100">
                                            {filteredAgents.map((agent, idx) => (
                                                <tr key={idx} className="hover:bg-gray-50/50 transition-colors">
                                                    <td className="px-6 py-4 font-medium text-gray-900 flex items-center gap-3">
                                                        <div className="w-8 h-8 rounded-lg bg-indigo-50 flex items-center justify-center text-indigo-600">
                                                            ⚡
                                                        </div>
                                                        {agent.name}
                                                    </td>
                                                    <td className="px-6 py-4">
                                                        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${agent.status === 'Published' ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'
                                                            }`}>
                                                            {agent.status}
                                                        </span>
                                                    </td>
                                                    <td className="px-6 py-4">{agent.lastRun}</td>
                                                    <td className="px-6 py-4 text-right flex items-center justify-end gap-3">
                                                        <Link
                                                            href={`/editor/${agent.id}`}
                                                            className="text-indigo-600 hover:text-indigo-900 font-medium hover:underline"
                                                        >
                                                            Edit
                                                        </Link>
                                                        <a
                                                            href={`http://localhost:5678/workflow/${agent.id}`}
                                                            target="_blank"
                                                            rel="noopener noreferrer"
                                                            className="text-gray-500 hover:text-gray-700 font-medium hover:underline"
                                                        >
                                                            Open in n8n
                                                        </a>
                                                    </td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                </div>
                            )}

                            {filteredAgents.length === 0 && (
                                <div className="col-span-full text-center py-20 text-slate-400">
                                    No agents found matching your search.
                                </div>
                            )}
                        </>
                    )}

                    {/* AI Chat / New Agent Interface */}
                    {isModalOpen && (
                        <div className="fixed inset-0 bg-white z-50 flex">
                            {/* Left Sidebar - Chat History */}
                            <div className="w-64 bg-gray-50 border-r border-gray-200 flex flex-col">
                                <div className="p-4 border-b border-gray-200">
                                    <h3 className="text-sm font-semibold text-gray-900">Chat History</h3>
                                </div>
                                <div className="flex-1 overflow-y-auto p-3 space-y-2">
                                    <div className="p-3 bg-white rounded-lg border border-gray-200 hover:border-indigo-300 cursor-pointer transition-colors">
                                        <p className="text-sm font-medium text-gray-900 truncate">Current Session</p>
                                        <p className="text-xs text-gray-500 mt-1">Just now</p>
                                    </div>
                                </div>
                                <div className="p-3 border-t border-gray-200">
                                    <button
                                        onClick={() => setIsModalOpen(false)}
                                        className="w-full px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
                                    >
                                        Close
                                    </button>
                                </div>
                            </div>

                            {/* Main Chat Area */}
                            <div className="flex-1 flex flex-col">
                                {/* Header */}
                                <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200 bg-white">
                                    <div>
                                        <h2 className="text-xl font-semibold text-gray-900">Create New Agent</h2>
                                        <p className="text-sm text-gray-500 mt-0.5">Describe your workflow in natural language</p>
                                    </div>
                                    <div className="flex items-center gap-3">
                                        <div className="flex items-center gap-2 bg-gray-100 rounded-lg p-1">
                                            <button
                                                onClick={() => setModalMode('ai')}
                                                className={`px-3 py-1.5 text-sm font-medium rounded-md transition-colors ${modalMode === 'ai'
                                                    ? 'bg-white text-gray-900 shadow-sm'
                                                    : 'text-gray-600 hover:text-gray-900'
                                                    }`}
                                            >
                                                AI Agent
                                            </button>
                                            <button
                                                onClick={() => setModalMode('manual')}
                                                className={`px-3 py-1.5 text-sm font-medium rounded-md transition-colors ${modalMode === 'manual'
                                                    ? 'bg-white text-gray-900 shadow-sm'
                                                    : 'text-gray-600 hover:text-gray-900'
                                                    }`}
                                            >
                                                Manual JSON
                                            </button>
                                        </div>
                                    </div>
                                </div>

                                {/* Messages Area */}
                                <div className="flex-1 overflow-y-auto bg-gradient-to-b from-gray-50 to-white">
                                    <div className="max-w-3xl mx-auto px-6 py-8">
                                        {modalMode === 'ai' && !prompt && (
                                            <div className="text-center py-12">
                                                <div className="w-16 h-16 bg-indigo-100 rounded-full flex items-center justify-center mx-auto mb-4">
                                                    <svg className="w-8 h-8 text-indigo-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z" />
                                                    </svg>
                                                </div>
                                                <h3 className="text-lg font-semibold text-gray-900 mb-2">Start a new conversation</h3>
                                                <p className="text-sm text-gray-500">
                                                    Describe the workflow you want to create, and I'll generate it for you.
                                                </p>
                                                <div className="mt-6 grid grid-cols-2 gap-3">
                                                    <button
                                                        onClick={() => setPrompt('Create a workflow that sends daily email reports')}
                                                        className="p-4 text-left bg-white border border-gray-200 rounded-xl hover:border-indigo-300 hover:shadow-sm transition-all"
                                                    >
                                                        <p className="text-sm font-medium text-gray-900">📧 Email Report</p>
                                                        <p className="text-xs text-gray-500 mt-1">Daily automated reports</p>
                                                    </button>
                                                    <button
                                                        onClick={() => setPrompt('Create a workflow that monitors Google Sheets for changes')}
                                                        className="p-4 text-left bg-white border border-gray-200 rounded-xl hover:border-indigo-300 hover:shadow-sm transition-all"
                                                    >
                                                        <p className="text-sm font-medium text-gray-900">📊 Sheet Monitor</p>
                                                        <p className="text-xs text-gray-500 mt-1">Track spreadsheet updates</p>
                                                    </button>
                                                </div>
                                            </div>
                                        )}
                                    </div>
                                </div>

                                {/* Input Area */}
                                <div className="border-t border-gray-200 bg-white px-6 py-4">
                                    <div className="max-w-3xl mx-auto">
                                        {modalMode === 'ai' ? (
                                            <div className="relative">
                                                <textarea
                                                    className="w-full bg-white text-gray-900 text-base rounded-2xl py-4 px-5 pr-14 focus:outline-none focus:ring-2 focus:ring-indigo-500 border border-gray-300 placeholder:text-gray-400 resize-none overflow-hidden"
                                                    placeholder="Describe your workflow... (e.g., 'Send Slack alerts when new leads arrive')"
                                                    value={prompt}
                                                    onChange={(e) => {
                                                        setPrompt(e.target.value);
                                                        // Auto-expand textarea
                                                        e.target.style.height = 'auto';
                                                        e.target.style.height = Math.min(e.target.scrollHeight, 200) + 'px';
                                                    }}
                                                    onKeyDown={(e) => {
                                                        if (e.key === 'Enter' && !e.shiftKey && !isGenerating) {
                                                            e.preventDefault();
                                                            handleGenerate();
                                                        }
                                                    }}
                                                    rows={1}
                                                    style={{ minHeight: '56px', maxHeight: '200px' }}
                                                    autoFocus
                                                />
                                                <button
                                                    onClick={handleGenerate}
                                                    disabled={!prompt || isGenerating}
                                                    className={`absolute right-3 bottom-3 p-2.5 rounded-xl transition-all ${prompt && !isGenerating
                                                        ? 'bg-indigo-600 text-white hover:bg-indigo-700 shadow-sm'
                                                        : 'bg-gray-100 text-gray-400 cursor-not-allowed'
                                                        }`}
                                                >
                                                    {isGenerating ? (
                                                        <svg className="animate-spin w-5 h-5" fill="none" viewBox="0 0 24 24">
                                                            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                                                            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                                                        </svg>
                                                    ) : (
                                                        <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
                                                        </svg>
                                                    )}
                                                </button>
                                            </div>
                                        ) : (
                                            <div className="relative">
                                                <textarea
                                                    className="w-full bg-gray-50 text-gray-900 text-sm font-mono rounded-2xl py-4 px-5 focus:outline-none focus:ring-2 focus:ring-indigo-500 border border-gray-300 placeholder:text-gray-400 min-h-[300px]"
                                                    placeholder='Paste your n8n workflow JSON here...'
                                                    value={manualJson}
                                                    onChange={(e) => setManualJson(e.target.value)}
                                                />
                                                <button
                                                    onClick={handleGenerate}
                                                    disabled={!manualJson || isGenerating}
                                                    className="absolute top-4 right-4 bg-indigo-600 text-white px-5 py-2.5 rounded-xl font-medium hover:bg-indigo-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed shadow-sm"
                                                >
                                                    {isGenerating ? 'Importing...' : 'Import JSON'}
                                                </button>
                                            </div>
                                        )}
                                        <p className="text-xs text-gray-500 mt-3">
                                            Press <kbd className="px-2 py-0.5 bg-gray-100 border border-gray-300 rounded text-xs font-mono">Enter</kbd> to send,
                                            <kbd className="px-2 py-0.5 bg-gray-100 border border-gray-300 rounded text-xs font-mono ml-1">Shift + Enter</kbd> for new line
                                        </p>
                                    </div>
                                </div>
                            </div>
                        </div>
                    )}
                </div>
            </main>
        </div>
    );
}
