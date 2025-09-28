document.addEventListener("DOMContentLoaded", () => {
    // ====================== DOM ELEMENTS ======================
    const tabs = document.querySelectorAll('.tab-link');
    const tabContents = document.querySelectorAll('.tab-content');

    const elModeSelect = document.getElementById('mode-select');
    const elAddModeBtn = document.getElementById('add-mode-btn');
    const elCopyModeBtn = document.getElementById('copy-mode-btn');
    const elRenameModeBtn = document.getElementById('rename-mode-btn');
    const elDeleteModeBtn = document.getElementById('delete-mode-btn');
    const elImportSettingsBtn = document.getElementById('import-settings-btn');
    const elImportFileInput = document.getElementById('import-file-input');
    const elExportSettingsBtn = document.getElementById('export-settings-btn');
    const elChapterSettingsBtn = document.getElementById('chapter-settings-btn');
    const elAddPairBtn = document.getElementById('add-pair-btn');
    const elSaveSettingsBtn = document.getElementById('save-settings-btn');
    const elPairsContainer = document.getElementById('replace-pairs-container');
    const elChapterSettingsCard = document.getElementById('chapter-settings-card');
    const elChapterKeywordInput = document.getElementById('chapter-keyword-input');
    const elAddKeywordBtn = document.getElementById('add-keyword-btn');
    const elKeywordsListContainer = document.getElementById('chapter-keywords-list');

    const elReplaceInput = document.getElementById('replace-input');
    const elReplaceWordCountDisplay = document.getElementById('replace-word-count');
    const elReplaceBtn = document.getElementById('replace-btn');
    const elReplaceOutput = document.getElementById('replace-output');
    const elOutputWordCountDisplay = document.getElementById('output-word-count');
    const elCopyOutputBtn = document.getElementById('copy-output-btn');

    const elSplitControls = document.querySelector('.split-controls');
    const elSplitInput = document.getElementById('split-input');
    const elSplitInputWordCountDisplay = document.getElementById('split-input-word-count');
    const elSplitOutputContainer = document.getElementById('split-output-container');

    const elPopup = document.getElementById('popup');

    // ====================== STATE ======================
    let settings = {
        modes: {
            'Mặc định': { pairs: [{ find: '', replace: '', matchCase: false, wholeWord: false }] }
        },
        activeMode: 'Mặc định',
        chapterKeywords: ['Chương', 'Chapter', 'Phần', 'Hồi']
    };

    let popupTimeout = null;
    let currentNumSplits = 2;

    // ====================== INITIALIZATION ======================
    loadSettings();
    updateUI();
    setupEventListeners();
    createSplitButtons();

    // Set styles for scrolling and resize
    tabContents.forEach(content => {
        content.style.overflow = 'visible';
    });
    if (elSplitOutputContainer) {
        elSplitOutputContainer.style.overflow = 'visible';
        elSplitOutputContainer.style.height = 'auto';
    }
    if (elReplaceInput) elReplaceInput.style.resize = 'none';
    if (elSplitInput) elSplitInput.style.resize = 'none';

    // Auto-click default split button (Chia 2)
    const defaultSplitBtn = elSplitControls.querySelector('[data-splits="2"]');
    if (defaultSplitBtn) {
        defaultSplitBtn.click();
    }

    // ====================== UI UPDATE FUNCTIONS ======================
    function updateUI() {
        updateModeSelect();
        renderCurrentModeSettings();
        renderChapterKeywords();
    }

    function switchTab(targetTabId) {
        tabContents.forEach(content => {
            content.classList.toggle('active', content.id === targetTabId);
        });
        tabs.forEach(tab => {
            tab.classList.toggle('active', tab.dataset.tab === targetTabId);
        });
        if (targetTabId === 'split') {
            const activeSplitBtn = elSplitControls.querySelector('.active');
            (activeSplitBtn || defaultSplitBtn)?.click();
        }
    }

    function updateModeSelect() {
        if (!elModeSelect) return;
        elModeSelect.innerHTML = '';
        Object.keys(settings.modes).forEach(modeName => {
            const option = document.createElement('option');
            option.value = modeName;
            option.textContent = modeName;
            if (modeName === settings.activeMode) {
                option.selected = true;
            }
            elModeSelect.appendChild(option);
        });
    }

    function renderCurrentModeSettings() {
        const mode = settings.modes[settings.activeMode];
        if (!mode) return;

        elPairsContainer.innerHTML = '';
        mode.pairs.forEach((pair) => {
            const pairElement = createPairElement(pair.find, pair.replace, pair.matchCase, pair.wholeWord);
            elPairsContainer.appendChild(pairElement);
        });
    }

    function createPairElement(findVal = '', replaceVal = '', matchCase = false, wholeWord = false) {
        const div = document.createElement('div');
        div.className = 'replace-pair';
        div.innerHTML = `
            <input type="text" class="find-input" placeholder="Tìm" value="${escapeHtml(findVal)}">
            <input type="text" class="replace-input" placeholder="Thay thế" value="${escapeHtml(replaceVal)}">
            <label class="toggle-switch" aria-label="Phân biệt hoa thường">
                <input type="checkbox" class="match-case-checkbox" ${matchCase ? 'checked' : ''}>
                <span class="slider"></span>
            </label>
            <label class="toggle-switch" aria-label="Toàn bộ từ">
                <input type="checkbox" class="whole-word-checkbox" ${wholeWord ? 'checked' : ''}>
                <span class="slider"></span>
            </label>
            <button type="button" class="delete-pair-btn btn btn-danger">Xóa</button>
        `;
        return div;
    }

    function createSplitButtons() {
        elSplitControls.innerHTML = '';
        for (let i = 2; i <= 10; i++) {
            const button = document.createElement('button');
            button.type = 'button';
            button.className = 'btn split-btn';
            button.textContent = `Chia ${i}`;
            button.dataset.splits = i;
            elSplitControls.appendChild(button);
        }
        // Add Chia Chương button
        const chiaChuongBtn = document.createElement('button');
        chiaChuongBtn.type = 'button';
        chiaChuongBtn.className = 'btn chia-chuong-btn';
        chiaChuongBtn.textContent = 'Chia Chương';
        elSplitControls.appendChild(chiaChuongBtn);
    }

    function renderChapterKeywords() {
        elKeywordsListContainer.innerHTML = '';
        settings.chapterKeywords.forEach(keyword => {
            const tag = document.createElement('div');
            tag.className = 'keyword-tag';
            tag.innerHTML = `
                <span>${escapeHtml(keyword)}</span>
                <button type="button" class="delete-keyword-btn" data-keyword="${escapeHtml(keyword)}">✖</button>
            `;
            elKeywordsListContainer.appendChild(tag);
        });
    }

    function renderPlaceholders(num) {
        elSplitOutputContainer.innerHTML = '';
        for (let i = 1; i <= num; i++) {
            const box = document.createElement('div');
            box.className = 'split-result-box';
            box.innerHTML = `
                <h4>Kết quả chương ${i}</h4>
                <div class="content">Kết quả chương ${i} sẽ xuất hiện ở đây.</div>
                <div class="toolbar text-center">
                    <span class="word-count-display">Words: 0</span>
                </div>
                <button type="button" class="btn copy-split-btn full-width-btn" data-chapter-index="${i-1}">Sao chép ${i}</button>
            `;
            elSplitOutputContainer.appendChild(box);
        }
    }

    function renderSplitOutput(chapters) {
        elSplitOutputContainer.innerHTML = '';
        chapters.forEach((chapter, index) => {
            const box = document.createElement('div');
            box.className = 'split-result-box';
            const contentHtml = escapeHtml(chapter.content || '').split('\n\n').map(p => `<p>${p}</p>`).join('');
            box.innerHTML = `
                <h4>${escapeHtml(chapter.title || `Kết quả chương ${index + 1}`)}</h4>
                <div class="content">${contentHtml}</div>
                <div class="toolbar text-center">
                    <span class="word-count-display">Words: ${countWords(chapter.content || '')}</span>
                </div>
                <button type="button" class="btn copy-split-btn full-width-btn" data-chapter-index="${index}">Sao chép ${index + 1}</button>
            `;
            elSplitOutputContainer.appendChild(box);
        });
    }

    // ====================== DATA HANDLING FUNCTIONS ======================
    function saveSettingsToUI() {
        const currentMode = settings.modes[settings.activeMode];
        if (!currentMode) return;

        const newPairs = [];
        elPairsContainer.querySelectorAll('.replace-pair').forEach(pairEl => {
            const find = pairEl.querySelector('.find-input').value;
            const replace = pairEl.querySelector('.replace-input').value;
            const matchCase = pairEl.querySelector('.match-case-checkbox').checked;
            const wholeWord = pairEl.querySelector('.whole-word-checkbox').checked;
            newPairs.push({ find, replace, matchCase, wholeWord });
        });
        currentMode.pairs = newPairs;
        saveSettings();
        showPopup('Đã lưu cài đặt cho chế độ: ' + settings.activeMode);
        if (elChapterSettingsCard?.style.display !== 'none') {
            toggleChapterSettings();
        }
    }

    function saveSettings() {
        try {
            localStorage.setItem('textToolSettings', JSON.stringify(settings));
        } catch (err) {
            console.error('Lưu settings thất bại', err);
            showPopup('Lưu cài đặt thất bại, có thể bộ nhớ đầy.');
        }
    }

    function loadSettings() {
        try {
            const saved = localStorage.getItem('textToolSettings');
            if (saved) {
                const loadedSettings = JSON.parse(saved);
                Object.keys(loadedSettings.modes).forEach(modeName => {
                    loadedSettings.modes[modeName].pairs.forEach(pair => {
                        pair.matchCase = !!pair.matchCase;
                        pair.wholeWord = !!pair.wholeWord;
                    });
                });
                if (!Array.isArray(loadedSettings.chapterKeywords) || loadedSettings.chapterKeywords.length === 0) {
                    loadedSettings.chapterKeywords = ['Chương', 'Chapter', 'Phần', 'Hồi'];
                }
                settings = loadedSettings;
            }
        } catch (err) {
            console.error('Không thể load settings', err);
            showPopup('Tải cài đặt thất bại.');
        }
    }

    function showPopup(message) {
        if (!elPopup) return;
        clearTimeout(popupTimeout);
        elPopup.textContent = message;
        elPopup.style.display = 'block';
        popupTimeout = setTimeout(() => {
            elPopup.style.display = 'none';
        }, 3000);
    }

    function toggleChapterSettings() {
        if (!elChapterSettingsCard) return;
        const isHidden = elChapterSettingsCard.style.display === 'none';
        elPairsContainer.style.display = isHidden ? 'none' : 'flex';
        elChapterSettingsCard.style.display = isHidden ? 'block' : 'none';
        if (elAddPairBtn) elAddPairBtn.style.display = isHidden ? 'none' : 'inline-block';
    }

    // ====================== EVENT HANDLERS ======================
    function handleTabClick(e) {
        const targetTabId = e.currentTarget.dataset.tab;
        if (targetTabId) switchTab(targetTabId);
    }

    function handleModeChange(e) {
        settings.activeMode = e.target.value;
        renderCurrentModeSettings();
    }

    function handleAddMode() {
        const name = prompt('Nhập tên chế độ mới:', 'Chế độ mới');
        if (!name || settings.modes[name]) {
            showPopup('Tên chế độ không hợp lệ hoặc đã tồn tại!');
            return;
        }
        settings.modes[name] = { pairs: [{ find: '', replace: '', matchCase: false, wholeWord: false }] };
        settings.activeMode = name;
        saveSettings();
        updateUI();
    }

    function handleCopyMode() {
        const newName = prompt('Nhập tên cho chế độ sao chép:', `${settings.activeMode} (copy)`);
        if (!newName || settings.modes[newName]) {
            showPopup('Tên chế độ không hợp lệ hoặc đã tồn tại!');
            return;
        }
        settings.modes[newName] = JSON.parse(JSON.stringify(settings.modes[settings.activeMode]));
        settings.activeMode = newName;
        saveSettings();
        updateUI();
    }

    function handleRenameMode() {
        const oldName = settings.activeMode;
        const newName = prompt('Nhập tên mới:', oldName);
        if (!newName || newName === oldName || settings.modes[newName]) {
            showPopup('Tên mới không hợp lệ hoặc đã tồn tại.');
            return;
        }
        settings.modes[newName] = settings.modes[oldName];
        delete settings.modes[oldName];
        settings.activeMode = newName;
        saveSettings();
        updateUI();
    }

    function handleDeleteMode() {
        if (Object.keys(settings.modes).length <= 1) {
            showPopup('Không thể xóa chế độ cuối cùng.');
            return;
        }
        if (confirm(`Bạn có chắc muốn xóa chế độ "${settings.activeMode}"?`)) {
            delete settings.modes[settings.activeMode];
            settings.activeMode = Object.keys(settings.modes)[0];
            saveSettings();
            updateUI();
        }
    }

    function handleExportSettings() {
        try {
            const dataStr = JSON.stringify(settings, null, 2);
            const dataUri = 'data:application/json;charset=utf-8,' + encodeURIComponent(dataStr);
            const linkElement = document.createElement('a');
            linkElement.setAttribute('href', dataUri);
            linkElement.setAttribute('download', 'th_settings.json');
            document.body.appendChild(linkElement);
            linkElement.click();
            document.body.removeChild(linkElement);
        } catch (err) {
            console.error('Xuất cài đặt thất bại', err);
            showPopup('Xuất cài đặt thất bại.');
        }
    }

    function handleImportSettings(event) {
        const file = event.target.files[0];
        if (!file) return;

        const reader = new FileReader();
        reader.onload = function(e) {
            try {
                const importedSettings = JSON.parse(e.target.result);
                if (importedSettings.modes && importedSettings.activeMode && Object.keys(importedSettings.modes).length > 0) {
                    settings = importedSettings;
                    saveSettings();
                    updateUI();
                    showPopup('Nhập cài đặt thành công!');
                } else {
                    showPopup('Tệp cài đặt không hợp lệ.');
                }
            } catch (error) {
                console.error('Lỗi khi đọc tệp JSON', error);
                showPopup('Lỗi khi đọc tệp JSON.');
            }
        };
        reader.readAsText(file);
        event.target.value = '';
    }

    function handleReplace() {
        const mode = settings.modes[settings.activeMode];
        const inputText = elReplaceInput.value;
        if (!mode || !inputText) return;

        const resultHTML = performReplacement(inputText, mode.pairs);
        elReplaceOutput.innerHTML = resultHTML;
        elOutputWordCountDisplay.textContent = `Số từ: ${countWords(elReplaceOutput.innerText)}`;
        elReplaceInput.value = '';
        elReplaceWordCountDisplay.textContent = 'Số từ: 0';
    }

    function handleSplit(e) {
        const target = e.target.closest('.split-btn, .chia-chuong-btn');
        if (!target) return;

        if (target.classList.contains('split-btn')) {
            elSplitControls.querySelectorAll('.split-btn').forEach(btn => btn.classList.remove('active'));
            target.classList.add('active');
            currentNumSplits = parseInt(target.dataset.splits, 10);
            renderPlaceholders(currentNumSplits);
        } else if (target.classList.contains('chia-chuong-btn')) {
            const text = elSplitInput.value;
            if (!text || !text.trim()) {
                showPopup('Vui lòng nhập văn bản để chia chương.');
                return;
            }
            const chapters = splitChapter(text, currentNumSplits, settings.chapterKeywords);
            renderSplitOutput(chapters);
            // Do not clear input as per request
        }
    }

    function setupEventListeners() {
        tabs.forEach(tab => tab.addEventListener('click', handleTabClick));
        if (elModeSelect) elModeSelect.addEventListener('change', handleModeChange);
        if (elAddModeBtn) elAddModeBtn.addEventListener('click', handleAddMode);
        if (elCopyModeBtn) elCopyModeBtn.addEventListener('click', handleCopyMode);
        if (elRenameModeBtn) elRenameModeBtn.addEventListener('click', handleRenameMode);
        if (elDeleteModeBtn) elDeleteModeBtn.addEventListener('click', handleDeleteMode);
        if (elExportSettingsBtn) elExportSettingsBtn.addEventListener('click', handleExportSettings);
        if (elImportSettingsBtn) elImportSettingsBtn.addEventListener('click', () => elImportFileInput.click());
        if (elImportFileInput) elImportFileInput.addEventListener('change', handleImportSettings);
        if (elChapterSettingsBtn) elChapterSettingsBtn.addEventListener('click', toggleChapterSettings);

        if (elAddPairBtn) elAddPairBtn.addEventListener('click', () => {
            elPairsContainer.insertBefore(createPairElement(), elPairsContainer.firstChild);
        });

        if (elSaveSettingsBtn) elSaveSettingsBtn.addEventListener('click', saveSettingsToUI);

        if (elAddKeywordBtn) elAddKeywordBtn.addEventListener('click', () => {
            const newKeyword = elChapterKeywordInput.value.trim();
            if (newKeyword && !settings.chapterKeywords.includes(newKeyword)) {
                settings.chapterKeywords.push(newKeyword);
                saveSettings();
                renderChapterKeywords();
                elChapterKeywordInput.value = '';
            }
        });

        if (elPairsContainer) {
            elPairsContainer.addEventListener('click', (e) => {
                if (e.target.classList.contains('delete-pair-btn')) {
                    e.target.closest('.replace-pair').remove();
                }
            });
        }

        if (elKeywordsListContainer) {
            elKeywordsListContainer.addEventListener('click', (e) => {
                if (e.target.classList.contains('delete-keyword-btn')) {
                    const keywordToRemove = e.target.dataset.keyword;
                    settings.chapterKeywords = settings.chapterKeywords.filter(k => k !== keywordToRemove);
                    saveSettings();
                    renderChapterKeywords();
                }
            });
        }

        if (elReplaceInput) {
            elReplaceInput.addEventListener('input', () => {
                elReplaceWordCountDisplay.textContent = `Số từ: ${countWords(elReplaceInput.value)}`;
            });
        }
        if (elReplaceBtn) elReplaceBtn.addEventListener('click', handleReplace);
        if (elCopyOutputBtn) elCopyOutputBtn.addEventListener('click', (e) => {
            copyToClipboard(elReplaceOutput.innerText, e.target);
        });

        if (elSplitInput) {
            elSplitInput.addEventListener('input', () => {
                elSplitInputWordCountDisplay.textContent = `Số từ: ${countWords(elSplitInput.value)}`;
            });
        }
        if (elSplitControls) elSplitControls.addEventListener('click', handleSplit);

        if (elSplitOutputContainer) {
            elSplitOutputContainer.addEventListener('click', (e) => {
                if (e.target.classList.contains('copy-split-btn')) {
                    const chapterIndex = e.target.dataset.chapterIndex ? parseInt(e.target.dataset.chapterIndex, 10) : null;
                    const box = e.target.closest('.split-result-box');
                    if (!box) return;
                    const contentEl = box.querySelector('.content');
                    if (!contentEl) return;
                    const raw = contentEl.innerHTML.replace(/<\/p>\s*<p>/g, '\n\n').replace(/<\/?p>|<br>/g, '\n').replace(/&quot;/g, '"'); // Fix &quot; in copy
                    copyToClipboard(raw, e.target);
                }
            });
        }
    }

    // ====================== HELPERS / UTILITIES ======================
    function countWords(text) {
        if (!text) return 0;
        const cleaned = text.trim().replace(/\s+/g, ' ');
        return cleaned ? cleaned.split(' ').length : 0;
    }

    function escapeRegExp(string) {
        return string.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    }

    function escapeHtml(unsafe) {
        if (unsafe === null || unsafe === undefined) return '';
        return String(unsafe)
            .replace(/&/g, "&amp;")
            .replace(/</g, "&lt;")
            .replace(/>/g, "&gt;")
            .replace(/"/g, "&quot;")
            .replace(/'/g, "&#039;");
    }

    function performReplacement(inputText, pairs) {
        if (!inputText) return '';
        let result = inputText;

        pairs.forEach(pair => {
            if (!pair.find) return;
            const escapedFind = escapeRegExp(pair.find);
            const boundary = pair.wholeWord ? '(^|[^\\p{L}\\p{N}_])' : '';
            const flags = pair.matchCase ? 'gu' : 'giu';
            try {
                const regex = new RegExp(`${boundary}${escapedFind}${boundary ? '($|[^\\p{L}\\p{N}_])' : ''}`, flags);
                result = result.replace(regex, (match, prefix = '', suffix = '') => {
                    return (prefix || '') + `<span class="highlight">${escapeHtml(pair.replace)}</span>` + (suffix || '');
                });
            } catch (err) {
                console.error('Regex lỗi:', err);
                result = result.split(pair.find).join(`<span class="highlight">${escapeHtml(pair.replace)}</span>`);
            }
        });

        const tempDiv = document.createElement('div');
        tempDiv.innerHTML = result;
        const walker = document.createTreeWalker(tempDiv, NodeFilter.SHOW_TEXT);
        let node;
        while (node = walker.nextNode()) {
            if (!node.parentElement.closest('.highlight')) {
                node.textContent = escapeHtml(node.textContent);
            }
        }
        result = tempDiv.innerHTML;

        return result.split(/\n\s*\n/).map(p => `<p>${p.replace(/\n/g, '<br>')}</p>`).join('');
    }

    function splitChapter(text, numSplits = 2, keywords = ['Chương', 'Chapter']) {
        const paragraphs = text.split(/\n\s*\n/).map(p => p.trim()).filter(p => p.length > 0);
        const chapters = [];
        let current = { title: '', content: '' };

        const pushCurrent = () => {
            if (current.content.trim() || current.title) {
                chapters.push({ title: current.title || `Chương ${chapters.length + 1}`, content: current.content.trim() });
            }
        };

        paragraphs.forEach(p => {
            const lowered = p.toLowerCase();
            const foundKeyword = keywords.find(k => lowered.startsWith(k.toLowerCase()));
            if (foundKeyword) {
                pushCurrent();
                current = { title: p.split('\n')[0], content: '' };
            } else {
                current.content += (current.content ? '\n\n' : '') + p;
            }
        });
        pushCurrent();

        if (chapters.length >= numSplits) {
            return chapters.slice(0, chapters.length);
        }

        const totalWords = countWords(text);
        const wordsPerSplit = Math.ceil(totalWords / numSplits);
        const result = [];
        let currentWords = 0;
        let currentContent = '';
        let paragraphIndex = 0;

        while (paragraphIndex < paragraphs.length) {
            currentContent += (currentContent ? '\n\n' : '') + paragraphs[paragraphIndex];
            currentWords += countWords(paragraphs[paragraphIndex]);
            paragraphIndex++;

            if (currentWords >= wordsPerSplit || paragraphIndex === paragraphs.length) {
                result.push({ title: `Chương ${result.length + 1}`, content: currentContent });
                currentContent = '';
                currentWords = 0;
            }
        }

        return result;
    }

    function copyToClipboard(text, triggerElement = null) {
        if (!text) {
            showPopup('Không có nội dung để sao chép.');
            return;
        }
        text = text.replace(/&quot;/g, '"'); // Ensure &quot; is converted back to " in copied text
        if (navigator.clipboard && navigator.clipboard.writeText) {
            navigator.clipboard.writeText(text).then(() => {
                showPopup('Đã sao chép vào clipboard!');
                if (triggerElement) {
                    triggerElement.classList.add('copied');
                    setTimeout(() => triggerElement.classList.remove('copied'), 700);
                }
            }).catch(err => {
                console.error('Clipboard API thất bại:', err);
                fallbackCopy(text, triggerElement);
            });
        } else {
            fallbackCopy(text, triggerElement);
        }
    }

    function fallbackCopy(text, triggerElement = null) {
        try {
            const ta = document.createElement('textarea');
            ta.value = text;
            ta.style.position = 'fixed';
            ta.style.left = '-9999px';
            document.body.appendChild(ta);
            ta.select();
            document.execCommand('copy');
            document.body.removeChild(ta);
            showPopup('Đã sao chép vào clipboard!');
            if (triggerElement) {
                triggerElement.classList.add('copied');
                setTimeout(() => triggerElement.classList.remove('copied'), 700);
            }
        } catch (err) {
            console.error('Sao chép thất bại:', err);
            showPopup('Sao chép thất bại.');
        }
    }
});
