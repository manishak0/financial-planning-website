// Storage management - all data saved to browser localStorage

class StorageManager {
    constructor() {
        this.STORAGE_KEY = 'financial_plans';
        this.RM_KEY = 'current_rm_name';
    }

    getPlans(rmName = null) {
        try {
            const data = localStorage.getItem(this.STORAGE_KEY);
            if (!data) return [];
            
            const plans = JSON.parse(data);
            
            if (rmName) {
                return plans.filter(p => p.rmName === rmName);
            }
            
            return plans;
        } catch (error) {
            console.error('Error reading plans:', error);
            return [];
        }
    }

    getPlan(id) {
        const plans = this.getPlans();
        return plans.find(p => p.id === id) || null;
    }

    savePlan(plan) {
        try {
            const plans = this.getPlans();
            const index = plans.findIndex(p => p.id === plan.id);
            
            if (index >= 0) {
                plans[index] = { ...plan, updatedAt: new Date().toISOString() };
            } else {
                plans.push({
                    ...plan,
                    createdAt: new Date().toISOString(),
                    updatedAt: new Date().toISOString(),
                });
            }
            
            localStorage.setItem(this.STORAGE_KEY, JSON.stringify(plans));
            return true;
        } catch (error) {
            console.error('Error saving plan:', error);
            return false;
        }
    }

    deletePlan(id) {
        try {
            const plans = this.getPlans();
            const filtered = plans.filter(p => p.id !== id);
            localStorage.setItem(this.STORAGE_KEY, JSON.stringify(filtered));
            return true;
        } catch (error) {
            console.error('Error deleting plan:', error);
            return false;
        }
    }

    createPlan(rmName, clientName) {
        return {
            id: Math.random().toString(36).substr(2, 9),
            rmName,
            clientName,
            currentAge: null,
            retirementAge: null,
            dependents: null,
            monthlyIncome: null,
            monthlyExpenses: null,
            defaultReturnRate: 9,
            riskProfile: null,
            emergencyFundCurrent: 0,
            insuranceLife: 0,
            insuranceHealth: 0,
            goals: [],
            assets: [],
            debts: [],
            updatedAt: new Date().toISOString(),
            createdAt: new Date().toISOString(),
        };
    }

    getCurrentRMName() {
        return localStorage.getItem(this.RM_KEY);
    }

    setCurrentRMName(name) {
        localStorage.setItem(this.RM_KEY, name);
    }

    exportPlans() {
        const plans = this.getPlans();
        return JSON.stringify(plans, null, 2);
    }

    importPlans(jsonString) {
        try {
            const plans = JSON.parse(jsonString);
            localStorage.setItem(this.STORAGE_KEY, JSON.stringify(plans));
            return true;
        } catch (error) {
            console.error('Error importing plans:', error);
            return false;
        }
    }

    clearAllPlans() {
        if (confirm('Are you absolutely sure? This cannot be undone.')) {
            localStorage.removeItem(this.STORAGE_KEY);
            return true;
        }
        return false;
    }
}

const storage = new StorageManager();
