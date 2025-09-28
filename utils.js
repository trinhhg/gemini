/**
 * Đếm số từ theo chuẩn.
 * @param {string} text - Văn bản cần đếm.
 * @returns {number} Số lượng từ.
 */
function countWords(text) {
    if (!text) return 0;
    // Dùng regex để tìm các chuỗi ký tự không phải khoảng trắng liên tục
    const matches = text.match(/\S+/g);
    return matches ? matches.length : 0;
}

/**
 * Thực hiện thay thế và highlight các từ đã thay đổi.
 * @param {string} text - Văn bản gốc.
 * @param {Array<Object>} pairs - Mảng các cặp {find, replace, matchCase, wholeWord}.
 * @returns {string} Chuỗi HTML với các từ đã được highlight, chia đoạn bằng thẻ <p>.
 */
function performReplacement(text, pairs) {
    let outputText = text;
    let replacements = [];

    // Bước 1: Thu thập tất cả các vị trí và nội dung thay thế
    pairs.forEach(pair => {
        if (pair.find) {
            let findStr = pair.find;
            // Xử lý ký tự đặc biệt trong regex
            findStr = findStr.replace(/[-\/\\^$*+?.()|[\]{}]/g, '\\$&');
            
            // Thêm ranh giới từ (\b) nếu là Find Whole Word Only
            if (pair.wholeWord) {
                findStr = `\\b${findStr}\\b`;
            }

            const flags = pair.matchCase ? 'g' : 'gi';

            try {
                const regex = new RegExp(findStr, flags);
                let match;

                while ((match = regex.exec(outputText)) !== null) {
                    // Tránh vòng lặp vô tận nếu regex khớp với chuỗi rỗng
                    if (match.index === regex.lastIndex) {
                        regex.lastIndex++;
                    }
                    
                    replacements.push({
                        index: match.index,
                        length: match[0].length,
                        newText: `<span class="highlight">${pair.replace}</span>`
                    });
                }
            } catch (e) {
                console.error("Lỗi regex không hợp lệ:", pair.find, e);
            }
        }
    });

    // Sắp xếp các thay thế theo thứ tự giảm dần vị trí (để thay thế từ cuối trước)
    replacements.sort((a, b) => b.index - a.index);

    // Bước 2: Thực hiện thay thế lên văn bản gốc
    for (const rep of replacements) {
        outputText = outputText.slice(0, rep.index) + rep.newText + outputText.slice(rep.index + rep.length);
    }
    
    // Bước 3: Chia đoạn và định dạng HTML
    // Tự động cách 1 dòng giữa các đoạn: chia bằng 2 lần xuống dòng (hoặc hơn)
    return outputText
        .split(/\n\s*\n+/) // Tách các đoạn bằng 2 hoặc nhiều lần xuống dòng
        .filter(p => p.trim() !== '')
        .map(p => {
            // Trong mỗi đoạn, thay thế 1 lần xuống dòng bằng <br>
            const content = p.replace(/\n/g, '<br>');
            return `<p>${content}</p>`;
        })
        .join('');
}


/**
 * Chia văn bản thành N phần bằng nhau (theo số từ) và tự động đánh số chương.
 * @param {string} text - Văn bản gốc.
 * @param {number} numSplits - Số phần cần chia.
 * @param {Array<string>} chapterKeywords - Danh sách từ khóa nhận diện chương.
 * @returns {Array<Object>} Mảng các chương đã chia { title, content }.
 */
function splitChapter(text, numSplits, chapterKeywords) {
    if (!text.trim() || numSplits <= 1) return [];

    const allLines = text.split('\n');
    let firstLine = allLines.shift() || ''; // Dòng đầu tiên (tiêu đề/chương)
    let remainingText = allLines.join('\n').trim();

    // 1. Phân tích tiêu đề chương
    let chapterTitleInfo = { base: "Chương", number: "1", suffix: "", original: firstLine };
    let hasChapterMatch = false;

    // Regex tìm kiếm từ khóa + số + suffix (vd: Chương 1: Thế giới)
    const keywordRegex = new RegExp(`^(${chapterKeywords.join('|')})\\s*(\\d+)([\\.:\\s].*)?$`, 'i');
    const match = firstLine.match(keywordRegex);

    if (match) {
        hasChapterMatch = true;
        chapterTitleInfo = {
            base: match[1], // "Chương"
            number: match[2], // "1"
            suffix: (match[3] || '').trim(), // ": Thế giới" hoặc ""
            original: firstLine
        };
    } else {
        // Nếu dòng đầu không phải tiêu đề chương, gán nó vào nội dung
        remainingText = `${firstLine}\n${remainingText}`.trim();
    }
    
    // 2. Chia văn bản thành các đoạn (cắt theo đoạn xuống dòng)
    const paragraphs = remainingText.split(/\n\s*\n+/).filter(p => p.trim() !== '');
    if (paragraphs.length === 0) return [];
    
    // 3. Tính tổng số từ và số từ trung bình mỗi phần
    const wordsInParagraphs = paragraphs.map(p => ({
        content: p,
        wordCount: countWords(p)
    }));
    const totalWords = wordsInParagraphs.reduce((sum, p) => sum + p.wordCount, 0);
    const wordsPerSplit = totalWords / numSplits;

    const resultChapters = [];
    let currentParaIndex = 0;
    
    for (let i = 0; i < numSplits; i++) {
        const targetWords = wordsPerSplit * (i + 1);
        let currentWords = 0;
        let contentParas = [];
        let splitIndex = currentParaIndex; // Vị trí đoạn cuối cùng của phần này
        
        // Tìm ranh giới đoạn để số từ gần với targetWords nhất
        while (splitIndex < wordsInParagraphs.length) {
            const tempWords = currentWords + wordsInParagraphs[splitIndex].wordCount;
            const diff1 = Math.abs(targetWords - currentWords);
            const diff2 = Math.abs(targetWords - tempWords);

            if (diff2 < diff1 && i < numSplits - 1) {
                 // Nếu thêm đoạn tiếp theo làm tổng số từ gần với target hơn
                currentWords = tempWords;
                splitIndex++;
            } else {
                // Đã tìm được ranh giới đoạn tốt nhất (hoặc là phần cuối cùng)
                break;
            }
        }
        
        // Phần cuối cùng phải bao gồm tất cả các đoạn còn lại
        if (i === numSplits - 1) {
            splitIndex = wordsInParagraphs.length;
        }

        contentParas = wordsInParagraphs.slice(currentParaIndex, splitIndex).map(p => p.content);
        const chapterContent = contentParas.join('\n\n');
        
        // Tên chương
        const newTitle = hasChapterMatch 
            ? `${chapterTitleInfo.base} ${chapterTitleInfo.number}.${i + 1}${chapterTitleInfo.suffix}`
            : `Phần ${i + 1}${chapterTitleInfo.suffix}`; // Tên chương mặc định nếu không khớp
            
        resultChapters.push({ title: newTitle, content: chapterContent });
        currentParaIndex = splitIndex;
    }

    // Nếu số từ quá ít, có thể có chương rỗng, cần loại bỏ
    return resultChapters.filter(c => c.content.trim() !== '');
}

/**
 * Sao chép văn bản vào clipboard và thông báo cho người dùng.
 * @param {string} text - Văn bản cần sao chép.
 * @param {HTMLElement} button - Nút đã được nhấn.
 */
function copyToClipboard(text, button) {
    if (!navigator.clipboard) {
        alert('Trình duyệt của bạn không hỗ trợ sao chép tự động.');
        return;
    }

    navigator.clipboard.writeText(text).then(() => {
        const originalText = button.textContent;
        const originalBg = button.style.backgroundColor;
        
        button.textContent = 'Đã sao chép!';
        button.style.backgroundColor = 'var(--success-color)';
        
        setTimeout(() => {
            button.textContent = originalText;
            button.style.backgroundColor = originalBg; // Khôi phục màu
        }, 2000);
    }).catch(err => {
        console.error('Không thể sao chép: ', err);
        alert('Sao chép thất bại! Vui lòng sao chép thủ công.');
    });
}
