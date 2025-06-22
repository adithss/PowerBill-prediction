import React, { useState, useMemo } from "react";
import {
  Calendar,
  Trash2,
  Eye,
  Download,
  TrendingUp,
  Zap,
  DollarSign,
  ArrowUpDown,
  BarChart3,
  PieChart,
  LineChart,
  Activity,
  Target,
  Lightbulb,
} from "lucide-react";
import {
  LineChart as RechartsLineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  BarChart,
  Bar,
  PieChart as RechartsPieChart,
  Cell,
  Area,
  AreaChart,
  ComposedChart,
  Legend,
  Pie,
} from "recharts";
import { SavedBill } from "../types";
import { formatCurrency, formatKwh } from "../utils/calculations";

interface Props {
  bills: SavedBill[];
  onDeleteBill: (billId: string) => void;
  onLoadBill: (bill: SavedBill) => void;
}

export default function BillHistory({
  bills,
  onDeleteBill,
  onLoadBill,
}: Props) {
  const [selectedBill, setSelectedBill] = useState<SavedBill | null>(null);
  const [sortBy, setSortBy] = useState<"date" | "amount" | "name">("date");
  const [sortOrder, setSortOrder] = useState<"asc" | "desc">("desc");
  const [activeChartTab, setActiveChartTab] = useState<
    "trends" | "comparison" | "breakdown"
  >("trends");

  // Sort bills
  const sortedBills = [...bills].sort((a, b) => {
    let comparison = 0;

    switch (sortBy) {
      case "date":
        comparison =
          new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime();
        break;
      case "amount":
        comparison = a.calculation.monthlyBill - b.calculation.monthlyBill;
        break;
      case "name":
        comparison = a.name.localeCompare(b.name);
        break;
    }

    return sortOrder === "asc" ? comparison : -comparison;
  });

  // Prepare chart data
  const chartData = useMemo(() => {
    if (bills.length === 0) {
      return {
        trends: [],
        categories: [],
        comparison: [],
      };
    }

    const trendsData = [...bills]
      .sort(
        (a, b) =>
          new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()
      )
      .map((bill, index) => ({
        name: bill.name,
        date: new Date(bill.createdAt).toLocaleDateString("en-US", {
          month: "short",
          day: "numeric",
        }),
        monthlyBill: bill.calculation.monthlyBill,
        monthlyKwh: bill.calculation.totalKwh,
        appliances: bill.appliances.length,
        dailyAverage: bill.calculation.dailyAverage,
        index: index + 1,
      }));

    // Category breakdown data
    const categoryData = new Map<string, number>();
    bills.forEach((bill) => {
      if (bill.calculation.categoryBreakdown) {
        bill.calculation.categoryBreakdown.forEach((category) => {
          if (categoryData.has(category.category)) {
            categoryData.set(
              category.category,
              categoryData.get(category.category)! + category.monthlyCost
            );
          } else {
            categoryData.set(category.category, category.monthlyCost);
          }
        });
      }
    });

    const categoryChartData = Array.from(categoryData.entries()).map(
      ([category, cost]) => ({
        category,
        cost: cost / bills.length, // Average cost per category across all bills
        percentage:
          (cost /
            bills.reduce(
              (sum, bill) => sum + bill.calculation.monthlyBill,
              0
            )) *
          100,
      })
    );

    // Monthly comparison data
    const monthlyComparison = bills.reduce((acc, bill) => {
      const monthYear = `${bill.month || "N/A"} ${bill.year || "N/A"}`;
      if (!acc[monthYear]) {
        acc[monthYear] = {
          monthYear,
          totalBills: 0,
          totalCost: 0,
          totalKwh: 0,
          avgCost: 0,
          avgKwh: 0,
        };
      }
      acc[monthYear].totalBills += 1;
      acc[monthYear].totalCost += bill.calculation.monthlyBill;
      acc[monthYear].totalKwh += bill.calculation.totalKwh;
      acc[monthYear].avgCost =
        acc[monthYear].totalCost / acc[monthYear].totalBills;
      acc[monthYear].avgKwh =
        acc[monthYear].totalKwh / acc[monthYear].totalBills;
      return acc;
    }, {} as Record<string, any>);

    const comparisonData = Object.values(monthlyComparison);

    return {
      trends: trendsData,
      categories: categoryChartData,
      comparison: comparisonData,
    };
  }, [bills]);

  // Calculate statistics
  const stats = useMemo(() => {
    const totalBills = bills.length;
    if (totalBills === 0) return null;

    const totalCost = bills.reduce(
      (sum, bill) => sum + bill.calculation.monthlyBill,
      0
    );
    const totalKwh = bills.reduce(
      (sum, bill) => sum + bill.calculation.totalKwh,
      0
    );
    const averageMonthly = totalCost / totalBills;
    const averageKwh = totalKwh / totalBills;

    const highestBill = bills.reduce((max, bill) =>
      bill.calculation.monthlyBill > max.calculation.monthlyBill ? bill : max
    );

    const lowestBill = bills.reduce((min, bill) =>
      bill.calculation.monthlyBill < min.calculation.monthlyBill ? bill : min
    );

    // Trend calculation
    const sortedByDate = [...bills].sort(
      (a, b) =>
        new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()
    );

    const trend =
      sortedByDate.length > 1
        ? ((sortedByDate[sortedByDate.length - 1].calculation.monthlyBill -
            sortedByDate[0].calculation.monthlyBill) /
            sortedByDate[0].calculation.monthlyBill) *
          100
        : 0;

    return {
      totalBills,
      totalCost,
      averageMonthly,
      averageKwh,
      highestBill,
      lowestBill,
      trend,
    };
  }, [bills]);

  const handleSort = (field: "date" | "amount" | "name") => {
    if (sortBy === field) {
      setSortOrder(sortOrder === "asc" ? "desc" : "asc");
    } else {
      setSortBy(field);
      setSortOrder("desc");
    }
  };

  const exportBill = (bill: SavedBill) => {
    const exportData = {
      ...bill,
      exportDate: new Date().toISOString(),
    };

    const blob = new Blob([JSON.stringify(exportData, null, 2)], {
      type: "application/json",
    });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `${bill.name.replace(/[^a-z0-9]/gi, "_").toLowerCase()}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const COLORS = [
    "#3B82F6",
    "#EF4444",
    "#10B981",
    "#F59E0B",
    "#8B5CF6",
    "#EC4899",
    "#06B6D4",
    "#84CC16",
    "#F97316",
    "#6366F1",
  ];

  if (bills.length === 0) {
    return (
      <div className="space-y-6">
        <div className="bg-white/60 backdrop-blur-sm rounded-xl p-8 text-center border border-white/20">
          <Calendar className="h-16 w-16 text-gray-400 mx-auto mb-4" />
          <h3 className="text-xl font-semibold text-gray-900 mb-2">
            No Bills Saved Yet
          </h3>
          <p className="text-gray-600 mb-4">
            Start by adding appliances and saving your first bill prediction.
          </p>
          <p className="text-sm text-gray-500">
            Your saved bills will appear here for easy comparison and tracking.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Enhanced Statistics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-gradient-to-br from-purple-500 to-pink-600 text-white rounded-xl p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-white/80">Total Spent</p>
              <p className="text-2xl font-bold">
                {formatCurrency(stats?.totalCost || 0)}
              </p>
              <p className="text-xs text-white/70 mt-1">
                Across {stats?.totalBills} bills
              </p>
            </div>
            <Calendar className="h-8 w-8 text-white/60" />
          </div>
        </div>

        <div className="bg-gradient-to-br from-blue-500 to-indigo-600 text-white rounded-xl p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-white/80">
                Average Monthly
              </p>
              <p className="text-2xl font-bold">
                {formatCurrency(stats?.averageMonthly || 0)}
              </p>
              <p className="text-xs text-white/70 mt-1">
                {formatKwh(stats?.averageKwh || 0)} usage
              </p>
            </div>
            <DollarSign className="h-8 w-8 text-white/60" />
          </div>
        </div>

        <div className="bg-gradient-to-br from-orange-500 to-red-600 text-white rounded-xl p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-white/80">Highest Bill</p>
              <p className="text-2xl font-bold">
                {stats?.highestBill
                  ? formatCurrency(stats.highestBill.calculation.monthlyBill)
                  : "--"}
              </p>
              <p className="text-xs text-white/70 mt-1 truncate">
                {stats?.highestBill?.name || "N/A"}
              </p>
            </div>
            <TrendingUp className="h-8 w-8 text-white/60" />
          </div>
        </div>

        <div className="bg-gradient-to-br from-green-500 to-emerald-600 text-white rounded-xl p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-white/80">
                {stats?.trend && stats.trend > 0
                  ? "Trending Up"
                  : stats?.trend && stats.trend < 0
                  ? "Trending Down"
                  : "Stable"}
              </p>
              <p className="text-2xl font-bold">
                {stats?.trend ? `${Math.abs(stats.trend).toFixed(1)}%` : "0%"}
              </p>
              <p className="text-xs text-white/70 mt-1">Cost trend</p>
            </div>
            <Activity className="h-8 w-8 text-white/60" />
          </div>
        </div>
      </div>

      {/* Interactive Charts Section */}
      <div className="bg-white/60 backdrop-blur-sm rounded-xl border border-white/20 overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-200">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-semibold text-gray-900">
              Bill Analytics
            </h3>
            <div className="flex space-x-1 bg-gray-100 p-1 rounded-lg">
              <button
                onClick={() => setActiveChartTab("trends")}
                className={`px-4 py-2 text-sm font-medium rounded-md transition-colors ${
                  activeChartTab === "trends"
                    ? "bg-white text-blue-600 shadow-sm"
                    : "text-gray-600 hover:text-blue-600"
                }`}
              >
                <LineChart className="h-4 w-4 inline mr-2" />
                Trends
              </button>
              <button
                onClick={() => setActiveChartTab("comparison")}
                className={`px-4 py-2 text-sm font-medium rounded-md transition-colors ${
                  activeChartTab === "comparison"
                    ? "bg-white text-blue-600 shadow-sm"
                    : "text-gray-600 hover:text-blue-600"
                }`}
              >
                <BarChart3 className="h-4 w-4 inline mr-2" />
                Compare
              </button>
              <button
                onClick={() => setActiveChartTab("breakdown")}
                className={`px-4 py-2 text-sm font-medium rounded-md transition-colors ${
                  activeChartTab === "breakdown"
                    ? "bg-white text-blue-600 shadow-sm"
                    : "text-gray-600 hover:text-blue-600"
                }`}
              >
                <PieChart className="h-4 w-4 inline mr-2" />
                Breakdown
              </button>
            </div>
          </div>
        </div>

        <div className="p-6">
          {/* Trends Chart */}
          {activeChartTab === "trends" && chartData.trends.length > 0 && (
            <div className="space-y-6">
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Cost Trend */}
                <div>
                  <h4 className="text-md font-semibold text-gray-900 mb-4">
                    Cost Trend Over Time
                  </h4>
                  <div className="h-64">
                    <ResponsiveContainer width="100%" height="100%">
                      <AreaChart data={chartData.trends}>
                        <defs>
                          <linearGradient
                            id="colorGradient"
                            x1="0"
                            y1="0"
                            x2="0"
                            y2="1"
                          >
                            <stop
                              offset="5%"
                              stopColor="#3b82f6"
                              stopOpacity={0.3}
                            />
                            <stop
                              offset="95%"
                              stopColor="#3b82f6"
                              stopOpacity={0.1}
                            />
                          </linearGradient>
                        </defs>
                        <CartesianGrid strokeDasharray="3 3" stroke="#e0e7ff" />
                        <XAxis
                          dataKey="name"
                          tick={{ fontSize: 12 }}
                          stroke="#6b7280"
                        />
                        <YAxis
                          tick={{ fontSize: 12 }}
                          stroke="#6b7280"
                          tickFormatter={(value) => `$${value}`}
                        />
                        <Tooltip
                          formatter={(value) => [
                            formatCurrency(Number(value)),
                            "Monthly Bill",
                          ]}
                          labelStyle={{ color: "#374151" }}
                          contentStyle={{
                            backgroundColor: "white",
                            border: "1px solid #e5e7eb",
                            borderRadius: "8px",
                            boxShadow: "0 4px 6px -1px rgba(0, 0, 0, 0.1)",
                          }}
                        />
                        <Area
                          type="monotone"
                          dataKey="monthlyBill"
                          stroke="#3b82f6"
                          fill="url(#colorGradient)"
                          strokeWidth={2}
                        />
                      </AreaChart>
                    </ResponsiveContainer>
                  </div>
                </div>

                {/* Usage Trend */}
                <div>
                  <h4 className="text-md font-semibold text-gray-900 mb-4">
                    Energy Usage Trend
                  </h4>
                  <div className="h-64">
                    <ResponsiveContainer width="100%" height="100%">
                      <RechartsLineChart data={chartData.trends}>
                        <CartesianGrid strokeDasharray="3 3" stroke="#e0e7ff" />
                        <XAxis
                          dataKey="name"
                          tick={{ fontSize: 12 }}
                          stroke="#6b7280"
                        />
                        <YAxis
                          tick={{ fontSize: 12 }}
                          stroke="#6b7280"
                          tickFormatter={(value) => `${value} kWh`}
                        />
                        <Tooltip
                          formatter={(value) => [
                            formatKwh(Number(value)),
                            "Monthly Usage",
                          ]}
                          labelStyle={{ color: "#374151" }}
                          contentStyle={{
                            backgroundColor: "white",
                            border: "1px solid #e5e7eb",
                            borderRadius: "8px",
                            boxShadow: "0 4px 6px -1px rgba(0, 0, 0, 0.1)",
                          }}
                        />
                        <Line
                          type="monotone"
                          dataKey="monthlyKwh"
                          stroke="#10b981"
                          strokeWidth={3}
                          dot={{ r: 4, fill: "#10b981" }}
                        />
                      </RechartsLineChart>
                    </ResponsiveContainer>
                  </div>
                </div>
              </div>

              {/* Combined Chart */}
              <div>
                <h4 className="text-md font-semibold text-gray-900 mb-4">
                  Cost vs Usage Correlation
                </h4>
                <div className="h-80">
                  <ResponsiveContainer width="100%" height="100%">
                    <ComposedChart data={chartData.trends}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#e0e7ff" />
                      <XAxis
                        dataKey="name"
                        tick={{ fontSize: 12 }}
                        stroke="#6b7280"
                      />
                      <YAxis
                        yAxisId="cost"
                        tick={{ fontSize: 12 }}
                        stroke="#6b7280"
                        tickFormatter={(value) => `$${value}`}
                      />
                      <YAxis
                        yAxisId="kwh"
                        orientation="right"
                        tick={{ fontSize: 12 }}
                        stroke="#6b7280"
                        tickFormatter={(value) => `${value} kWh`}
                      />
                      <Tooltip
                        formatter={(value, name) => [
                          name === "monthlyBill"
                            ? formatCurrency(Number(value))
                            : formatKwh(Number(value)),
                          name === "monthlyBill"
                            ? "Monthly Cost"
                            : "Monthly Usage",
                        ]}
                        labelStyle={{ color: "#374151" }}
                        contentStyle={{
                          backgroundColor: "white",
                          border: "1px solid #e5e7eb",
                          borderRadius: "8px",
                          boxShadow: "0 4px 6px -1px rgba(0, 0, 0, 0.1)",
                        }}
                      />
                      <Legend />
                      <Bar
                        yAxisId="cost"
                        dataKey="monthlyBill"
                        fill="#3b82f6"
                        name="Monthly Cost"
                        radius={[4, 4, 0, 0]}
                      />
                      <Line
                        yAxisId="kwh"
                        type="monotone"
                        dataKey="monthlyKwh"
                        stroke="#10b981"
                        strokeWidth={3}
                        name="Monthly Usage"
                      />
                    </ComposedChart>
                  </ResponsiveContainer>
                </div>
              </div>
            </div>
          )}

          {/* Comparison Chart */}
          {activeChartTab === "comparison" && chartData.trends.length > 0 && (
            <div className="space-y-6">
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Bills Comparison */}
                <div>
                  <h4 className="text-md font-semibold text-gray-900 mb-4">
                    Bill Comparison
                  </h4>
                  <div className="h-64">
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart data={chartData.trends}>
                        <CartesianGrid strokeDasharray="3 3" stroke="#e0e7ff" />
                        <XAxis
                          dataKey="name"
                          tick={{ fontSize: 10 }}
                          stroke="#6b7280"
                          angle={-45}
                          textAnchor="end"
                          height={80}
                        />
                        <YAxis
                          tick={{ fontSize: 12 }}
                          stroke="#6b7280"
                          tickFormatter={(value) => `$${value}`}
                        />
                        <Tooltip
                          formatter={(value) => [
                            formatCurrency(Number(value)),
                            "Monthly Bill",
                          ]}
                          labelStyle={{ color: "#374151" }}
                          contentStyle={{
                            backgroundColor: "white",
                            border: "1px solid #e5e7eb",
                            borderRadius: "8px",
                            boxShadow: "0 4px 6px -1px rgba(0, 0, 0, 0.1)",
                          }}
                        />
                        <Bar
                          dataKey="monthlyBill"
                          fill="#3b82f6"
                          radius={[4, 4, 0, 0]}
                        />
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                </div>

                {/* Appliance Count vs Cost */}
                <div>
                  <h4 className="text-md font-semibold text-gray-900 mb-4">
                    Appliances vs Cost
                  </h4>
                  <div className="h-64">
                    <ResponsiveContainer width="100%" height="100%">
                      <ComposedChart data={chartData.trends}>
                        <CartesianGrid strokeDasharray="3 3" stroke="#e0e7ff" />
                        <XAxis
                          dataKey="name"
                          tick={{ fontSize: 10 }}
                          stroke="#6b7280"
                          angle={-45}
                          textAnchor="end"
                          height={80}
                        />
                        <YAxis
                          yAxisId="cost"
                          tick={{ fontSize: 12 }}
                          stroke="#6b7280"
                          tickFormatter={(value) => `$${value}`}
                        />
                        <YAxis
                          yAxisId="count"
                          orientation="right"
                          tick={{ fontSize: 12 }}
                          stroke="#6b7280"
                        />
                        <Tooltip
                          formatter={(value, name) => {
                            if (name === "monthlyBill") {
                              return [
                                formatCurrency(Number(value)),
                                "Monthly Cost",
                              ];
                            } else if (name === "appliances") {
                              return [value, "Appliance Count"];
                            }
                            return [value, name];
                          }}
                          labelStyle={{ color: "#374151" }}
                          contentStyle={{
                            backgroundColor: "white",
                            border: "1px solid #e5e7eb",
                            borderRadius: "8px",
                            boxShadow: "0 4px 6px -1px rgba(0, 0, 0, 0.1)",
                          }}
                        />
                        <Legend />
                        <Bar
                          yAxisId="cost"
                          dataKey="monthlyBill"
                          fill="#3b82f6"
                          name="Monthly Cost"
                          radius={[4, 4, 0, 0]}
                        />
                        <Line
                          yAxisId="count"
                          type="monotone"
                          dataKey="appliances"
                          stroke="#ef4444"
                          strokeWidth={3}
                          name="Appliance Count"
                        />
                      </ComposedChart>
                    </ResponsiveContainer>
                  </div>
                </div>
              </div>

              {/* Monthly Comparison */}
              {/* {chartData.comparison.length > 0 && (
                <div>
                  <h4 className="text-md font-semibold text-gray-900 mb-4">
                    Monthly Averages
                  </h4>
                  <div className="h-64">
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart data={chartData.comparison}>
                        <CartesianGrid strokeDasharray="3 3" stroke="#e0e7ff" />
                        <XAxis
                          dataKey="monthYear"
                          tick={{ fontSize: 12 }}
                          stroke="#6b7280"
                        />
                        <YAxis
                          tick={{ fontSize: 12 }}
                          stroke="#6b7280"
                          tickFormatter={(value) => `$${value}`}
                        />
                        <Tooltip
                          formatter={(value) => [
                            formatCurrency(Number(value)),
                            "Average Cost",
                          ]}
                          labelStyle={{ color: "#374151" }}
                          contentStyle={{
                            backgroundColor: "white",
                            border: "1px solid #e5e7eb",
                            borderRadius: "8px",
                            boxShadow: "0 4px 6px -1px rgba(0, 0, 0, 0.1)",
                          }}
                        />
                        <Bar
                          dataKey="avgCost"
                          fill="#8b5cf6"
                          radius={[4, 4, 0, 0]}
                        />
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                </div>
              )} */}
            </div>
          )}

          {/* Breakdown Charts */}
          {activeChartTab === "breakdown" &&
            chartData.categories.length > 0 && (
              <div className="space-y-6">
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  {/* Category Breakdown Pie Chart */}
                  <div>
                    <h4 className="text-md font-semibold text-gray-900 mb-4">
                      Average Cost by Category
                    </h4>
                    <div className="h-64">
                      <ResponsiveContainer width="100%" height="100%">
                        <RechartsPieChart>
                          <Pie
                            data={chartData.categories}
                            cx="50%"
                            cy="50%"
                            innerRadius={60}
                            outerRadius={100}
                            paddingAngle={5}
                            dataKey="cost"
                          >
                            {chartData.categories.map((entry, index) => (
                              <Cell
                                key={`cell-${index}`}
                                fill={COLORS[index % COLORS.length]}
                              />
                            ))}
                          </Pie>
                          <Tooltip
                            formatter={(value) => [
                              formatCurrency(Number(value)),
                              "Average Cost",
                            ]}
                            contentStyle={{
                              backgroundColor: "white",
                              border: "1px solid #e5e7eb",
                              borderRadius: "8px",
                              boxShadow: "0 4px 6px -1px rgba(0, 0, 0, 0.1)",
                            }}
                          />
                          <Legend />
                        </RechartsPieChart>
                      </ResponsiveContainer>
                    </div>
                  </div>

                  <div>
                    <div>
                      {chartData.categories.length > 0 ? (
                        <div className="bg-gray-50 rounded-lg p-4 h-64 flex flex-col justify-center">
                          <h5 className="text-lg font-medium text-gray-900 mb-3">
                            Category Details
                          </h5>
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            {chartData.categories.map((category, index) => (
                              <div
                                key={category.category}
                                className="flex items-center justify-between p-3 bg-white rounded-lg shadow-sm"
                              >
                                <div className="flex items-center space-x-3">
                                  <div
                                    className="w-4 h-4 rounded-full"
                                    style={{
                                      backgroundColor:
                                        COLORS[index % COLORS.length],
                                    }}
                                  />
                                  <span className="text-sm font-medium text-gray-900">
                                    {category.category}
                                  </span>
                                </div>
                                <div className="text-right">
                                  <div className="text-sm font-semibold text-gray-900">
                                    {formatCurrency(category.cost)}
                                  </div>
                                  <div className="text-xs text-gray-500">
                                    {category.percentage.toFixed(1)}%
                                  </div>
                                </div>
                              </div>
                            ))}
                          </div>
                        </div>
                      ) : (
                        <div className="bg-gray-50 rounded-lg p-4 h-64 flex flex-col justify-center items-center">
                          <PieChart className="h-8 w-8 text-gray-400 mb-2" />
                          <p className="text-gray-600 text-center">
                            No category data available
                          </p>
                        </div>
                      )}
                    </div>
                    {/* <h4 className="text-md font-semibold text-gray-900 mb-4">
                      Category Breakdown
                    </h4>
                    <div className="h-64">
                      <ResponsiveContainer width="100%" height="100%">
                        <BarChart
                          data={chartData.categories}
                          layout="horizontal"
                        >
                          <CartesianGrid
                            strokeDasharray="3 3"
                            stroke="#e0e7ff"
                          />
                          <XAxis
                            type="number"
                            tick={{ fontSize: 12 }}
                            stroke="#6b7280"
                            tickFormatter={(value) => `$${value}`}
                          />
                          <YAxis
                            type="category"
                            dataKey="category"
                            tick={{ fontSize: 12 }}
                            stroke="#6b7280"
                            width={80}
                          />
                          <Tooltip
                            formatter={(value) => [
                              formatCurrency(Number(value)),
                              "Average Cost",
                            ]}
                            labelStyle={{ color: "#374151" }}
                            contentStyle={{
                              backgroundColor: "white",
                              border: "1px solid #e5e7eb",
                              borderRadius: "8px",
                              boxShadow: "0 4px 6px -1px rgba(0, 0, 0, 0.1)",
                            }}
                          />
                          <Bar
                            dataKey="cost"
                            fill="#10b981"
                            radius={[0, 4, 4, 0]}
                          />
                        </BarChart>
                      </ResponsiveContainer>
                    </div> */}
                  </div>
                </div>

                {/* Category Legend */}
              </div>
            )}
        </div>
      </div>
      <div className="bg-white/60 backdrop-blur-sm rounded-xl border border-white/20">
        <div className="px-6 py-4 border-b border-gray-200">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-semibold text-gray-900">Saved Bills</h3>
            <div className="flex items-center space-x-2">
              <button
                onClick={() => handleSort("date")}
                className="flex items-center space-x-1 px-3 py-2 text-sm font-medium text-gray-700 hover:text-blue-600 rounded-md hover:bg-gray-50"
              >
                <Calendar className="h-4 w-4" />
                <span>Date</span>
                <ArrowUpDown className="h-3 w-3" />
              </button>
              <button
                onClick={() => handleSort("amount")}
                className="flex items-center space-x-1 px-3 py-2 text-sm font-medium text-gray-700 hover:text-blue-600 rounded-md hover:bg-gray-50"
              >
                <DollarSign className="h-4 w-4" />
                <span>Amount</span>
                <ArrowUpDown className="h-3 w-3" />
              </button>
              <button
                onClick={() => handleSort("name")}
                className="flex items-center space-x-1 px-3 py-2 text-sm font-medium text-gray-700 hover:text-blue-600 rounded-md hover:bg-gray-50"
              >
                <Target className="h-4 w-4" />
                <span>Name</span>
                <ArrowUpDown className="h-3 w-3" />
              </button>
            </div>
          </div>
        </div>

        <div className="divide-y divide-gray-200">
          {sortedBills.map((bill) => (
            <div
              key={bill.id}
              className="p-6 hover:bg-gray-50/50 transition-colors"
            >
              <div className="flex items-center justify-between">
                <div className="flex-1">
                  <div className="flex items-center space-x-3 mb-2">
                    <h4 className="text-lg font-semibold text-gray-900">
                      {bill.name}
                    </h4>
                    <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                      {bill.appliances.length} appliances
                    </span>
                  </div>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                    <div>
                      <span className="text-gray-500">Monthly Bill:</span>
                      <div className="font-semibold text-gray-900">
                        {formatCurrency(bill.calculation.monthlyBill)}
                      </div>
                    </div>
                    <div>
                      <span className="text-gray-500">Usage:</span>
                      <div className="font-semibold text-gray-900">
                        {formatKwh(bill.calculation.totalKwh)}
                      </div>
                    </div>
                    <div>
                      <span className="text-gray-500">Daily Average:</span>
                      <div className="font-semibold text-gray-900">
                        {formatCurrency(bill.calculation.dailyAverage)}
                      </div>
                    </div>
                    <div>
                      <span className="text-gray-500">Created:</span>
                      <div className="font-semibold text-gray-900">
                        {new Date(bill.createdAt).toLocaleDateString()}
                      </div>
                    </div>
                  </div>
                </div>
                <div className="flex items-center space-x-2 ml-4">
                  <button
                    onClick={() => setSelectedBill(bill)}
                    className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                    title="View Details"
                  >
                    <Eye className="h-4 w-4" />
                  </button>
                  <button
                    onClick={() => exportBill(bill)}
                    className="p-2 text-green-600 hover:bg-green-50 rounded-lg transition-colors"
                    title="Export Bill"
                  >
                    <Download className="h-4 w-4" />
                  </button>
                  <button
                    onClick={() => onLoadBill(bill)}
                    className="p-2 text-purple-600 hover:bg-purple-50 rounded-lg transition-colors"
                    title="Load Bill"
                  >
                    <Lightbulb className="h-4 w-4" />
                  </button>
                  <button
                    onClick={() => onDeleteBill(bill.id)}
                    className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                    title="Delete Bill"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Bill Details Modal */}
      {selectedBill && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-xl max-w-2xl w-full max-h-[80vh] overflow-y-auto">
            <div className="p-6 border-b border-gray-200">
              <div className="flex items-center justify-between">
                <h3 className="text-xl font-semibold text-gray-900">
                  {selectedBill.name} - Details
                </h3>
                <button
                  onClick={() => setSelectedBill(null)}
                  className="text-gray-400 hover:text-gray-600"
                >
                  ×
                </button>
              </div>
            </div>
            <div className="p-6">
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <span className="text-sm text-gray-500">Monthly Bill</span>
                    <div className="text-lg font-semibold text-gray-900">
                      {formatCurrency(selectedBill.calculation.monthlyBill)}
                    </div>
                  </div>
                  <div>
                    <span className="text-sm text-gray-500">Total Usage</span>
                    <div className="text-lg font-semibold text-gray-900">
                      {formatKwh(selectedBill.calculation.totalKwh)}
                    </div>
                  </div>
                </div>
                <div>
                  <span className="text-sm text-gray-500 block mb-2">
                    Appliances
                  </span>
                  <div className="space-y-2">
                    {selectedBill.appliances.map((appliance, index) => (
                      <div
                        key={index}
                        className="flex justify-between items-center p-2 bg-gray-50 rounded"
                      >
                        <span className="font-medium">{appliance.name}</span>
                        <span className="text-sm text-gray-600">
                          {appliance.wattage}W • {appliance.hoursPerDay}h/day
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div> // <- ADD THIS: closes main container <div className="space-y-6">
  );
}
