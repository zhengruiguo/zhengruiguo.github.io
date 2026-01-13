// 全局变量
let questions = [];
let originalQuestions = []; // 保存完整原始题库
let currentIndex = 0;
let userAnswers = {}; // 存储用户答案 {题id: 选项}
const DEFAULT_QUESTION_COUNT = 10; // 配置：每次出题数量

// DOM元素
const questionBox = document.getElementById('question-box');
const questionTitle = document.getElementById('question-title');
const questionImg = document.getElementById('question-img');
const options = document.getElementById('options');
const prevBtn = document.getElementById('prev-btn');
const nextBtn = document.getElementById('next-btn');
const submitBtn = document.getElementById('submit-btn');
const analysisBtn = document.getElementById('analysis-btn');
const analysisText = document.getElementById('analysis-text');
const analysis = document.getElementById('analysis');
const resultBox = document.getElementById('result-box');
const scoreSpan = document.getElementById('score');
const accuracySpan = document.getElementById('accuracy');
const wrongNumSpan = document.getElementById('wrong-num');
const wrongItems = document.getElementById('wrong-items');
const resetBtn = document.getElementById('reset-btn');
const currentSpan = document.getElementById('current');
const totalNumSpan = document.getElementById('total-num');

// 工具函数1：Fisher-Yates 洗牌算法（打乱数组）
function shuffleArray(array) {
    const newArray = [...array];
    for (let i = newArray.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [newArray[i], newArray[j]] = [newArray[j], newArray[i]];
    }
    return newArray;
}

// 工具函数2：随机抽取指定数量的题目
function getRandomQuestions(sourceArray, count) {
    // 深拷贝原始题库，避免修改原数据
    const tempArray = [...sourceArray];
    // 洗牌后截取前count道题
    const shuffledArray = shuffleArray(tempArray);
    return shuffledArray.slice(0, count);
}

// 加载题库
fetch('questions2.json')
    .then(response => {
        if (!response.ok) throw new Error('题库文件不存在');
        return response.json();
    })
    .then(data => {
        originalQuestions = data; // 保存完整题库
        // 抽取10道题（若题库不足10道则取全部）
        questions = getRandomQuestions(originalQuestions, DEFAULT_QUESTION_COUNT);
        totalNumSpan.textContent = questions.length; // 更新总题数显示
        renderQuestion(currentIndex);
    })
    .catch(err => {
        questionTitle.textContent = '加载失败：' + err.message;
    });

// 渲染题目（保持不变）
function renderQuestion(index) {
    const q = questions[index];
    currentSpan.textContent = `第${index + 1}题`;
    questionTitle.textContent = q.question;

    // 渲染图片（可选）
    if (q.img) {
        questionImg.style.display = 'block';
        questionImg.innerHTML = `<img src="${q.img}" alt="题目图片">`;
    } else {
        questionImg.style.display = 'none';
    }

    // 渲染选项
    options.innerHTML = '';
    q.options.forEach((opt, idx) => {
        const optionId = `opt-${idx}`;
        const isChecked = userAnswers[q.id] === String.fromCharCode(65 + idx);
        const optionItem = document.createElement('div');
        optionItem.className = 'option-item';
        optionItem.innerHTML = `
            <input type="radio" name="option" id="${optionId}" value="${String.fromCharCode(65 + idx)}" ${isChecked ? 'checked' : ''}>
            <label for="${optionId}">${String.fromCharCode(65 + idx)}. ${opt}</label>
        `;
        options.appendChild(optionItem);
    });

    // 渲染解析（默认隐藏）
    analysisText.textContent = q.analysis || '暂无解析';
    analysis.style.display = 'none';

    // 按钮状态
    prevBtn.disabled = index === 0;
    if (index === questions.length - 1) {
        nextBtn.style.display = 'none';
        submitBtn.style.display = 'inline-block';
    } else {
        nextBtn.style.display = 'inline-block';
        submitBtn.style.display = 'none';
    }
}

// 保存当前题答案（保持不变）
function saveAnswer() {
    const selectedOpt = document.querySelector('input[name="option"]:checked');
    if (selectedOpt) {
        userAnswers[questions[currentIndex].id] = selectedOpt.value;
    }
}

// 上一题事件
prevBtn.addEventListener('click', () => {
    saveAnswer();
    currentIndex--;
    renderQuestion(currentIndex);
});

// 下一题事件
nextBtn.addEventListener('click', () => {
    saveAnswer();
    currentIndex++;
    renderQuestion(currentIndex);
});

// 查看解析事件
analysisBtn.addEventListener('click', () => {
    if (analysis.style.display === 'none') {
        analysis.style.display = 'block';
        analysisBtn.textContent = '隐藏解析';
    } else {
        analysis.style.display = 'none';
        analysisBtn.textContent = '查看解析';
    }
});

// 提交试卷事件
submitBtn.addEventListener('click', () => {
    saveAnswer();
    calculateResult();
    generateWrongList();
    questionBox.style.display = 'none';
    document.querySelector('.btn-group').style.display = 'none';
    document.querySelector('.progress').style.display = 'none';
    resultBox.style.display = 'block';
});

// 计算得分（保持不变）
function calculateResult() {
    let correctNum = 0;
    questions.forEach(q => {
        if (userAnswers[q.id] === q.answer) correctNum++;
    });
    const total = questions.length;
    const score = (correctNum / total) * 100;
    const wrongNum = total - correctNum;
    scoreSpan.textContent = score.toFixed(1);
    accuracySpan.textContent = ((correctNum / total) * 100).toFixed(1);
    wrongNumSpan.textContent = wrongNum;
}

// 生成错题列表（保持不变）
function generateWrongList() {
    wrongItems.innerHTML = '';
    questions.forEach(q => {
        if (userAnswers[q.id] !== q.answer) {
            const wrongItem = document.createElement('div');
            wrongItem.className = 'wrong-item';
            wrongItem.innerHTML = `
                <p><strong>题目：</strong>${q.question}</p>
                <p class="user-answer">你的答案：${userAnswers[q.id] || '未作答'}</p>
                <p class="correct-answer">正确答案：${q.answer}</p>
                <div class="analysis"><strong>解析：</strong>${q.analysis || '暂无解析'}</div>
            `;
            wrongItems.appendChild(wrongItem);
        }
    });
}

// 重新答题事件（修改：重新抽取10道题）
resetBtn.addEventListener('click', () => {
    userAnswers = {};
    currentIndex = 0;
    // 重新随机抽取10道题
    questions = getRandomQuestions(originalQuestions, DEFAULT_QUESTION_COUNT);
    totalNumSpan.textContent = questions.length; // 更新总题数
    questionBox.style.display = 'block';
    document.querySelector('.btn-group').style.display = 'flex';
    document.querySelector('.progress').style.display = 'flex';
    resultBox.style.display = 'none';
    renderQuestion(currentIndex);
});
