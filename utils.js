function countWords(text) {
    if (!text) return 0;
    const cleaned = text.trim().replace(/\s+/g, ' ');
    return cleaned ? cleaned.split(' ').length : 0;
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

function performReplacement(text, pairs) {
    let highlightedText = text || '';

    pairs.forEach(pair => {
        if (pair.find) {
            try {
                let findPattern = pair.find.replace(/[-\/\\^$*+?.()|[\]{}]/g, '\\$&');
                if (pair.wholeWord) {
                    findPattern = '\\b' + findPattern + '\\b';
                }
                const flags = pair.matchCase ? 'g' : 'gi';
                const regex = new RegExp(findPattern, flags);
                highlightedText = highlightedText.replace(regex, match => {
                    return `<span class="highlight">${escapeHtml(pair.replace)}</span>`;
                });
            } catch (e) {
                console.error("Lỗi regex không hợp lệ:", pair.find, e);
            }
        }
    });

    return highlightedText.split(/\n\s*\n/).map(p => `<p>${p.replace(/\n/g, '<br>')}</p>`).join('');
}

function splitChapter(text, numSplits, chapterKeywords) {
    if (!text.trim()) return [];

    const lines = text.trim().split('\n');
    let firstLine = lines.length > 0 ? lines.shift() : '';
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
    } else if (firstLine) {
        remainingText = `${firstLine}\n${remainingText}`.trim();
        chapterTitleInfo.suffix = '';
    }

    const paragraphs = remainingText.split(/\n\s*\n/).filter(p => p.trim() !== '');
    const paragraphWords = paragraphs.map(p => countWords(p));
    const totalWords = paragraphWords.reduce((a, b) => a + b, 0);

    if (totalWords === 0 || numSplits <= 1) {
        return [{ title: chapterTitleInfo.original, content: remainingText }];
    }

    const maxSplits = Math.min(numSplits, Math.ceil(totalWords / 50)); // Giới hạn số chương dựa trên 50 từ
    const targetWordsPerSplit = Math.max(Math.floor(totalWords / maxSplits), 50);
    const resultChapters = [];
    let currentWordCount = 0;
    let startPara = 0;

    for (let i = 1; i <= maxSplits; i++) {
        let target = i * targetWordsPerSplit;
        if (i === maxSplits) target = totalWords;

        let endPara = startPara;
        while (endPara < paragraphs.length && currentWordCount < target) {
            currentWordCount += paragraphWords[endPara] || 0;
            endPara++;
        }

        const contentParas = paragraphs.slice(startPara, endPara);
        let content = contentParas.join('\n\n').trim() || ' '; // Tránh nội dung rỗng
        const newTitle = `${chapterTitleInfo.base} ${parseInt(chapterTitleInfo.number) + i - 1}${chapterTitleInfo.suffix}`;
        resultChapters.push({ title: newTitle, content: content });
        startPara = endPara;
    }

    return resultChapters;
}

function copyToClipboard(text, button) {
    if (!text) {
        console.error('Không có nội dung để sao chép');
        return;
    }

    navigator.clipboard.writeText(text).then(() => {
        button.classList.add('copied');
        const originalText = button.textContent;
        button.textContent = 'Đã sao chép!';
        setTimeout(() => {
            button.textContent = originalText;
            button.classList.remove('copied');
        }, 2000);
    }).catch(err => {
        console.error('Không thể sao chép:', err);
        // Fallback cho trình duyệt cũ
        try {
            const ta = document.createElement('textarea');
            ta.value = text;
            ta.style.position = 'fixed';
            ta.style.left = '-9999px';
            document.body.appendChild(ta);
            ta.select();
            document.execCommand('copy');
            document.body.removeChild(ta);
            button.classList.add('copied');
            const originalText = button.textContent;
            button.textContent = 'Đã sao chép!';
            setTimeout(() => {
                button.textContent = originalText;
                button.classList.remove('copied');
            }, 2000);
        } catch (fallbackErr) {
            console.error('Fallback sao chép thất bại:', fallbackErr);
            alert('Sao chép thất bại!');
        }
    });
}
