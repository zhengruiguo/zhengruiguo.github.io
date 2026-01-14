// 全局变量
let questions = [];
let originalQuestions = []; // 保存完整原始题库
let currentIndex = 0;
let userAnswers = {}; // 存储用户答案 {题id: [选项1, 选项2]}（多选改为数组）
const DEFAULT_QUESTION_COUNT = 10; // 每次出题数量

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
    const tempArray = [...sourceArray];
    const shuffledArray = shuffleArray(tempArray);
    return shuffledArray.slice(0, count);
}

// 工具函数3：对比多选答案是否完全一致（排序后对比）
function isAnswerCorrect(userAns, correctAns) {
    // 统一排序后转为字符串对比（避免 ["A","C"] 和 ["C","A"] 判定为错误）
    const sortedUser = (userAns || []).sort().join('');
    const sortedCorrect = (correctAns || []).sort().join('');
    return sortedUser === sortedCorrect;
}

// 加载题库
fetch('questions2.json')
    .then(response => {
        if (!response.ok) throw new Error('题库文件不存在');
        return response.json();
    })
    .then(data => {
        originalQuestions = data;
        questions = getRandomQuestions(originalQuestions, DEFAULT_QUESTION_COUNT);
        totalNumSpan.textContent = questions.length;
        renderQuestion(currentIndex);
    })
    .catch(err => {
        questionTitle.textContent = '加载失败：' + err.message;
    });

// 渲染题目（修改：单选改复选框）
function renderQuestion(index) {
    const q = questions[index];
    currentSpan.textContent = `第${index + 1}题`;
    questionTitle.textContent = q.question;

    // 渲染图片
    if (q.img) {
        questionImg.style.display = 'block';
        questionImg.innerHTML = `<img src="${q.img}" alt="题目图片">`;
    } else {
        questionImg.style.display = 'none';
    }

    // 渲染选项（单选框改为复选框）
    options.innerHTML = '';
    q.options.forEach((opt, idx) => {
        const optionId = `opt-${idx}`;
        const optionVal = String.fromCharCode(65 + idx);
        // 检查当前选项是否被用户选中（多选需判断数组包含）
        const isChecked = (userAnswers[q.id] || []).includes(optionVal) ? 'checked' : '';
        
        const optionItem = document.createElement('div');
        optionItem.className = 'option-item';
        optionItem.innerHTML = `
            <input type="checkbox" name="option" id="${optionId}" value="${optionVal}" ${isChecked}>
            <label for="${optionId}">${optionVal}. ${opt}</label>
        `;
        options.appendChild(optionItem);
    });

    // 渲染解析
    analysisText.textContent = q.answer || '暂无答案';
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

// 保存当前题答案（修改：保存多选答案为数组）
function saveAnswer() {
    const selectedOpts = document.querySelectorAll('input[name="option"]:checked');
    // 将选中的选项转为数组
    const selectedVals = Array.from(selectedOpts).map(opt => opt.value);
    userAnswers[questions[currentIndex].id] = selectedVals;
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
        analysisBtn.textContent = '查看隐藏答案';
    } else {
        analysis.style.display = 'none';
        analysisBtn.textContent = '查看隐藏答案';
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

// 计算得分（修改：适配多选答案判定）
function calculateResult() {
    let correctNum = 0;
    questions.forEach(q => {
        // 使用自定义函数对比多选答案
        if (isAnswerCorrect(userAnswers[q.id], q.answer)) correctNum++;
    });
    const total = questions.length;
    const score = (correctNum / total) * 100;
    const wrongNum = total - correctNum;
    scoreSpan.textContent = score.toFixed(1);
    accuracySpan.textContent = ((correctNum / total) * 100).toFixed(1);
    wrongNumSpan.textContent = wrongNum;
}

// 生成错题列表（修改：适配多选答案显示）
function generateWrongList() {
    wrongItems.innerHTML = '';
    questions.forEach(q => {
        if (!isAnswerCorrect(userAnswers[q.id], q.answer)) {
            const wrongItem = document.createElement('div');
            wrongItem.className = 'wrong-item';
            // 格式化答案显示：数组转字符串（如 ["A","C"] → "A、C"）
            const userAnsText = (userAnswers[q.id] || []).join('、') || '未作答';
            const correctAnsText = (q.answer || []).join('、');
            
            wrongItem.innerHTML = `
                <p><strong>题目：</strong>${q.question}</p>
                <p class="user-answer">你的答案：${userAnsText}</p>
                <p class="correct-answer">正确答案：${correctAnsText}</p>
                <div class="analysis"><strong>答案：</strong>${q.answer || '暂无答案'}</div>
            `;
            wrongItems.appendChild(wrongItem);
        }
    });
}

// 重新答题事件
resetBtn.addEventListener('click', () => {
    userAnswers = {};
    currentIndex = 0;
    questions = getRandomQuestions(originalQuestions, DEFAULT_QUESTION_COUNT);
    totalNumSpan.textContent = questions.length;
    questionBox.style.display = 'block';
    document.querySelector('.btn-group').style.display = 'flex';
    document.querySelector('.progress').style.display = 'flex';
    resultBox.style.display = 'none';
    renderQuestion(currentIndex);
});
