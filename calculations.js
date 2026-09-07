const CURRENT_YEAR = new Date().getFullYear();

function getAutoExpectedReturn(targetYear) {
    const years = targetYear - CURRENT_YEAR;
    if (years <= 3) return 6;
    if (years <= 8) return 9;
    return 12;
}

function fvLumpsum(principal, ratePct, years) {
    const rate = ratePct / 100;
    return principal * Math.pow(1 + rate, years);
}

function fvStepUpSip(monthlyAmount, ratePct, stepUpPct, years) {
    const monthlyRate = ratePct / 100 / 12;
    const stepUpRate = stepUpPct / 100;
    
    let totalFv = 0;
    let currentMonthlyAmount = monthlyAmount;
    
    for (let year = 0; year < years; year++) {
        const monthsRemaining = (years - year) * 12;
        const yearlyFv = currentMonthlyAmount * (Math.pow(1 + monthlyRate, 12) - 1) / monthlyRate;
        const compoundedFv = yearlyFv * Math.pow(1 + monthlyRate, monthsRemaining - 12);
        totalFv += compoundedFv;
        currentMonthlyAmount *= 1 + stepUpRate;
    }
    
    return totalFv;
}

function fvSip(monthlyAmount, ratePct, years) {
    const monthlyRate = ratePct / 100 / 12;
    const months = years * 12;
    
    if (monthlyRate === 0) return monthlyAmount * months;
    return monthlyAmount * (Math.pow(1 + monthlyRate, months) - 1) / monthlyRate;
}

function calculateRequiredSip(targetAmount, currentSavings, ratePct, stepUpPct, years) {
    const remainingTarget = targetAmount - fvLumpsum(currentSavings, ratePct, years);
    if (remainingTarget <= 0) return 0;
    
    const fvOf1Rupee = fvStepUpSip(1, ratePct, stepUpPct, years);
    if (fvOf1Rupee <= 0) return 0;
    
    return remainingTarget / fvOf1Rupee;
}

function calculateAdditionalSip(requiredSip, currentMonthlySip) {
    return Math.max(0, requiredSip - currentMonthlySip);
}

function getEmergencyFundTarget(monthlyIncome) {
    return 6 * monthlyIncome;
}

function getRecommendedLifeCover(monthlyIncome, totalDebt) {
    return 12 * monthlyIncome * 10 + totalDebt;
}

function getRecommendedHealthCover(dependents) {
    return 500000 + dependents * 300000;
}

function calculateNetWorth(totalAssets, totalDebt) {
    return totalAssets - totalDebt;
}

function calculateMonthlySurplus(monthlyIncome, monthlyExpenses, totalEmi) {
    return monthlyIncome - monthlyExpenses - totalEmi;
}

function calculateEmiToIncomeRatio(totalEmi, monthlyIncome) {
    const ratio = (totalEmi / monthlyIncome) * 100;
    return {
        ratio,
        isAboveCeiling: ratio > 40,
    };
}

function getRequiredRetirementCorpus(monthlyExpenses, yearsToRetirement) {
    const inflationRate = 0.06;
    const inflationAdjustedAnnualExpense = monthlyExpenses * 12 * Math.pow(inflationRate + 1, yearsToRetirement);
    return inflationAdjustedAnnualExpense * 25;
}

function formatIndianCurrency(amount) {
    if (isNaN(amount)) amount = 0;
    const crore = 10000000;
    const lakh = 100000;
    
    if (amount >= crore) {
        return `₹${(amount / crore).toFixed(2)} Cr`;
    }
    if (amount >= lakh) {
        return `₹${(amount / lakh).toFixed(2)} L`;
    }
    
    return '₹' + Math.round(amount).toLocaleString('en-IN', {
        minimumFractionDigits: 0,
        maximumFractionDigits: 0,
    });
}

function parseDecimal(value) {
    if (typeof value === 'number') return value;
    if (typeof value !== 'string') return 0;
    
    const cleaned = value.replace(/,/g, '').trim();
    const parsed = parseFloat(cleaned);
    
    return isNaN(parsed) ? 0 : parsed;
}
