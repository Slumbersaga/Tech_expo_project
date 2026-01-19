'use client';

import { useState } from 'react';


export default function Home() {
  const [mode, setMode] = useState<'simple' | 'json'>('simple');
  const [name, setName] = useState('');
  const [jsonInput, setJsonInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [response, setResponse] = useState<any>(null);

  const createWorkflow = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setResponse(null);

    try {
      let payload;

      if (mode === 'simple') {
        payload = {
          name: name,
          nodes: [],
          connections: {},
          settings: { saveManualExecutions: true, callers: [] },
          // active: false  <-- REMOVED: This field is read-only in n8n API
        };
      } else {
        try {
          // Parse the pasted JSON
          const parsed = JSON.parse(jsonInput);

          // SANITIZE: Remove 'active' if present, as it causes API errors
          if ('active' in parsed) {
            delete parsed.active;
          }
          // Also remove ID if present (new workflows shouldn't have ID)
          if ('id' in parsed) {
            delete parsed.id;
          }

          payload = parsed;
        } catch (jsonErr) {
          alert('Invalid JSON input');
          setLoading(false);
          return;
        }
      }

      const res = await fetch('/api/n8n/workflows', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      const data = await res.json();
      setResponse(data);
    } catch (err) {
      setResponse({ error: 'Failed to create workflow' });
    } finally {
      setLoading(false);
    }
  };

  const testConnection = async () => {
    setLoading(true);
    setResponse(null);
    try {
      const res = await fetch('/api/n8n/workflows');
      const data = await res.json();
      setResponse(data);
    } catch (err) {
      setResponse({ error: 'Failed to test connection' });
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="flex min-h-screen flex-col items-center justify-center p-24 bg-gray-950 text-white">
      <div className="z-10 max-w-5xl w-full items-center justify-between font-mono text-sm lg:flex">
        <h1 className="text-4xl font-bold mb-8 text-transparent bg-clip-text bg-gradient-to-r from-purple-400 to-pink-600">
          Workflow Builder
        </h1>
        <div className="flex gap-4 mb-8">
          <button
            onClick={testConnection}
            className="px-4 py-2 border border-purple-500 rounded text-purple-400 hover:bg-purple-900 transition-colors"
          >
            Test Connection
          </button>
        </div>
      </div>

      <div className="w-full max-w-2xl bg-gray-900 p-8 rounded-lg shadow-xl border border-gray-800">

        <div className="flex gap-4 mb-6 border-b border-gray-700 pb-4">
          <button
            onClick={() => setMode('simple')}
            className={`px-3 py-1 rounded ${mode === 'simple' ? 'bg-purple-600' : 'bg-gray-800 hover:bg-gray-700'}`}
          >
            Simple Mode
          </button>
          <button
            onClick={() => setMode('json')}
            className={`px-3 py-1 rounded ${mode === 'json' ? 'bg-purple-600' : 'bg-gray-800 hover:bg-gray-700'}`}
          >
            Raw JSON Import
          </button>
        </div>

        <form onSubmit={createWorkflow} className="space-y-6">

          {mode === 'simple' ? (
            <div>
              <label htmlFor="name" className="block text-sm font-medium text-gray-300">
                Workflow Name
              </label>
              <input
                type="text"
                id="name"
                required
                className="mt-1 block w-full px-3 py-2 bg-gray-800 border border-gray-700 rounded-md text-white focus:outline-none focus:ring-2 focus:ring-purple-500"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="My Awesome Workflow"
              />
            </div>
          ) : (
            <div>
              <label htmlFor="json" className="block text-sm font-medium text-gray-300">
                Workflow JSON Object
              </label>
              <textarea
                id="json"
                required
                rows={10}
                className="mt-1 block w-full px-3 py-2 bg-gray-800 border border-gray-700 rounded-md text-white font-mono text-xs focus:outline-none focus:ring-2 focus:ring-purple-500"
                value={jsonInput}
                onChange={(e) => setJsonInput(e.target.value)}
                placeholder='{"name": "My Flow", "nodes": [...]}'
              />
              <p className="text-xs text-gray-500 mt-2">Note: "active" and "id" fields will be automatically removed.</p>
            </div>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-purple-600 hover:bg-purple-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-purple-500 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200"
          >
            {loading ? 'Processing...' : 'Create Workflow'}
          </button>
        </form>

        {response && (
          <div className="mt-8 p-4 bg-gray-800 rounded-md overflow-hidden border border-gray-700">
            <h3 className="text-sm font-semibold text-gray-400 mb-2">Response:</h3>
            <pre className="text-xs text-green-400 overflow-x-auto max-h-96">
              {JSON.stringify(response, null, 2)}
            </pre>
          </div>
        )}
      </div>
    </main>
  );
}
