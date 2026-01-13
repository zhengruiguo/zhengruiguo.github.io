
// 全局变量
let questions = [];
let currentIndex = 0;
let userAnswers = {}; // 存储用户答案 {题id: 选项}

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

// 加载题库
fetch('questions2.json')
    .then(response => {
        if (!response.ok) throw new Error('题库文件不存在');
        return response.json();
    })
    .then(data => {
        questions = data;
        totalNumSpan.textContent = questions.length//10;
        renderQuestion(currentIndex);
    })
    .catch(err => {
        questionTitle.textContent = '加载失败：' + err.message;
    });

// 渲染题目（新增图片和解析渲染）
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

// 保存当前题答案
function saveAnswer() {
    const selectedOpt = document.querySelector('input[name="option"]:checked');
    if (selectedOpt) {
        userAnswers[questions[currentIndex].id] = selectedOpt.value;
    }
}

// 上一题
prevBtn.addEventListener('click', () => {
    saveAnswer();
    currentIndex--;
    renderQuestion(currentIndex);
});

// 下一题
nextBtn.addEventListener('click', () => {
    saveAnswer();
    currentIndex++;
    renderQuestion(currentIndex);
});

// 新增：查看解析按钮事件
analysisBtn.addEventListener('click', () => {
    if (analysis.style.display === 'none') {
        analysis.style.display = 'block';
        analysisBtn.textContent = '隐藏答案';
    } else {
        analysis.style.display = 'none';
        analysisBtn.textContent = '查看答案';
    }
});

// 提交试卷（新增错题列表生成）
submitBtn.addEventListener('click', () => {
    saveAnswer();
    calculateResult();
    generateWrongList();
    questionBox.style.display = 'none';
    document.querySelector('.btn-group').style.display = 'none';
    document.querySelector('.progress').style.display = 'none';
    resultBox.style.display = 'block';
});

// 计算得分
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

// 新增：生成错题列表
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
                <div class="analysis"><strong>答案：</strong>${q.analysis || '暂无答案'}</div>
            `;
            wrongItems.appendChild(wrongItem);
        }
    });
}

// 重新答题
resetBtn.addEventListener('click', () => {
    userAnswers = {};
    currentIndex = 0;
    questionBox.style.display = 'block';
    document.querySelector('.btn-group').style.display = 'flex';
    document.querySelector('.progress').style.display = 'flex';
    resultBox.style.display = 'none';
    renderQuestion(currentIndex);
});
