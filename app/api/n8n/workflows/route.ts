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
    try {
        const body = await request.json();
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
        try {
            data = await response.json();
        } catch (e) {
            // Handle non-JSON responses
            const text = await response.text();
            data = { error: 'Invalid JSON response from n8n', text };
        }

        // Log to file
        const logPath = path.join(process.cwd(), 'api_responses.json');
        let logs = [];
        try {
            const fileContent = await fs.readFile(logPath, 'utf-8');
            logs = JSON.parse(fileContent);
        } catch (e) {
            // File missing or invalid, start fresh
            logs = [];
        }

        logs.push({
            timestamp: new Date().toISOString(),
            request: body,
            response: data,
            status: response.status
        });

        await fs.writeFile(logPath, JSON.stringify(logs, null, 2));

        return NextResponse.json(data, { status: response.status });
    } catch (error) {
        console.error('Proxy Error:', error);
        return NextResponse.json({ error: 'Failed to proxy request', details: String(error) }, { status: 500 });
    }
}
