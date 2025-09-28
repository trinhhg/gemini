function countWords(text) {
    if (!text) return 0;
    const matches = text.match(/\S+/g);
    return matches ? matches.length : 0;
}

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

    return highlightedText.split(/\n\s*\n/).map(p => `<p>${p.replace(/\n/g, '<br>')}</p>`).join('');
}

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
        remainingText = `${firstLine}\n${remainingText}`.trim();
        chapterTitleInfo.suffix = '';
    }

    const paragraphs = remainingText.split(/\n\s*\n/).filter(p => p.trim() !== '');
    const paragraphWords = paragraphs.map(p => countWords(p));
    const totalWords = paragraphWords.reduce((a, b) => a + b, 0);

    if (totalWords === 0 || numSplits <= 1) return [{ title: chapterTitleInfo.original, content: remainingText }];

    const targetWordsPerSplit = Math.max(Math.floor(totalWords / numSplits), 50); // Tối thiểu 50 từ mỗi chương
    const resultChapters = [];
    let currentWordCount = 0;
    let startPara = 0;

    for (let i = 1; i <= numSplits; i++) {
        let target = i * targetWordsPerSplit;
        if (i === numSplits) target = totalWords;

        let endPara = startPara;
        while (endPara < paragraphs.length && currentWordCount < target) {
            currentWordCount += paragraphWords[endPara] || 0;
            endPara++;
        }

        const contentParas = paragraphs.slice(startPara, endPara);
        let content = contentParas.join('\n\n');
        if (content.trim() === '') content = ' '; // Tránh nội dung rỗng

        const newTitle = `${chapterTitleInfo.base} ${parseInt(chapterTitleInfo.number) + i - 1}${chapterTitleInfo.suffix}`;
        resultChapters.push({ title: newTitle, content: content });
        startPara = endPara;
    }

    return resultChapters;
}

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
