import { NextResponse } from 'next/server';
import { GoogleGenerativeAI } from '@google/generative-ai';

const AI_EDITOR_PROMPT = `You are an n8n Workflow Editor AI Assistant.

Your job: Modify n8n workflows based on user requests.

CRITICAL RULES:
1. Output ONLY valid JSON (no explanations, no markdown)
2. Return ONLY these fields: { "name", "nodes", "connections", "settings" }
3. Do NOT include: id, createdAt, updatedAt, active, isArchived, tags, versionId
4. n8n uses "disabled": true in node parameters to disable nodes - if user says "remove disabled nodes", filter out nodes where parameters.disabled === true
5. When removing nodes, also remove their connections
6. Keep all other nodes and connections unchanged unless explicitly requested

n8n Node Structure:
- Each node has: id, name, type, typeVersion, position, parameters, credentials
- "disabled" nodes have: "parameters": { "disabled": true, ... }
- Connections format: { "NodeName": { "main": [[ { "node": "TargetNode", "type": "main", "index": 0 } ]] } }

Common User Requests:
- "remove disabled nodes" → Filter out nodes where parameters.disabled === true
- "remove [node name]" → Remove node by name and its connections
- "add delay" → Add n8n-nodes-base.wait node with amount/unit parameters
- "undo" → You CANNOT undo, respond with explanation

User Request: {{user_request}}

Current Workflow (JSON):
{{current_workflow}}

RETURN ONLY: { "name": "...", "nodes": [...], "connections": {...}, "settings": {...} }`;

export async function POST(request: Request) {
    try {
        const { workflowId, userRequest } = await request.json();
        console.log('[AI Edit] Received edit request for workflow:', workflowId);

        const apiKey = process.env.GEMINI_API_KEY;
        if (!apiKey) {
            return NextResponse.json(
                { error: 'GEMINI_API_KEY not configured' },
                { status: 500 }
            );
        }

        // Fetch current workflow from n8n
        console.log('[AI Edit] Fetching current workflow from n8n...');
        const n8nResponse = await fetch(`${process.env.N8N_API_URL}/workflows/${workflowId}`, {
            headers: {
                'X-N8N-API-KEY': process.env.N8N_API_KEY || '',
            },
        });

        if (!n8nResponse.ok) {
            return NextResponse.json(
                { error: 'Failed to fetch workflow from n8n' },
                { status: 500 }
            );
        }

        const currentWorkflow = await n8nResponse.json();
        console.log('[AI Edit] Current workflow nodes:', currentWorkflow.nodes?.length);

        // Call Gemini to modify workflow
        const genAI = new GoogleGenerativeAI(apiKey);
        const model = genAI.getGenerativeModel({ model: 'gemini-flash-latest' });

        const fullPrompt = AI_EDITOR_PROMPT
            .replace('{{user_request}}', userRequest)
            .replace('{{current_workflow}}', JSON.stringify(currentWorkflow, null, 2));

        console.log('[AI Edit] Calling Gemini API...');
        const result = await model.generateContent(fullPrompt);
        const response = await result.response;
        let text = response.text();

        console.log('[AI Edit] Raw response length:', text.length);
        console.log('[AI Edit] First 200 chars:', text.substring(0, 200));

        // Extract JSON
        text = text.replace(/```json/g, '').replace(/```/g, '').trim();
        const jsonStartIndex = text.indexOf('{');
        const jsonEndIndex = text.lastIndexOf('}');

        if (jsonStartIndex !== -1 && jsonEndIndex !== -1) {
            text = text.substring(jsonStartIndex, jsonEndIndex + 1);
        } else {
            console.error('[AI Edit] No JSON found in response');
            return NextResponse.json(
                { error: 'No valid JSON in AI response' },
                { status: 500 }
            );
        }

        let updatedWorkflow;
        try {
            updatedWorkflow = JSON.parse(text);
            console.log('[AI Edit] Parsed updated workflow, nodes:', updatedWorkflow.nodes?.length);
        } catch (parseError: any) {
            console.error('[AI Edit] JSON parse error:', parseError.message);
            console.error('[AI Edit] Failed text:', text.substring(0, 500));
            return NextResponse.json(
                { error: 'Failed to parse AI response', details: parseError.message },
                { status: 500 }
            );
        }

        // Log to file for debugging
        const fs = require('fs');
        const path = require('path');
        const logPath = path.join(process.cwd(), 'ai_edit_logs.json');

        try {
            let logs = [];
            if (fs.existsSync(logPath)) {
                logs = JSON.parse(fs.readFileSync(logPath, 'utf-8'));
            }
            logs.push({
                timestamp: new Date().toISOString(),
                workflowId,
                userRequest,
                response: text.substring(0, 1000),
                success: true
            });
            fs.writeFileSync(logPath, JSON.stringify(logs, null, 2));
        } catch (logError) {
            console.error('[AI Edit] Failed to write log:', logError);
        }

        // IMPORTANT: Sanitize workflow - remove n8n metadata fields
        // n8n PUT endpoint rejects: id, createdAt, updatedAt, active, isArchived, versionId, tags (read-only)
        const sanitizedWorkflow = {
            name: updatedWorkflow.name,
            nodes: updatedWorkflow.nodes,
            connections: updatedWorkflow.connections,
            settings: updatedWorkflow.settings || { executionOrder: 'v1' },
            ...(updatedWorkflow.staticData && { staticData: updatedWorkflow.staticData }),
        };

        console.log('[AI Edit] Sanitized workflow - removed metadata fields');

        // Update workflow in n8n
        const updateResponse = await fetch(`${process.env.N8N_API_URL}/workflows/${workflowId}`, {
            method: 'PUT',
            headers: {
                'Content-Type': 'application/json',
                'X-N8N-API-KEY': process.env.N8N_API_KEY || '',
            },
            body: JSON.stringify(sanitizedWorkflow),
        });

        if (!updateResponse.ok) {
            const errorData = await updateResponse.json();
            console.error('[AI Edit] n8n update failed:', errorData);
            return NextResponse.json(
                { error: 'Failed to update workflow in n8n', details: errorData },
                { status: 500 }
            );
        }

        console.log('[AI Edit] Workflow updated successfully');
        return NextResponse.json({
            response: 'Workflow updated successfully! The changes are now live in the editor.',
            updatedWorkflow,
        });
    } catch (error: any) {
        console.error('[AI Edit] Error:', error);
        return NextResponse.json(
            { error: 'Failed to edit workflow', details: error.message },
            { status: 500 }
        );
    }
}
