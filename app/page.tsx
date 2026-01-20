import Link from 'next/link';
import { Navbar } from './components/Navbar';
import { ArrowRight, Bot, Zap, Share2 } from 'lucide-react';

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 font-sans">
      <Navbar />

      {/* Hero Section */}
      <section className="pt-32 pb-20 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto text-center">
        <div className="inline-flex items-center gap-2 bg-indigo-50 text-indigo-700 px-4 py-2 rounded-full text-sm font-medium mb-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
          <span className="relative flex h-2 w-2">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-indigo-400 opacity-75"></span>
            <span className="relative inline-flex rounded-full h-2 w-2 bg-indigo-500"></span>
          </span>
          Powered by Gemini 1.5 Pro
        </div>

        <h1 className="text-5xl md:text-7xl font-bold tracking-tight mb-8 bg-clip-text text-transparent bg-gradient-to-r from-slate-900 via-indigo-900 to-slate-900 animate-in fade-in slide-in-from-bottom-6 duration-700">
          Build AI Agents <br /> with simple words.
        </h1>

        <p className="text-xl text-slate-500 max-w-2xl mx-auto mb-10 animate-in fade-in slide-in-from-bottom-8 duration-700 delay-100">
          Orchestrate complex workflows using natural language.
          Connect your favorite apps and let AI handle the logic.
          Seamlessly integrated with n8n.
        </p>

        <div className="flex flex-col sm:flex-row items-center justify-center gap-4 animate-in fade-in slide-in-from-bottom-10 duration-700 delay-200">
          <Link
            href="/signup"
            className="w-full sm:w-auto px-8 py-4 bg-indigo-600 text-white rounded-full font-medium hover:bg-indigo-700 transition-all shadow-lg shadow-indigo-500/30 flex items-center justify-center gap-2 active:scale-95"
          >
            Start Building Free <ArrowRight className="w-5 h-5" />
          </Link>
          <a
            href="https://n8n.io"
            target="_blank"
            className="w-full sm:w-auto px-8 py-4 bg-white text-slate-700 border border-slate-200 rounded-full font-medium hover:bg-slate-50 transition-colors flex items-center justify-center"
          >
            Read Documentation
          </a>
        </div>
      </section>

      {/* Features Grid */}
      <section className="py-24 bg-white border-t border-slate-100">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid md:grid-cols-3 gap-12">
            <div className="p-8 rounded-2xl bg-slate-50 border border-slate-100 hover:shadow-lg transition-shadow">
              <div className="w-12 h-12 bg-blue-100 rounded-xl flex items-center justify-center mb-6">
                <Bot className="w-6 h-6 text-blue-600" />
              </div>
              <h3 className="text-xl font-bold mb-3">Natural Language</h3>
              <p className="text-slate-500 leading-relaxed">
                "Create a workflow that scrapes TechCrunch every morning and summarizes it to Slack." Just say it, and we build it.
              </p>
            </div>

            <div className="p-8 rounded-2xl bg-slate-50 border border-slate-100 hover:shadow-lg transition-shadow">
              <div className="w-12 h-12 bg-purple-100 rounded-xl flex items-center justify-center mb-6">
                <Zap className="w-6 h-6 text-purple-600" />
              </div>
              <h3 className="text-xl font-bold mb-3">Instant Deployment</h3>
              <p className="text-slate-500 leading-relaxed">
                Connects directly to your local n8n instance. Workflows are pushed instantly via API and ready to activate.
              </p>
            </div>

            <div className="p-8 rounded-2xl bg-slate-50 border border-slate-100 hover:shadow-lg transition-shadow">
              <div className="w-12 h-12 bg-green-100 rounded-xl flex items-center justify-center mb-6">
                <Share2 className="w-6 h-6 text-green-600" />
              </div>
              <h3 className="text-xl font-bold mb-3">Open Ecosystem</h3>
              <p className="text-slate-500 leading-relaxed">
                Built on open standards. Export your agents as standard n8n JSON. No vendor lock-in.
              </p>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
