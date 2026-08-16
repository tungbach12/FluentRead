import {ElMessage} from "element-plus";
import {h} from "vue";
import {throttle} from "@/entrypoints/utils/common";

function isCredentialMessage(message: string): boolean {
    return /API Key|access token/i.test(message);
}

function getNoticeTitle(type: 'error' | 'success', credential: boolean): string {
    if (credential) return 'Configuration reminder';
    return type === 'success' ? 'Completed' : 'Translation reminder';
}

function getNoticeDetail(message: string, credential: boolean): string {
    if (!credential) return message;

    const service = message.match(/^(.+?) requires an API Key/)?.[1];
    return service
        ? `Last step: enter the API Key for ${service} and you can start translating.`
        : 'Almost there: enter the API Key and you can keep translating.';
}

function createNoticeContent(message: string, type: 'error' | 'success', credential: boolean) {
    const detail = getNoticeDetail(message, credential);
    return h('span', {class: 'fluent-read-notice-copy'}, [
        h('span', {class: 'fluent-read-notice-heading'}, [
            h('strong', {class: 'fluent-read-notice-brand'}, '流畅阅读'),
            h('span', {class: 'fluent-read-notice-divider', 'aria-hidden': 'true'}, '·'),
            h('span', {class: 'fluent-read-notice-title'}, getNoticeTitle(type, credential)),
        ]),
        h('span', {class: 'fluent-read-notice-body'}, [
            h('span', {class: 'fluent-read-notice-detail'}, detail),
            credential
                ? h('button', {
                    class: 'fluent-read-notice-action',
                    type: 'button',
                    onClick: () => {
                        void browser.runtime.sendMessage({type: 'openOptionsPage'});
                    },
                }, '去设置')
                : null,
        ]),
    ]);
}

function sendMessage(message: string, type: 'error' | 'success'): void {
    const credential = isCredentialMessage(message);
    const tone = credential ? 'warning' : type;

    ElMessage({
        message: createNoticeContent(message, type, credential),
        type: tone,
        icon: () => h('img', {
            class: 'fluent-read-notice-mark',
            src: browser.runtime.getURL('/icon/48.png'),
            alt: '流畅阅读',
        }),
        customClass: `fluent-read-message${credential ? ' fluent-read-message-credential' : ''}`,
        showClose: true,
        duration: credential ? 6500 : 3500,
        offset: 18,
        plain: true,
    });
}

function _sendErrorMessage(message: string) {
    sendMessage(message, 'error');
}

// 使用防抖函数包装，1s 内只能发送一次消息
export const sendErrorMessage = throttle(_sendErrorMessage, 1000);
