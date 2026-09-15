// Main app controller
class FinancialPlanningApp {
    constructor() {
        this.currentView = 'dashboard';
        this.currentRMName = storage.getCurrentRMName();
        this.currentPlanId = null;
        this.currentPlan = null;
        this.init();
    }

    init() {
        this.render();
        window.addEventListener('hashchange', () => this.handleNavigation());
    }

    handleNavigation() {
        const hash = window.location.hash.substr(1);
        if (hash.startsWith('builder/')) {
            this.currentPlanId = hash.split('/')[1];
            this.currentView = 'builder';
        } else {
            this.currentView = 'dashboard';
            this.currentPlanId = null;
        }
        this.render();
    }

    render() {
        const app = document.getElementById('app');
        
        if (this.currentView === 'dashboard') {
            app.innerHTML = this.renderDashboard();
            this.attachDashboardEvents();
        } else if (this.currentView === 'builder') {
            this.currentPlan = storage.getPlan(this.currentPlanId);
            if (!this.currentPlan) {
                this.currentView = 'dashboard';
                window.location.hash = '';
                this.render();
                return;
            }
            app.innerHTML = this.renderBuilder();
            this.attachBuilderEvents();
        }
    }

    renderDashboard() {
        const plans = this.currentRMName ? storage.getPlans(this.currentRMName) : [];
        
        return `
            <div class="dashboard-header">
                <div class="container">
                    <div class="dashboard-header-content">
                        <div class="logo"></div>
                        <div class="header-title">
                            <div class="header-title-brand">SLA Finserv Private Limited</div>
                            <h1 class="header-title-main">Financial Plan Dashboard</h1>
                        </div>
                    </div>
                </div>
            </div>

            <div class="container">
                <!-- RM Selector -->
                <div class="card" style="margin-bottom: 24px;">
                    <div style="margin-bottom: 16px;">
                        <label class="form-label">Your Name (RM)</label>
                        <div class="add-rm-group">
                            <input type="text" id="rmNameInput" placeholder="Enter your name" style="flex: 1;">
                            <button class="btn btn-primary btn-small" onclick="app.setRMName()">Set Name</button>
                        </div>
                    </div>
                    ${this.currentRMName ? `
                        <div style="padding: 12px; background: #F6F4EF; border-radius: 3px; font-size: 13px; color: #6B6558;">
                            <strong>Currently logged in as:</strong> ${this.currentRMName}
                        </div>
                    ` : ''}
                </div>

                <!-- Controls -->
                <div class="controls">
                    <button class="btn btn-primary" ${!this.currentRMName ? 'disabled' : ''} onclick="app.newPlan()">
                        + New Client Plan
                    </button>
                    <button class="btn btn-secondary" onclick="app.exportPlans()">
                        Export Plans (JSON)
                    </button>
                </div>

                <!-- Plans Table -->
                ${!this.currentRMName ? `
                    <div class="card" style="text-align: center; padding: 60px 40px;">
                        <p class="text-muted">Enter your name above to get started.</p>
                    </div>
                ` : plans.length === 0 ? `
                    <div class="card" style="text-align: center; padding: 60px 40px;">
                        <p class="text-muted">No client plans yet. Click "+ New Client Plan" to start one.</p>
                    </div>
                ` : `
                    <table class="table">
                        <thead>
                            <tr>
                                <th style="width: 50%;">Client</th>
                                <th style="width: 30%;">Last edited</th>
                                <th style="width: 20%;">Action</th>
                            </tr>
                        </thead>
                        <tbody>
                            ${plans.map(plan => `
                                <tr onclick="app.openPlan('${plan.id}')">
                                    <td style="font-weight: 600; color: #151B2E;">${plan.clientName}</td>
                                    <td>${new Date(plan.updatedAt).toLocaleDateString()}</td>
                                    <td>
                                        <button class="btn btn-delete" onclick="event.stopPropagation(); app.deletePlan('${plan.id}')">
                                            Delete
                                        </button>
                                    </td>
                                </tr>
                            `).join('')}
                        </tbody>
                    </table>
                `}
            </div>
        `;
    }

    renderBuilder() {
        const plan = this.currentPlan;
        const totalAssets = plan.assets.reduce((sum, a) => sum + (a.value || 0), 0);
        const totalDebts = plan.debts.reduce((sum, d) => sum + (d.outstanding || 0), 0);
        const totalEmi = plan.debts.reduce((sum, d) => sum + (d.monthlyEmi || 0), 0);
        const emergencyFundTarget = getEmergencyFundTarget(plan.monthlyIncome || 0);

        return `
            <div class="builder-layout">
                <!-- Sidebar -->
                <div class="sidebar">
                    <div class="sidebar-header">
                        <div class="logo" style="width: 32px; height: 32px; margin-bottom: 12px;"></div>
                        <div class="sidebar-title-brand">SLA Finserv Private Limited</div>
                        <h2 class="sidebar-title">Financial Plan Builder</h2>
                    </div>

                    <div class="sidebar-buttons">
                        <button class="btn btn-secondary btn-small" onclick="app.backToDashboard()">← Back</button>
                        <button class="btn btn-success btn-small" onclick="app.savePlan()">Save</button>
                        <button class="btn btn-primary btn-small" onclick="window.print()">PDF</button>
                        <button class="btn btn-secondary btn-small" onclick="app.clearData()">Clear</button>
                    </div>

                    <!-- Client Profile Card -->
                    <div class="card">
                        <div class="card-title">Client Profile</div>
                        
                        <div class="form-group">
                            <label class="form-label">Client Name</label>
                            <input type="text" value="${plan.clientName}" onchange="app.updatePlan({clientName: this.value})" oninput="app.plan.clientName = this.value; app.renderReport()">
                        </div>

                        <div class="form-row">
                            <div class="form-group">
                                <label class="form-label">Current Age</label>
                                <input type="text" inputmode="decimal" value="${plan.currentAge ?? ''}" onchange="app.updatePlan({currentAge: parseDecimal(this.value)})" oninput="app.plan.currentAge = parseInt(this.value) || 0; app.renderReport()">
                            </div>
                            <div class="form-group">
                                <label class="form-label">Retirement Age</label>
                                <input type="text" inputmode="decimal" value="${plan.retirementAge ?? ''}" onchange="app.updatePlan({retirementAge: parseDecimal(this.value)})" oninput="app.plan.retirementAge = parseInt(this.value) || 0; app.renderReport()">
                            </div>
                        </div>

                        <div class="form-row">
                            <div class="form-group">
                                <label class="form-label">Dependents</label>
                                <input type="text" inputmode="decimal" value="${plan.dependents ?? ''}" onchange="app.updatePlan({dependents: parseDecimal(this.value)})" oninput="app.plan.dependents = parseInt(this.value) || 0; app.renderReport()">
                            </div>
                            <div class="form-group">
                                <label class="form-label">Monthly Income (₹)</label>
                                <input type="text" inputmode="decimal" value="${plan.monthlyIncome ?? ''}" onchange="app.updatePlan({monthlyIncome: parseDecimal(this.value)})" oninput="app.plan.monthlyIncome = parseInt(this.value.replace(/,/g, '')) || 0; app.renderReport()">
                            </div>
                        </div>

                        <div class="form-group">
                            <label class="form-label">Monthly Expenses (₹)</label>
                            <input type="text" inputmode="decimal" value="${plan.monthlyExpenses ?? ''}" onchange="app.updatePlan({monthlyExpenses: parseDecimal(this.value)})" oninput="app.plan.monthlyExpenses = parseInt(this.value.replace(/,/g, '')) || 0; app.renderReport()">
                        </div>
                    </div>

                    <!-- Goals Card -->
                    <div class="card">
                        <div class="card-title">Goals</div>
                        
                        ${plan.goals.map((goal, idx) => `
                            <div style="margin-bottom: 12px; padding-bottom: 12px; border-bottom: 1px solid #E4DFD2;">
                                <input type="text" value="${goal.name}" placeholder="Goal name" style="width: 100%; margin-bottom: 8px;" onchange="app.updateGoal(${idx}, {name: this.value})">
                                <div class="form-row">
                                    <input type="text" inputmode="decimal" value="${goal.targetYear}" placeholder="Target year" onchange="app.updateGoal(${idx}, {targetYear: parseInt(this.value)})">
                                    <input type="text" inputmode="decimal" value="${goal.targetAmount || ''}" placeholder="Target amount" onchange="app.updateGoal(${idx}, {targetAmount: parseDecimal(this.value)})">
                                </div>
                                <button class="btn btn-delete" onclick="app.removeGoal(${idx})">Remove</button>
                            </div>
                        `).join('')}
                        
                        <button class="btn btn-primary w-full" onclick="app.addGoal()">+ Add goal</button>
                    </div>

                    <!-- Risk Profile Card -->
                    <div class="card">
                        <div class="card-title">Risk Profile</div>
                        <div class="form-row">
                            ${['conservative', 'moderate', 'aggressive'].map(risk => `
                                <button class="btn ${plan.riskProfile === risk ? 'btn-primary' : 'btn-secondary'}" style="text-transform: capitalize;" onclick="app.updatePlan({riskProfile: '${risk}'})">
                                    ${risk}
                                </button>
                            `).join('')}
                        </div>
                    </div>

                    <!-- Insurance & Emergency Fund -->
                    <div class="card">
                        <div class="card-title">Insurance & Emergency</div>
                        
                        <div class="form-group">
                            <label class="form-label">Life Cover (₹)</label>
                            <input type="text" inputmode="decimal" value="${plan.insuranceLife || ''}" onchange="app.updatePlan({insuranceLife: parseDecimal(this.value)})">
                        </div>

                        <div class="form-group">
                            <label class="form-label">Health Cover (₹)</label>
                            <input type="text" inputmode="decimal" value="${plan.insuranceHealth || ''}" onchange="app.updatePlan({insuranceHealth: parseDecimal(this.value)})">
                        </div>

                        <div class="form-group">
                            <label class="form-label">Emergency Fund (₹)</label>
                            <input type="text" inputmode="decimal" value="${plan.emergencyFundCurrent || ''}" onchange="app.updatePlan({emergencyFundCurrent: parseDecimal(this.value)})">
                            <p style="font-size: 12px; color: #6B6558; margin-top: 8px;">
                                Target (6× income): <strong>${formatIndianCurrency(emergencyFundTarget)}</strong>
                            </p>
                        </div>
                    </div>

                    <!-- Debts Card -->
                    <div class="card">
                        <div class="card-title">Debts</div>
                        
                        ${plan.debts.map((debt, idx) => `
                            <div style="margin-bottom: 12px; padding-bottom: 12px; border-bottom: 1px solid #E4DFD2;">
                                <input type="text" value="${debt.name}" placeholder="Loan name" style="width: 100%; margin-bottom: 8px;" onchange="app.updateDebt(${idx}, {name: this.value})">
                                <div class="form-row">
                                    <input type="text" inputmode="decimal" value="${debt.outstanding || ''}" placeholder="Outstanding (₹)" onchange="app.updateDebt(${idx}, {outstanding: parseDecimal(this.value)})">
                                    <input type="text" inputmode="decimal" value="${debt.monthlyEmi || ''}" placeholder="Monthly EMI (₹)" onchange="app.updateDebt(${idx}, {monthlyEmi: parseDecimal(this.value)})">
                                </div>
                                <button class="btn btn-delete" onclick="app.removeDebt(${idx})">Remove</button>
                            </div>
                        `).join('')}
                        
                        <button class="btn btn-primary w-full" onclick="app.addDebt()">+ Add debt</button>
                    </div>
                </div>

                <!-- Report Pane -->
                <div class="report-pane">
                    <div class="report-preview-info no-print">
                        Live preview — this is the PDF the client receives.
                    </div>

                    <div class="report-container">
                        ${this.renderReport(plan)}
                    </div>
                </div>
            </div>
        `;
    }

    renderReport(plan) {
        const totalAssets = plan.assets.reduce((sum, a) => sum + (a.value || 0), 0);
        const totalDebts = plan.debts.reduce((sum, d) => sum + (d.outstanding || 0), 0);
        const totalEmi = plan.debts.reduce((sum, d) => sum + (d.monthlyEmi || 0), 0);
        const netWorth = calculateNetWorth(totalAssets, totalDebts);
        const monthlySurplus = calculateMonthlySurplus(plan.monthlyIncome || 0, plan.monthlyExpenses || 0, totalEmi);
        const emiRatio = calculateEmiToIncomeRatio(totalEmi, plan.monthlyIncome || 0);
        const yearsToRetirement = (plan.retirementAge || 60) - (plan.currentAge || 30);
        const emergencyFundTarget = getEmergencyFundTarget(plan.monthlyIncome || 0);
        const recommendedLifeCover = getRecommendedLifeCover(plan.monthlyIncome || 0, totalDebts);
        const recommendedHealthCover = getRecommendedHealthCover(plan.dependents || 0);
        const requiredRetirementCorpus = getRequiredRetirementCorpus(plan.monthlyExpenses || 0, yearsToRetirement);

        return `
            <!-- PAGE 1 -->
            <div class="report-page">
                <div class="page-header">
                    <div style="display: flex; justify-content: space-between; align-items: flex-start;">
                        <div style="width: 52px; height: 52px; background: #1D2A4D; border-radius: 4px;"></div>
                        <div style="text-align: right;">
                            <div class="page-title">Personal Financial Plan</div>
                        </div>
                    </div>
                    <div class="page-date">${new Date().toLocaleDateString()}</div>
                </div>

                <div style="margin-bottom: 24px;">
                    <div class="form-label">Prepared for</div>
                    <h2 style="font-size: 30px; margin: 0 0 8px 0;">${plan.clientName}</h2>
                    <p style="font-size: 13px; color: #6B6558; margin: 0;">
                        Age ${plan.currentAge || 'N/A'} · Retiring at ${plan.retirementAge || 'N/A'} · ${plan.dependents || 0} dependents
                    </p>
                </div>

                <div class="stat-cards">
                    <div class="stat-card">
                        <div class="stat-label">Net Worth</div>
                        <div class="stat-value">${formatIndianCurrency(netWorth)}</div>
                    </div>
                    <div class="stat-card">
                        <div class="stat-label">Monthly Surplus</div>
                        <div class="stat-value">${formatIndianCurrency(monthlySurplus)}</div>
                    </div>
                    <div class="stat-card">
                        <div class="stat-label">Risk Profile</div>
                        <div class="stat-value" style="text-transform: capitalize;">${plan.riskProfile || 'N/A'}</div>
                    </div>
                </div>

                <div style="margin-bottom: 24px;">
                    <h4 style="margin-bottom: 12px;">Net Worth Summary</h4>
                    <table class="table">
                        <thead>
                            <tr>
                                <th style="width: 25%;">Assets</th>
                                <th style="width: 25%;">Value</th>
                                <th style="width: 25%;">Liabilities</th>
                                <th style="width: 25%;">Value</th>
                            </tr>
                        </thead>
                        <tbody>
                            ${plan.assets.map((asset, idx) => `
                                <tr>
                                    <td>${asset.name}</td>
                                    <td>${formatIndianCurrency(asset.value)}</td>
                                    <td>${idx === 0 ? 'Total Outstanding Debt' : ''}</td>
                                    <td>${idx === 0 ? formatIndianCurrency(totalDebts) : ''}</td>
                                </tr>
                            `).join('')}
                            <tr style="border-top: 1px solid #1D2A4D; font-weight: 600;">
                                <td>Total Assets</td>
                                <td>${formatIndianCurrency(totalAssets)}</td>
                                <td>Total Liabilities</td>
                                <td>${formatIndianCurrency(totalDebts)}</td>
                            </tr>
                        </tbody>
                    </table>
                </div>

                <div class="page-footer">
                    <div>SLA Finserv Private Limited — Confidential financial plan prepared for ${plan.clientName}</div>
                    <div>Page 1 of 3</div>
                </div>
            </div>

            <!-- PAGE 2 -->
            <div class="report-page">
                <div class="page-header">
                    <div class="page-title">Goals & Investment Projections</div>
                    <p style="font-size: 13px; color: #6B6558; margin: 0;">
                        Projected using each goal's own expected return, reflecting its investment horizon
                    </p>
                </div>

                <div style="margin-bottom: 24px;">
                    <table class="table">
                        <thead>
                            <tr>
                                <th>Goal</th>
                                <th style="text-align: center;">Target Year</th>
                                <th style="text-align: right;">Target Amount</th>
                                <th style="text-align: right;">Projected Value</th>
                                <th style="text-align: right;">Additional SIP</th>
                                <th style="text-align: center;">Status</th>
                            </tr>
                        </thead>
                        <tbody>
                            ${plan.goals.map(goal => {
                                const years = goal.targetYear - CURRENT_YEAR;
                                const expectedReturn = goal.expectedReturnRate || getAutoExpectedReturn(goal.targetYear);
                                const projectedValue = 
                                    fvLumpsum(goal.currentSavings, expectedReturn, years) +
                                    fvStepUpSip(goal.monthlySip, expectedReturn, goal.stepUpPercent, years);
                                const requiredSip = calculateRequiredSip(goal.targetAmount, goal.currentSavings, expectedReturn, goal.stepUpPercent, years);
                                const additionalSip = calculateAdditionalSip(requiredSip, goal.monthlySip);
                                const isOnTrack = projectedValue >= goal.targetAmount;

                                return `
                                    <tr style="font-size: 12px;">
                                        <td>${goal.name}</td>
                                        <td style="text-align: center;">${goal.targetYear}</td>
                                        <td style="text-align: right;">${formatIndianCurrency(goal.targetAmount)}</td>
                                        <td style="text-align: right;">${formatIndianCurrency(projectedValue)}</td>
                                        <td style="text-align: right; color: ${additionalSip > 0 ? '#B0552F' : '#3B6B4F'};">${formatIndianCurrency(additionalSip)}</td>
                                        <td style="text-align: center; color: ${isOnTrack ? '#3B6B4F' : '#B0552F'};">${isOnTrack ? '✓ On track' : '⚠ Shortfall'}</td>
                                    </tr>
                                `;
                            }).join('')}
                        </tbody>
                    </table>
                </div>

                <div class="page-footer">
                    <div>SLA Finserv Private Limited — Confidential financial plan prepared for ${plan.clientName}</div>
                    <div>Page 2 of 3</div>
                </div>
            </div>

            <!-- PAGE 3 -->
            <div class="report-page">
                <div class="page-header">
                    <div class="page-title">Risk, Retirement & Protection</div>
                </div>

                <div style="margin-bottom: 24px;">
                    <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 24px; margin-bottom: 24px;">
                        <div>
                            <h4 style="margin-bottom: 12px;">Recommended Asset Allocation — ${plan.riskProfile || 'Moderate'}</h4>
                            ${[
                                { name: 'Equity', pct: plan.riskProfile === 'conservative' ? 30 : plan.riskProfile === 'aggressive' ? 70 : 50 },
                                { name: 'Debt', pct: plan.riskProfile === 'conservative' ? 50 : plan.riskProfile === 'aggressive' ? 20 : 35 },
                                { name: 'Gold', pct: plan.riskProfile === 'conservative' ? 10 : plan.riskProfile === 'aggressive' ? 5 : 10 },
                                { name: 'Cash', pct: plan.riskProfile === 'conservative' ? 10 : plan.riskProfile === 'aggressive' ? 5 : 5 },
                            ].map(asset => `
                                <div style="margin-bottom: 8px;">
                                    <div style="display: flex; justify-content: space-between; font-size: 12px; margin-bottom: 4px;">
                                        <span>${asset.name}</span>
                                        <span>${asset.pct}%</span>
                                    </div>
                                    <div style="background: #F0ECE0; height: 8px; border-radius: 2px; overflow: hidden;">
                                        <div style="background: ${asset.name === 'Equity' ? '#1D2A4D' : asset.name === 'Debt' ? '#C0703C' : asset.name === 'Gold' ? '#FFD700' : '#999'}; width: ${asset.pct}%; height: 100%;"></div>
                                    </div>
                                </div>
                            `).join('')}
                        </div>

                        <div>
                            <h4 style="margin-bottom: 12px;">Retirement Corpus vs. Target</h4>
                            <p style="font-size: 12px; margin: 0;">Target: ${formatIndianCurrency(requiredRetirementCorpus)}</p>
                        </div>
                    </div>
                </div>

                <div style="margin-bottom: 24px;">
                    <h4 style="margin-bottom: 12px;">Debt Summary</h4>
                    <table class="table">
                        <thead>
                            <tr>
                                <th>Loan</th>
                                <th style="text-align: right;">Outstanding</th>
                                <th style="text-align: right;">Monthly EMI</th>
                            </tr>
                        </thead>
                        <tbody>
                            ${plan.debts.map(debt => `
                                <tr style="font-size: 12px;">
                                    <td>${debt.name}</td>
                                    <td style="text-align: right;">${formatIndianCurrency(debt.outstanding)}</td>
                                    <td style="text-align: right;">${formatIndianCurrency(debt.monthlyEmi)}</td>
                                </tr>
                            `).join('')}
                            <tr style="font-weight: 600; border-top: 1px solid #1D2A4D;">
                                <td>Total</td>
                                <td style="text-align: right;">${formatIndianCurrency(totalDebts)}</td>
                                <td style="text-align: right;">${formatIndianCurrency(totalEmi)}</td>
                            </tr>
                        </tbody>
                    </table>
                </div>

                <div style="background: #F6F4EF; border: 1px solid #E4DFD2; border-radius: 4px; padding: 12px; font-size: 12px;">
                    <div style="font-weight: 600; margin-bottom: 8px;">
                        EMI-to-income ratio: <span style="color: ${emiRatio.isAboveCeiling ? '#B0552F' : '#3B6B4F'};">${emiRatio.ratio.toFixed(1)}%</span>
                    </div>
                    <div style="font-size: 11px; color: #6B6558;">
                        ${emiRatio.isAboveCeiling ? '⚠ Above the recommended 40% ceiling' : '✓ Within a healthy range'}
                    </div>
                </div>

                <div class="page-footer">
                    <div>SLA Finserv Private Limited — Confidential financial plan prepared for ${plan.clientName}</div>
                    <div>Page 3 of 3</div>
                </div>
            </div>
        `;
    }

    // Event handlers
    attachDashboardEvents() {
        const rmInput = document.getElementById('rmNameInput');
        if (rmInput) {
            rmInput.value = this.currentRMName || '';
        }
    }

    attachBuilderEvents() {
        // Events attached inline via onchange handlers
    }

    setRMName() {
        const input = document.getElementById('rmNameInput');
        const name = input.value.trim();
        if (!name) return;
        
        storage.setCurrentRMName(name);
        this.currentRMName = name;
        this.render();
    }

    newPlan() {
        if (!this.currentRMName) {
            alert('Please set your RM name first');
            return;
        }
        
        const plan = storage.createPlan(this.currentRMName, 'New Client');
        storage.savePlan(plan);
        window.location.hash = `builder/${plan.id}`;
    }

    openPlan(id) {
        window.location.hash = `builder/${id}`;
    }

    deletePlan(id) {
        if (!confirm('Delete this plan?')) return;
        storage.deletePlan(id);
        this.render();
    }

    exportPlans() {
        const json = storage.exportPlans();
        const blob = new Blob([json], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `financial-plans-${new Date().toISOString().split('T')[0]}.json`;
        a.click();
    }

    backToDashboard() {
        this.savePlan();
        window.location.hash = '';
    }

    savePlan() {
        if (!this.currentPlan) return;
        storage.savePlan(this.currentPlan);
        alert('Plan saved!');
    }

    clearData() {
        if (!confirm('Clear all data in this plan?')) return;
        this.currentPlan = {
            ...this.currentPlan,
            currentAge: null,
            retirementAge: null,
            dependents: null,
            monthlyIncome: null,
            monthlyExpenses: null,
            emergencyFundCurrent: 0,
            insuranceLife: 0,
            insuranceHealth: 0,
            goals: [],
            assets: [],
            debts: [],
        };
        this.render();
    }

    updatePlan(updates) {
        this.currentPlan = { ...this.currentPlan, ...updates };
        this.render();
    }

    addGoal() {
        this.currentPlan.goals.push({
            id: Math.random().toString(),
            name: 'New Goal',
            targetYear: new Date().getFullYear() + 5,
            targetAmount: 0,
            currentSavings: 0,
            monthlySip: 0,
            stepUpPercent: 0,
            expectedReturnRate: null,
        });
        this.render();
    }

    updateGoal(index, updates) {
        this.currentPlan.goals[index] = { ...this.currentPlan.goals[index], ...updates };
        this.render();
    }

    removeGoal(index) {
        this.currentPlan.goals.splice(index, 1);
        this.render();
    }

    addDebt() {
        this.currentPlan.debts.push({
            id: Math.random().toString(),
            name: 'New Debt',
            outstanding: 0,
            monthlyEmi: 0,
        });
        this.render();
    }

    updateDebt(index, updates) {
        this.currentPlan.debts[index] = { ...this.currentPlan.debts[index], ...updates };
        this.render();
    }

    removeDebt(index) {
        this.currentPlan.debts.splice(index, 1);
        this.render();
    }
}

// Initialize app
const app = new FinancialPlanningApp();
