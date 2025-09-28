document.addEventListener("DOMContentLoaded", () => {
    // ====================== DOM ELEMENTS ======================
    const tabs = document.querySelectorAll('.tab-link');
    const tabContents = document.querySelectorAll('.tab-content');

    const modeSelect = document.getElementById('mode-select');
    const addModeBtn = document.getElementById('add-mode-btn');
    const copyModeBtn = document.getElementById('copy-mode-btn');
    const renameModeBtn = document.getElementById('rename-mode-btn');
    const deleteModeBtn = document.getElementById('delete-mode-btn');
    const importSettingsBtn = document.getElementById('import-settings-btn');
    const importFileInput = document.getElementById('import-file-input');
    const exportSettingsBtn = document.getElementById('export-settings-btn');
    const chapterSettingsBtn = document.getElementById('chapter-settings-btn');
    const addPairBtn = document.getElementById('add-pair-btn');
    const saveSettingsBtn = document.getElementById('save-settings-btn');
    const pairsContainer = document.getElementById('replace-pairs-container');
    const chapterSettingsCard = document.getElementById('chapter-settings-card');
    const chapterKeywordInput = document.getElementById('chapter-keyword-input');
    const addKeywordBtn = document.getElementById('add-keyword-btn');
    const keywordsListContainer = document.getElementById('chapter-keywords-list');

    const replaceInput = document.getElementById('replace-input');
    const replaceWordCountDisplay = document.getElementById('replace-word-count');
    const replaceBtn = document.getElementById('replace-btn');
    const replaceOriginal = document.getElementById('replace-original');
    const replaceOutput = document.getElementById('replace-output');
    const outputWordCountDisplay = document.getElementById('output-word-count');
    const copyOutputBtn = document.getElementById('copy-output-btn');

    const splitControls = document.querySelector('.split-controls');
    const splitInput = document.getElementById('split-input');
    const splitInputWordCountDisplay = document.getElementById('split-input-word-count');
    const splitOutputContainer = document.getElementById('split-output-container');

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
        if (targetTabId === 'replace') {
            replaceWordCountDisplay.textContent = `Số từ: ${countWords(replaceInput.value)}`;
            replaceOriginal.innerHTML = `<p>${replaceInput.value.replace(/\n/g, '<br>')}</p>`;
            outputWordCountDisplay.textContent = `Số từ: ${countWords(replaceOutput.innerText)}`;
        } else if (targetTabId === 'split') {
            splitInputWordCountDisplay.textContent = `Số từ: ${countWords(splitInput.value)}`;
        }
    }

    function updateModeSelect() {
        modeSelect.innerHTML = '';
        Object.keys(settings.modes).forEach(modeName => {
            const option = document.createElement('option');
            option.value = modeName;
            option.textContent = modeName;
            if (modeName === settings.activeMode) {
                option.selected = true;
            }
            modeSelect.appendChild(option);
        });
    }

    function renderCurrentModeSettings() {
        const mode = settings.modes[settings.activeMode];
        if (!mode) return;

        pairsContainer.innerHTML = '';
        mode.pairs.forEach((pair, index) => {
            const pairElement = createPairElement(pair.find, pair.replace, pair.matchCase, pair.wholeWord);
            pairsContainer.appendChild(pairElement);
        });
    }

    function createPairElement(findVal = '', replaceVal = '', matchCase = false, wholeWord = false) {
        const div = document.createElement('div');
        div.className = 'replace-pair';
        const uniqueId = Date.now() + Math.random();
        div.innerHTML = `
            <input type="text" class="find-input" placeholder="Tìm" value="${findVal}">
            <input type="text" class="replace-input" placeholder="Thay thế" value="${replaceVal}">
            <label class="toggle-switch">
                <input type="checkbox" class="match-case-checkbox" ${matchCase ? 'checked' : ''}>
                <span class="slider"></span>
                Match Case
            </label>
            <label class="toggle-switch">
                <input type="checkbox" class="whole-word-checkbox" ${wholeWord ? 'checked' : ''}>
                <span class="slider"></span>
                Find Whole Word Only
            </label>
            <button class="delete-pair-btn btn btn-danger">Xóa</button>
        `;
        div.querySelector('.delete-pair-btn').addEventListener('click', () => {
            div.remove();
        });
        return div;
    }

    function createSplitButtons() {
        splitControls.innerHTML = '';
        for (let i = 2; i <= 10; i++) {
            const button = document.createElement('button');
            button.className = 'btn split-btn';
            button.textContent = `Chia ${i}`;
            button.dataset.splits = i;
            splitControls.appendChild(button);
        }
    }

    function renderChapterKeywords() {
        keywordsListContainer.innerHTML = '';
        settings.chapterKeywords.forEach(keyword => {
            const tag = document.createElement('div');
            tag.className = 'keyword-tag';
            tag.innerHTML = `
                <span>${keyword}</span>
                <button class="delete-keyword-btn" data-keyword="${keyword}">✖</button>
            `;
            keywordsListContainer.appendChild(tag);
        });
    }

    function renderSplitOutput(chapters, numSplits) {
        splitOutputContainer.innerHTML = '';
        const layoutContainer = document.createElement('div');
        layoutContainer.className = `split-layout-${numSplits}`;

        // Ô văn bản gốc
        const originalBox = document.createElement('div');
        originalBox.className = 'split-result-box';
        originalBox.innerHTML = `
            <h4>Văn bản gốc</h4>
            <div class="content-wrapper">
                <div class="content">${splitInput.value.split('\n\n').map(p => `<p>${p}</p>`).join('')}</div>
            </div>
            <div class="toolbar text-center">
                <span class="word-count-display">Số từ: ${countWords(splitInput.value)}</span>
            </div>
            <button class="btn copy-split-btn full-width-btn">Sao chép gốc</button>
        `;
        layoutContainer.appendChild(originalBox);

        chapters.forEach((chapter, index) => {
            const box = document.createElement('div');
            box.className = 'split-result-box';
            const contentWithTitle = chapter.title + '\n\n' + chapter.content;
            box.innerHTML = `
                <h4>${chapter.title}</h4>
                <div class="content-wrapper">
                    <div class="content">${contentWithTitle.split('\n\n').map(p => `<p>${p}</p>`).join('')}</div>
                </div>
                <div class="toolbar text-center">
                    <span class="word-count-display">Số từ: ${countWords(contentWithTitle)}</span>
                </div>
                <button class="btn copy-split-btn full-width-btn" data-chapter-index="${index}">Sao chép ${index + 1}</button>
            `;
            layoutContainer.appendChild(box);
        });

        splitOutputContainer.appendChild(layoutContainer);
    }

    // ====================== DATA HANDLING FUNCTIONS ======================
    function saveSettingsToUI() {
        const currentMode = settings.modes[settings.activeMode];
        if (!currentMode) return;

        const newPairs = [];
        document.querySelectorAll('.replace-pair').forEach(pairEl => {
            const find = pairEl.querySelector('.find-input').value;
            const replace = pairEl.querySelector('.replace-input').value;
            const matchCase = pairEl.querySelector('.match-case-checkbox').checked;
            const wholeWord = pairEl.querySelector('.whole-word-checkbox').checked;
            newPairs.push({ find, replace, matchCase, wholeWord });
        });
        currentMode.pairs = newPairs;
        saveSettings();
        alert('Đã lưu cài đặt cho chế độ: ' + settings.activeMode);
        if (chapterSettingsCard.style.display !== 'none') {
            toggleChapterSettings();
        }
    }

    function saveSettings() {
        localStorage.setItem('textToolSettings', JSON.stringify(settings));
    }

    function loadSettings() {
        const saved = localStorage.getItem('textToolSettings');
        if (saved) {
            const loadedSettings = JSON.parse(saved);
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
    }

    function toggleChapterSettings() {
        if (chapterSettingsCard.style.display === 'none') {
            pairsContainer.style.display = 'none';
            chapterSettingsCard.style.display = 'block';
            addPairBtn.style.display = 'none';
        } else {
            pairsContainer.style.display = 'flex';
            chapterSettingsCard.style.display = 'none';
            addPairBtn.style.display = 'inline-block';
        }
    }

    // ====================== EVENT HANDLERS ======================
    function handleTabClick(e) {
        const targetTabId = e.target.dataset.tab;
        switchTab(targetTabId);
    }

    function handleModeChange(e) {
        settings.activeMode = e.target.value;
        renderCurrentModeSettings();
    }

    function handleAddMode() {
        const name = prompt('Nhập tên chế độ mới:', 'Chế độ mới');
        if (name && !settings.modes[name]) {
            settings.modes[name] = { pairs: [{ find: '', replace: '', matchCase: false, wholeWord: false }] };
            settings.activeMode = name;
            saveSettings();
            updateUI();
        } else if (name) {
            alert('Tên chế độ đã tồn tại!');
        }
    }

    function handleCopyMode() {
        const newName = prompt('Nhập tên cho chế độ sao chép:', `${settings.activeMode} (copy)`);
        if (newName && !settings.modes[newName]) {
            settings.modes[newName] = JSON.parse(JSON.stringify(settings.modes[settings.activeMode]));
            settings.activeMode = newName;
            saveSettings();
            updateUI();
        } else if (newName) {
            alert('Tên chế độ đã tồn tại!');
        }
    }

    function handleRenameMode() {
        const oldName = settings.activeMode;
        const newName = prompt('Nhập tên mới:', oldName);
        if (newName && newName !== oldName && !settings.modes[newName]) {
            settings.modes[newName] = settings.modes[oldName];
            delete settings.modes[oldName];
            settings.activeMode = newName;
            saveSettings();
            updateUI();
        } else if (newName) {
            alert('Tên mới không hợp lệ hoặc đã tồn tại.');
        }
    }

    function handleDeleteMode() {
        if (Object.keys(settings.modes).length <= 1) {
            alert('Không thể xóa chế độ cuối cùng.');
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
        const dataStr = JSON.stringify(settings, null, 2);
        const dataUri = 'data:application/json;charset=utf-8,' + encodeURIComponent(dataStr);
        const exportFileDefaultName = 'th_settings.json';

        const linkElement = document.createElement('a');
        linkElement.setAttribute('href', dataUri);
        linkElement.setAttribute('download', exportFileDefaultName);
        linkElement.click();
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
                    alert('Nhập cài đặt thành công!');
                } else {
                    alert('Tệp cài đặt không hợp lệ.');
                }
            } catch (error) {
                alert('Lỗi khi đọc tệp JSON.');
            }
        };
        reader.readAsText(file);
    }

    function handleReplace() {
        const mode = settings.modes[settings.activeMode];
        const inputText = replaceInput.value;
        if (!mode || !inputText) return;

        replaceOriginal.innerHTML = `<p>${inputText.replace(/\n/g, '<br>')}</p>`;
        const resultHTML = performReplacement(inputText, mode.pairs);
        replaceOutput.innerHTML = resultHTML;
        outputWordCountDisplay.textContent = `Số từ: ${countWords(replaceOutput.innerText)}`;
        replaceInput.value = ''; // Xóa văn bản gốc sau khi thay thế
        replaceWordCountDisplay.textContent = 'Số từ: 0';
    }

    function handleSplit(e) {
        const target = e.target.closest('.split-btn');
        if (!target) return;

        document.querySelectorAll('.split-btn').forEach(btn => btn.classList.remove('active'));
        target.classList.add('active');

        const numSplits = parseInt(target.dataset.splits, 10);
        const text = splitInput.value;
        if (!text.trim()) return;

        const chapters = splitChapter(text, numSplits, settings.chapterKeywords);
        renderSplitOutput(chapters, numSplits);
        splitInput.value = '';
        splitInputWordCountDisplay.textContent = 'Số từ: 0';
    }

    function setupEventListeners() {
        tabs.forEach(tab => tab.addEventListener('click', handleTabClick));

        modeSelect.addEventListener('change', handleModeChange);
        addModeBtn.addEventListener('click', handleAddMode);
        copyModeBtn.addEventListener('click', handleCopyMode);
        renameModeBtn.addEventListener('click', handleRenameMode);
        deleteModeBtn.addEventListener('click', handleDeleteMode);
        exportSettingsBtn.addEventListener('click', handleExportSettings);
        importSettingsBtn.addEventListener('click', () => importFileInput.click());
        importFileInput.addEventListener('change', handleImportSettings);
        chapterSettingsBtn.addEventListener('click', toggleChapterSettings);
        addPairBtn.addEventListener('click', () => {
            pairsContainer.insertBefore(createPairElement(), pairsContainer.firstChild);
        });
        saveSettingsBtn.addEventListener('click', saveSettingsToUI);

        addKeywordBtn.addEventListener('click', () => {
            const newKeyword = chapterKeywordInput.value.trim();
            if (newKeyword && !settings.chapterKeywords.includes(newKeyword)) {
                settings.chapterKeywords.push(newKeyword);
                saveSettings();
                renderChapterKeywords();
                chapterKeywordInput.value = '';
            }
        });

        keywordsListContainer.addEventListener('click', (e) => {
            if (e.target.classList.contains('delete-keyword-btn')) {
                const keywordToRemove = e.target.dataset.keyword;
                settings.chapterKeywords = settings.chapterKeywords.filter(k => k !== keywordToRemove);
                saveSettings();
                renderChapterKeywords();
            }
        });

        replaceInput.addEventListener('input', () => {
            replaceWordCountDisplay.textContent = `Số từ: ${countWords(replaceInput.value)}`;
        });
        replaceBtn.addEventListener('click', handleReplace);
        copyOutputBtn.addEventListener('click', (e) => {
            copyToClipboard(replaceOutput.innerText, e.target);
        });

        splitInput.addEventListener('input', () => {
            splitInputWordCountDisplay.textContent = `Số từ: ${countWords(splitInput.value)}`;
        });
        splitControls.addEventListener('click', handleSplit);
        splitOutputContainer.addEventListener('click', (e) => {
            if (e.target.classList.contains('copy-split-btn')) {
                const index = e.target.dataset.chapterIndex ? parseInt(e.target.dataset.chapterIndex, 10) : -1;
                const box = e.target.closest('.split-result-box');
                const content = box.querySelector('.content').innerHTML.replace(/<\/?p>/g, '\n\n').replace(/\n\n/g, '\n\n');
                copyToClipboard(content, e.target);
            }
        });
    }
});
