import { method } from "../utils/constant";
import {commonMsgTemplate} from "../utils/template";
import { config } from "@/entrypoints/utils/config";
import { contentPostHandler } from "@/entrypoints/utils/check";
import { appendOptionalBearer } from './auth';

async function newapi(message: any) {
    try {
        const service = message.serviceOverride || config.service;
        const headers = new Headers({'Content-Type': 'application/json'});
        appendOptionalBearer(headers, config.token[service]);

        let url = config.newApiUrl

        if (!url) {
            throw new Error('New API URL is not configured');
        }

        if (url.endsWith('/')) {
            url = url.slice(0, -1); // 删除末尾的斜杠
        }

        // check has /v1
        if (url.endsWith('/v1')) {
            url += '/chat/completions';
        } else if (!url.endsWith('/chat/completions')) {
            url += '/v1/chat/completions';
        }

        const resp = await fetch(url, {
            method: method.POST,
            headers,
            body: commonMsgTemplate(message.origin, message.pageContext, message.summaryPrompt, message.summarySystemPrompt, service)
        });

        if (!resp.ok) {
            throw new Error(`Translation failed: ${resp.status} ${resp.statusText} body: ${await resp.text()}`);
        }

        const result = await resp.json();

        if (result.choices && result.choices.length > 0) {
            return contentPostHandler(result.choices[0].message.content);
        }

        throw new Error('Translation failed: upstream returned no content');
    } catch (error) {
        console.error('API调用失败:', error);
        throw error;
    }
}

export default newapi;
