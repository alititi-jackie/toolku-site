// ===== Toolku.com 工具逻辑 =====

// 汇率换算工具
function convertCurrency() {
    const amount = parseFloat(document.getElementById('currency-amount').value) || 0;
    const from = document.getElementById('currency-from').value;
    const to = document.getElementById('currency-to').value;
    
    // 参考汇率（实际使用时应接入API）
    const rates = {
        'USD': 1,
        'CNY': 7.25,
        'EUR': 0.92,
        'JPY': 149.50,
        'HKD': 7.82,
        'GBP': 0.79
    };
    
    const amountInUSD = amount / rates[from];
    const result = amountInUSD * rates[to];
    
    const symbols = { USD: '$', CNY: '¥', EUR: '€', JPY: '¥', HKD: 'HK$', GBP: '£' };
    const names = { USD: '美元', CNY: '人民币', EUR: '欧元', JPY: '日元', HKD: '港币', GBP: '英镑' };
    
    document.getElementById('currency-result').innerHTML = 
        '<div class="result-value">' + symbols[to] + result.toFixed(2) + '</div>' +
        '<div class="result-label">' + amount + ' ' + names[from] + ' = ' + result.toFixed(2) + ' ' + names[to] + '</div>' +
        '<div class="result-label" style="margin-top:4px;font-size:12px;opacity:0.7;">汇率参考: 1 ' + names[from] + ' = ' + (rates[from] ? (rates[to]/rates[from]).toFixed(4) : '-') + ' ' + names[to] + '（仅供参考）</div>';
}

// DMV 6 Points 计算器
function calculatePoints() {
    const pointsMap = {
        'red_light': 5,
        'speeding_1': 4,
        'speeding_2': 3,
        'reckless': 5,
        'accident': 3,
        'seatbelt': 2,
        'device': 2,
        'registration': 2,
        'insurance': 3,
        'other': 1
    };
    
    let total = 0;
    for (const [key, val] of Object.entries(pointsMap)) {
        const checked = document.getElementById('point-' + key);
        if (checked && checked.checked) {
            total += val;
        }
    }
    
    const resultDiv = document.getElementById('points-result');
    if (total === 0) {
        resultDiv.className = 'result-box';
        resultDiv.innerHTML = '<div class="result-value">0</div><div class="result-label">未选择任何违章项目</div>';
    } else if (total <= 6) {
        resultDiv.className = 'result-box success';
        resultDiv.innerHTML = '<div class="result-value">' + total + '</div><div class="result-label">6 Points 以内 - 满足申请/续照要求</div><div class="result-label" style="margin-top:4px;">你的积分在安全范围内，可以正常申请或续期驾照。</div>';
    } else if (total <= 10) {
        resultDiv.className = 'result-box warning';
        resultDiv.innerHTML = '<div class="result-value">' + total + '</div><div class="result-label">超过 6 Points - 可能影响驾照申请</div><div class="result-label" style="margin-top:4px;">你需要完成交通安全课程来降低积分。</div>';
    } else {
        resultDiv.className = 'result-box danger';
        resultDiv.innerHTML = '<div class="result-value">' + total + '</div><div class="result-label">严重超标 - 驾照可能被吊销</div><div class="result-label" style="margin-top:4px;">请立即联系 DMV 或律师处理。</div>';
    }
}

// REAL ID 检查器
function checkRealID() {
    const checks = {
        identity: document.getElementById('rid-identity').checked,
        ssn: document.getElementById('rid-ssn').checked,
        address1: document.getElementById('rid-address1').checked,
        address2: document.getElementById('rid-address2').checked,
        legal: document.getElementById('rid-legal').checked
    };
    
    const results = {
        identity: { label: '身份证明 (2份)', passed: checks.identity },
        ssn: { label: 'SSN 或无法申请证明', passed: checks.ssn },
        address1: { label: '地址证明 (第1份)', passed: checks.address1 },
        address2: { label: '地址证明 (第2份)', passed: checks.address2 },
        legal: { label: '合法身份文件', passed: checks.legal }
    };
    
    let passed = 0;
    let total = Object.keys(results).length;
    let html = '';
    
    for (const [key, item] of Object.entries(results)) {
        const status = item.passed ? '✓' : '✗';
        const color = item.passed ? 'var(--success)' : 'var(--danger)';
        html += '<div style="display:flex;justify-content:space-between;align-items:center;padding:10px 16px;border:1px solid var(--border);border-radius:8px;margin-bottom:6px;">' +
                '<span>' + item.label + '</span>' +
                '<span style="color:' + color + ';font-weight:bold;font-size:18px;">' + status + '</span></div>';
        if (item.passed) passed++;
    }
    
    const pct = (passed / total) * 100;
    const fillClass = pct === 100 ? 'green' : pct >= 50 ? 'orange' : 'red';
    const boxClass = pct === 100 ? 'success' : pct >= 50 ? 'warning' : 'danger';
    const msg = pct === 100 ? '所有文件已备齐，可以前往 DMV！' : '还缺少部分文件，请对照上方标记的项目准备。';
    
    document.getElementById('realid-checklist').innerHTML = html;
    document.getElementById('realid-progress').innerHTML = 
        '<div class="progress-bar"><div class="fill ' + fillClass + '" style="width:' + pct + '%"></div></div>' +
        '<div style="text-align:center;margin-top:8px;">' + passed + '/' + total + ' 项已完成 (' + pct.toFixed(0) + '%)</div>';
    document.getElementById('realid-result').className = 'result-box ' + boxClass;
    document.getElementById('realid-result').innerHTML = '<div class="result-value">' + passed + '/' + total + '</div><div class="result-label">' + msg + '</div>';
}

// DMV 文件检查清单
function toggleCheck(element) {
    const li = element.closest('li');
    if (li) {
        li.classList.toggle('checked');
        updateChecklistProgress();
    }
}

function updateChecklistProgress() {
    const items = document.querySelectorAll('#checklist-items li');
    const total = items.length;
    const checked = document.querySelectorAll('#checklist-items li.checked').length;
    const pct = total > 0 ? (checked / total) * 100 : 0;
    const fillClass = pct === 100 ? 'green' : pct >= 50 ? 'orange' : 'red';
    
    document.getElementById('checklist-progress-bar').innerHTML = 
        '<div class="progress-bar"><div class="fill ' + fillClass + '" style="width:' + pct + '%"></div></div>';
    document.getElementById('checklist-progress-text').textContent = checked + '/' + total + ' 项已完成 (' + pct.toFixed(0) + '%)';
    
    if (pct === 100) {
        document.getElementById('checklist-progress-text').innerHTML += ' — 所有文件已备齐！';
    }
}

// 生活开支记录（本地存储）
function saveExpense() {
    const item = document.getElementById('expense-item').value.trim();
    const amount = parseFloat(document.getElementById('expense-amount').value) || 0;
    const category = document.getElementById('expense-category').value;
    const date = document.getElementById('expense-date').value || new Date().toISOString().split('T')[0];
    
    if (!item || amount <= 0) {
        alert('请填写完整的支出信息');
        return;
    }
    
    const expenses = JSON.parse(localStorage.getItem('toolku_expenses') || '[]');
    expenses.push({ id: Date.now(), item, amount, category, date });
    localStorage.setItem('toolku_expenses', JSON.stringify(expenses));
    
    document.getElementById('expense-item').value = '';
    document.getElementById('expense-amount').value = '';
    document.getElementById('expense-category').value = 'food';
    renderExpenses();
}

function renderExpenses() {
    const expenses = JSON.parse(localStorage.getItem('toolku_expenses') || '[]');
    const container = document.getElementById('expense-list');
    
    if (expenses.length === 0) {
        container.innerHTML = '<div style="text-align:center;padding:40px;color:var(--text-muted);">暂无支出记录</div>';
        document.getElementById('expense-total').textContent = '0.00';
        return;
    }
    
    // 按日期倒序
    expenses.sort((a, b) => new Date(b.date) - new Date(a.date));
    
    const total = expenses.reduce((sum, e) => sum + e.amount, 0);
    document.getElementById('expense-total').textContent = total.toFixed(2);
    
    const categoryIcons = { food: '🍜', transport: '🚗', shopping: '🛒', bill: '📄', health: '🏥', other: '📦' };
    const categoryNames = { food: '餐饮', transport: '交通', shopping: '购物', bill: '账单', health: '医疗', other: '其他' };
    
    let html = '';
    expenses.slice(0, 20).forEach(e => {
        html += '<div style="display:flex;justify-content:space-between;align-items:center;padding:12px 16px;border-bottom:1px solid var(--border);">' +
                '<div style="display:flex;align-items:center;gap:10px;">' +
                '<span style="font-size:20px;">' + (categoryIcons[e.category] || '📦') + '</span>' +
                '<div><div style="font-weight:600;">' + e.item + '</div>' +
                '<div style="font-size:12px;color:var(--text-muted);">' + e.date + ' · ' + (categoryNames[e.category] || '其他') + '</div></div></div>' +
                '<div style="display:flex;align-items:center;gap:12px;">' +
                '<span style="font-weight:700;color:var(--primary);">-$' + e.amount.toFixed(2) + '</span>' +
                '<button onclick="deleteExpense(' + e.id + ')" style="background:none;border:none;color:var(--danger);cursor:pointer;font-size:16px;">✕</button></div></div>';
    });
    
    container.innerHTML = html;
}

function deleteExpense(id) {
    let expenses = JSON.parse(localStorage.getItem('toolku_expenses') || '[]');
    expenses = expenses.filter(e => e.id !== id);
    localStorage.setItem('toolku_expenses', JSON.stringify(expenses));
    renderExpenses();
}

// 页面加载时渲染支出记录
document.addEventListener('DOMContentLoaded', function() {
    if (document.getElementById('expense-list')) {
        renderExpenses();
    }
    if (document.getElementById('checklist-items')) {
        updateChecklistProgress();
    }
});

// 重置清单
function resetChecklist() {
    document.querySelectorAll('#checklist-items li input[type="checkbox"]').forEach(cb => {
        cb.checked = false;
        cb.closest('li').classList.remove('checked');
    });
    updateChecklistProgress();
}
