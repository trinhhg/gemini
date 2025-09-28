/**
 * Đếm số từ theo chuẩn Microsoft Word (chuỗi ký tự liên tục).
 * @param {string} text - Văn bản cần đếm.
 * @returns {number} Số lượng từ.
 */
function countWords(text) {
    if (!text) return 0;
    const matches = text.match(/\S+/g);
    return matches ? matches.length : 0;
}

/**
 * Thực hiện thay thế và highlight các từ đã thay đổi.
 * @param {string} text - Văn bản gốc.
 * @param {Array<Object>} pairs - Mảng các cặp {find, replace, matchCase, wholeWord}.
 * @returns {string} Chuỗi HTML với các từ đã được highlight.
 */
function performReplacement(text, pairs) {
    let highlightedText = text;

    pairs.forEach(pair => {
        if (pair.find) {
            try {
                let findPattern = pair.find.replace(/[-\/\\^$*+?.()|[\]{}]/g, '\\$&');
                if (pair.wholeWord) {
                    findPattern = '\\b' + findPattern + '\\b';
                }
                const flags = pair.matchCase ? 'g' : 'gi';
                const regex = new RegExp(findPattern, flags);
                highlightedText = highlightedText.replace(regex, `<span class="highlight">${pair.replace}</span>`);
            } catch (e) {
                console.error("Lỗi regex không hợp lệ:", pair.find, e);
            }
        }
    });

    // Chuyển đổi xuống dòng thành thẻ <p> để tự động cách dòng
    return highlightedText.split(/\n\s*\n/).map(p => `<p>${p.replace(/\n/g, '<br>')}</p>`).join('');
}


/**
 * Chia văn bản thành N phần bằng nhau và tự động đánh số chương.
 * @param {string} text - Văn bản gốc.
 * @param {number} numSplits - Số phần cần chia.
 * @param {Array<string>} chapterKeywords - Danh sách từ khóa nhận diện chương.
 * @returns {Array<Object>} Mảng các chương đã chia { title, content }.
 */
function splitChapter(text, numSplits, chapterKeywords) {
    if (!text.trim()) return [];

    const lines = text.trim().split('\n');
    let firstLine = lines.shift() || '';
    let remainingText = lines.join('\n').trim();

    let chapterTitleInfo = { base: "Chương", number: "1", suffix: "", original: firstLine };

    const keywordRegex = new RegExp(`^(${chapterKeywords.join('|')})\\s*(\\d+)([\\.:\\s].*)?$`, 'i');
    const match = firstLine.match(keywordRegex);

    if (match) {
        chapterTitleInfo = {
            base: match[1],
            number: match[2],
            suffix: (match[3] || '').trim(),
            original: firstLine
        };
    } else {
        // Nếu không khớp, coi dòng đầu là suffix và thêm "Chương 1" vào
        remainingText = `${firstLine}\n${remainingText}`.trim();
        chapterTitleInfo.suffix = '';
    }

    const paragraphs = remainingText.split(/\n\s*\n/).filter(p => p.trim() !== '');
    const paragraphWords = paragraphs.map(p => countWords(p));
    const totalWords = paragraphWords.reduce((a, b) => a + b, 0);
    const targetWordsPerSplit = totalWords / numSplits;

    const resultChapters = [];
    let currentWordCount = 0;
    let startPara = 0;

    for (let i = 1; i <= numSplits; i++) {
        const target = i * targetWordsPerSplit;
        let endPara = startPara;

        while (endPara < paragraphs.length && currentWordCount < target) {
            currentWordCount += paragraphWords[endPara];
            endPara++;
        }

        // Adjust to not overshoot if last
        if (i === numSplits) endPara = paragraphs.length;

        const contentParas = paragraphs.slice(startPara, endPara);
        let content = contentParas.join('\n\n');

        const newTitle = `${chapterTitleInfo.base} ${chapterTitleInfo.number}.${i}${chapterTitleInfo.suffix}`;
        content = `${newTitle}\n\n${content}`;

        resultChapters.push({ title: newTitle, content: content });
        startPara = endPara;
    }

    return resultChapters;
}

/**
 * Sao chép văn bản vào clipboard và thông báo cho người dùng.
 * @param {string} text - Văn bản cần sao chép.
 * @param {HTMLElement} button - Nút đã được nhấn.
 */
function copyToClipboard(text, button) {
    navigator.clipboard.writeText(text).then(() => {
        const originalText = button.textContent;
        button.textContent = 'Đã sao chép!';
        button.style.backgroundColor = 'var(--success-color)';
        setTimeout(() => {
            button.textContent = originalText;
            button.style.backgroundColor = '';
        }, 2000);
    }).catch(err => {
        console.error('Không thể sao chép: ', err);
        alert('Sao chép thất bại!');
    });
}
