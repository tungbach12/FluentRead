import {method} from "../utils/constant";
import {commonMsgTemplate} from "../utils/template";
import {config} from "@/entrypoints/utils/config";
import {contentPostHandler} from "@/entrypoints/utils/check";
import {isApiKeyRequired} from "@/entrypoints/utils/configValidation";

async function azureOpenai(message: any) {
    try {
        const service = message.serviceOverride || config.service;
        // 验证必要的配置
        const apiKey = config.token[service];
        if ((!apiKey || apiKey.trim() === '') && isApiKeyRequired(service, config)) {
            throw new Error('Azure OpenAI API Key is not configured. Enter a valid API Key in Settings.');
        }

        const endpoint = config.azureOpenaiEndpoint;
        if (!endpoint || endpoint.trim() === '') {
            throw new Error('Azure OpenAI endpoint is not configured. Enter the full endpoint URL in Settings.');
        }

        // 验证端点地址格式
        if (!endpoint.includes('openai.azure.com') || !endpoint.includes('/chat/completions')) {
            throw new Error('Azure OpenAI endpoint format is incorrect. Make sure it includes the correct domain and path.');
        }

        const headers = new Headers({'Content-Type': 'application/json'});
        if (apiKey?.trim()) headers.set('api-key', apiKey.trim());
                
        const resp = await fetch(endpoint, {
            method: method.POST,
            headers,
            body: commonMsgTemplate(message.origin, message.pageContext, message.summaryPrompt, message.summarySystemPrompt, service)
        });

        if (!resp.ok) {
            const errorText = await resp.text();
            let errorMessage = `Azure OpenAI API call failed: ${resp.status} ${resp.statusText}`;
            
            // 根据状态码提供更具体的错误信息
            switch (resp.status) {
                case 401:
                    errorMessage = 'API Key is invalid or expired. Check your Azure OpenAI API Key.';
                    break;
                case 404:
                    errorMessage = 'The endpoint does not exist. Check that the resource name and deployment name are correct.';
                    break;
                case 429:
                    errorMessage = 'API rate limit exceeded. Retry later or check your quota settings.';
                    break;
                case 500:
                    errorMessage = 'Azure OpenAI service internal error. Please retry later.';
                    break;
                default:
                    errorMessage += `\n详细信息: ${errorText}`;
            }
            
            throw new Error(errorMessage);
        }

        const result = await resp.json();
        
        if (!result.choices || !result.choices[0] || !result.choices[0].message) {
            throw new Error('Azure OpenAI 返回数据格式异常，请检查模型配置');
        }
        
        return contentPostHandler(result.choices[0].message.content);
    } catch (error) {
        console.error('Azure OpenAI API调用失败:', error);
        throw error;
    }
}

export default azureOpenai;
