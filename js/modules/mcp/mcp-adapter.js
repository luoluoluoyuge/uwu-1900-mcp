(function () {
    'use strict';

    const MCP_SCHEMA = {
        characters: '&id',
        groups: '&id',
        worldBooks: '&id',
        myStickers: '&id',
        globalSettings: 'key',
        workshopHistory: '++id, timestamp',
        workshopVibeGroups: '++id',
        characterPhotos: '++id, charId, timestamp',
        customFonts: '&id',
        reader_books: '&id, lastReadTime',
        reader_chapters: '&id, bookId',
        reader_comments: '++id, bookId, [bookId+chapterIndex+paragraphIndex]',
        mcpConnections: '&id,type,enabled,status,updatedAt',
        mcpActivities: '&id,connectionId,status,chatId,createdAt',
        mcpSettings: '&id',
        mcpSecrets: '&id',
        mcpSubscriptions: '&id,connectionId,uri,status'
    };

    const MCP_SCREEN_HTML = `
        <div id="mcp-screen" class="screen">
            <header class="app-header">
                <button class="back-btn" data-target="home-screen" aria-label="返回">‹</button>
                <div class="title-container"><h1 class="title">MCP</h1></div>
                <button class="action-btn" id="mcp-add-btn" aria-label="添加连接">＋</button>
            </header>
            <main class="content mcp-content">
                <section class="mcp-engine-card" aria-live="polite">
                    <div class="mcp-engine-glow"></div>
                    <div class="mcp-engine-header">
                        <div class="mcp-pulse-wrapper">
                            <span id="mcp-summary-dot" class="mcp-summary-dot"></span>
                            <span class="mcp-pulse-ring"></span>
                        </div>
                        <div class="mcp-engine-title-group">
                            <h2 id="mcp-summary-title">尚未连接</h2>
                            <p id="mcp-summary-detail">0 个连接 · 0 个工具</p>
                        </div>
                    </div>
                    <div class="mcp-engine-metrics">
                        <div class="mcp-metric-item"><span class="mcp-metric-val" id="mcp-metric-active">0</span><span class="mcp-metric-lbl">在线节点</span></div>
                        <div class="mcp-metric-sep"></div>
                        <div class="mcp-metric-item"><span class="mcp-metric-val" id="mcp-metric-tools">0</span><span class="mcp-metric-lbl">挂载工具</span></div>
                        <div class="mcp-metric-sep"></div>
                        <div class="mcp-metric-item"><span class="mcp-metric-val" id="mcp-metric-calls">0</span><span class="mcp-metric-lbl">通信流水</span></div>
                    </div>
                </section>
                <nav class="mcp-tabs mcp-tabs-pill" aria-label="MCP 页面">
                    <button class="active" data-mcp-tab="connections">连接</button><button data-mcp-tab="tools">工具</button><button data-mcp-tab="activity">活动</button><button data-mcp-tab="settings">设置</button>
                </nav>
                <div id="mcp-panel" class="mcp-panel-root"></div>
                <input id="mcp-import-input" type="file" accept="application/json,.json" hidden>
            </main>
        </div>
        <div id="mcp-sheet" class="mcp-sheet-overlay" aria-hidden="true">
            <div class="mcp-sheet" role="dialog" aria-modal="true" aria-labelledby="mcp-sheet-title">
                <div class="mcp-sheet-head">
                    <h2 id="mcp-sheet-title"></h2>
                    <button id="mcp-sheet-close" class="mcp-sheet-close-btn" type="button" aria-label="关闭">
                        <svg viewBox="0 0 24 24" width="16" height="16" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round" fill="none"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>
                    </button>
                </div>
                <div id="mcp-sheet-body" class="mcp-sheet-body"></div>
                <div id="mcp-sheet-actions" class="mcp-sheet-actions"></div>
            </div>
        </div>`;

    function injectMcpScreen() {
        if (document.getElementById('mcp-screen')) return;
        const phone = document.querySelector('.phone-screen');
        if (phone) phone.insertAdjacentHTML('beforeend', MCP_SCREEN_HTML);
    }

    function ensureMcpHomeIcon() {
        const existing = document.querySelector('[data-id="app-mcp"]');
        if (existing) {
            bindMcpHomeIcon(existing);
            return;
        }
        const grid = document.querySelector('.home-grid-layout');
        if (!grid) return;
        grid.insertAdjacentHTML('beforeend', `
            <div class="grid-item-1x1" data-id="app-mcp">
                <a href="#" class="app-icon" data-target="mcp-screen">
                    <img src="./mcp-icon.png" alt="MCP" class="icon-img">
                    <span class="app-name">MCP</span>
                </a>
            </div>`);
        bindMcpHomeIcon(grid.querySelector('[data-id="app-mcp"]'));
    }

    function bindMcpHomeIcon(item) {
        const link = item && item.querySelector('.app-icon');
        if (!link || link.dataset.mcpBound === 'true') return;
        link.dataset.mcpBound = 'true';
        link.addEventListener('click', event => {
            event.preventDefault();
            event.stopPropagation();
            if (window.mcpManager && typeof window.mcpManager.open === 'function') {
                window.mcpManager.open();
            } else if (typeof window.switchScreen === 'function') {
                window.switchScreen('mcp-screen');
            }
        });
    }

    function installDatabaseSchema() {
        if (typeof window.initDatabase !== 'function') return;
        const original = window.initDatabase;
        window.initDatabase = function () {
            original.apply(this, arguments);
            if (window.dexieDB) dexieDB.version(9).stores(MCP_SCHEMA);
        };
    }

    function installHomeHook() {
        if (typeof window.setupHomeScreen !== 'function') return;
        const original = window.setupHomeScreen;
        window.setupHomeScreen = function () {
            const result = original.apply(this, arguments);
            ensureMcpHomeIcon();
            return result;
        };
    }

    function injectPrivatePermissionUi() {
        const form = document.getElementById('chat-settings-form');
        const tabs = document.querySelector('#chat-settings-screen .settings-tabs');
        if (!form || !tabs || document.getElementById('setting-tab-mcp')) return;
        tabs.insertAdjacentHTML('beforeend', '<div class="settings-tab-item" data-tab="setting-tab-mcp">MCP</div>');
        form.querySelector('button[type="submit"]')?.insertAdjacentHTML('beforebegin', '<div id="setting-tab-mcp" class="settings-tab-content"><div id="chat-mcp-settings"></div></div>');
    }

    function injectGroupPermissionUi() {
        const form = document.getElementById('group-settings-form');
        if (!form || document.getElementById('group-mcp-settings')) return;
        const submit = form.querySelector('button[type="submit"], input[type="submit"]');
        const html = '<div class="kkt-group" style="margin-top:15px;"><div style="margin-bottom:10px;padding:5px 0 0 8px;"><div class="kkt-item-label" style="font-weight:bold;color:var(--primary-color);">MCP 工具权限</div></div><div class="kkt-item" style="display:block"><div id="group-mcp-settings" style="width:100%"></div></div></div>';
        if (submit) submit.insertAdjacentHTML('beforebegin', html);
        else form.insertAdjacentHTML('beforeend', html);
    }

    function renderPermissions(containerId, target) {
        const container = document.getElementById(containerId);
        if (container && window.McpManager) window.McpManager.renderPermissionEditor(container, target);
    }

    function installSettingsHooks() {
        if (typeof window.injectChatSettingsHtml === 'function') {
            const original = window.injectChatSettingsHtml;
            window.injectChatSettingsHtml = function () {
                const result = original.apply(this, arguments);
                injectPrivatePermissionUi();
                return result;
            };
        }
        if (typeof window.injectGroupSettingsHtml === 'function') {
            const original = window.injectGroupSettingsHtml;
            window.injectGroupSettingsHtml = function () {
                const result = original.apply(this, arguments);
                injectGroupPermissionUi();
                return result;
            };
        }
        if (typeof window.loadSettingsToSidebar === 'function') {
            const original = window.loadSettingsToSidebar;
            window.loadSettingsToSidebar = function () {
                const result = original.apply(this, arguments);
                const target = window.db && db.characters.find(item => item.id === window.currentChatId);
                renderPermissions('chat-mcp-settings', target);
                return result;
            };
        }
        if (typeof window.saveSettingsFromSidebar === 'function') {
            const original = window.saveSettingsFromSidebar;
            window.saveSettingsFromSidebar = async function () {
                const target = window.db && db.characters.find(item => item.id === window.currentChatId);
                const container = document.getElementById('chat-mcp-settings');
                if (target && container && window.McpManager) target.mcpSettings = window.McpManager.readPermissionEditor(container);
                return original.apply(this, arguments);
            };
        }
        if (typeof window.loadGroupSettingsToSidebar === 'function') {
            const original = window.loadGroupSettingsToSidebar;
            window.loadGroupSettingsToSidebar = function () {
                const result = original.apply(this, arguments);
                const target = window.db && db.groups.find(item => item.id === window.currentChatId);
                renderPermissions('group-mcp-settings', target);
                return result;
            };
        }
        if (typeof window.saveGroupSettingsFromSidebar === 'function') {
            const original = window.saveGroupSettingsFromSidebar;
            window.saveGroupSettingsFromSidebar = async function () {
                const target = window.db && db.groups.find(item => item.id === window.currentChatId);
                const container = document.getElementById('group-mcp-settings');
                if (target && container && window.McpManager) target.mcpSettings = window.McpManager.readPermissionEditor(container);
                return original.apply(this, arguments);
            };
        }
    }

    function installMessageCardRenderer() {
        if (typeof window.createMessageBubbleElement !== 'function') return;
        const original = window.createMessageBubbleElement;
        window.createMessageBubbleElement = function (message) {
            if (message && message.type === 'mcp_activity' && window.mcpManager) {
                const wrapper = document.createElement('div');
                wrapper.className = 'message-wrapper received mcp-activity-wrapper';
                wrapper.dataset.messageId = message.id || '';
                wrapper.innerHTML = window.mcpManager.renderMessageCard(message);
                return wrapper;
            }
            return original.apply(this, arguments);
        };
    }

    function currentForegroundChat() {
        if (!window.db || !window.currentChatId || window.isGenerating !== true) return null;
        return window.currentChatType === 'private'
            ? db.characters.find(item => item.id === currentChatId)
            : db.groups.find(item => item.id === currentChatId);
    }

    function latestUserMessage(chat) {
        return [...(chat.history || [])].reverse().find(message => message && message.role === 'user' && !message.isHidden && !message.isContextDisabled);
    }

    function isAiEndpoint(url) {
        return /\/v1\/chat\/completions(?:\?|$)/i.test(url) || /:streamGenerateContent(?:\?|$)/i.test(url);
    }

    function isMcpEnabledForChat(chat) {
        if (!chat) return false;
        if (chat.mcpSettings && chat.mcpSettings.enabled === true) return true;
        if (chat.settings && chat.settings.mcp && chat.settings.mcp.enabled === true) return true;
        if (!Array.isArray(chat.members)) return false;
        const memberSettings = chat.mcpSettings && chat.mcpSettings.memberSettings;
        return chat.members.some(member => {
            const saved = memberSettings && memberSettings[member.id] || member.mcpSettings || member.mcp;
            return saved && saved.enabled === true;
        });
    }

    function makeSyntheticResponse(text, provider, streaming) {
        let body;
        if (streaming && provider === 'gemini') {
            body = JSON.stringify([{ candidates: [{ content: { role: 'model', parts: [{ text }] } }] }]);
        } else if (streaming) {
            body = `data: ${JSON.stringify({ choices: [{ delta: { content: text } }] })}\n\ndata: [DONE]\n\n`;
        } else if (provider === 'gemini') {
            body = JSON.stringify({ candidates: [{ content: { role: 'model', parts: [{ text }] } }] });
        } else {
            body = JSON.stringify({ choices: [{ message: { role: 'assistant', content: text } }] });
        }
        return new Response(body, { status: 200, headers: { 'Content-Type': streaming && provider !== 'gemini' ? 'text/event-stream' : 'application/json' } });
    }

    function installMcpFetchBridge() {
        const nativeFetch = window.fetch.bind(window);
        window.fetch = async function (input, init) {
            const url = typeof input === 'string' ? input : input && input.url || '';
            if (!isAiEndpoint(url) || !init || typeof init.body !== 'string') return nativeFetch(input, init);

            const chat = currentForegroundChat();
            if (!isMcpEnabledForChat(chat)) return nativeFetch(input, init);
            if (!chat || !window.McpChatOrchestrator || !window.mcpManager) return nativeFetch(input, init);

            let requestBody;
            try { requestBody = JSON.parse(init.body); } catch (error) { return nativeFetch(input, init); }
            const latest = latestUserMessage(chat);
            const catalog = window.McpChatOrchestrator.createCatalog(chat, latest);
            if (!catalog.length) return nativeFetch(input, init);

            const provider = /:streamGenerateContent/i.test(url) ? 'gemini' : 'openai';
            const streaming = provider === 'gemini' ? true : requestBody.stream !== false;
            const initialMessages = provider === 'gemini' ? [...(requestBody.contents || [])] : [...(requestBody.messages || [])];

            const send = async options => {
                let endpoint = url;
                let body;
                if (provider === 'gemini') {
                    endpoint = url.replace(/:streamGenerateContent/i, ':generateContent');
                    const contents = options.messages.map(message => {
                        if (message && Array.isArray(message.parts)) return message;
                        if (message && message.role === 'tool') {
                            let response;
                            try { response = JSON.parse(message.content || '{}'); } catch (error) { response = { result: String(message.content || '') }; }
                            return { role: 'user', parts: [{ functionResponse: { name: message.name, response } }] };
                        }
                        return { role: message.role === 'assistant' ? 'model' : 'user', parts: [{ text: typeof message.content === 'string' ? message.content : JSON.stringify(message.content || '') }] };
                    });
                    const declarations = (options.tools || []).map(tool => tool.function).filter(Boolean);
                    const nativeTools = (requestBody.tools || []).filter(tool => !tool.functionDeclarations);
                    body = {
                        ...requestBody,
                        contents,
                        tools: declarations.length ? [...nativeTools, { functionDeclarations: declarations }] : nativeTools,
                        generationConfig: { ...(requestBody.generationConfig || {}) }
                    };
                    if (options.requireTool && declarations.length) body.toolConfig = { functionCallingConfig: { mode: 'ANY', allowedFunctionNames: declarations.map(item => item.name) } };
                    else delete body.toolConfig;
                } else {
                    body = {
                        ...requestBody,
                        messages: options.messages,
                        stream: false
                    };
                    if (options.tools && options.tools.length) {
                        body.tools = options.tools;
                        body.tool_choice = options.forceFinal ? 'none' : options.requireTool ? 'required' : 'auto';
                    } else {
                        delete body.tools;
                        delete body.tool_choice;
                    }
                }

                const response = await nativeFetch(endpoint, { ...init, body: JSON.stringify(body) });
                if (!response.ok) throw new Error(`MCP 工具回合 API 错误：${response.status} ${(await response.text()).slice(0, 300)}`);
                const payload = await response.json();
                if (provider === 'gemini') {
                    const assistantMessage = payload.candidates?.[0]?.content || { role: 'model', parts: [] };
                    const parts = assistantMessage.parts || [];
                    return {
                        text: parts.filter(part => part && part.text).map(part => part.text).join(''),
                        assistantMessage,
                        toolCalls: parts.filter(part => part && part.functionCall).map((part, index) => ({ id: `gemini_${Date.now()}_${index}`, name: part.functionCall.name, arguments: part.functionCall.args || {} }))
                    };
                }
                const assistantMessage = payload.choices?.[0]?.message || {};
                return {
                    text: assistantMessage.content || '',
                    assistantMessage,
                    toolCalls: (assistantMessage.tool_calls || []).map(call => ({ id: call.id, name: call.function && call.function.name, arguments: call.function && call.function.arguments || '{}' }))
                };
            };

            const text = await window.McpChatOrchestrator.run({ chat, messages: initialMessages, send });
            return makeSyntheticResponse(text || '', provider, streaming);
        };
    }

    injectMcpScreen();
    installDatabaseSchema();
    installHomeHook();
    installSettingsHooks();
    installMessageCardRenderer();
    installMcpFetchBridge();

    document.addEventListener('DOMContentLoaded', () => {
        ensureMcpHomeIcon();
        injectPrivatePermissionUi();
        injectGroupPermissionUi();
        setTimeout(() => {
            if (window.McpManager) window.McpManager.init().catch(error => console.error('[MCP] 初始化失败:', error));
        }, 0);
    });
})();
