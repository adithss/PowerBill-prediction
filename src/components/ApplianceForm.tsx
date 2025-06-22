import React, { useState } from "react";
import { Plus, Trash2, Edit3, Zap } from "lucide-react";
import { Appliance } from "../types";

interface Props {
  appliances: Appliance[];
  onAddAppliance: (appliance: Appliance) => void;
  onRemoveAppliance: (id: string) => void;
  onUpdateAppliance: (id: string, appliance: Partial<Appliance>) => void;
}

const COMMON_APPLIANCES = [
  {
    name: "Refrigerator",
    category: "Kitchen",
    wattage: 150,
    hoursPerDay: 24,
    daysPerMonth: 30,
  },
  {
    name: "Air Conditioner",
    category: "Heating & Cooling",
    wattage: 3500,
    hoursPerDay: 8,
    daysPerMonth: 30,
  },
  {
    name: "LED Light Bulb",
    category: "Lighting",
    wattage: 10,
    hoursPerDay: 6,
    daysPerMonth: 30,
  },
  {
    name: "Television (LED)",
    category: "Electronics",
    wattage: 100,
    hoursPerDay: 5,
    daysPerMonth: 30,
  },
  {
    name: "Laptop",
    category: "Electronics",
    wattage: 65,
    hoursPerDay: 8,
    daysPerMonth: 30,
  },
  {
    name: "Washing Machine",
    category: "Laundry",
    wattage: 1000,
    hoursPerDay: 1,
    daysPerMonth: 10,
  },
  {
    name: "Water Heater",
    category: "Water Heating",
    wattage: 4000,
    hoursPerDay: 3,
    daysPerMonth: 30,
  },
  {
    name: "Microwave",
    category: "Kitchen",
    wattage: 1200,
    hoursPerDay: 0.5,
    daysPerMonth: 25,
  },
];

const CATEGORIES = [
  "Heating & Cooling",
  "Kitchen",
  "Lighting",
  "Electronics",
  "Laundry",
  "Water Heating",
  "Other",
];

export default function ApplianceForm({
  appliances,
  onAddAppliance,
  onRemoveAppliance,
  onUpdateAppliance,
}: Props) {
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [formData, setFormData] = useState({
    name: "",
    category: "Electronics",
    wattage: 100,
    hoursPerDay: 1,
    daysPerMonth: 30,
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (editingId) {
      onUpdateAppliance(editingId, formData);
      setEditingId(null);
    } else {
      onAddAppliance({
        ...formData,
        id: Date.now().toString(),
      });
    }

    resetForm();
  };

  const resetForm = () => {
    setFormData({
      name: "",
      category: "Electronics",
      wattage: 100,
      hoursPerDay: 1,
      daysPerMonth: 30,
    });
    setShowForm(false);
    setEditingId(null);
  };

  const handleEdit = (appliance: Appliance) => {
    setFormData({
      name: appliance.name,
      category: appliance.category,
      wattage: appliance.wattage,
      hoursPerDay: appliance.hoursPerDay,
      daysPerMonth: appliance.daysPerMonth,
    });
    setEditingId(appliance.id);
    setShowForm(true);
  };

  const addCommonAppliance = (appliance: (typeof COMMON_APPLIANCES)[0]) => {
    onAddAppliance({
      ...appliance,
      id: Date.now().toString(),
    });
  };
  const handleResetAllAppliances = () => {
    if (appliances.length === 0) {
      return; // No appliances to reset
    }

    const confirmReset = window.confirm(
      `Are you sure you want to remove all ${appliances.length} appliances? This action cannot be undone.`
    );

    if (confirmReset) {
      // Remove all appliances by calling onRemoveAppliance for each one
      appliances.forEach((appliance) => onRemoveAppliance(appliance.id));

      // Also reset the form if it's currently open
      if (showForm) {
        resetForm();
      }
    }
  };
  return (
    <div className="space-y-6">
      {/* Quick Add Section */}
      <div className="bg-white/70 backdrop-blur-sm rounded-xl p-6 border border-white/20">
        <h2 className="text-lg font-semibold text-gray-900 mb-4">
          Quick Add Common Appliances
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3">
          {COMMON_APPLIANCES.map((appliance, index) => (
            <button
              key={index}
              onClick={() => addCommonAppliance(appliance)}
              className="p-3 bg-gradient-to-r from-blue-50 to-indigo-50 hover:from-blue-100 hover:to-indigo-100 rounded-lg border border-blue-100 text-left transition-all duration-200 hover:shadow-sm"
            >
              <div className="flex items-center space-x-2 mb-1">
                <Zap className="h-4 w-4 text-blue-500" />
                <span className="font-medium text-gray-900 text-sm">
                  {appliance.name}
                </span>
              </div>
              <p className="text-xs text-gray-600">
                {appliance.wattage}W • {appliance.hoursPerDay}h/day
              </p>
            </button>
          ))}
        </div>
      </div>

      {/* Add Custom Appliance */}
      <div className="bg-white/70 backdrop-blur-sm rounded-xl p-6 border border-white/20">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold text-gray-900">
            Your Appliances
          </h2>
          <div className="flex items-center space-x-3">
            <button
              onClick={handleResetAllAppliances}
              disabled={appliances.length === 0}
              className="flex items-center space-x-2 px-4 py-2 bg-gradient-to-r from-red-500 to-red-600 text-white rounded-lg hover:from-red-600 hover:to-red-700 transition-all duration-200 font-medium disabled:from-gray-300 disabled:to-gray-400 disabled:cursor-not-allowed"
              title={
                appliances.length === 0
                  ? "No appliances to reset"
                  : `Reset all ${appliances.length} appliances`
              }
            >
              <Trash2 className="h-4 w-4" />
              <span>Reset All</span>
            </button>
            <button
              onClick={() => setShowForm(!showForm)}
              className="flex items-center space-x-2 px-4 py-2 bg-gradient-to-r from-blue-500 to-indigo-600 text-white rounded-lg hover:from-blue-600 hover:to-indigo-700 transition-all duration-200 font-medium"
            >
              <Plus className="h-4 w-4" />
              <span>Add Custom</span>
            </button>
          </div>
        </div>
        {/* Form */}
        {showForm && (
          <form
            onSubmit={handleSubmit}
            className="bg-gray-50 rounded-lg p-4 mb-6 space-y-4"
          >
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Appliance Name
                </label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) =>
                    setFormData({ ...formData, name: e.target.value })
                  }
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="e.g., Gaming PC"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Category
                </label>
                <select
                  value={formData.category}
                  onChange={(e) =>
                    setFormData({ ...formData, category: e.target.value })
                  }
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                >
                  {CATEGORIES.map((category) => (
                    <option key={category} value={category}>
                      {category}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Power (Watts)
                </label>
                <input
                  type="number"
                  value={formData.wattage}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      wattage: Number(e.target.value),
                    })
                  }
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  min="1"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Hours per Day
                </label>
                <input
                  type="number"
                  step="0.1"
                  value={formData.hoursPerDay}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      hoursPerDay: Number(e.target.value),
                    })
                  }
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  min="0"
                  max="24"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Days per Month
                </label>
                <input
                  type="number"
                  value={formData.daysPerMonth}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      daysPerMonth: Number(e.target.value),
                    })
                  }
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  min="1"
                  max="31"
                  required
                />
              </div>
            </div>

            <div className="flex space-x-3">
              <button
                type="submit"
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium"
              >
                {editingId ? "Update" : "Add"} Appliance
              </button>
              <button
                type="button"
                onClick={resetForm}
                className="px-4 py-2 bg-gray-300 text-gray-700 rounded-lg hover:bg-gray-400 transition-colors font-medium"
              >
                Cancel
              </button>
            </div>
          </form>
        )}

        {/* Appliance List */}
        {appliances.length === 0 ? (
          <div className="text-center py-8 text-gray-500">
            <Zap className="h-12 w-12 mx-auto mb-3 text-gray-300" />
            <p>No appliances added yet.</p>
            <p className="text-sm">
              Add some appliances to see your power bill prediction!
            </p>
          </div>
        ) : (
          <div className="space-y-3">
            {appliances.map((appliance) => (
              <div
                key={appliance.id}
                className="flex items-center justify-between p-4 bg-gradient-to-r from-white to-blue-50 rounded-lg border border-blue-100"
              >
                <div className="flex-1">
                  <div className="flex items-center space-x-3">
                    <div className="p-2 bg-blue-100 rounded-lg">
                      <Zap className="h-4 w-4 text-blue-600" />
                    </div>
                    <div>
                      <h3 className="font-medium text-gray-900">
                        {appliance.name}
                      </h3>
                      <p className="text-sm text-gray-600">
                        {appliance.category} • {appliance.wattage}W •{" "}
                        {appliance.hoursPerDay}h/day • {appliance.daysPerMonth}{" "}
                        days/month
                      </p>
                    </div>
                  </div>
                </div>
                <div className="flex items-center space-x-2">
                  <button
                    onClick={() => handleEdit(appliance)}
                    className="p-2 text-gray-400 hover:text-blue-600 transition-colors"
                  >
                    <Edit3 className="h-4 w-4" />
                  </button>
                  <button
                    onClick={() => onRemoveAppliance(appliance.id)}
                    className="p-2 text-gray-400 hover:text-red-600 transition-colors"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
