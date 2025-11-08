'use client';

import { Activity, AlertCircle, Heart, Thermometer, Brain, Stethoscope } from 'lucide-react';

interface Symptom {
  icon: React.ReactNode;
  name: string;
  severity: 'low' | 'medium' | 'high';
  description: string;
}

export default function SymptomsDisplay() {
  // Mock symptoms data - in real app, this would come from backend analysis
  const symptoms: Symptom[] = [
    {
      icon: <Thermometer className="w-6 h-6" />,
      name: 'Elevated Temperature',
      severity: 'medium',
      description: 'Body temperature above normal range (98.6°F)',
    },
    {
      icon: <Heart className="w-6 h-6" />,
      name: 'Irregular Heartbeat',
      severity: 'high',
      description: 'Heart rate variability detected',
    },
    {
      icon: <Brain className="w-6 h-6" />,
      name: 'Mild Headache',
      severity: 'low',
      description: 'Occasional tension-type headache',
    },
    {
      icon: <Activity className="w-6 h-6" />,
      name: 'Fatigue',
      severity: 'medium',
      description: 'Reduced energy levels throughout the day',
    },
  ];

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case 'high':
        return 'from-red-500 to-orange-500';
      case 'medium':
        return 'from-yellow-500 to-orange-500';
      case 'low':
        return 'from-green-500 to-emerald-500';
      default:
        return 'from-gray-500 to-gray-600';
    }
  };

  const getSeverityBg = (severity: string) => {
    switch (severity) {
      case 'high':
        return 'bg-red-900/20 border-red-500/30';
      case 'medium':
        return 'bg-yellow-900/20 border-yellow-500/30';
      case 'low':
        return 'bg-green-900/20 border-green-500/30';
      default:
        return 'bg-gray-900/20 border-gray-500/30';
    }
  };

  return (
    <div className="w-full max-w-4xl mx-auto">
      <div className="bg-gray-900 rounded-2xl p-8 shadow-xl border border-gray-800">
        <div className="flex items-center space-x-3 mb-8">
          <div className="p-3 bg-white rounded-full shadow-lg">
            <Stethoscope className="w-8 h-8 text-black" />
          </div>
          <div>
            <h2 className="text-3xl font-bold text-white">
              Symptoms Analysis
            </h2>
            <p className="text-gray-400">
              Based on your uploaded medical records
            </p>
          </div>
        </div>

        <div className="mb-6 p-4 bg-blue-900/30 border-l-4 border-blue-500 rounded-lg">
          <div className="flex items-start space-x-3">
            <AlertCircle className="w-5 h-5 text-blue-400 mt-0.5" />
            <div>
              <p className="text-sm text-blue-300 font-medium">
                AI-Powered Analysis Complete
              </p>
              <p className="text-xs text-blue-400 mt-1">
                We've identified {symptoms.length} potential symptoms from your records
              </p>
            </div>
          </div>
        </div>

        <div className="grid gap-4">
          {symptoms.map((symptom, index) => (
            <div
              key={index}
              className={`
                p-6 rounded-xl border-2 transition-all duration-300 hover:shadow-lg hover:scale-[1.02]
                ${getSeverityBg(symptom.severity)}
              `}
            >
              <div className="flex items-start space-x-4">
                <div className={`p-3 rounded-lg bg-gradient-to-br ${getSeverityColor(symptom.severity)}`}>
                  <div className="text-white">
                    {symptom.icon}
                  </div>
                </div>
                
                <div className="flex-1">
                  <div className="flex items-center justify-between mb-2">
                    <h3 className="text-xl font-bold text-white">
                      {symptom.name}
                    </h3>
                    <span className={`
                      px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wide
                      ${symptom.severity === 'high' ? 'bg-red-500 text-white' : ''}
                      ${symptom.severity === 'medium' ? 'bg-yellow-500 text-white' : ''}
                      ${symptom.severity === 'low' ? 'bg-green-500 text-white' : ''}
                    `}>
                      {symptom.severity}
                    </span>
                  </div>
                  <p className="text-gray-400">
                    {symptom.description}
                  </p>
                </div>
              </div>
            </div>
          ))}
        </div>

        <div className="mt-8 p-6 bg-gradient-to-r from-indigo-900/30 to-purple-900/30 rounded-xl border border-indigo-500/30">
          <h3 className="text-lg font-bold text-white mb-2">
            💡 Recommendation
          </h3>
          <p className="text-gray-300">
            Please consult with a healthcare professional for proper diagnosis and treatment. 
            This analysis is for informational purposes only.
          </p>
        </div>
      </div>
    </div>
  );
}

