// Custom API adapter — robust against both JSON and SSE (streaming) responses.
import {commonMsgTemplate} from "../utils/template";
import {method} from "../utils/constant";
import {services} from "@/entrypoints/utils/option";
import {config} from "@/entrypoints/utils/config";
import {contentPostHandler} from "@/entrypoints/utils/check";
import {appendOptionalBearer} from './auth';

function extractContentFromSSE(text: string): string | null {
    // 9Router/OpenAI-compatible SSE: lines like "data: {"choices":[{"delta":{"content":"..."}}]}"
    let lastContent = '';
    for (const rawLine of text.split('\n')) {
        const line = rawLine.trim();
        if (!line.startsWith('data:')) continue;
        const jsonStr = line.slice(5).trim();
        if (!jsonStr || jsonStr === '[DONE]') continue;
        try {
            const data = JSON.parse(jsonStr);
            // Chat completion chunk
            const delta = data?.choices?.[0]?.delta?.content;
            if (delta) lastContent += delta;
            // Some gateways emit full message in choices[0].message
            const msg = data?.choices?.[0]?.message?.content;
            if (msg) lastContent += msg;
            // Non-stream fallback body inside a data line
            if (!delta && !msg) {
                const content = data?.choices?.[0]?.message?.content;
                if (content) lastContent += content;
            }
        } catch {
            // ignore malformed lines
        }
    }
    return lastContent || null;
}

async function custom(message: any) {
    const service = message.serviceOverride || services.custom;

    let headers = new Headers();
    headers.append('Content-Type', 'application/json');
    appendOptionalBearer(headers, config.token[service]);

    const resp = await fetch(config.custom, {
        method: method.POST,
        headers: headers,
        body: commonMsgTemplate(message.origin, message.pageContext, message.summaryPrompt, message.summarySystemPrompt, service)
    });

    if (resp.ok) {
        const raw = await resp.text();
        // Try JSON first (non-streaming) — quickest path.
        try {
            const result = JSON.parse(raw);
            const content = result?.choices?.[0]?.message?.content;
            if (content) return contentPostHandler(content);
        } catch {
            // fall through to SSE parse
        }
        // SSE/streamed body — aggregate final content.
        const sseContent = extractContentFromSSE(raw);
        if (sseContent) return contentPostHandler(sseContent);
        throw new Error(`Translation failed: response could not be parsed (${raw.slice(0, 200)})`);
    } else {
        console.log("Translation failed:", resp);
        throw new Error(`Translation failed: ${resp.status} ${resp.statusText} body: ${await resp.text()}`);
    }
}

export default custom;