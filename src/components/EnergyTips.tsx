import React from 'react';
import { Lightbulb, TrendingDown, Star, Clock, DollarSign } from 'lucide-react';
import { BillCalculation, EnergyTip } from '../types';

interface Props {
  billData: BillCalculation | null;
}

const ENERGY_TIPS: EnergyTip[] = [
  {
    title: 'Switch to LED Light Bulbs',
    description: 'Replace incandescent bulbs with LED bulbs to reduce lighting costs by up to 80%. LEDs last 25 times longer and use significantly less energy.',
    potentialSavings: '$75-200/year',
    difficulty: 'Easy',
    category: 'Lighting'
  },
  {
    title: 'Unplug Electronics When Not in Use',
    description: 'Electronics continue to draw power even when turned off. Unplug chargers, TVs, and other devices to eliminate phantom loads.',
    potentialSavings: '$50-100/year',
    difficulty: 'Easy',
    category: 'Electronics'
  },
  {
    title: 'Use a Programmable Thermostat',
    description: 'Set your thermostat to automatically adjust temperature when you\'re away. This can reduce heating and cooling costs by 10-15%.',
    potentialSavings: '$180-300/year',
    difficulty: 'Medium',
    category: 'Heating & Cooling'
  },
  {
    title: 'Wash Clothes in Cold Water',
    description: 'About 90% of washing machine energy goes to heating water. Use cold water settings to significantly reduce energy consumption.',
    potentialSavings: '$60-120/year',
    difficulty: 'Easy',
    category: 'Laundry'
  },
  {
    title: 'Seal Air Leaks',
    description: 'Use weatherstripping and caulk to seal gaps around windows and doors. This prevents conditioned air from escaping.',
    potentialSavings: '$200-400/year',
    difficulty: 'Medium',
    category: 'Heating & Cooling'
  },
  {
    title: 'Use Energy-Efficient Appliances',
    description: 'When replacing appliances, choose ENERGY STAR certified models. They use 10-50% less energy than standard models.',
    potentialSavings: '$300-600/year',
    difficulty: 'Hard',
    category: 'Kitchen'
  },
  {
    title: 'Lower Water Heater Temperature',
    description: 'Set your water heater to 120°F (49°C) instead of the default 140°F (60°C). You won\'t notice the difference but will save energy.',
    potentialSavings: '$50-100/year',
    difficulty: 'Easy',
    category: 'Water Heating'
  },
  {
    title: 'Use Power Strips',
    description: 'Connect multiple devices to power strips and turn them off when not in use. This makes it easy to eliminate standby power consumption.',
    potentialSavings: '$25-75/year',
    difficulty: 'Easy',
    category: 'Electronics'
  }
];

export default function EnergyTips({ billData }: Props) {
  const getDifficultyColor = (difficulty: string) => {
    switch (difficulty) {
      case 'Easy': return 'text-green-600 bg-green-100';
      case 'Medium': return 'text-yellow-600 bg-yellow-100';
      case 'Hard': return 'text-red-600 bg-red-100';
      default: return 'text-gray-600 bg-gray-100';
    }
  };

  const getRelevantTips = () => {
    if (!billData) return ENERGY_TIPS;
    
    // Get categories present in user's appliances
    const userCategories = billData.categoryBreakdown.map(cat => cat.category);
    
    // Prioritize tips for categories the user has
    const relevantTips = ENERGY_TIPS.filter(tip => 
      userCategories.includes(tip.category) || tip.category === 'Electronics'
    );
    
    // Add remaining tips
    const otherTips = ENERGY_TIPS.filter(tip => 
      !userCategories.includes(tip.category) && tip.category !== 'Electronics'
    );
    
    return [...relevantTips, ...otherTips];
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-gradient-to-r from-green-500 to-emerald-600 text-white rounded-xl p-6">
        <div className="flex items-center space-x-3">
          <Lightbulb className="h-8 w-8" />
          <div>
            <h1 className="text-2xl font-bold">Energy Saving Tips</h1>
            <p className="text-green-100">Simple changes that can reduce your electricity bill</p>
          </div>
        </div>
        
        {billData && (
          <div className="mt-6 grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="bg-white/20 rounded-lg p-4">
              <div className="flex items-center space-x-2">
                <DollarSign className="h-5 w-5" />
                <span className="font-semibold">Current Monthly Bill</span>
              </div>
              <p className="text-2xl font-bold mt-1">${billData.monthlyBill.toFixed(2)}</p>
            </div>
            <div className="bg-white/20 rounded-lg p-4">
              <div className="flex items-center space-x-2">
                <TrendingDown className="h-5 w-5" />
                <span className="font-semibold">Potential Savings</span>
              </div>
              <p className="text-2xl font-bold mt-1">$100-500/year</p>
            </div>
            <div className="bg-white/20 rounded-lg p-4">
              <div className="flex items-center space-x-2">
                <Star className="h-5 w-5" />
                <span className="font-semibold">Quick Wins</span>
              </div>
              <p className="text-2xl font-bold mt-1">8 Easy Tips</p>
            </div>
          </div>
        )}
      </div>

      {/* Tips Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {getRelevantTips().map((tip, index) => (
          <div
            key={index}
            className="bg-white/70 backdrop-blur-sm rounded-xl p-6 border border-white/20 hover:shadow-lg transition-all duration-200 hover:scale-[1.02]"
          >
            <div className="flex items-start justify-between mb-4">
              <div className="flex items-center space-x-3">
                <div className="p-2 bg-gradient-to-r from-blue-500 to-indigo-600 rounded-lg">
                  <Lightbulb className="h-5 w-5 text-white" />
                </div>
                <div>
                  <h3 className="font-semibold text-gray-900">{tip.title}</h3>
                  <span className="text-xs text-gray-500">{tip.category}</span>
                </div>
              </div>
              <span className={`px-2 py-1 rounded-full text-xs font-medium ${getDifficultyColor(tip.difficulty)}`}>
                {tip.difficulty}
              </span>
            </div>
            
            <p className="text-gray-600 mb-4 leading-relaxed">{tip.description}</p>
            
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-2 text-green-600">
                <DollarSign className="h-4 w-4" />
                <span className="font-semibold">{tip.potentialSavings}</span>
              </div>
              <div className="flex items-center space-x-1 text-gray-500">
                <Clock className="h-4 w-4" />
                <span className="text-sm">{tip.difficulty} to implement</span>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Additional Resources */}
      <div className="bg-white/70 backdrop-blur-sm rounded-xl p-6 border border-white/20">
        <h2 className="text-lg font-semibold text-gray-900 mb-4">Additional Resources</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="p-4 bg-blue-50 rounded-lg">
            <h3 className="font-medium text-blue-900 mb-2">Energy Audit</h3>
            <p className="text-sm text-blue-700">Get a professional energy audit to identify specific savings opportunities in your home.</p>
          </div>
          <div className="p-4 bg-green-50 rounded-lg">
            <h3 className="font-medium text-green-900 mb-2">Utility Rebates</h3>
            <p className="text-sm text-green-700">Check with your utility company for rebates on energy-efficient appliances and upgrades.</p>
          </div>
          <div className="p-4 bg-purple-50 rounded-lg">
            <h3 className="font-medium text-purple-900 mb-2">Smart Home Tech</h3>
            <p className="text-sm text-purple-700">Consider smart thermostats, smart plugs, and energy monitoring devices for automated savings.</p>
          </div>
        </div>
      </div>
    </div>
  );
}