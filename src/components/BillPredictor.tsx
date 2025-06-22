import React from "react";
import { DollarSign, TrendingUp, Calendar, Zap, PieChart } from "lucide-react";
import { BillCalculation, Appliance } from "../types";
import { formatCurrency, formatKwh } from "../utils/calculations";

interface Props {
  billData: BillCalculation;
  appliances: Appliance[];
  isAggregatedView?: boolean;
  totalBillsCount?: number;
}
// Replace the function signature and add header indicator in BillPredictor.tsx (around line 10)
export default function BillPredictor({
  billData,
  appliances,
  isAggregatedView = false,
  totalBillsCount = 0,
}: Props) {
  const topAppliances = billData.applianceBreakdown
    .sort((a, b) => b.monthlyCost - a.monthlyCost)
    .slice(0, 5);

  return (
    <div className="space-y-6">
      {/* Aggregated View Indicator */}
      {isAggregatedView && totalBillsCount > 0 && (
        <div className="bg-gradient-to-r from-purple-500 to-pink-600 text-white rounded-xl p-4">
          <div className="flex items-center justify-center space-x-2">
            <Calendar className="h-5 w-5" />
            <span className="font-semibold">
              Showing Average Data from {totalBillsCount} Saved Bill
              {totalBillsCount !== 1 ? "s" : ""}
            </span>
          </div>
        </div>
      )}

      {/* Overview Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <div className="bg-gradient-to-br from-green-500 to-emerald-600 text-white rounded-xl p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-green-100 text-sm font-medium">
                {isAggregatedView ? "Average Monthly Bill" : "Monthly Bill"}
              </p>
              <p className="text-3xl font-bold">
                {formatCurrency(billData.monthlyBill)}
              </p>
            </div>
            <DollarSign className="h-8 w-8 text-green-200" />
          </div>
        </div>

        <div className="bg-gradient-to-br from-blue-500 to-indigo-600 text-white rounded-xl p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-blue-100 text-sm font-medium">
                {isAggregatedView ? "Average Monthly Usage" : "Monthly Usage"}
              </p>
              <p className="text-3xl font-bold">
                {formatKwh(billData.totalKwh)}
              </p>
            </div>
            <Zap className="h-8 w-8 text-blue-200" />
          </div>
        </div>

        <div className="bg-gradient-to-br from-purple-500 to-pink-600 text-white rounded-xl p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-purple-100 text-sm font-medium">
                {isAggregatedView ? "Average Yearly Bill" : "Yearly Bill"}
              </p>
              <p className="text-3xl font-bold">
                {formatCurrency(billData.yearlyBill)}
              </p>
            </div>
            <Calendar className="h-8 w-8 text-purple-200" />
          </div>
        </div>

        <div className="bg-gradient-to-br from-orange-500 to-red-600 text-white rounded-xl p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-orange-100 text-sm font-medium">
                {isAggregatedView ? "Average Daily Usage" : "Daily Average"}
              </p>
              <p className="text-3xl font-bold">
                {formatKwh(billData.dailyAverage)}
              </p>
            </div>
            <TrendingUp className="h-8 w-8 text-orange-200" />
          </div>
        </div>
      </div>

      {/* Usage Breakdown */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Top Appliances */}
        <div className="bg-white/70 backdrop-blur-sm rounded-xl p-6 border border-white/20">
          <div className="flex items-center space-x-2 mb-6">
            <TrendingUp className="h-5 w-5 text-blue-600" />
            <h2 className="text-lg font-semibold text-gray-900">
              Top Energy Consumers
            </h2>
          </div>

          <div className="space-y-4">
            {topAppliances.map((item, index) => (
              <div
                key={item.appliance.id}
                className="flex items-center justify-between"
              >
                <div className="flex items-center space-x-3">
                  <div className="flex items-center justify-center w-8 h-8 bg-gradient-to-r from-blue-500 to-indigo-600 text-white rounded-full text-sm font-bold">
                    {index + 1}
                  </div>
                  <div>
                    <p className="font-medium text-gray-900">
                      {item.appliance.name}
                    </p>
                    <p className="text-sm text-gray-500">
                      {formatKwh(item.monthlyKwh)} •{" "}
                      {item.percentage.toFixed(1)}%
                    </p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="font-semibold text-gray-900">
                    {formatCurrency(item.monthlyCost)}
                  </p>
                  <p className="text-sm text-gray-500">per month</p>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Category Breakdown */}
        <div className="bg-white/70 backdrop-blur-sm rounded-xl p-6 border border-white/20">
          <div className="flex items-center space-x-2 mb-6">
            <PieChart className="h-5 w-5 text-blue-600" />
            <h2 className="text-lg font-semibold text-gray-900">
              Usage by Category
            </h2>
          </div>

          <div className="space-y-4">
            {billData.categoryBreakdown
              .sort((a, b) => b.monthlyCost - a.monthlyCost)
              .map((category) => (
                <div key={category.category} className="space-y-2">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-2">
                      <div
                        className="w-3 h-3 rounded-full"
                        style={{ backgroundColor: category.color }}
                      />
                      <span className="font-medium text-gray-900">
                        {category.category}
                      </span>
                    </div>
                    <div className="text-right">
                      <span className="font-semibold text-gray-900">
                        {formatCurrency(category.monthlyCost)}
                      </span>
                      <span className="text-sm text-gray-500 ml-2">
                        ({category.percentage.toFixed(1)}%)
                      </span>
                    </div>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-2">
                    <div
                      className="h-2 rounded-full transition-all duration-500 "
                      style={{
                        backgroundColor: category.color,
                        width: `${category.percentage}%`,
                      }}
                    />
                  </div>
                </div>
              ))}
          </div>
        </div>
      </div>

      {/* Detailed Breakdown */}
      <div className="bg-white/70 backdrop-blur-sm rounded-xl p-6 border border-white/20">
        <h2 className="text-lg font-semibold text-gray-900 mb-6">
          Detailed Appliance Breakdown
        </h2>

        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-gray-200">
                <th className="text-left py-3 px-4 font-semibold text-gray-900">
                  Appliance
                </th>
                <th className="text-left py-3 px-4 font-semibold text-gray-900">
                  Category
                </th>
                <th className="text-right py-3 px-4 font-semibold text-gray-900">
                  Power
                </th>
                <th className="text-right py-3 px-4 font-semibold text-gray-900">
                  Usage
                </th>
                <th className="text-right py-3 px-4 font-semibold text-gray-900">
                  Monthly kWh
                </th>
                <th className="text-right py-3 px-4 font-semibold text-gray-900">
                  Monthly Cost
                </th>
                <th className="text-right py-3 px-4 font-semibold text-gray-900">
                  % of Bill
                </th>
              </tr>
            </thead>
            <tbody>
              {billData.applianceBreakdown
                .sort((a, b) => b.monthlyCost - a.monthlyCost)
                .map((item) => (
                  <tr
                    key={item.appliance.id}
                    className="border-b border-gray-100 hover:bg-blue-50/50"
                  >
                    <td className="py-3 px-4 font-medium text-gray-900">
                      {item.appliance.name}
                    </td>
                    <td className="py-3 px-4 text-gray-600">
                      {item.appliance.category}
                    </td>
                    <td className="py-3 px-4 text-right text-gray-600">
                      {item.appliance.wattage}W
                    </td>
                    <td className="py-3 px-4 text-right text-gray-600">
                      {item.appliance.hoursPerDay}h/day ×{" "}
                      {item.appliance.daysPerMonth} days
                    </td>
                    <td className="py-3 px-4 text-right font-medium text-gray-900">
                      {formatKwh(item.monthlyKwh)}
                    </td>
                    <td className="py-3 px-4 text-right font-medium text-gray-900">
                      {formatCurrency(item.monthlyCost)}
                    </td>
                    <td className="py-3 px-4 text-right text-gray-600">
                      {item.percentage.toFixed(1)}%
                    </td>
                  </tr>
                ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
