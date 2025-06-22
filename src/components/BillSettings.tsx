import React from 'react';
import { Settings, MapPin, Clock, Home, Star } from 'lucide-react';
import { BillSettings as BillSettingsType } from '../types';

interface Props {
  settings: BillSettingsType;
  onSettingsChange: (settings: BillSettingsType) => void;
}

const REGIONS = [
  'National Average',
  'California',
  'New York', 
  'Texas',
  'Florida',
  'Illinois',
  'Pennsylvania',
  'Ohio',
  'Georgia',
  'North Carolina',
  'Michigan'
];

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

export default function BillSettings({ settings, onSettingsChange }: Props) {
  const updateSetting = (key: keyof BillSettingsType, value: any) => {
    onSettingsChange({ ...settings, [key]: value });
  };

  return (
    <div className="bg-white/70 backdrop-blur-sm rounded-xl p-6 border border-white/20">
      <div className="flex items-center space-x-2 mb-6">
        <Settings className="h-5 w-5 text-blue-600" />
        <h2 className="text-lg font-semibold text-gray-900">Bill Calculation Settings</h2>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {/* Region Selection */}
        <div>
          <label className="flex items-center space-x-2 text-sm font-medium text-gray-700 mb-2">
            <MapPin className="h-4 w-4" />
            <span>Your Region</span>
          </label>
          <select
            value={settings.region}
            onChange={(e) => updateSetting('region', e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          >
            {REGIONS.map(region => (
              <option key={region} value={region}>
                {region} (${REGIONAL_RATES[region]?.toFixed(2) || '0.16'}/kWh)
              </option>
            ))}
          </select>
        </div>

        {/* Season */}
        <div>
          <label className="flex items-center space-x-2 text-sm font-medium text-gray-700 mb-2">
            <Clock className="h-4 w-4" />
            <span>Current Season</span>
          </label>
          <select
            value={settings.season}
            onChange={(e) => updateSetting('season', e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          >
            <option value="spring">Spring (Lower Usage)</option>
            <option value="summer">Summer (High AC Usage)</option>
            <option value="fall">Fall (Lower Usage)</option>
            <option value="winter">Winter (High Heating)</option>
          </select>
        </div>

        {/* Home Size */}
        <div>
          <label className="flex items-center space-x-2 text-sm font-medium text-gray-700 mb-2">
            <Home className="h-4 w-4" />
            <span>Home Size</span>
          </label>
          <select
            value={settings.homeSize}
            onChange={(e) => updateSetting('homeSize', e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          >
            <option value="small">Small (&lt;1,500 sq ft)</option>
            <option value="medium">Medium (1,500-2,500 sq ft)</option>
            <option value="large">Large (&gt;2,500 sq ft)</option>
          </select>
        </div>

        {/* Efficiency Rating */}
        <div>
          <label className="flex items-center space-x-2 text-sm font-medium text-gray-700 mb-2">
            <Star className="h-4 w-4" />
            <span>Home Efficiency</span>
          </label>
          <select
            value={settings.efficiencyRating}
            onChange={(e) => updateSetting('efficiencyRating', e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          >
            <option value="poor">Poor (Old home, no upgrades)</option>
            <option value="average">Average (Some efficiency features)</option>
            <option value="good">Good (Energy Star appliances)</option>
            <option value="excellent">Excellent (Smart home, solar)</option>
          </select>
        </div>

        {/* Time of Use */}
        <div className="md:col-span-2">
          <label className="flex items-center space-x-2 text-sm font-medium text-gray-700 mb-2">
            <Clock className="h-4 w-4" />
            <span>Time-of-Use Pricing</span>
          </label>
          <div className="flex items-center space-x-3">
            <label className="flex items-center space-x-2">
              <input
                type="checkbox"
                checked={settings.useTimeOfUse}
                onChange={(e) => updateSetting('useTimeOfUse', e.target.checked)}
                className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
              />
              <span className="text-sm text-gray-700">
                Enable time-of-use rates (higher during peak hours)
              </span>
            </label>
          </div>
          {settings.useTimeOfUse && (
            <p className="text-xs text-gray-500 mt-1">
              Peak: 4-9 PM weekdays (+50%) | Off-peak: 10 PM-6 AM (-20%) | Standard: Other times
            </p>
          )}
        </div>
      </div>

      {/* Current Rate Display */}
      <div className="mt-6 p-4 bg-blue-50 rounded-lg">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm font-medium text-blue-900">Current Rate</p>
            <p className="text-xs text-blue-700">Based on your settings</p>
          </div>
          <div className="text-right">
            <p className="text-lg font-bold text-blue-900">
              ${REGIONAL_RATES[settings.region]?.toFixed(3) || '0.160'}/kWh
            </p>
            {settings.useTimeOfUse && (
              <p className="text-xs text-blue-700">Time-of-use enabled</p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}