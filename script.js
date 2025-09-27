document.addEventListener('DOMContentLoaded', () => {
    // --- STATE MANAGEMENT ---
    let settings = {
        modes: {
            'Mặc định': { matchCase: false, pairs: [{ find: '', replace: '' }] }
        },
        activeMode: 'Mặc định',
        chapterKeywords: ['Chương', 'Chapter', 'Phần', 'Hồi']
    };

    // --- DOM ELEMENTS ---
    const tabs = document.querySelectorAll('.tab-link');
    const tabContents = document.querySelectorAll('.tab-content');
    
    // Settings Tab
    const modeSelect = document.getElementById('mode-select');
    const addModeBtn = document.getElementById('add-mode-btn');
    const copyModeBtn = document.getElementById('copy-mode-btn');
    const renameModeBtn = document.getElementById('rename-mode-btn');
    const deleteModeBtn = document.getElementById('delete-mode-btn');
    const importSettingsBtn = document.getElementById('import-settings-btn');
    const importFileInput = document.getElementById('import-file-input');
    const exportSettingsBtn = document.getElementById('export-settings-btn');
    const matchCaseCheckbox = document.getElementById('match-case-checkbox');
    const addPairBtn = document.getElementById('add-pair-btn');
    const saveSettingsBtn = document.getElementById('save-settings-btn');
    const pairsContainer = document.getElementById('replace-pairs-container');
    const chapterKeywordInput = document.getElementById('chapter-keyword-input');
    const addKeywordBtn = document.getElementById('add-keyword-btn');
    const keywordsListContainer = document.getElementById('chapter-keywords-list');


    // Replace Tab
    const replaceInput = document.getElementById('replace-input');
    const wordCountDisplay = document.getElementById('word-count');
    const replaceBtn = document.getElementById('replace-btn');
    const replaceOutput = document.getElementById('replace-output');
    const copyOutputBtn = document.getElementById('copy-output-btn');

    // Split Tab
    const splitControls = document.querySelector('.split-controls');
    const splitInput = document.getElementById('split-input');
    const splitOutputContainer = document.getElementById('split-output-container');

    // --- INITIALIZATION ---
    loadSettings();
    updateUI();
    setupEventListeners();
    createSplitButtons();

    // --- FUNCTIONS ---

    // UI Update Functions
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

        matchCaseCheckbox.checked = mode.matchCase;
        pairsContainer.innerHTML = '';
        mode.pairs.forEach((pair, index) => {
            const pairElement = createPairElement(pair.find, pair.replace);
            pairsContainer.appendChild(pairElement);
        });
    }
    
    function createPairElement(findVal = '', replaceVal = '') {
        const div = document.createElement('div');
        div.className = 'replace-pair';
        div.innerHTML = `
            <input type="text" class="find-input" placeholder="Tìm" value="${findVal}">
            <span>→</span>
            <input type="text" class="replace-input" placeholder="Thay thế" value="${replaceVal}">
            <button class="delete-pair-btn">✖</button>
        `;
        div.querySelector('.delete-pair-btn').addEventListener('click', () => {
            div.remove();
        });
        return div;
    }

    function createSplitButtons() {
        for (let i = 2; i <= 10; i++) {
            const button = document.createElement('button');
            button.className = 'btn';
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

    // Data Handling Functions
    function saveSettingsToUI() {
        const currentMode = settings.modes[settings.activeMode];
        if (!currentMode) return;
        
        currentMode.matchCase = matchCaseCheckbox.checked;
        
        const newPairs = [];
        document.querySelectorAll('.replace-pair').forEach(pairEl => {
            const find = pairEl.querySelector('.find-input').value;
            const replace = pairEl.querySelector('.replace-input').value;
            newPairs.push({ find, replace });
        });
        currentMode.pairs = newPairs;
        saveSettings();
        alert('Đã lưu cài đặt cho chế độ: ' + settings.activeMode);
    }
    
    function saveSettings() {
        localStorage.setItem('textToolSettings', JSON.stringify(settings));
    }

    function loadSettings() {
        const saved = localStorage.getItem('textToolSettings');
        if (saved) {
            settings = JSON.parse(saved);
            // Ensure default structure exists
            if (!settings.chapterKeywords) {
                settings.chapterKeywords = ['Chương', 'Chapter', 'Phần', 'Hồi'];
            }
        }
    }

    // Event Handlers
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
            settings.modes[name] = { matchCase: false, pairs: [{ find: '', replace: '' }] };
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
        const dataUri = 'data:application/json;charset=utf-8,'+ encodeURIComponent(dataStr);
        const exportFileDefaultName = 'settings.json';
        
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
                // Simple validation
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
        
        const resultHTML = performReplacement(inputText, mode.pairs, mode.matchCase);
        replaceOutput.innerHTML = resultHTML;
        replaceInput.value = '';
        wordCountDisplay.textContent = 'Số từ: 0';
    }

    function handleSplit(e) {
        if (!e.target.matches('.btn[data-splits]')) return;
        const numSplits = parseInt(e.target.dataset.splits, 10);
        const text = splitInput.value;
        if (!text) return;

        const chapters = splitChapter(text, numSplits, settings.chapterKeywords);
        splitOutputContainer.innerHTML = '';

        chapters.forEach((chapter, index) => {
            const box = document.createElement('div');
            box.className = 'split-result-box';
            
            const content = document.createElement('div');
            content.className = 'content';
            content.textContent = chapter.content;

            box.innerHTML = `
                <h4>${chapter.title}</h4>
            `;
            box.appendChild(content);
            box.innerHTML += `
                <div class="toolbar">
                    <span>Số từ: ${countWords(chapter.content)}</span>
                    <button class="btn copy-split-btn">Sao chép ${index + 1}</button>
                </div>
            `;
            splitOutputContainer.appendChild(box);
        });
        splitInput.value = '';
    }

    function setupEventListeners() {
        tabs.forEach(tab => tab.addEventListener('click', handleTabClick));
        
        // Settings Tab
        modeSelect.addEventListener('change', handleModeChange);
        addModeBtn.addEventListener('click', handleAddMode);
        copyModeBtn.addEventListener('click', handleCopyMode);
        renameModeBtn.addEventListener('click', handleRenameMode);
        deleteModeBtn.addEventListener('click', handleDeleteMode);
        exportSettingsBtn.addEventListener('click', handleExportSettings);
        importSettingsBtn.addEventListener('click', () => importFileInput.click());
        importFileInput.addEventListener('change', handleImportSettings);
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

        // Replace Tab
        replaceInput.addEventListener('input', () => {
            wordCountDisplay.textContent = `Số từ: ${countWords(replaceInput.value)}`;
        });
        replaceBtn.addEventListener('click', handleReplace);
        copyOutputBtn.addEventListener('click', (e) => {
            copyToClipboard(replaceOutput.innerText, e.target);
        });

        // Split Tab
        splitControls.addEventListener('click', handleSplit);
        splitOutputContainer.addEventListener('click', (e) => {
            if (e.target.classList.contains('copy-split-btn')) {
                const box = e.target.closest('.split-result-box');
                const content = box.querySelector('.content').textContent;
                copyToClipboard(content, e.target);
            }
        });
    }
});
