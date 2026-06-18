const STORAGE_KEY = 'financeOSV13';

const categories = [
  { name: 'خوراک و خانه', limit: 0.22 },
  { name: 'حمل‌ونقل', limit: 0.07 },
  { name: 'قبوض و اینترنت', limit: 0.04 },
  { name: 'درمان', limit: 0.05 },
  { name: 'تفریح', limit: 0.05 },
  { name: 'آموزش', limit: 0.08 },
  { name: 'خرید شخصی', limit: 0.05 },
  { name: 'سرمایه‌گذاری', limit: 0.20 },
  { name: 'قسط و بدهی', limit: 0.30 },
  { name: 'هدف مالی', limit: 0.20 },
  { name: 'سایر', limit: 0.05 }
];

const currentPeriod = () => new Date().toISOString().slice(0, 7);
const uid = () => Date.now().toString(36) + Math.random().toString(36).slice(2, 7);
const $ = (id) => document.getElementById(id);
const fmt = (number) => Math.round(Number(number) || 0).toLocaleString('fa-IR');

const demoPeriod = currentPeriod();

const initialData = {
  activePeriod: demoPeriod,
  periods: {
    [demoPeriod]: {
      baseIncome: { myIncome: 75000000, spouseIncome: 20000000 },
      accounts: [
        { id: uid(), name: 'حساب درآمد', type: 'Bank', balance: 0, currency: 'IRR' },
        { id: uid(), name: 'صندوق اضطراری', type: 'Emergency Fund', balance: 0, currency: 'IRR' },
        { id: uid(), name: 'سرمایه‌گذاری', type: 'Investment', balance: 0, currency: 'IRR' },
        { id: uid(), name: 'Lumentra Fund', type: 'Business Fund', balance: 0, currency: 'IRR' }
      ],
      transactions: [],
      assets: [],
      liabilities: [
        { id: uid(), name: 'مجموع اقساط فعلی', balance: 0, monthlyPayment: 37000000, remainingMonths: 0 }
      ],
      goals: [
        { id: uid(), name: 'Emergency Fund', category: 'Emergency Fund', target: 256500000, current: 0, monthlyContribution: 5000000, priority: 'High', status: 'Active' },
        { id: uid(), name: 'Germany Migration', category: 'Germany Migration', target: 500000000, current: 0, monthlyContribution: 10000000, priority: 'High', status: 'Active' },
        { id: uid(), name: 'Lumentra Fund', category: 'Lumentra Fund', target: 100000000, current: 0, monthlyContribution: 5000000, priority: 'Medium', status: 'Active' }
      ]
    }
  }
};

let data = JSON.parse(localStorage.getItem(STORAGE_KEY) || 'null') || initialData;

function save() { localStorage.setItem(STORAGE_KEY, JSON.stringify(data)); }

function getPeriodData() {
  if (!data.periods[data.activePeriod]) {
    const lastKey = Object.keys(data.periods).sort().pop();
    const previous = data.periods[lastKey] || initialData.periods[demoPeriod];
    data.periods[data.activePeriod] = {
      baseIncome: JSON.parse(JSON.stringify(previous.baseIncome || { myIncome: 0, spouseIncome: 0 })),
      accounts: JSON.parse(JSON.stringify(previous.accounts || [])),
      transactions: [],
      assets: JSON.parse(JSON.stringify(previous.assets || [])),
      liabilities: JSON.parse(JSON.stringify(previous.liabilities || [])),
      goals: JSON.parse(JSON.stringify(previous.goals || []))
    };
    save();
  }
  if (!data.periods[data.activePeriod].goals) data.periods[data.activePeriod].goals = [];
  return data.periods[data.activePeriod];
}

function baseIncome() {
  const p = getPeriodData();
  return Number(p.baseIncome.myIncome || 0) + Number(p.baseIncome.spouseIncome || 0);
}

function transactionIncome() {
  return getPeriodData().transactions
    .filter(tx => tx.type === 'Income')
    .reduce((sum, tx) => sum + Number(tx.amount || 0), 0);
}

function totalIncome() { return baseIncome() + transactionIncome(); }

function totalExpenses() {
  return getPeriodData().transactions
    .filter(tx => ['Expense', 'Loan Payment', 'Goal Contribution'].includes(tx.type))
    .reduce((sum, tx) => sum + Number(tx.amount || 0), 0);
}

function investmentAmount() {
  return getPeriodData().transactions
    .filter(tx => ['Investment', 'Goal Contribution'].includes(tx.type) || tx.category === 'سرمایه‌گذاری')
    .reduce((sum, tx) => sum + Number(tx.amount || 0), 0);
}

function goalContributionAmount() {
  return getPeriodData().transactions
    .filter(tx => tx.type === 'Goal Contribution' || tx.category === 'هدف مالی')
    .reduce((sum, tx) => sum + Number(tx.amount || 0), 0);
}

function totalDebtPayment() {
  const fromLiabilities = getPeriodData().liabilities.reduce((sum, l) => sum + Number(l.monthlyPayment || 0), 0);
  const txPayments = getPeriodData().transactions
    .filter(tx => tx.type === 'Loan Payment')
    .reduce((sum, tx) => sum + Number(tx.amount || 0), 0);
  return Math.max(fromLiabilities, txPayments);
}

function totalAssets() {
  const p = getPeriodData();
  const accounts = p.accounts.reduce((sum, a) => sum + Number(a.balance || 0), 0);
  const assets = p.assets.reduce((sum, a) => sum + Number(a.value || 0), 0);
  return accounts + assets;
}

function totalLiabilities() {
  return getPeriodData().liabilities.reduce((sum, l) => sum + Number(l.balance || 0), 0);
}

function netWorth() { return totalAssets() - totalLiabilities(); }

function updateAccountBalance(accountId, amount) {
  const acc = getPeriodData().accounts.find(a => a.id === accountId);
  if (acc) acc.balance = Number(acc.balance || 0) + Number(amount || 0);
}

function emergencyFundBalance() {
  const p = getPeriodData();
  const emergencyAccounts = p.accounts
    .filter(a => a.type === 'Emergency Fund' || a.name.includes('اضطراری') || a.name.toLowerCase().includes('emergency'))
    .reduce((sum, a) => sum + Number(a.balance || 0), 0);
  const emergencyGoal = p.goals.find(g => g.category === 'Emergency Fund');
  return Math.max(emergencyAccounts, Number(emergencyGoal?.current || 0));
}

function essentialExpensesTarget() {
  const income = totalIncome();
  return income * 0.45;
}

function emergencyTarget() { return essentialExpensesTarget() * 6; }

function averageGoalsProgress() {
  const goals = getPeriodData().goals || [];
  if (!goals.length) return 0;
  const total = goals.reduce((sum, g) => sum + Math.min(100, goalProgress(g)), 0);
  return total / goals.length;
}

function goalProgress(goal) {
  return goal.target ? (Number(goal.current || 0) / Number(goal.target)) * 100 : 0;
}

function goalEta(goal) {
  const remaining = Number(goal.target || 0) - Number(goal.current || 0);
  const monthly = Number(goal.monthlyContribution || 0);
  if (remaining <= 0) return 'تکمیل شده';
  if (!monthly) return 'نامشخص';
  return `${Math.ceil(remaining / monthly)} ماه`;
}

function categoryTotals() {
  const totals = {};
  getPeriodData().transactions
    .filter(tx => ['Expense', 'Loan Payment', 'Goal Contribution'].includes(tx.type))
    .forEach(tx => {
      totals[tx.category] = (totals[tx.category] || 0) + Number(tx.amount || 0);
    });
  return totals;
}

function calculateBudget(income, debtPayment) {
  const debtRatio = income ? debtPayment / income : 0;

  if (debtRatio <= 0.3) {
    return [
      ['هزینه‌های ضروری زندگی', 'living', 0.35],
      ['اقساط و تعهدات مالی', 'debt', debtRatio],
      ['سرمایه‌گذاری و حفظ ارزش پول', 'invest', 0.20],
      ['صندوق اضطراری', 'emergency', 0.10],
      ['آموزش و رشد فردی', 'skills', 0.10],
      ['اهداف مالی', 'goals', 0.10],
      ['تفریح و کیفیت زندگی', 'fun', 0.05]
    ];
  }

  const available = Math.max(0, 1 - debtRatio);
  const weights = {
    living: 0.58,
    invest: 0.14,
    emergency: 0.10,
    skills: 0.06,
    goals: 0.07,
    business: 0.03,
    fun: 0.02
  };

  const labels = {
    living: 'هزینه‌های ضروری زندگی',
    invest: 'سرمایه‌گذاری و حفظ ارزش پول',
    emergency: 'صندوق اضطراری',
    skills: 'آموزش و رشد فردی',
    goals: 'اهداف مالی',
    business: 'بودجه کسب‌وکار',
    fun: 'تفریح و کیفیت زندگی'
  };

  const model = Object.entries(weights).map(([key, value]) => [labels[key], key, available * value]);
  model.splice(1, 0, ['اقساط و تعهدات مالی', 'debt', debtRatio]);
  return model;
}

function financialHealthScore() {
  const income = totalIncome();
  const debtRatio = income ? totalDebtPayment() / income : 0;
  const emergencyProgress = emergencyTarget() ? Math.min(1, emergencyFundBalance() / emergencyTarget()) : 0;
  const savingRate = income ? (goalContributionAmount() + investmentAmount()) / income : 0;
  const investRate = income ? investmentAmount() / income : 0;
  const nw = netWorth();
  const expenses = totalExpenses();
  const budgetDiscipline = income ? Math.max(0, 1 - Math.max(0, expenses - income * 0.7) / (income * 0.7)) : 0;

  const debtScore = debtRatio <= 0.3 ? 25 : debtRatio <= 0.4 ? 15 : debtRatio <= 0.5 ? 8 : 0;
  const emergencyScore = emergencyProgress * 20;
  const savingScore = Math.min(1, savingRate / 0.2) * 20;
  const investmentScore = Math.min(1, investRate / 0.15) * 15;
  const netWorthScore = nw > 0 ? 10 : 0;
  const disciplineScore = budgetDiscipline * 10;

  const total = Math.round(debtScore + emergencyScore + savingScore + investmentScore + netWorthScore + disciplineScore);

  return {
    total,
    status: total >= 90 ? 'Excellent' : total >= 75 ? 'Good' : total >= 60 ? 'Fair' : 'Critical',
    parts: {
      debtScore: Math.round(debtScore),
      emergencyScore: Math.round(emergencyScore),
      savingScore: Math.round(savingScore),
      investmentScore: Math.round(investmentScore),
      netWorthScore: Math.round(netWorthScore),
      disciplineScore: Math.round(disciplineScore)
    }
  };
}

function renderSelects() {
  const p = getPeriodData();
  const accountOptions = ['<option value="">انتخاب نشده</option>']
    .concat(p.accounts.map(a => `<option value="${a.id}">${a.name}</option>`))
    .join('');

  $('txFrom').innerHTML = accountOptions;
  $('txTo').innerHTML = accountOptions;
  $('txCategory').innerHTML = categories.map(c => `<option>${c.name}</option>`).join('');
}

function renderAccounts() {
  const p = getPeriodData();
  $('accountList').innerHTML = p.accounts.map((a, i) => `
    <tr>
      <td>${a.name}</td>
      <td>${a.type}</td>
      <td>${fmt(a.balance)} ${a.currency}</td>
      <td><button class="danger" onclick="deleteAccount(${i})">حذف</button></td>
    </tr>
  `).join('');
}

function renderTransactions() {
  const p = getPeriodData();
  $('txList').innerHTML = p.transactions.slice().reverse().map((tx, idx) => {
    const realIndex = p.transactions.length - 1 - idx;
    return `
      <tr>
        <td>${tx.type}</td>
        <td>${tx.category}</td>
        <td>${fmt(tx.amount)}</td>
        <td>${tx.note || '-'}</td>
        <td><button class="danger" onclick="deleteTransaction(${realIndex})">حذف</button></td>
      </tr>
    `;
  }).join('');
}

function renderAssets() {
  const p = getPeriodData();
  $('assetList').innerHTML = p.assets.map((a, i) => `
    <tr>
      <td>${a.name}</td>
      <td>${a.type}</td>
      <td>${fmt(a.value)}</td>
      <td><button class="danger" onclick="deleteAsset(${i})">حذف</button></td>
    </tr>
  `).join('');
}

function renderLiabilities() {
  const p = getPeriodData();
  $('liabilityList').innerHTML = p.liabilities.map((l, i) => `
    <tr>
      <td>${l.name}</td>
      <td>${fmt(l.balance)}</td>
      <td>${fmt(l.monthlyPayment)}</td>
      <td><button class="danger" onclick="deleteLiability(${i})">حذف</button></td>
    </tr>
  `).join('');
}

function renderGoals() {
  const p = getPeriodData();
  $('goalCards').innerHTML = (p.goals || []).map((g, i) => {
    const progress = Math.min(100, goalProgress(g));
    const remaining = Math.max(0, Number(g.target || 0) - Number(g.current || 0));
    return `
      <div class="goal-card">
        <div class="goal-header">
          <div>
            <strong>${g.name}</strong>
            <small>${g.category} • ${g.priority}</small>
          </div>
          <button class="danger" onclick="deleteGoal(${i})">حذف</button>
        </div>
        <div class="progress big"><div class="bar" style="width:${progress}%"></div></div>
        <div class="goal-meta">
          <span>هدف: ${fmt(g.target)}</span>
          <span>فعلی: ${fmt(g.current)}</span>
          <span>مانده: ${fmt(remaining)}</span>
          <span>پیشرفت: ${progress.toFixed(1)}٪</span>
          <span>ETA: ${goalEta(g)}</span>
        </div>
      </div>
    `;
  }).join('');
}

function renderAllocation(income, debtPayment) {
  const budget = calculateBudget(income, debtPayment);
  $('allocation').innerHTML = budget.map(([label, key, ratio]) => {
    const amount = key === 'debt' ? debtPayment : income * ratio;
    const percent = income ? (amount / income) * 100 : 0;
    return `
      <div class="allocation-item">
        <div style="display:flex;justify-content:space-between;gap:8px">
          <span>${label}</span>
          <strong>${fmt(amount)} تومان</strong>
        </div>
        <div class="progress"><div class="bar" style="width:${Math.min(100, percent)}%"></div></div>
        <small>${percent.toFixed(1)}٪ از درآمد</small>
      </div>
    `;
  }).join('');
}

function renderEmergencyTracker() {
  const target = emergencyTarget();
  const current = emergencyFundBalance();
  const progress = target ? Math.min(100, current / target * 100) : 0;
  $('emergencyTracker').innerHTML = `
    <div class="score-circle">${progress.toFixed(0)}٪</div>
    <div class="progress big"><div class="bar" style="width:${progress}%"></div></div>
    <p class="note">
      <b>هدف صندوق اضطراری:</b> ${fmt(target)} تومان<br>
      <b>موجودی فعلی:</b> ${fmt(current)} تومان<br>
      <b>مانده تا هدف:</b> ${fmt(Math.max(0, target - current))} تومان<br>
      هدف بر اساس ۶ ماه هزینه ضروری زندگی محاسبه شده است.
    </p>
  `;
}

function renderHealthBreakdown() {
  const score = financialHealthScore();
  const p = score.parts;
  const rows = [
    ['Debt Ratio', p.debtScore, 25],
    ['Emergency Fund', p.emergencyScore, 20],
    ['Saving Rate', p.savingScore, 20],
    ['Investment Rate', p.investmentScore, 15],
    ['Net Worth', p.netWorthScore, 10],
    ['Budget Discipline', p.disciplineScore, 10]
  ];
  $('healthBreakdown').innerHTML = `
    <div class="health-main">
      <div class="score-circle">${score.total}</div>
      <div>
        <strong>${score.status}</strong>
        <p class="note">امتیاز سلامت مالی از ۱۰۰</p>
      </div>
    </div>
    ${rows.map(([label, value, max]) => `
      <div class="category-line">
        <div class="category-line-header"><span>${label}</span><strong>${value}/${max}</strong></div>
        <div class="progress"><div class="bar" style="width:${(value/max)*100}%"></div></div>
      </div>
    `).join('')}
  `;
}

function renderAdvice(income, debtPayment, expenses) {
  const debtRatio = income ? debtPayment / income : 0;
  const totals = categoryTotals();
  const alerts = [];
  const score = financialHealthScore();

  alerts.push([score.total < 60 ? 'badbg' : score.total < 75 ? 'warnbg' : 'goodbg', `Financial Health Score: ${score.total}/100 — وضعیت: ${score.status}`]);

  if (debtRatio > 0.4) {
    alerts.push(['badbg', 'اولویت ۱: نسبت اقساط بسیار پرریسک است. خرید اقساطی جدید ممنوع و باید برای کاهش یا تجمیع اقساط برنامه‌ریزی شود.']);
  } else if (debtRatio > 0.3) {
    alerts.push(['warnbg', `اولویت ۱: نسبت اقساط بالاتر از محدوده امن است. سقف امن فعلی حدود ${fmt(income * 0.3)} تومان است.`]);
  } else {
    alerts.push(['goodbg', 'نسبت اقساط در محدوده قابل قبول است. می‌توان سهم سرمایه‌گذاری و اهداف مالی را تقویت کرد.']);
  }

  const emergencyProgress = emergencyTarget() ? emergencyFundBalance() / emergencyTarget() : 0;
  if (emergencyProgress < 0.25) {
    alerts.push(['warnbg', 'اولویت ۲: صندوق اضطراری ضعیف است. حتی اگر مبلغ کم باشد، هر ماه یک واریزی ثابت به Emergency Fund انجام بده.']);
  }

  if (goalContributionAmount() < income * 0.05) {
    alerts.push(['warnbg', 'اولویت ۳: سهم اهداف مالی پایین است. برای Germany Migration یا Lumentra Fund حداقل ۵٪ درآمد را جدا کن.']);
  }

  categories.forEach(cat => {
    const spent = totals[cat.name] || 0;
    const limitAmount = income * cat.limit;
    if (spent > limitAmount && spent > 0) {
      alerts.push(['warnbg', `هزینه «${cat.name}» بالاتر از سقف پیشنهادی است. سقف: ${fmt(limitAmount)}، هزینه فعلی: ${fmt(spent)} تومان.`]);
    }
  });

  if (netWorth() < 0) {
    alerts.push(['badbg', 'دارایی خالص منفی است. تمرکز اصلی باید کاهش بدهی و جلوگیری از خرید اقساطی جدید باشد.']);
  } else {
    alerts.push(['goodbg', `دارایی خالص فعلی: ${fmt(netWorth())} تومان. این عدد را ماه‌به‌ماه پیگیری کن.`]);
  }

  $('advice').innerHTML = alerts.map(([type, text]) => `<div class="alert ${type}">${text}</div>`).join('');
}

function renderSnapshot(income, debtPayment, expenses) {
  const safeDebt = income * 0.3;
  const debtGap = Math.max(0, debtPayment - safeDebt);
  $('snapshot').innerHTML = `
    <b>Total Assets:</b> ${fmt(totalAssets())} تومان<br>
    <b>Total Liabilities:</b> ${fmt(totalLiabilities())} تومان<br>
    <b>Net Worth:</b> ${fmt(netWorth())} تومان<br>
    <b>Monthly Income:</b> ${fmt(income)} تومان<br>
    <b>Monthly Expenses:</b> ${fmt(expenses)} تومان<br>
    <b>Monthly Debt Payment:</b> ${fmt(debtPayment)} تومان<br>
    <b>Safe Debt Payment:</b> ${fmt(safeDebt)} تومان<br>
    <b>Debt Gap:</b> ${fmt(debtGap)} تومان<br>
    <b>Average Goals Progress:</b> ${averageGoalsProgress().toFixed(1)}٪
  `;
}

function renderCategoryReport(income) {
  const totals = categoryTotals();
  $('categoryReport').innerHTML = categories.map(cat => {
    const spent = totals[cat.name] || 0;
    const percent = income ? spent / income * 100 : 0;
    return `
      <div class="category-line">
        <div class="category-line-header">
          <span>${cat.name}</span>
          <strong>${fmt(spent)} تومان</strong>
        </div>
        <div class="progress"><div class="bar" style="width:${Math.min(100, percent)}%"></div></div>
        <small>${percent.toFixed(1)}٪ از درآمد</small>
      </div>
    `;
  }).join('');
}

function renderChart(income) {
  const canvas = $('expenseChart');
  const ctx = canvas.getContext('2d');
  const totals = categoryTotals();
  const labels = categories.map(c => c.name);
  const values = labels.map(label => totals[label] || 0);
  const max = Math.max(...values, income * 0.05, 1);

  ctx.clearRect(0, 0, canvas.width, canvas.height);
  ctx.font = '14px Tahoma';
  ctx.fillStyle = '#f5f7fb';
  ctx.fillText('Expense by Category', 390, 28);

  const chartX = 40;
  const chartY = 50;
  const barHeight = 15;
  const gap = 8;
  const maxWidth = 300;

  labels.forEach((label, i) => {
    const y = chartY + i * (barHeight + gap);
    const width = (values[i] / max) * maxWidth;
    ctx.fillStyle = '#a6adbb';
    ctx.fillText(label, 450, y + 12);
    const grad = ctx.createLinearGradient(chartX, y, chartX + maxWidth, y);
    grad.addColorStop(0, '#8b5cf6');
    grad.addColorStop(1, '#3b82f6');
    ctx.fillStyle = '#1f2430';
    ctx.fillRect(chartX, y, maxWidth, barHeight);
    ctx.fillStyle = grad;
    ctx.fillRect(chartX, y, width, barHeight);
    ctx.fillStyle = '#f5f7fb';
    ctx.fillText(fmt(values[i]), chartX + maxWidth + 12, y + 12);
  });
}

function render() {
  const p = getPeriodData();
  const income = totalIncome();
  const expenses = totalExpenses();
  const debtPayment = totalDebtPayment();
  const debtRatio = income ? debtPayment / income : 0;
  const score = financialHealthScore();

  $('periodInput').value = data.activePeriod;
  $('myIncome').value = p.baseIncome.myIncome;
  $('spouseIncome').value = p.baseIncome.spouseIncome;

  $('kpiIncome').textContent = fmt(income);
  $('kpiExpense').textContent = fmt(expenses);
  $('kpiNetWorth').textContent = fmt(netWorth());
  $('kpiDebtRatio').textContent = `${(debtRatio * 100).toFixed(1)}٪`;
  $('kpiDebtAmount').textContent = `اقساط: ${fmt(debtPayment)} تومان`;
  $('kpiHealthScore').textContent = `${score.total}/100`;
  $('kpiHealthStatus').textContent = score.status;
  $('kpiGoalsProgress').textContent = `${averageGoalsProgress().toFixed(1)}٪`;

  $('kpiDebtRatio').className = debtRatio > 0.4 ? 'bad' : debtRatio > 0.3 ? 'warn' : 'good';
  $('kpiNetWorth').className = netWorth() < 0 ? 'bad' : 'good';
  $('kpiHealthScore').className = score.total < 60 ? 'bad' : score.total < 75 ? 'warn' : 'good';

  renderSelects();
  renderAccounts();
  renderTransactions();
  renderAssets();
  renderLiabilities();
  renderGoals();
  renderAllocation(income, debtPayment);
  renderEmergencyTracker();
  renderHealthBreakdown();
  renderAdvice(income, debtPayment, expenses);
  renderSnapshot(income, debtPayment, expenses);
  renderCategoryReport(income);
  renderChart(income);
}

function changePeriod() {
  data.activePeriod = $('periodInput').value || currentPeriod();
  getPeriodData();
  save();
  render();
}

function saveIncome() {
  const p = getPeriodData();
  p.baseIncome.myIncome = Number($('myIncome').value) || 0;
  p.baseIncome.spouseIncome = Number($('spouseIncome').value) || 0;
  save();
  render();
}

function addAccount() {
  const p = getPeriodData();
  const name = $('accountName').value.trim();
  const balance = Number($('accountBalance').value) || 0;
  if (!name) return alert('نام حساب را وارد کن.');
  p.accounts.push({ id: uid(), name, type: $('accountType').value, balance, currency: $('accountCurrency').value });
  $('accountName').value = '';
  $('accountBalance').value = '';
  save();
  render();
}

function deleteAccount(index) {
  if (!confirm('حساب حذف شود؟ تراکنش‌های قبلی پاک نمی‌شوند.')) return;
  getPeriodData().accounts.splice(index, 1);
  save();
  render();
}

function addTransaction() {
  const p = getPeriodData();
  const type = $('txType').value;
  const from = $('txFrom').value;
  const to = $('txTo').value;
  const amount = Number($('txAmount').value) || 0;
  const category = $('txCategory').value;
  const note = $('txNote').value.trim();
  if (!amount) return alert('مبلغ تراکنش را وارد کن.');

  if (type === 'Income' && to) updateAccountBalance(to, amount);
  if (['Expense', 'Investment', 'Loan Payment', 'Goal Contribution'].includes(type) && from) updateAccountBalance(from, -amount);
  if (type === 'Transfer') {
    if (!from || !to) return alert('برای انتقال، حساب مبدا و مقصد را انتخاب کن.');
    updateAccountBalance(from, -amount);
    updateAccountBalance(to, amount);
  }
  if (['Investment', 'Goal Contribution'].includes(type) && to) updateAccountBalance(to, amount);

  p.transactions.push({ id: uid(), type, from, to, amount, category, note, date: new Date().toISOString().slice(0, 10) });
  $('txAmount').value = '';
  $('txNote').value = '';
  save();
  render();
}

function deleteTransaction(index) {
  getPeriodData().transactions.splice(index, 1);
  save();
  render();
}

function addAsset() {
  const p = getPeriodData();
  const name = $('assetName').value.trim();
  const value = Number($('assetValue').value) || 0;
  if (!name || !value) return alert('نام و ارزش دارایی را وارد کن.');
  p.assets.push({ id: uid(), name, type: $('assetType').value, value, note: $('assetNote').value.trim() });
  $('assetName').value = '';
  $('assetValue').value = '';
  $('assetNote').value = '';
  save();
  render();
}

function deleteAsset(index) {
  getPeriodData().assets.splice(index, 1);
  save();
  render();
}

function addLiability() {
  const p = getPeriodData();
  const name = $('liabilityName').value.trim();
  const balance = Number($('liabilityBalance').value) || 0;
  const monthlyPayment = Number($('liabilityPayment').value) || 0;
  const remainingMonths = Number($('liabilityMonths').value) || 0;
  if (!name || !monthlyPayment) return alert('عنوان و قسط ماهانه را وارد کن.');
  p.liabilities.push({ id: uid(), name, balance, monthlyPayment, remainingMonths });
  $('liabilityName').value = '';
  $('liabilityBalance').value = '';
  $('liabilityPayment').value = '';
  $('liabilityMonths').value = '';
  save();
  render();
}

function deleteLiability(index) {
  getPeriodData().liabilities.splice(index, 1);
  save();
  render();
}

function addGoal() {
  const p = getPeriodData();
  const name = $('goalName').value.trim();
  const target = Number($('goalTarget').value) || 0;
  const current = Number($('goalCurrent').value) || 0;
  const monthlyContribution = Number($('goalMonthly').value) || 0;
  if (!name || !target) return alert('نام و مبلغ هدف را وارد کن.');

  p.goals.push({
    id: uid(),
    name,
    category: $('goalCategory').value,
    target,
    current,
    monthlyContribution,
    priority: $('goalPriority').value,
    status: 'Active'
  });

  $('goalName').value = '';
  $('goalTarget').value = '';
  $('goalCurrent').value = '';
  $('goalMonthly').value = '';
  save();
  render();
}

function deleteGoal(index) {
  getPeriodData().goals.splice(index, 1);
  save();
  render();
}

function exportData() { $('dataBox').value = JSON.stringify(data, null, 2); }

function importData() {
  try {
    const imported = JSON.parse($('dataBox').value);
    if (!imported || typeof imported !== 'object') throw new Error();
    data = imported;
    save();
    render();
    alert('اطلاعات با موفقیت وارد شد.');
  } catch {
    alert('فرمت JSON معتبر نیست.');
  }
}

function resetData() {
  if (confirm('همه اطلاعات پاک و تنظیمات اولیه برگردد؟')) {
    data = initialData;
    save();
    render();
  }
}

$('periodInput').addEventListener('change', changePeriod);
$('saveIncomeBtn').addEventListener('click', saveIncome);
$('addAccountBtn').addEventListener('click', addAccount);
$('addTxBtn').addEventListener('click', addTransaction);
$('addAssetBtn').addEventListener('click', addAsset);
$('addLiabilityBtn').addEventListener('click', addLiability);
$('addGoalBtn').addEventListener('click', addGoal);
$('exportBtn').addEventListener('click', exportData);
$('importBtn').addEventListener('click', importData);
$('resetBtn').addEventListener('click', resetData);

render();
