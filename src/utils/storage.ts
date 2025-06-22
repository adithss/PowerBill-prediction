import { Appliance, BillSettings, SavedBill } from "../types";

export interface UserData {
  appliances: Appliance[];
  billSettings: BillSettings;
  savedBills: SavedBill[];
}

const STORAGE_PREFIX = "powerpredict_";

// Get user data
export function getUserData(email: string): UserData | null {
  try {
    const data = localStorage.getItem(`${STORAGE_PREFIX}user_${email}`);
    return data ? JSON.parse(data) : null;
  } catch (error) {
    console.error("Error reading user data:", error);
    return null;
  }
}

// Save user appliances
export function saveUserAppliances(
  email: string,
  appliances: Appliance[]
): void {
  try {
    const existingData = getUserData(email) || {
      appliances: [],
      billSettings: getDefaultBillSettings(),
      savedBills: [],
    };
    const updatedData = {
      ...existingData,
      appliances,
    };
    localStorage.setItem(
      `${STORAGE_PREFIX}user_${email}`,
      JSON.stringify(updatedData)
    );
  } catch (error) {
    console.error("Error saving appliances:", error);
  }
}

// Save user bill settings
export function saveUserBillSettings(
  email: string,
  billSettings: BillSettings
): void {
  try {
    const existingData = getUserData(email) || {
      appliances: [],
      billSettings: getDefaultBillSettings(),
      savedBills: [],
    };
    const updatedData = {
      ...existingData,
      billSettings,
    };
    localStorage.setItem(
      `${STORAGE_PREFIX}user_${email}`,
      JSON.stringify(updatedData)
    );
  } catch (error) {
    console.error("Error saving bill settings:", error);
  }
}

// Save a complete bill
export function saveUserBill(email: string, bill: SavedBill): void {
  try {
    const existingData = getUserData(email) || {
      appliances: [],
      billSettings: getDefaultBillSettings(),
      savedBills: [],
    };
    const updatedBills = [bill, ...existingData.savedBills];
    const updatedData = {
      ...existingData,
      savedBills: updatedBills,
    };
    localStorage.setItem(
      `${STORAGE_PREFIX}user_${email}`,
      JSON.stringify(updatedData)
    );
  } catch (error) {
    console.error("Error saving bill:", error);
  }
}

// Get user bills
export function getUserBills(email: string): SavedBill[] {
  try {
    const userData = getUserData(email);
    return userData?.savedBills || [];
  } catch (error) {
    console.error("Error reading user bills:", error);
    return [];
  }
}

// Delete a user bill
export function deleteUserBill(email: string, billId: string): void {
  try {
    const existingData = getUserData(email);
    if (!existingData) return;

    const updatedBills = existingData.savedBills.filter(
      (bill) => bill.id !== billId
    );
    const updatedData = {
      ...existingData,
      savedBills: updatedBills,
    };
    localStorage.setItem(
      `${STORAGE_PREFIX}user_${email}`,
      JSON.stringify(updatedData)
    );
  } catch (error) {
    console.error("Error deleting bill:", error);
  }
}

// Update a saved bill
export function updateUserBill(
  email: string,
  billId: string,
  updatedBill: SavedBill
): void {
  try {
    const existingData = getUserData(email);
    if (!existingData) return;

    const updatedBills = existingData.savedBills.map((bill) =>
      bill.id === billId ? { ...updatedBill, updatedAt: new Date() } : bill
    );
    const updatedData = {
      ...existingData,
      savedBills: updatedBills,
    };
    localStorage.setItem(
      `${STORAGE_PREFIX}user_${email}`,
      JSON.stringify(updatedData)
    );
  } catch (error) {
    console.error("Error updating bill:", error);
  }
}

// Clear current user session
export function clearCurrentUserSession(): void {
  try {
    localStorage.removeItem(`${STORAGE_PREFIX}current_user`);
  } catch (error) {
    console.error("Error clearing user session:", error);
  }
}

// Export user data
export function exportUserData(email: string): string | null {
  try {
    const userData = getUserData(email);
    if (!userData) return null;

    const exportData = {
      ...userData,
      exportDate: new Date().toISOString(),
      version: "2.0",
    };

    return JSON.stringify(exportData, null, 2);
  } catch (error) {
    console.error("Error exporting user data:", error);
    return null;
  }
}

// Import user data
export function importUserData(email: string, jsonData: string): boolean {
  try {
    const importedData = JSON.parse(jsonData);

    // Validate imported data structure
    if (!importedData.appliances || !importedData.billSettings) {
      return false;
    }

    // Convert date strings back to Date objects for savedBills
    if (importedData.savedBills) {
      importedData.savedBills = importedData.savedBills.map((bill: any) => ({
        ...bill,
        createdAt: new Date(bill.createdAt),
        updatedAt: new Date(bill.updatedAt),
      }));
    }

    const userData: UserData = {
      appliances: importedData.appliances || [],
      billSettings: importedData.billSettings || getDefaultBillSettings(),
      savedBills: importedData.savedBills || [],
    };

    localStorage.setItem(
      `${STORAGE_PREFIX}user_${email}`,
      JSON.stringify(userData)
    );
    return true;
  } catch (error) {
    console.error("Error importing user data:", error);
    return false;
  }
}

// Get default bill settings
function getDefaultBillSettings(): BillSettings {
  return {
    region: "National Average",
    useTimeOfUse: false,
    season: "summer",
    homeSize: "medium",
    efficiencyRating: "average",
  };
}

// Get bill statistics
export function getBillStatistics(email: string): {
  totalBills: number;
  averageMonthly: number;
  totalYearly: number;
  highestBill: SavedBill | null;
  lowestBill: SavedBill | null;
} {
  try {
    const bills = getUserBills(email);

    if (bills.length === 0) {
      return {
        totalBills: 0,
        averageMonthly: 0,
        totalYearly: 0,
        highestBill: null,
        lowestBill: null,
      };
    }

    const monthlyAmounts = bills.map((bill) => bill.calculation.monthlyBill);
    const totalMonthly = monthlyAmounts.reduce(
      (sum, amount) => sum + amount,
      0
    );
    const averageMonthly = totalMonthly / bills.length;

    const highestBill = bills.reduce((max, bill) =>
      bill.calculation.monthlyBill > max.calculation.monthlyBill ? bill : max
    );

    const lowestBill = bills.reduce((min, bill) =>
      bill.calculation.monthlyBill < min.calculation.monthlyBill ? bill : min
    );

    return {
      totalBills: bills.length,
      averageMonthly,
      totalYearly: averageMonthly * 12,
      highestBill,
      lowestBill,
    };
  } catch (error) {
    console.error("Error calculating bill statistics:", error);
    return {
      totalBills: 0,
      averageMonthly: 0,
      totalYearly: 0,
      highestBill: null,
      lowestBill: null,
    };
  }
}
