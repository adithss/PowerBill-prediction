export interface Appliance {
  id: string;
  name: string;
  category: string;
  wattage: number;
  hoursPerDay: number;
  daysPerMonth: number;
}

export interface ApplianceUsage {
  appliance: Appliance;
  monthlyKwh: number;
  monthlyCost: number;
  percentage: number;
}

export interface CategoryUsage {
  category: string;
  monthlyKwh: number;
  monthlyCost: number;
  percentage: number;
  color: string;
}

export interface BillCalculation {
  totalKwh: number;
  monthlyBill: number;
  yearlyBill: number;
  dailyAverage: number;
  applianceBreakdown: ApplianceUsage[];
  categoryBreakdown: CategoryUsage[];
}

export interface BillSettings {
  region: string;
  useTimeOfUse: boolean;
  season: "spring" | "summer" | "fall" | "winter";
  homeSize: "small" | "medium" | "large";
  efficiencyRating: "poor" | "average" | "good" | "excellent";
}

// NEW: Interface for saved monthly bills
export interface SavedBill {
  id: string;
  name: string;
  month: string;
  year: number;
  appliances: Appliance[];
  settings: BillSettings;
  calculation: BillCalculation;
  createdAt: Date;
  updatedAt: Date;
}

// NEW: Interface for bill comparison
export interface BillComparison {
  bills: SavedBill[];
  totalBills: number;
  averageMonthly: number;
  highestBill: SavedBill;
  lowestBill: SavedBill;
  trendPercentage: number;
}
