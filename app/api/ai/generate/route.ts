import { NextResponse } from 'next/server';
import { GoogleGenerativeAI } from '@google/generative-ai';
import { AI_ARCHITECT_PROMPT } from '@/app/lib/prompts';

export async function POST(request: Request) {
    let body;
    try {
        body = await request.json();
    } catch (e) {
        return NextResponse.json({ error: 'Invalid JSON body' }, { status: 400 });
    }

    try {
        const { prompt } = body;

        if (!prompt || typeof prompt !== 'string' || !prompt.trim()) {
            return NextResponse.json({ error: 'Missing or empty "prompt" field' }, { status: 400 });
        }
        console.log('[AI Generate] Received prompt:', prompt);

        const apiKey = process.env.GEMINI_API_KEY;

        if (!apiKey) {
            console.error('[AI Generate] GEMINI_API_KEY not configured');
            return NextResponse.json(
                { error: 'GEMINI_API_KEY not configured' },
                { status: 500 }
            );
        }

        console.log('[AI Generate] Calling Gemini API...');
        const genAI = new GoogleGenerativeAI(apiKey);
        // Reverting to gemini-flash-latest as gemini-1.5-flash returned 404 for this key
        const model = genAI.getGenerativeModel({ model: 'gemini-flash-latest' });

        const fullPrompt = AI_ARCHITECT_PROMPT.replace('{{user_input}}', prompt);

        let result;
        try {
            result = await model.generateContent(fullPrompt);
        } catch (geminiError: any) {
            console.error('[AI Generate] Gemini API Error:', geminiError);
            return NextResponse.json(
                { error: 'Gemini API failed', details: geminiError.message || String(geminiError) },
                { status: 500 }
            );
        }

        const response = await result.response;
        let text = response.text();
        console.log('[AI Generate] Raw AI response length:', text.length);

        // Clean up markdown and find JSON object
        text = text.replace(/```json/g, '').replace(/```/g, '').trim();
        const jsonStartIndex = text.indexOf('{');
        const jsonEndIndex = text.lastIndexOf('}');

        if (jsonStartIndex !== -1 && jsonEndIndex !== -1) {
            text = text.substring(jsonStartIndex, jsonEndIndex + 1);
        } else {
            console.error('[AI Generate] No JSON found in response');
            return NextResponse.json(
                { error: 'No valid JSON in AI response', raw: text.substring(0, 500) },
                { status: 500 }
            );
        }

        let workflowJson;
        try {
            workflowJson = JSON.parse(text);
            console.log('[AI Generate] Successfully parsed JSON, nodes count:', workflowJson.nodes?.length);
        } catch (e: any) {
            console.error('[AI Generate] JSON Parse Error:', e.message);
            console.error('[AI Generate] Failed text:', text.substring(0, 500));
            return NextResponse.json(
                { error: 'Failed to parse AI response', details: e.message, raw: text.substring(0, 500) },
                { status: 500 }
            );
        }

        return NextResponse.json(workflowJson);
    } catch (error: any) {
        console.error('[AI Generate] Unexpected Error:', error);
        return NextResponse.json(
            { error: 'Failed to generate workflow', details: error.message || String(error) },
            { status: 500 }
        );
    }
}
