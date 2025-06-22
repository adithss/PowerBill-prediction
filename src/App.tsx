import React, { useState, useEffect, useCallback } from "react";
import myImage from "./assets/black_circle_360x360.png";
import {
  Calculator,
  Zap,
  Home,
  TrendingUp,
  Lightbulb,
  Settings as SettingsIcon,
  LogOut,
  User,
  Download,
  Upload,
  Calendar,
  Plus,
  Archive,
} from "lucide-react";
import ApplianceForm from "./components/ApplianceForm";
import BillPredictor from "./components/BillPredictor";
import EnergyTips from "./components/EnergyTips";
import BillSettings from "./components/BillSettings";
import BillHistory from "./components/BillHistory"; // New component
import SignIn from "./components/SignIn";
import {
  Appliance,
  BillCalculation,
  BillSettings as BillSettingsType,
  SavedBill,
} from "./types";
import { calculateBill } from "./utils/calculations";
import {
  getUserData,
  saveUserAppliances,
  saveUserBillSettings,
  saveUserBill,
  getUserBills,
  deleteUserBill,
  clearCurrentUserSession,
  exportUserData,
  importUserData,
} from "./utils/storage";
import { BoltChatBot } from "./components/BoltChatBot";
interface User {
  email: string;
  name: string;
}
// Add this function before the App component definition
const calculateAggregatedBillData = (bills: SavedBill[]): BillCalculation => {
  if (bills.length === 0) {
    return {
      monthlyBill: 0,
      yearlyBill: 0,
      totalKwh: 0,
      dailyAverage: 0,
      applianceBreakdown: [],
      categoryBreakdown: [],
    };
  }

  // Calculate averages across all bills
  const totalMonthlyBill = bills.reduce(
    (sum, bill) => sum + bill.calculation.monthlyBill,
    0
  );
  const totalYearlyBill = bills.reduce(
    (sum, bill) => sum + bill.calculation.yearlyBill,
    0
  );
  const totalKwh = bills.reduce(
    (sum, bill) => sum + bill.calculation.totalKwh,
    0
  );

  const avgMonthlyBill = totalMonthlyBill / bills.length;
  const avgYearlyBill = totalYearlyBill / bills.length;
  const avgKwh = totalKwh / bills.length;
  const avgDailyAverage = avgKwh / 30;

  // Aggregate appliance data
  const applianceMap = new Map();
  bills.forEach((bill) => {
    bill.calculation.applianceBreakdown.forEach((item) => {
      const key = `${item.appliance.name}-${item.appliance.wattage}`;
      if (applianceMap.has(key)) {
        const existing = applianceMap.get(key);
        existing.monthlyCost += item.monthlyCost;
        existing.monthlyKwh += item.monthlyKwh;
        existing.count += 1;
      } else {
        applianceMap.set(key, {
          ...item,
          count: 1,
        });
      }
    });
  });

  // Calculate average appliance breakdown
  const applianceBreakdown = Array.from(applianceMap.values()).map((item) => ({
    ...item,
    monthlyCost: item.monthlyCost / item.count,
    monthlyKwh: item.monthlyKwh / item.count,
    percentage: (item.monthlyCost / item.count / avgMonthlyBill) * 100,
  }));

  // Aggregate category data
  const categoryMap = new Map();
  bills.forEach((bill) => {
    bill.calculation.categoryBreakdown.forEach((item) => {
      if (categoryMap.has(item.category)) {
        const existing = categoryMap.get(item.category);
        existing.monthlyCost += item.monthlyCost;
        existing.count += 1;
      } else {
        categoryMap.set(item.category, {
          ...item,
          count: 1,
        });
      }
    });
  });

  // Calculate average category breakdown
  const categoryBreakdown = Array.from(categoryMap.values()).map((item) => ({
    ...item,
    monthlyCost: item.monthlyCost / item.count,
    percentage: (item.monthlyCost / item.count / totalMonthlyBill) * 100,
  }));

  return {
    monthlyBill: avgMonthlyBill,
    yearlyBill: avgYearlyBill,
    totalKwh: avgKwh,
    dailyAverage: avgDailyAverage,
    applianceBreakdown: applianceBreakdown,
    categoryBreakdown: categoryBreakdown,
  };
};
function App() {
  const [user, setUser] = useState<User | null>(null);
  const [appliances, setAppliances] = useState<Appliance[]>([]);
  const [billData, setBillData] = useState<BillCalculation | null>(null);
  const [savedBills, setSavedBills] = useState<SavedBill[]>([]);
  const [activeTab, setActiveTab] = useState<
    "input" | "settings" | "results" | "tips" | "history"
  >("input");
  const [billSettings, setBillSettings] = useState<BillSettingsType>({
    region: "National Average",
    useTimeOfUse: false,
    season: "summer",
    homeSize: "medium",
    efficiencyRating: "average",
  });
  const [isLoadingData, setIsLoadingData] = useState(false);
  const [currentBillName, setCurrentBillName] = useState<string>("");

  // Check for saved user on app load
  useEffect(() => {
    const savedUser = localStorage.getItem("powerpredict_current_user");
    if (savedUser) {
      setUser(JSON.parse(savedUser));
    }
  }, []);

  // Load user-specific data when user changes
  useEffect(() => {
    if (user) {
      setIsLoadingData(true);

      // Save current user
      localStorage.setItem("powerpredict_current_user", JSON.stringify(user));

      // Load user's saved data
      const userData = getUserData(user.email);
      if (userData) {
        setAppliances(userData.appliances || []);
        setBillSettings(
          userData.billSettings || {
            region: "National Average",
            useTimeOfUse: false,
            season: "summer",
            homeSize: "medium",
            efficiencyRating: "average",
          }
        );
      } else {
        // New user - set defaults
        setAppliances([]);
        setBillSettings({
          region: "National Average",
          useTimeOfUse: false,
          season: "summer",
          homeSize: "medium",
          efficiencyRating: "average",
        });
      }

      // Load saved bills
      const userBills = getUserBills(user.email);
      setSavedBills(userBills);

      setIsLoadingData(false);
    }
  }, [user]);

  // Auto-save appliances when they change
  useEffect(() => {
    if (user && !isLoadingData && appliances.length >= 0) {
      saveUserAppliances(user.email, appliances);
    }
  }, [appliances, user, isLoadingData]);

  // Auto-save bill settings when they change
  useEffect(() => {
    if (user && !isLoadingData) {
      saveUserBillSettings(user.email, billSettings);
    }
  }, [billSettings, user, isLoadingData]);

  // Calculate bill when appliances or settings change
  // useEffect(() => {
  //   if (appliances.length > 0) {
  //     const calculation = calculateBill(appliances, billSettings);
  //     setBillData(calculation);
  //   } else {
  //     setBillData(null);
  //   }
  // }, [appliances, billSettings]);
  // Replace the existing useEffect that calculates billData (around line 108-116)
  // Calculate bill when appliances or settings change, OR when saved bills change
  useEffect(() => {
    if (activeTab === "results" && savedBills.length > 0) {
      // For results tab, use aggregated data from all saved bills
      const aggregatedData = calculateAggregatedBillData(savedBills);
      setBillData(aggregatedData);
    } else if (appliances.length > 0) {
      // For current bill tab, use current appliances and settings
      const calculation = calculateBill(appliances, billSettings);
      setBillData(calculation);
    } else {
      setBillData(null);
    }
  }, [appliances, billSettings, savedBills, activeTab]);

  const addAppliance = useCallback((appliance: Appliance) => {
    setAppliances((prev) => [
      ...prev,
      { ...appliance, id: Date.now().toString() },
    ]);
  }, []);

  const removeAppliance = useCallback((id: string) => {
    setAppliances((prev) => prev.filter((a) => a.id !== id));
  }, []);

  const updateAppliance = useCallback(
    (id: string, updatedAppliance: Partial<Appliance>) => {
      setAppliances((prev) =>
        prev.map((a) => (a.id === id ? { ...a, ...updatedAppliance } : a))
      );
    },
    []
  );

  const handleSignIn = (userData: User) => {
    setUser(userData);
  };

  const handleSignOut = () => {
    setUser(null);
    setAppliances([]);
    setBillData(null);
    setSavedBills([]);
    setActiveTab("input");
    setCurrentBillName("");
    setBillSettings({
      region: "National Average",
      useTimeOfUse: false,
      season: "summer",
      homeSize: "medium",
      efficiencyRating: "average",
    });
    clearCurrentUserSession();
  };

  const handleBillSettingsChange = (newSettings: BillSettingsType) => {
    setBillSettings(newSettings);
  };

  // Save current bill
  const handleSaveBill = () => {
    if (!user || !billData) return;

    const billName =
      currentBillName || `Bill ${new Date().toLocaleDateString()}`;
    const currentDate = new Date();

    const newBill: SavedBill = {
      id: Date.now().toString(),
      name: billName,
      month: currentDate.toLocaleDateString("en-US", { month: "long" }),
      year: currentDate.getFullYear(),
      appliances: [...appliances],
      settings: { ...billSettings },
      calculation: { ...billData },
      createdAt: currentDate,
      updatedAt: currentDate,
    };

    saveUserBill(user.email, newBill);
    setSavedBills((prev) => [newBill, ...prev]);
    setCurrentBillName("");

    // Show success message
    alert("Bill saved successfully!");
  };

  // Delete a saved bill
  const handleDeleteBill = (billId: string) => {
    if (!user) return;

    if (confirm("Are you sure you want to delete this bill?")) {
      deleteUserBill(user.email, billId);
      setSavedBills((prev) => prev.filter((bill) => bill.id !== billId));
    }
  };

  // Load a saved bill
  const handleLoadBill = (bill: SavedBill) => {
    setAppliances(bill.appliances);
    setBillSettings(bill.settings);
    setCurrentBillName(bill.name);
    setActiveTab("input");
  };

  // Export user data
  const handleExportData = () => {
    if (!user) return;

    const dataString = exportUserData(user.email);
    if (dataString) {
      const blob = new Blob([dataString], { type: "application/json" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `powerpredict-data-${user.email}-${
        new Date().toISOString().split("T")[0]
      }.json`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    }
  };

  // Import user data
  const handleImportData = (event: React.ChangeEvent<HTMLInputElement>) => {
    if (!user || !event.target.files?.[0]) return;

    const file = event.target.files[0];
    const reader = new FileReader();

    reader.onload = (e) => {
      try {
        const jsonData = e.target?.result as string;
        const success = importUserData(user.email, jsonData);

        if (success) {
          // Reload data after import
          const userData = getUserData(user.email);
          if (userData) {
            setAppliances(userData.appliances || []);
            setBillSettings(userData.billSettings || billSettings);
          }

          // Reload saved bills
          const userBills = getUserBills(user.email);
          setSavedBills(userBills);

          alert("Data imported successfully!");
        } else {
          alert("Failed to import data. Please check the file format.");
        }
      } catch (error) {
        alert("Failed to import data. Invalid file format.");
      }
    };

    reader.readAsText(file);
    event.target.value = ""; // Reset input
  };

  // Show sign-in page if user is not authenticated
  if (!user) {
    return <SignIn onSignIn={handleSignIn} />;
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-100">
      {/* Header */}
      <header className="bg-white/80 backdrop-blur-sm border-b border-blue-100 sticky top-0 z-10">
        <div className="max-w-7xl mx-auto px-4 py-2">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <div className="p-2 bg-gradient-to-r from-blue-500 to-indigo-600 rounded-xl">
                <Zap className="h-8 w-8 text-white" />
              </div>
              <div>
                <h1 className="text-2xl font-bold text-gray-900">
                  PowerPredict
                </h1>
                <p className="text-sm text-gray-600">
                  Smart electricity bill prediction
                </p>
              </div>
            </div>

            <div className="flex items-center space-x-6">
              {/* Current Bill Name Input */}
              {activeTab === "input" && (
                <div className="hidden lg:flex items-center space-x-2">
                  <input
                    type="text"
                    value={currentBillName}
                    onChange={(e) => setCurrentBillName(e.target.value)}
                    placeholder="Enter bill name..."
                    className="px-3 py-1 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                  <button
                    onClick={handleSaveBill}
                    disabled={!billData}
                    className="flex items-center space-x-1 px-3 py-1 text-sm bg-green-500 text-white rounded-lg hover:bg-green-600 disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors"
                  >
                    <Archive className="h-4 w-4" />
                    <span>Save Bill</span>
                  </button>
                </div>
              )}

              {/* Bill Summary */}
              {billData && (
                <div className="hidden lg:flex items-center space-x-6 text-sm">
                  <div className="text-center">
                    <p className="font-semibold text-blue-600">
                      {billData.totalKwh.toFixed(1)} kWh
                    </p>
                    <p className="text-gray-500">Monthly Usage</p>
                  </div>
                  <div className="text-center">
                    <p className="font-bold text-2xl text-green-600">
                      ${billData.monthlyBill.toFixed(2)}
                    </p>
                    <p className="text-gray-500">Estimated Bill</p>
                  </div>
                </div>
              )}

              {/* Data Management */}
              <div className="hidden md:flex items-center space-x-2">
                <button
                  onClick={handleExportData}
                  className="flex items-center space-x-1 px-3 py-2 text-sm text-gray-600 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-all duration-200"
                  title="Export Data"
                >
                  <Download className="h-4 w-4" />
                  <span className="hidden lg:inline">Export</span>
                </button>

                <label
                  className="flex items-center space-x-1 px-3 py-2 text-sm text-gray-600 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-all duration-200 cursor-pointer"
                  title="Import Data"
                >
                  <Upload className="h-4 w-4" />
                  <span className="hidden lg:inline">Import</span>
                  <input
                    type="file"
                    accept=".json"
                    onChange={handleImportData}
                    className="hidden"
                  />
                </label>
              </div>

              {/* User Menu */}
              <div className="flex items-center space-x-4">
                <div className="flex items-center space-x-2 text-sm">
                  <div className="p-2 bg-gray-100 rounded-lg">
                    <User className="h-4 w-4 text-gray-600" />
                  </div>
                  <div className="hidden sm:block">
                    <p className="font-medium text-gray-900">{user.name}</p>
                    <p className="text-gray-500 text-xs">{user.email}</p>
                  </div>
                </div>

                <button
                  onClick={handleSignOut}
                  className="flex items-center space-x-2 px-3 py-2 text-sm text-gray-600 hover:text-red-600 hover:bg-red-50 rounded-lg transition-all duration-200"
                  title="Sign Out"
                >
                  <LogOut className="h-4 w-4" />
                  <span className="hidden sm:inline">Sign Out</span>
                </button>
              </div>
            </div>
            <div className="flex items-center justify-center p-4">
              <a
                href="https://bolt.new/"
                target="_blank"
                rel="noopener noreferrer"
              >
                <img
                  src={myImage}
                  alt="My PNG"
                  className="w-20 h-auto rounded-lg shadow-md hover:opacity-80 transition"
                />
              </a>
            </div>
          </div>
        </div>
      </header>

      {/* Loading State */}
      {isLoadingData && (
        <div className="max-w-7xl mx-auto px-4 py-8">
          <div className="bg-white/60 backdrop-blur-sm rounded-xl p-8 text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
            <p className="text-gray-600">Loading your data...</p>
          </div>
        </div>
      )}

      {!isLoadingData && (
        <>
          {/* Navigation Tabs */}
          <div className="max-w-7xl mx-auto px-4 py-6">
            <div className="flex space-x-1 bg-white/60 backdrop-blur-sm p-1 rounded-xl border border-white/20">
              <button
                onClick={() => setActiveTab("input")}
                className={`flex-1 flex items-center justify-center space-x-2 py-3 px-4 rounded-lg font-medium transition-all duration-200 ${
                  activeTab === "input"
                    ? "bg-white text-blue-600 shadow-sm"
                    : "text-gray-600 hover:text-blue-600"
                }`}
              >
                <Home className="h-4 w-4" />
                <span>Current Bill</span>
                {appliances.length > 0 && (
                  <span className="bg-blue-100 text-blue-600 text-xs px-2 py-1 rounded-full">
                    {appliances.length}
                  </span>
                )}
              </button>
              <button
                onClick={() => setActiveTab("settings")}
                className={`flex-1 flex items-center justify-center space-x-2 py-3 px-4 rounded-lg font-medium transition-all duration-200 ${
                  activeTab === "settings"
                    ? "bg-white text-blue-600 shadow-sm"
                    : "text-gray-600 hover:text-blue-600"
                }`}
              >
                <SettingsIcon className="h-4 w-4" />
                <span>Settings</span>
              </button>
              <button
                onClick={() => setActiveTab("results")}
                className={`flex-1 flex items-center justify-center space-x-2 py-3 px-4 rounded-lg font-medium transition-all duration-200 ${
                  activeTab === "results"
                    ? "bg-white text-blue-600 shadow-sm"
                    : "text-gray-600 hover:text-blue-600"
                }`}
                // disabled={!billData}
              >
                <Calculator className="h-4 w-4" />
                <span>Prediction</span>
              </button>
              <button
                onClick={() => setActiveTab("history")}
                className={`flex-1 flex items-center justify-center space-x-2 py-3 px-4 rounded-lg font-medium transition-all duration-200 ${
                  activeTab === "history"
                    ? "bg-white text-blue-600 shadow-sm"
                    : "text-gray-600 hover:text-blue-600"
                }`}
              >
                <Calendar className="h-4 w-4" />
                <span>Bill History</span>
                {savedBills.length > 0 && (
                  <span className="bg-purple-100 text-purple-600 text-xs px-2 py-1 rounded-full">
                    {savedBills.length}
                  </span>
                )}
              </button>
              <button
                onClick={() => setActiveTab("tips")}
                className={`flex-1 flex items-center justify-center space-x-2 py-3 px-4 rounded-lg font-medium transition-all duration-200 ${
                  activeTab === "tips"
                    ? "bg-white text-blue-600 shadow-sm"
                    : "text-gray-600 hover:text-blue-600"
                }`}
              >
                <Lightbulb className="h-4 w-4" />
                <span>Tips</span>
              </button>
            </div>
          </div>

          {/* Main Content */}
          <main className="max-w-7xl mx-auto px-4 pb-12">
            {activeTab === "input" && (
              <ApplianceForm
                appliances={appliances}
                onAddAppliance={addAppliance}
                onRemoveAppliance={removeAppliance}
                onUpdateAppliance={updateAppliance}
              />
            )}
            {activeTab === "settings" && (
              <BillSettings
                settings={billSettings}
                onSettingsChange={handleBillSettingsChange}
              />
            )}

            {activeTab === "results" && billData && (
              <BillPredictor
                billData={billData}
                appliances={
                  activeTab === "results" && savedBills.length > 0
                    ? []
                    : appliances
                }
                isAggregatedView={savedBills.length > 0}
                totalBillsCount={savedBills.length}
              />
            )}
            {activeTab === "history" && (
              <BillHistory
                bills={savedBills}
                onDeleteBill={handleDeleteBill}
                onLoadBill={handleLoadBill}
              />
            )}
            {activeTab === "tips" && <EnergyTips billData={billData} />}
          </main>
          {billData && (
            <BoltChatBot
              prediction={{
                usageLevel: billData.monthlyBill > 1500 ? "high" : "medium",
                currentMonth: billData.monthlyBill,
                potentialSavings: billData.monthlyBill * 0.25,
              }}
            />
          )}
        </>
      )}
    </div>
  );
}

export default App;
