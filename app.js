// Main app controller - COMPLETELY FIXED VERSION
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
                        📥 Download PDF
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
                            <input type="text" value="${plan.clientName}" onblur="app.updatePlanField('clientName', this.value)">
                        </div>

                        <div class="form-row">
                            <div class="form-group">
                                <label class="form-label">Current Age</label>
                                <input type="text" inputmode="decimal" value="${plan.currentAge ?? ''}" onblur="app.updatePlanField('currentAge', this.value)">
                            </div>
                            <div class="form-group">
                                <label class="form-label">Retirement Age</label>
                                <input type="text" inputmode="decimal" value="${plan.retirementAge ?? ''}" onblur="app.updatePlanField('retirementAge', this.value)">
                            </div>
                        </div>

                        <div class="form-row">
                            <div class="form-group">
                                <label class="form-label">Dependents</label>
                                <input type="text" inputmode="decimal" value="${plan.dependents ?? ''}" onblur="app.updatePlanField('dependents', this.value)">
                            </div>
                            <div class="form-group">
                                <label class="form-label">Monthly Income (₹)</label>
                                <input type="text" inputmode="decimal" value="${plan.monthlyIncome ?? ''}" onblur="app.updatePlanField('monthlyIncome', this.value)">
                            </div>
                        </div>

                        <div class="form-group">
                            <label class="form-label">Monthly Expenses (₹)</label>
                            <input type="text" inputmode="decimal" value="${plan.monthlyExpenses ?? ''}" onblur="app.updatePlanField('monthlyExpenses', this.value)">
                        </div>
                    </div>

                    <!-- Goals Card -->
                    <div class="card">
                        <div class="card-title">Goals</div>
                        
                        ${plan.goals.map((goal, idx) => `
                            <div style="margin-bottom: 12px; padding-bottom: 12px; border-bottom: 1px solid #E4DFD2;">
                                <input type="text" value="${goal.name}" placeholder="Goal name" style="width: 100%; margin-bottom: 8px;" onblur="app.updateGoal(${idx}, {name: this.value})">
                                <div class="form-row">
                                    <input type="text" inputmode="decimal" value="${goal.targetYear}" placeholder="Target year" onblur="app.updateGoal(${idx}, {targetYear: parseInt(this.value)})">
                                    <input type="text" inputmode="decimal" value="${goal.targetAmount || ''}" placeholder="Target amount" onblur="app.updateGoal(${idx}, {targetAmount: parseDecimal(this.value)})">
                                </div>
                                <button class="btn btn-delete" onclick="app.removeGoal(${idx})">Remove</button>
                            </div>
                        `).join('')}
                        
                        <button class="btn btn-primary" onclick="app.addGoal()">+ Add Goal</button>
                    </div>

                    <!-- Risk Profile -->
                    <div class="card">
                        <div class="card-title">Risk Profile</div>
                        <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 8px;">
                            ${['conservative', 'moderate', 'aggressive'].map(risk => `
                                <button class="btn ${plan.riskProfile === risk ? 'btn-primary' : 'btn-secondary'}" style="text-transform: capitalize;" onclick="app.updatePlanField('riskProfile', '${risk}')">
                                    ${risk}
                                </button>
                            `).join('')}
                        </div>
                    </div>

                    <!-- Insurance Card -->
                    <div class="card">
                        <div class="card-title">Insurance</div>
                        
                        <div class="form-group">
                            <label class="form-label">Life Cover Current (₹)</label>
                            <input type="text" inputmode="decimal" value="${plan.insuranceLife || ''}" onblur="app.updatePlanField('insuranceLife', this.value)">
                        </div>

                        <div class="form-group">
                            <label class="form-label">Health Cover Current (₹)</label>
                            <input type="text" inputmode="decimal" value="${plan.insuranceHealth || ''}" onblur="app.updatePlanField('insuranceHealth', this.value)">
                        </div>

                        <div class="form-group">
                            <label class="form-label">Emergency Fund Current (₹)</label>
                            <input type="text" inputmode="decimal" value="${plan.emergencyFundCurrent || ''}" onblur="app.updatePlanField('emergencyFundCurrent', this.value)">
                        </div>
                    </div>

                    <!-- Assets Card -->
                    <div class="card">
                        <div class="card-title">Assets</div>
                        
                        ${plan.assets.map((asset, idx) => `
                            <div style="margin-bottom: 8px; padding-bottom: 8px; border-bottom: 1px solid #E4DFD2;">
                                <input type="text" value="${asset.name}" placeholder="Asset name" onblur="app.updateAsset(${idx}, {name: this.value})" style="width: 100%; margin-bottom: 4px;">
                                <input type="text" inputmode="decimal" value="${asset.value || ''}" placeholder="Value" onblur="app.updateAsset(${idx}, {value: parseDecimal(this.value)})">
                                <button class="btn btn-delete" onclick="app.removeAsset(${idx})" style="width: 100%; margin-top: 4px;">Remove</button>
                            </div>
                        `).join('')}
                        
                        <button class="btn btn-primary" onclick="app.addAsset()">+ Add Asset</button>
                    </div>

                    <!-- Debts Card -->
                    <div class="card">
                        <div class="card-title">Debts</div>
                        
                        ${plan.debts.map((debt, idx) => `
                            <div style="margin-bottom: 8px; padding-bottom: 8px; border-bottom: 1px solid #E4DFD2;">
                                <input type="text" value="${debt.name}" placeholder="Debt name" onblur="app.updateDebt(${idx}, {name: this.value})" style="width: 100%; margin-bottom: 4px;">
                                <div class="form-row">
                                    <input type="text" inputmode="decimal" value="${debt.outstanding || ''}" placeholder="Outstanding" onblur="app.updateDebt(${idx}, {outstanding: parseDecimal(this.value)})">
                                    <input type="text" inputmode="decimal" value="${debt.monthlyEmi || ''}" placeholder="Monthly EMI" onblur="app.updateDebt(${idx}, {monthlyEmi: parseDecimal(this.value)})">
                                </div>
                                <button class="btn btn-delete" onclick="app.removeDebt(${idx})" style="width: 100%; margin-top: 4px;">Remove</button>
                            </div>
                        `).join('')}
                        
                        <button class="btn btn-primary" onclick="app.addDebt()">+ Add Debt</button>
                    </div>
                </div>

                <!-- Report Pane -->
                <div class="report-pane">
                    ${this.renderReport(plan)}
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
            </div>

            <!-- PAGE 2 -->
            <div class="report-page">
                <h3 style="margin-bottom: 16px;">Goals & Projections</h3>
                <table class="table">
                    <thead>
                        <tr>
                            <th>Goal</th>
                            <th>Target</th>
                            <th>Timeline</th>
                            <th>Expected Return</th>
                        </tr>
                    </thead>
                    <tbody>
                        ${plan.goals.map(goal => `
                            <tr>
                                <td>${goal.name}</td>
                                <td>${formatIndianCurrency(goal.targetAmount)}</td>
                                <td>${goal.targetYear} (${Math.max(0, goal.targetYear - new Date().getFullYear())} years)</td>
                                <td>${goal.expectedReturnRate || 'Auto'}%</td>
                            </tr>
                        `).join('')}
                    </tbody>
                </table>

                <div style="margin-top: 24px;">
                    <h4 style="margin-bottom: 12px;">Asset Allocation (${plan.riskProfile || 'Moderate'})</h4>
                    <div class="stat-cards">
                        ${plan.riskProfile === 'conservative' ? `
                            <div class="stat-card">
                                <div class="stat-label">Equity</div>
                                <div class="stat-value">30%</div>
                            </div>
                            <div class="stat-card">
                                <div class="stat-label">Hybrid</div>
                                <div class="stat-value">30%</div>
                            </div>
                            <div class="stat-card">
                                <div class="stat-label">Debt</div>
                                <div class="stat-value">40%</div>
                            </div>
                        ` : plan.riskProfile === 'aggressive' ? `
                            <div class="stat-card">
                                <div class="stat-label">Equity</div>
                                <div class="stat-value">65%</div>
                            </div>
                            <div class="stat-card">
                                <div class="stat-label">Hybrid</div>
                                <div class="stat-value">25%</div>
                            </div>
                            <div class="stat-card">
                                <div class="stat-label">Debt</div>
                                <div class="stat-value">10%</div>
                            </div>
                        ` : `
                            <div class="stat-card">
                                <div class="stat-label">Equity</div>
                                <div class="stat-value">50%</div>
                            </div>
                            <div class="stat-card">
                                <div class="stat-label">Hybrid</div>
                                <div class="stat-value">30%</div>
                            </div>
                            <div class="stat-card">
                                <div class="stat-label">Debt</div>
                                <div class="stat-value">20%</div>
                            </div>
                        `}
                    </div>
                </div>

                <div style="margin-top: 24px;">
                    <h4 style="margin-bottom: 12px;">Insurance & Emergency Fund</h4>
                    <table class="table">
                        <thead>
                            <tr>
                                <th>Type</th>
                                <th>Current</th>
                                <th>Recommended</th>
                                <th>Gap</th>
                            </tr>
                        </thead>
                        <tbody>
                            <tr>
                                <td>Life Insurance</td>
                                <td>${formatIndianCurrency(plan.insuranceLife)}</td>
                                <td>${formatIndianCurrency(recommendedLifeCover)}</td>
                                <td>${formatIndianCurrency(Math.max(0, recommendedLifeCover - (plan.insuranceLife || 0)))}</td>
                            </tr>
                            <tr>
                                <td>Health Insurance</td>
                                <td>${formatIndianCurrency(plan.insuranceHealth)}</td>
                                <td>${formatIndianCurrency(recommendedHealthCover)}</td>
                                <td>${formatIndianCurrency(Math.max(0, recommendedHealthCover - (plan.insuranceHealth || 0)))}</td>
                            </tr>
                            <tr>
                                <td>Emergency Fund</td>
                                <td>${formatIndianCurrency(plan.emergencyFundCurrent)}</td>
                                <td>${formatIndianCurrency(emergencyFundTarget)}</td>
                                <td>${formatIndianCurrency(Math.max(0, emergencyFundTarget - (plan.emergencyFundCurrent || 0)))}</td>
                            </tr>
                        </tbody>
                    </table>
                </div>
            </div>

            <!-- PAGE 3 -->
            <div class="report-page">
                <h3 style="margin-bottom: 16px;">Financial Position</h3>
                
                <div style="margin-bottom: 24px;">
                    <h4 style="margin-bottom: 12px;">Debt Summary</h4>
                    <table class="table">
                        <thead>
                            <tr>
                                <th>Debt Type</th>
                                <th>Outstanding</th>
                                <th>Monthly EMI</th>
                            </tr>
                        </thead>
                        <tbody>
                            ${plan.debts.map(debt => `
                                <tr>
                                    <td>${debt.name}</td>
                                    <td>${formatIndianCurrency(debt.outstanding)}</td>
                                    <td>${formatIndianCurrency(debt.monthlyEmi)}</td>
                                </tr>
                            `).join('')}
                            <tr style="border-top: 1px solid #1D2A4D; font-weight: 600;">
                                <td>Total</td>
                                <td>${formatIndianCurrency(totalDebts)}</td>
                                <td>${formatIndianCurrency(totalEmi)}</td>
                            </tr>
                        </tbody>
                    </table>
                </div>

                <div class="stat-cards">
                    <div class="stat-card">
                        <div class="stat-label">EMI to Income Ratio</div>
                        <div class="stat-value">${emiRatio.ratio.toFixed(1)}%</div>
                    </div>
                    <div class="stat-card">
                        <div class="stat-label">Retirement Corpus</div>
                        <div class="stat-value">${formatIndianCurrency(requiredRetirementCorpus)}</div>
                    </div>
                </div>

                <div style="margin-top: 24px; padding: 16px; background: #F6F4EF; border-radius: 3px;">
                    <h4 style="margin-bottom: 8px;">Action Plan</h4>
                    <ol style="margin: 0; padding-left: 20px; font-size: 13px;">
                        <li>Review and update insurance coverage to meet recommended amounts</li>
                        <li>Build emergency fund to target amount (3-6 months expenses)</li>
                        <li>Create systematic investment plan for financial goals</li>
                        <li>Monitor and rebalance investment portfolio quarterly</li>
                        <li>Review retirement corpus progress annually</li>
                    </ol>
                </div>

                <div style="margin-top: 24px; padding-top: 16px; border-top: 1px solid #E4DFD2; font-size: 11px; color: #6B6558; text-align: center;">
                    <p style="margin: 0;">This plan is based on the information provided and standard financial assumptions.</p>
                    <p style="margin: 4px 0 0 0;">Please consult with a financial advisor for personalized guidance.</p>
                </div>
            </div>
        `;
    }

    // SIMPLE METHOD TO UPDATE PLAN FIELD - NO RENDER!
    updatePlanField(field, value) {
        if (field === 'currentAge' || field === 'retirementAge' || field === 'dependents' || 
            field === 'monthlyIncome' || field === 'monthlyExpenses' || field === 'insuranceLife' || 
            field === 'insuranceHealth' || field === 'emergencyFundCurrent') {
            this.currentPlan[field] = parseInt(value.replace(/,/g, '')) || 0;
        } else {
            this.currentPlan[field] = value;
        }
        storage.savePlan(this.currentPlan);
        // Update report only
        const reportPane = document.querySelector('.report-pane');
        if (reportPane) {
            reportPane.innerHTML = this.renderReport(this.currentPlan);
        }
    }

    setRMName() {
        const name = document.getElementById('rmNameInput').value.trim();
        if (name) {
            this.currentRMName = name;
            storage.setCurrentRMName(name);
            this.render();
        }
    }

    newPlan() {
        const plan = {
            id: Math.random().toString().substr(2),
            clientName: 'New Client',
            currentAge: 30,
            retirementAge: 60,
            dependents: 0,
            monthlyIncome: 0,
            monthlyExpenses: 0,
            riskProfile: 'moderate',
            insuranceLife: 0,
            insuranceHealth: 0,
            emergencyFundCurrent: 0,
            goals: [],
            assets: [{ id: Math.random().toString(), name: 'Asset 1', value: 0 }],
            debts: [{ id: Math.random().toString(), name: 'Debt 1', outstanding: 0, monthlyEmi: 0 }],
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
        };
        storage.savePlan(plan, this.currentRMName);
        this.currentPlanId = plan.id;
        this.currentPlan = plan;
        this.currentView = 'builder';
        window.location.hash = `builder/${plan.id}`;
        this.render();
    }

    openPlan(id) {
        window.location.hash = `builder/${id}`;
    }

    backToDashboard() {
        window.location.hash = '';
    }

    savePlan() {
        storage.savePlan(this.currentPlan, this.currentRMName);
        alert('Plan saved!');
    }

    deletePlan(id) {
        if (confirm('Delete this plan?')) {
            storage.deletePlan(id, this.currentRMName);
            this.render();
        }
    }

    exportPlans() {
        const plans = storage.getPlans(this.currentRMName);
        const json = JSON.stringify(plans, null, 2);
        const blob = new Blob([json], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `plans-${this.currentRMName}-${new Date().toISOString().split('T')[0]}.json`;
        a.click();
    }

    clearData() {
        if (confirm('Clear all data for this plan? This cannot be undone.')) {
            storage.deletePlan(this.currentPlan.id, this.currentRMName);
            this.backToDashboard();
        }
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
        storage.savePlan(this.currentPlan);
        this.render();
    }

    updateGoal(index, updates) {
        this.currentPlan.goals[index] = { ...this.currentPlan.goals[index], ...updates };
        storage.savePlan(this.currentPlan);
        const reportPane = document.querySelector('.report-pane');
        if (reportPane) {
            reportPane.innerHTML = this.renderReport(this.currentPlan);
        }
    }

    removeGoal(index) {
        this.currentPlan.goals.splice(index, 1);
        storage.savePlan(this.currentPlan);
        this.render();
    }

    addAsset() {
        this.currentPlan.assets.push({ id: Math.random().toString(), name: 'New Asset', value: 0 });
        storage.savePlan(this.currentPlan);
        this.render();
    }

    updateAsset(index, updates) {
        this.currentPlan.assets[index] = { ...this.currentPlan.assets[index], ...updates };
        storage.savePlan(this.currentPlan);
        const reportPane = document.querySelector('.report-pane');
        if (reportPane) {
            reportPane.innerHTML = this.renderReport(this.currentPlan);
        }
    }

    removeAsset(index) {
        this.currentPlan.assets.splice(index, 1);
        storage.savePlan(this.currentPlan);
        this.render();
    }

    addDebt() {
        this.currentPlan.debts.push({ id: Math.random().toString(), name: 'New Debt', outstanding: 0, monthlyEmi: 0 });
        storage.savePlan(this.currentPlan);
        this.render();
    }

    updateDebt(index, updates) {
        this.currentPlan.debts[index] = { ...this.currentPlan.debts[index], ...updates };
        storage.savePlan(this.currentPlan);
        const reportPane = document.querySelector('.report-pane');
        if (reportPane) {
            reportPane.innerHTML = this.renderReport(this.currentPlan);
        }
    }

    removeDebt(index) {
        this.currentPlan.debts.splice(index, 1);
        storage.savePlan(this.currentPlan);
        this.render();
    }

    attachDashboardEvents() {
        const rmInput = document.getElementById('rmNameInput');
        if (rmInput) {
            rmInput.value = this.currentRMName || '';
        }
    }

    attachBuilderEvents() {
        // Events already attached via onclick attributes
    }
}

// Initialize app
const app = new FinancialPlanningApp();
