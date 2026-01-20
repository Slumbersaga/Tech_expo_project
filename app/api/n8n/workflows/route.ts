import { NextResponse } from 'next/server';
import fs from 'fs/promises';
import path from 'path';

export async function GET() {
    try {
        const n8nUrl = process.env.N8N_API_URL;
        const n8nKey = process.env.N8N_API_KEY;

        if (!n8nUrl) {
            return NextResponse.json({ error: 'N8N_API_URL not configured' }, { status: 500 });
        }

        console.log(`Testing connectivity to: ${n8nUrl}/workflows`);

        const response = await fetch(`${n8nUrl}/workflows`, {
            method: 'GET',
            headers: {
                'Content-Type': 'application/json',
                'X-N8N-API-KEY': n8nKey || '',
            },
        });

        let data;
        try {
            data = await response.json();
        } catch (e) {
            const text = await response.text();
            data = { error: 'Invalid JSON response from n8n', text };
        }

        return NextResponse.json(data, { status: response.status });
    } catch (error) {
        console.error('Proxy Error:', error);
        return NextResponse.json({ error: 'Failed to proxy request', details: String(error) }, { status: 500 });
    }
}

export async function POST(request: Request) {
    let body;
    try {
        body = await request.json();
    } catch (e) {
        return NextResponse.json({ error: 'Invalid JSON body' }, { status: 400 });
    }

    try {
        const n8nUrl = process.env.N8N_API_URL;
        const n8nKey = process.env.N8N_API_KEY;

        if (!n8nUrl) {
            return NextResponse.json({ error: 'N8N_API_URL not configured' }, { status: 500 });
        }

        console.log(`Forwarding request to: ${n8nUrl}/workflows`);

        const response = await fetch(`${n8nUrl}/workflows`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'X-N8N-API-KEY': n8nKey || '',
            },
            body: JSON.stringify(body),
        });

        let data;
        const contentType = response.headers.get('content-type');
        if (contentType && contentType.includes('application/json')) {
            try {
                data = await response.json();
            } catch (e) {
                // Should not happen if content-type is json, but safe to handle
                data = { error: 'Failed to parse JSON response from n8n' };
            }
        } else {
            const text = await response.text();
            data = { error: 'Non-JSON response from n8n', text };
        }

        // Log to file (Legacy logging, consider database or proper logger)
        const logPath = path.join(process.cwd(), 'api_responses.json');
        let logs: any[] = [];
        try {
            const fileContent = await fs.readFile(logPath, 'utf-8');
            logs = JSON.parse(fileContent);
            if (!Array.isArray(logs)) logs = [];
        } catch (e) {
            logs = [];
        }

        logs.push({
            timestamp: new Date().toISOString(),
            request: body,
            response: data,
            status: response.status
        });

        // Limit log size to last 50 entries
        if (logs.length > 50) logs = logs.slice(-50);

        await fs.writeFile(logPath, JSON.stringify(logs, null, 2));

        return NextResponse.json(data, { status: response.status });
    } catch (error) {
        console.error('Proxy Error:', error);
        return NextResponse.json({ error: 'Failed to proxy request to n8n', details: String(error) }, { status: 500 });
    }
}
