// src/components/UserProfile.tsx
import React from "react";
import {
  User,
  Calendar,
  Zap,
  Settings,
  Download,
  Upload,
  Trash2,
} from "lucide-react";
import { getUserData, deleteUserData } from "../utils/storage";

interface UserProfileProps {
  user: {
    email: string;
    name: string;
  };
  onDataDelete: () => void;
  onExport: () => void;
  onImport: (event: React.ChangeEvent<HTMLInputElement>) => void;
}

const UserProfile: React.FC<UserProfileProps> = ({
  user,
  onDataDelete,
  onExport,
  onImport,
}) => {
  const userData = getUserData(user.email);

  const handleDeleteData = () => {
    if (
      window.confirm(
        "Are you sure you want to delete all your data? This action cannot be undone."
      )
    ) {
      deleteUserData(user.email);
      onDataDelete();
    }
  };

  return (
    <div className="space-y-6">
      {/* Profile Header */}
      <div className="bg-white/80 backdrop-blur-sm rounded-2xl p-8 border border-white/20">
        <div className="flex items-center space-x-4 mb-6">
          <div className="p-4 bg-gradient-to-r from-blue-500 to-indigo-600 rounded-2xl">
            <User className="h-8 w-8 text-white" />
          </div>
          <div>
            <h2 className="text-2xl font-bold text-gray-900">{user.name}</h2>
            <p className="text-gray-600">{user.email}</p>
          </div>
        </div>

        {/* Data Statistics */}
        {userData && (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
            <div className="bg-blue-50 rounded-xl p-4">
              <div className="flex items-center space-x-3">
                <Zap className="h-6 w-6 text-blue-600" />
                <div>
                  <p className="text-2xl font-bold text-blue-600">
                    {userData.appliances?.length || 0}
                  </p>
                  <p className="text-sm text-blue-700">Appliances Tracked</p>
                </div>
              </div>
            </div>

            <div className="bg-green-50 rounded-xl p-4">
              <div className="flex items-center space-x-3">
                <Settings className="h-6 w-6 text-green-600" />
                <div>
                  <p className="text-lg font-semibold text-green-600 capitalize">
                    {userData.billSettings?.region || "Not Set"}
                  </p>
                  <p className="text-sm text-green-700">Current Region</p>
                </div>
              </div>
            </div>

            <div className="bg-purple-50 rounded-xl p-4">
              <div className="flex items-center space-x-3">
                <Calendar className="h-6 w-6 text-purple-600" />
                <div>
                  <p className="text-sm font-semibold text-purple-600">
                    {userData.lastUpdated
                      ? new Date(userData.lastUpdated).toLocaleDateString()
                      : "Never"}
                  </p>
                  <p className="text-sm text-purple-700">Last Updated</p>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Data Management Actions */}
        <div className="border-t border-gray-200 pt-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">
            Data Management
          </h3>
          <div className="flex flex-wrap gap-3">
            <button
              onClick={onExport}
              className="flex items-center space-x-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-all duration-200"
            >
              <Download className="h-4 w-4" />
              <span>Export Data</span>
            </button>

            <label className="flex items-center space-x-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-all duration-200 cursor-pointer">
              <Upload className="h-4 w-4" />
              <span>Import Data</span>
              <input
                type="file"
                accept=".json"
                onChange={onImport}
                className="hidden"
              />
            </label>

            <button
              onClick={handleDeleteData}
              className="flex items-center space-x-2 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-all duration-200"
            >
              <Trash2 className="h-4 w-4" />
              <span>Delete All Data</span>
            </button>
          </div>
        </div>
      </div>

      {/* Data Preview */}
      {userData && userData.appliances && userData.appliances.length > 0 && (
        <div className="bg-white/80 backdrop-blur-sm rounded-2xl p-8 border border-white/20">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">
            Your Appliances
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {userData.appliances.map((appliance, index) => (
              <div key={index} className="bg-gray-50 rounded-lg p-4">
                <h4 className="font-semibold text-gray-900">
                  {appliance.name}
                </h4>
                <p className="text-sm text-gray-600">
                  {appliance.wattage}W • {appliance.hoursPerDay}h/day
                </p>
                <p className="text-xs text-gray-500 mt-1">
                  {appliance.daysPerWeek} days/week
                </p>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Settings Preview */}
      {userData && userData.billSettings && (
        <div className="bg-white/80 backdrop-blur-sm rounded-2xl p-8 border border-white/20">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">
            Your Settings
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <p className="text-sm font-medium text-gray-700">Region</p>
              <p className="text-gray-900">{userData.billSettings.region}</p>
            </div>
            <div>
              <p className="text-sm font-medium text-gray-700">Season</p>
              <p className="text-gray-900 capitalize">
                {userData.billSettings.season}
              </p>
            </div>
            <div>
              <p className="text-sm font-medium text-gray-700">Home Size</p>
              <p className="text-gray-900 capitalize">
                {userData.billSettings.homeSize}
              </p>
            </div>
            <div>
              <p className="text-sm font-medium text-gray-700">
                Efficiency Rating
              </p>
              <p className="text-gray-900 capitalize">
                {userData.billSettings.efficiencyRating}
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default UserProfile;
