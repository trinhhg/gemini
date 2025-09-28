document.addEventListener("DOMContentLoaded", () => {
    // ====================== DOM ELEMENTS ======================
    const tabs = document.querySelectorAll('.tab-link');
    const tabContents = document.querySelectorAll('.tab-content');

    // prefix el* to avoid collisions with any auto-created globals
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

    // ====================== INITIALIZATION ======================
    loadSettings();
    updateUI();
    setupEventListeners();
    createSplitButtons();

    // After creating split buttons, auto-click default (Chia 2) if exists
    const defaultSplitBtn = elSplitControls.querySelector('[data-splits="2"]');
    if (defaultSplitBtn) {
        // use setTimeout to ensure UI ready (safe)
        setTimeout(() => defaultSplitBtn.click(), 0);
    }

    // ====================== UI UPDATE FUNCTIONS ======================
    function updateUI() {
        updateModeSelect();
        renderCurrentModeSettings();
        renderChapterKeywords();
    }

    function switchTab(targetTabId) {
        tabContents.forEach(content => {
            content.classList.remove('active');
            if (content.id === targetTabId) {
                content.classList.add('active');
            }
        });
        tabs.forEach(tab => {
            tab.classList.remove('active');
            if (tab.dataset.tab === targetTabId) {
                tab.classList.add('active');
            }
        });
        if (targetTabId === 'split') {
            const activeSplitBtn = elSplitControls.querySelector('.active');
            if (activeSplitBtn) {
                activeSplitBtn.click();
            } else if (defaultSplitBtn) {
                defaultSplitBtn.click();
            }
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
        // ensure inputs are not creating globals by name
        div.innerHTML = `
            <input type="text" class="find-input" placeholder="Tìm" value="${escapeHtml(findVal)}">
            <input type="text" class="replace-input" placeholder="Thay thế" value="${escapeHtml(replaceVal)}">
            <label class="toggle-switch">
                <input type="checkbox" class="match-case-checkbox" ${matchCase ? 'checked' : ''}>
                <span class="slider"></span>
            </label>
            <label class="toggle-switch">
                <input type="checkbox" class="whole-word-checkbox" ${wholeWord ? 'checked' : ''}>
                <span class="slider"></span>
            </label>
            <button type="button" class="delete-pair-btn btn btn-danger">Xóa</button>
        `;
        div.querySelector('.delete-pair-btn').addEventListener('click', () => {
            div.remove();
        });
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

    /**
     * Render split output as:
     * - One "original" box first
     * - Then each chapter as a box
     * Layout is controlled by CSS grid (in your stylesheet).
     */
    function renderSplitOutput(chapters, numSplits) {
        elSplitOutputContainer.innerHTML = '';

        // Original box (one only)
        const originalBox = document.createElement('div');
        originalBox.className = 'split-result-box';
        originalBox.innerHTML = `
            <h4>Văn bản gốc</h4>
            <div class="content">${escapeHtml(elSplitInput.value).split('\n\n').map(p => `<p>${p}</p>`).join('')}</div>
            <div class="toolbar text-center">
                <span class="word-count-display">Số từ: ${countWords(elSplitInput.value)}</span>
            </div>
            <button type="button" class="btn copy-split-btn full-width-btn" data-chapter-index="-1">Sao chép gốc</button>
        `;
        elSplitOutputContainer.appendChild(originalBox);

        // Chapter boxes
        chapters.forEach((chapter, index) => {
            const box = document.createElement('div');
            box.className = 'split-result-box';
            const contentWithTitle = (chapter.title || `Chương ${index + 1}`) + '\n\n' + (chapter.content || '');
            box.innerHTML = `
                <h4>${escapeHtml(chapter.title || `Chương ${index + 1}`)}</h4>
                <div class="content">${escapeHtml(chapter.content || '').split('\n\n').map(p => `<p>${p}</p>`).join('')}</div>
                <div class="toolbar text-center">
                    <span class="word-count-display">Số từ: ${countWords(contentWithTitle)}</span>
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
        // hide chapter settings if visible
        if (elChapterSettingsCard && elChapterSettingsCard.style.display !== 'none') {
            toggleChapterSettings();
        }
    }

    function saveSettings() {
        try {
            localStorage.setItem('textToolSettings', JSON.stringify(settings));
        } catch (err) {
            console.warn('Lưu settings thất bại', err);
        }
    }

    function loadSettings() {
        try {
            const saved = localStorage.getItem('textToolSettings');
            if (saved) {
                const loadedSettings = JSON.parse(saved);
                // normalize
                Object.keys(loadedSettings.modes).forEach(modeName => {
                    loadedSettings.modes[modeName].pairs.forEach(pair => {
                        if (typeof pair.matchCase === 'undefined') pair.matchCase = false;
                        if (typeof pair.wholeWord === 'undefined') pair.wholeWord = false;
                    });
                });
                if (!loadedSettings.chapterKeywords) {
                    loadedSettings.chapterKeywords = ['Chương', 'Chapter', 'Phần', 'Hồi'];
                }
                settings = loadedSettings;
            }
        } catch (err) {
            console.warn('Không thể load settings', err);
        }
    }

    function showPopup(message) {
        if (!elPopup) return;
        elPopup.textContent = message;
        elPopup.style.display = 'block';
        setTimeout(() => {
            elPopup.style.display = 'none';
        }, 3000);
    }

    function toggleChapterSettings() {
        if (!elChapterSettingsCard) return;
        const isHidden = getComputedStyle(elChapterSettingsCard).display === 'none' || elChapterSettingsCard.style.display === 'none';
        if (isHidden) {
            elPairsContainer.style.display = 'none';
            elChapterSettingsCard.style.display = 'block';
            if (elAddPairBtn) elAddPairBtn.style.display = 'none';
        } else {
            elPairsContainer.style.display = 'flex';
            elChapterSettingsCard.style.display = 'none';
            if (elAddPairBtn) elAddPairBtn.style.display = 'inline-block';
        }
    }

    // ====================== EVENT HANDLERS ======================
    function handleTabClick(e) {
        const targetTabId = e.currentTarget.dataset.tab;
        if (!targetTabId) return;
        switchTab(targetTabId);
    }

    function handleModeChange(e) {
        settings.activeMode = e.target.value;
        renderCurrentModeSettings();
    }

    function handleAddMode() {
        const name = prompt('Nhập tên chế độ mới:', 'Chế độ mới');
        if (!name) return;
        if (!settings.modes[name]) {
            settings.modes[name] = { pairs: [{ find: '', replace: '', matchCase: false, wholeWord: false }] };
            settings.activeMode = name;
            saveSettings();
            updateUI();
        } else {
            showPopup('Tên chế độ đã tồn tại!');
        }
    }

    function handleCopyMode() {
        const newName = prompt('Nhập tên cho chế độ sao chép:', `${settings.activeMode} (copy)`);
        if (!newName) return;
        if (!settings.modes[newName]) {
            settings.modes[newName] = JSON.parse(JSON.stringify(settings.modes[settings.activeMode]));
            settings.activeMode = newName;
            saveSettings();
            updateUI();
        } else {
            showPopup('Tên chế độ đã tồn tại!');
        }
    }

    function handleRenameMode() {
        const oldName = settings.activeMode;
        const newName = prompt('Nhập tên mới:', oldName);
        if (!newName) return;
        if (newName && newName !== oldName && !settings.modes[newName]) {
            settings.modes[newName] = settings.modes[oldName];
            delete settings.modes[oldName];
            settings.activeMode = newName;
            saveSettings();
            updateUI();
        } else {
            showPopup('Tên mới không hợp lệ hoặc đã tồn tại.');
        }
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
            const exportFileDefaultName = 'th_settings.json';

            const linkElement = document.createElement('a');
            linkElement.setAttribute('href', dataUri);
            linkElement.setAttribute('download', exportFileDefaultName);
            document.body.appendChild(linkElement);
            linkElement.click();
            document.body.removeChild(linkElement);
        } catch (err) {
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
                if (importedSettings.modes && importedSettings.activeMode) {
                    settings = importedSettings;
                    saveSettings();
                    updateUI();
                    showPopup('Nhập cài đặt thành công!');
                } else {
                    showPopup('Tệp cài đặt không hợp lệ.');
                }
            } catch (error) {
                showPopup('Lỗi khi đọc tệp JSON.');
            }
        };
        reader.readAsText(file);
        // reset input value so same file can be selected again if needed
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
        const target = e.target.closest('.split-btn');
        if (!target) return;

        // toggle active class
        elSplitControls.querySelectorAll('.split-btn').forEach(btn => btn.classList.remove('active'));
        target.classList.add('active');

        const numSplits = parseInt(target.dataset.splits, 10);
        const text = elSplitInput.value;
        if (!text || !text.trim()) return;

        const chapters = splitChapter(text, numSplits, settings.chapterKeywords);
        renderSplitOutput(chapters, numSplits);

        // clear input and word count
        elSplitInput.value = '';
        elSplitInputWordCountDisplay.textContent = 'Số từ: 0';
    }

    function setupEventListeners() {
        // Tabs
        tabs.forEach(tab => tab.addEventListener('click', handleTabClick));

        // Mode controls
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

        // Replace inputs
        if (elReplaceInput) {
            elReplaceInput.addEventListener('input', () => {
                elReplaceWordCountDisplay.textContent = `Số từ: ${countWords(elReplaceInput.value)}`;
            });
        }
        if (elReplaceBtn) elReplaceBtn.addEventListener('click', handleReplace);
        if (elCopyOutputBtn) elCopyOutputBtn.addEventListener('click', (e) => {
            copyToClipboard(elReplaceOutput.innerText, e.target);
        });

        // Split inputs
        if (elSplitInput) {
            elSplitInput.addEventListener('input', () => {
                elSplitInputWordCountDisplay.textContent = `Số từ: ${countWords(elSplitInput.value)}`;
            });
        }
        if (elSplitControls) elSplitControls.addEventListener('click', handleSplit);

        // Copy chapter/gốc buttons inside split output (delegation)
        if (elSplitOutputContainer) {
            elSplitOutputContainer.addEventListener('click', (e) => {
                if (e.target.classList.contains('copy-split-btn')) {
                    const chapterIndex = e.target.dataset.chapterIndex ? parseInt(e.target.dataset.chapterIndex, 10) : null;
                    const box = e.target.closest('.split-result-box');
                    if (!box) return;
                    const contentEl = box.querySelector('.content');
                    if (!contentEl) return;
                    // Convert <p> back to paragraph breaks
                    const raw = contentEl.innerHTML.replace(/<\/p>\s*<p>/g, '\n\n').replace(/<\/?p>/g, '');
                    copyToClipboard(raw, e.target);
                }
            });
        }
    }

    // ====================== HELPERS / UTILITIES ======================

    function countWords(text) {
        if (!text) return 0;
        // remove extra whitespace, count by splitting
        const cleaned = text.trim().replace(/\s+/g, ' ');
        if (!cleaned) return 0;
        return cleaned.split(' ').length;
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

    /**
     * performReplacement:
     * - input: raw text
     * - pairs: [{find, replace, matchCase, wholeWord}, ...]
     * returns HTML string where replaced bits are wrapped with highlight span (optional)
     */
    function performReplacement(inputText, pairs) {
        if (!inputText) return '';
        let result = escapeHtml(inputText);

        // apply each pair sequentially; operate on HTML-escaped string to avoid injection
        pairs.forEach(pair => {
            const find = pair.find;
            const replace = pair.replace;
            if (!find) return; // skip empty find

            const escapedFind = escapeRegExp(find);
            const wordBoundary = pair.wholeWord ? '\\b' : '';
            const flags = pair.matchCase ? 'g' : 'gi';
            let regex;
            try {
                regex = new RegExp(wordBoundary + escapedFind + wordBoundary, flags);
            } catch (err) {
                // fallback: simple string replace (case sensitive)
                result = result.split(find).join(replace);
                return;
            }

            // result currently holds escaped HTML. We want to replace in escaped HTML.
            // but replacement string may contain HTML; escape it.
            const replacementEscaped = escapeHtml(replace);
            // wrap replacement with span.highlight for visibility
            result = result.replace(regex, `<span class="highlight">${replacementEscaped}</span>`);
        });

        // preserve newlines -> paragraphs for display (replace double newlines with paragraph tags)
        // result is already escaped HTML with <span> inserted; convert single/double newlines to <p>
        const paragraphs = result.split(/\n\s*\n/).map(p => `<p>${p.replace(/\n/g, '<br>')}</p>`);
        return paragraphs.join('');
    }

    /**
     * splitChapter:
     * Simple algorithm:
     * - Look for paragraphs (double newline) that start with a keyword => chapter title markers.
     * - If found many titles, group content under them.
     * - If found fewer than requested numSplits, fallback to splitting by approx equal word chunks.
     * Returns array of {title, content}
     */
    function splitChapter(text, numSplits = 2, keywords = ['Chương', 'Chapter']) {
        const paragraphs = text.split(/\n\s*\n/).map(p => p.trim()).filter(p => p.length > 0);
        const chapters = [];
        let current = { title: 'Không có tiêu đề', content: '' };

        // helper to push current if has content
        const pushCurrent = () => {
            if (current.content.trim() || current.title) {
                chapters.push({ title: current.title, content: current.content.trim() });
            }
        };

        // detect title if paragraph starts with any keyword (case-insensitive)
        paragraphs.forEach(p => {
            const lowered = p.toLowerCase();
            const foundKeyword = keywords.find(k => lowered.startsWith(k.toLowerCase()));
            if (foundKeyword) {
                // new chapter
                pushCurrent();
                current = { title: p.split('\n')[0], content: '' };
            } else {
                // append
                if (current.content) current.content += '\n\n' + p;
                else current.content = p;
            }
        });
        // push last
        pushCurrent();

        // If we have enough chapters (>= numSplits), we can merge or slice to exactly numSplits (keep as many as available)
        if (chapters.length >= numSplits) {
            // if more than numSplits, we take them all — UI will display however many found.
            return chapters.slice(0, chapters.length);
        }

        // If too few chapters (< numSplits), fallback: split by word-count into numSplits parts
        const words = text.trim().split(/\s+/);
        if (words.length === 0) return [{ title: 'Chương 1', content: text }];

        const approxPer = Math.ceil(words.length / Math.max(1, numSplits));
        const splitted = [];
        for (let i = 0; i < words.length; i += approxPer) {
            const chunkWords = words.slice(i, i + approxPer);
            splitted.push({ title: `Chương ${Math.floor(i / approxPer) + 1}`, content: chunkWords.join(' ') });
        }
        return splitted;
    }

    /**
     * copyToClipboard: copy text and show tiny popup/feedback on the provided button (if provided)
     */
    function copyToClipboard(text, triggerElement = null) {
        if (!text) {
            showPopup('Không có nội dung để sao chép.');
            return;
        }
        if (navigator.clipboard && navigator.clipboard.writeText) {
            navigator.clipboard.writeText(text).then(() => {
                showPopup('Đã sao chép vào clipboard!');
                if (triggerElement) {
                    // small visual feedback
                    triggerElement.classList.add('copied');
                    setTimeout(() => triggerElement.classList.remove('copied'), 700);
                }
            }).catch(err => {
                // fallback
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
            showPopup('Sao chép thất bại.');
        }
    }

    // ====================== End of script ======================
});
