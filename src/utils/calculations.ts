import { Appliance, BillCalculation, ApplianceUsage, CategoryUsage } from '../types';

// Regional electricity rates (cents per kWh)
const REGIONAL_RATES: Record<string, number> = {
  'California': 0.23,
  'New York': 0.20,
  'Texas': 0.12,
  'Florida': 0.13,
  'Illinois': 0.13,
  'Pennsylvania': 0.14,
  'Ohio': 0.13,
  'Georgia': 0.12,
  'North Carolina': 0.12,
  'Michigan': 0.16,
  'National Average': 0.16
};

// Time-of-use rates (multipliers)
const TIME_OF_USE_MULTIPLIERS = {
  peak: 1.5,      // 4-9 PM weekdays
  offPeak: 0.8,   // 10 PM - 6 AM
  standard: 1.0   // All other times
};

// Seasonal adjustments
const SEASONAL_MULTIPLIERS = {
  summer: 1.3,    // June-August (AC usage)
  winter: 1.2,    // December-February (heating)
  spring: 0.9,    // March-May
  fall: 0.9       // September-November
};

const CATEGORY_COLORS: Record<string, string> = {
  'Heating & Cooling': '#EF4444',
  'Kitchen': '#F97316',
  'Lighting': '#EAB308',
  'Electronics': '#3B82F6',
  'Laundry': '#8B5CF6',
  'Water Heating': '#06B6D4',
  'Other': '#6B7280'
};

// Enhanced appliance efficiency data
const APPLIANCE_EFFICIENCY_FACTORS: Record<string, number> = {
  'Refrigerator': 0.85,        // Modern fridges are more efficient
  'Air Conditioner': 1.2,      // Varies greatly by age/efficiency
  'Water Heater': 1.1,         // Older units less efficient
  'Washing Machine': 0.9,      // Modern units more efficient
  'Dryer': 1.0,
  'Dishwasher': 0.8,          // Energy Star models
  'Television': 0.7,           // LED TVs very efficient
  'Computer': 0.9,
  'Laptop': 0.6,              // Very efficient
  'LED Light Bulb': 0.2,      // Extremely efficient vs incandescent
  'Microwave': 1.0,
  'Oven': 1.1
};

export interface BillSettings {
  region: string;
  useTimeOfUse: boolean;
  season: 'spring' | 'summer' | 'fall' | 'winter';
  homeSize: 'small' | 'medium' | 'large';
  efficiencyRating: 'poor' | 'average' | 'good' | 'excellent';
}

export function calculateBill(
  appliances: Appliance[], 
  settings: BillSettings = {
    region: 'National Average',
    useTimeOfUse: false,
    season: 'summer',
    homeSize: 'medium',
    efficiencyRating: 'average'
  }
): BillCalculation {
  const baseRate = REGIONAL_RATES[settings.region] || REGIONAL_RATES['National Average'];
  const seasonalMultiplier = SEASONAL_MULTIPLIERS[settings.season];
  
  // Home efficiency factor
  const efficiencyFactors = {
    poor: 1.3,
    average: 1.0,
    good: 0.85,
    excellent: 0.7
  };
  const efficiencyFactor = efficiencyFactors[settings.efficiencyRating];
  
  // Calculate usage for each appliance
  const applianceBreakdown: ApplianceUsage[] = appliances.map(appliance => {
    // Base calculation
    let monthlyKwh = (appliance.wattage * appliance.hoursPerDay * appliance.daysPerMonth) / 1000;
    
    // Apply efficiency factor for specific appliances
    const efficiencyMultiplier = APPLIANCE_EFFICIENCY_FACTORS[appliance.name] || 1.0;
    monthlyKwh *= efficiencyMultiplier;
    
    // Apply home efficiency
    monthlyKwh *= efficiencyFactor;
    
    // Apply seasonal adjustments for climate-sensitive appliances
    if (appliance.category === 'Heating & Cooling') {
      monthlyKwh *= seasonalMultiplier;
    }
    
    // Calculate cost with time-of-use if enabled
    let costPerKwh = baseRate;
    if (settings.useTimeOfUse) {
      // Assume 30% peak, 40% standard, 30% off-peak usage
      costPerKwh = baseRate * (
        0.3 * TIME_OF_USE_MULTIPLIERS.peak +
        0.4 * TIME_OF_USE_MULTIPLIERS.standard +
        0.3 * TIME_OF_USE_MULTIPLIERS.offPeak
      );
    }
    
    const monthlyCost = monthlyKwh * costPerKwh;
    
    return {
      appliance,
      monthlyKwh,
      monthlyCost,
      percentage: 0 // Will be calculated after totals
    };
  });

  // Calculate totals
  const totalKwh = applianceBreakdown.reduce((sum, item) => sum + item.monthlyKwh, 0);
  const monthlyBill = applianceBreakdown.reduce((sum, item) => sum + item.monthlyCost, 0);
  
  // Update percentages
  applianceBreakdown.forEach(item => {
    item.percentage = totalKwh > 0 ? (item.monthlyKwh / totalKwh) * 100 : 0;
  });

  // Calculate category breakdown
  const categoryTotals: Record<string, { kwh: number; cost: number }> = {};
  
  applianceBreakdown.forEach(item => {
    const category = item.appliance.category;
    if (!categoryTotals[category]) {
      categoryTotals[category] = { kwh: 0, cost: 0 };
    }
    categoryTotals[category].kwh += item.monthlyKwh;
    categoryTotals[category].cost += item.monthlyCost;
  });

  const categoryBreakdown: CategoryUsage[] = Object.entries(categoryTotals).map(([category, totals]) => ({
    category,
    monthlyKwh: totals.kwh,
    monthlyCost: totals.cost,
    percentage: totalKwh > 0 ? (totals.kwh / totalKwh) * 100 : 0,
    color: CATEGORY_COLORS[category] || CATEGORY_COLORS['Other']
  }));

  return {
    totalKwh,
    monthlyBill,
    yearlyBill: monthlyBill * 12,
    dailyAverage: totalKwh / 30,
    applianceBreakdown,
    categoryBreakdown
  };
}

export function formatCurrency(amount: number): string {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 2,
    maximumFractionDigits: 2
  }).format(amount);
}

export function formatKwh(kwh: number): string {
  return `${kwh.toFixed(1)} kWh`;
}

// Utility function to get average usage for appliance type
export function getAverageUsage(applianceName: string): { wattage: number; hoursPerDay: number } {
  const averages: Record<string, { wattage: number; hoursPerDay: number }> = {
    'Refrigerator': { wattage: 150, hoursPerDay: 24 },
    'Air Conditioner': { wattage: 3500, hoursPerDay: 8 },
    'Water Heater': { wattage: 4000, hoursPerDay: 3 },
    'Washing Machine': { wattage: 1000, hoursPerDay: 1 },
    'Dryer': { wattage: 3000, hoursPerDay: 1 },
    'Dishwasher': { wattage: 1800, hoursPerDay: 1 },
    'Television': { wattage: 100, hoursPerDay: 5 },
    'Computer': { wattage: 300, hoursPerDay: 8 },
    'Laptop': { wattage: 65, hoursPerDay: 8 },
    'LED Light Bulb': { wattage: 10, hoursPerDay: 6 },
    'Microwave': { wattage: 1200, hoursPerDay: 0.5 },
    'Oven': { wattage: 2400, hoursPerDay: 1 }
  };
  
  return averages[applianceName] || { wattage: 100, hoursPerDay: 4 };
}