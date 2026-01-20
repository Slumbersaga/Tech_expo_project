import { MoreVertical } from 'lucide-react';
import Link from 'next/link';

interface AgentCardProps {
    name: string;
    status: 'Published' | 'Not Published';
    statusColor?: 'green' | 'gray';
    description: string;
    lastRun?: string;
    icons?: React.ReactNode[];
    workflowUrl?: string;
    agentId?: string;
}

export function AgentCard({ name, status, statusColor = 'gray', description, lastRun, icons, workflowUrl, agentId }: AgentCardProps) {
    return (
        <div className="bg-white rounded-lg border border-gray-200 shadow-sm hover:shadow-md transition-shadow p-5 flex flex-col h-full">
            <div className="flex justify-between items-start mb-2">
                <h3 className="font-semibold text-gray-900 flex items-center gap-2">
                    <span className="w-4 h-4 rounded-sm bg-purple-100 text-purple-600 flex items-center justify-center text-[10px]">⚡</span>
                    {name}
                </h3>
                <div className="flex items-center gap-2">
                    <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${status === 'Published'
                        ? 'bg-green-100 text-green-700'
                        : 'bg-gray-100 text-gray-600'
                        }`}>
                        {status}
                    </span>
                    {workflowUrl && (
                        <a
                            href={workflowUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-gray-400 hover:text-indigo-600 transition-colors p-1"
                            title="Open in n8n"
                        >
                            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6"></path><polyline points="15 3 21 3 21 9"></polyline><line x1="10" y1="14" x2="21" y2="3"></line></svg>
                        </a>
                    )}
                </div>
            </div>

            <p className="text-sm text-gray-500 mb-4 flex-1 line-clamp-3 leading-relaxed">
                {description}
            </p>

            {agentId && (
                <Link
                    href={`/editor/${agentId}`}
                    className="mb-4 w-full bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-medium py-2 px-4 rounded-lg transition-colors text-center"
                >
                    Edit with AI
                </Link>
            )}

            <div className="flex items-center justify-between mt-auto">
                <div className="flex items-center gap-2">
                    {icons && icons.map((icon, i) => (
                        <div key={i} className="w-6 h-6 rounded-full border border-gray-100 flex items-center justify-center bg-white shadow-sm text-xs">
                            {icon}
                        </div>
                    ))}
                    <div className="w-6 h-6 rounded-full bg-blue-100 flex items-center justify-center text-blue-600 text-[10px] font-bold">
                        OK
                    </div>
                </div>
                <span className="text-xs text-gray-400">
                    {lastRun || 'No runs yet...'}
                </span>
            </div>
        </div>
    );
}
