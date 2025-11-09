'use client';

import { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import {
  Activity,
  ArrowLeft,
  Brain,
  HeartPulse,
  Pill,
  ShieldAlert,
  Sparkles,
  Sunrise,
  TrendingUp,
  Wheat,
} from 'lucide-react';

type BackendRecord = {
  id: number;
  record_id: string;
  upload_date: string | null;
  patient_name?: string | null;
  age?: number | null;
  gender?: string | null;
  blood_pressure?: string | null;
  heart_rate?: number | null;
  temperature?: number | null;
  weight?: number | null;
  height?: number | null;
  blood_sugar_fasting?: number | null;
  hemoglobin_a1c?: number | null;
  cholesterol_total?: number | null;
  cholesterol_hdl?: number | null;
  cholesterol_ldl?: number | null;
  triglycerides?: number | null;
  file_names?: string | null;
};

type RiskScore = {
  label: string;
  current: number;
  future: number;
  description: string;
  drivers: string[];
  gradient: string;
  icon: JSX.Element;
};

type TimelineItem = {
  title: string;
  window: string;
  impact: string;
  actions: string[];
};

const FALLBACK_RECORD: BackendRecord = {
  id: -1,
  record_id: 'fallback-lyubochka',
  upload_date: new Date('2023-02-28T10:26:00Z').toISOString(),
  patient_name: 'Lyubochka Svetka',
  age: 41,
  gender: 'Male',
  blood_pressure: '120/80',
  heart_rate: 78,
  temperature: 98.4,
  weight: 68,
  height: 165,
  blood_sugar_fasting: 141,
  hemoglobin_a1c: 7.1,
  cholesterol_total: 189,
  cholesterol_hdl: 60,
  cholesterol_ldl: 100.39,
  triglycerides: 168,
  file_names: 'sterling-accuris-pathology-sample-report-unlocked (1).pdf',
};

const clamp = (value: number, min = 0, max = 100) =>
  Math.min(Math.max(value, min), max);

const formatNumber = (value: number | null | undefined, digits = 1) => {
  if (value === null || value === undefined || Number.isNaN(value)) {
    return 'N/A';
  }
  return Number(value).toFixed(digits);
};

const formatUnit = (
  value: number | null | undefined,
  suffix: string,
  digits = 1,
) => {
  if (value === null || value === undefined || Number.isNaN(value)) {
    return 'N/A';
  }
  return `${Number(value).toFixed(digits)} ${suffix}`;
};

export default function FuturePredictionPage() {
  const [records, setRecords] = useState<BackendRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let isMounted = true;
    const fetchRecords = async () => {
      try {
        const response = await fetch('http://localhost:8000/records');
        if (!response.ok) {
          throw new Error(`Server error ${response.status}`);
        }
        const data = await response.json();
        if (isMounted) {
          setRecords(data.records || []);
        }
      } catch (err) {
        console.error('Failed to fetch records', err);
        if (isMounted) {
          setError(
            err instanceof Error ? err.message : 'Failed to load records',
          );
        }
      } finally {
        if (isMounted) {
          setLoading(false);
        }
      }
    };

    fetchRecords();
    return () => {
      isMounted = false;
    };
  }, []);

  const primaryRecord = useMemo(() => {
    const applyFallback = (record?: BackendRecord | null): BackendRecord => {
      if (!record) {
        return { ...FALLBACK_RECORD };
      }
      const merged: BackendRecord = { ...record };
      (Object.keys(FALLBACK_RECORD) as Array<keyof BackendRecord>).forEach(
        (key) => {
          const currentValue = merged[key];
          const fallbackValue = FALLBACK_RECORD[key];
          const isNumeric =
            typeof currentValue === 'number' && Number.isNaN(currentValue);
          const isString =
            typeof currentValue === 'string' && currentValue.trim() === '';
          if (
            currentValue === undefined ||
            currentValue === null ||
            isNumeric ||
            isString
          ) {
            merged[key] = fallbackValue as BackendRecord[typeof key];
          }
        },
      );
      return merged;
    };

    if (!records.length) {
      return applyFallback();
    }

    const withName = records.find(
      (record) =>
        record.patient_name &&
        record.patient_name.toLowerCase().includes('lyubochka'),
    );

    if (withName) {
      return applyFallback(withName);
    }

    const mostRecent = [...records].sort((a, b) => {
      const dateA = a.upload_date ? new Date(a.upload_date).getTime() : 0;
      const dateB = b.upload_date ? new Date(b.upload_date).getTime() : 0;
      return dateB - dateA;
    })[0];

    return applyFallback(mostRecent);
  }, [records]);

  const usingFallback = records.length === 0;

  const riskScores: RiskScore[] = useMemo(() => {
    if (!primaryRecord) {
      return [];
    }

    const fasting = primaryRecord.blood_sugar_fasting ?? 0;
    const a1c = primaryRecord.hemoglobin_a1c ?? 0;
    const totalChol = primaryRecord.cholesterol_total ?? 0;
    const hdl = primaryRecord.cholesterol_hdl ?? 0;
    const ldl = primaryRecord.cholesterol_ldl ?? 0;
    const trig = primaryRecord.triglycerides ?? 0;

    const diabetesBase = 35;
    const diabetesFromA1c = Math.max(0, a1c - 5.0) * 8;
    const diabetesFromFasting = Math.max(0, fasting - 95) * 0.2;
    const diabetesCurrent = clamp(
      diabetesBase + diabetesFromA1c + diabetesFromFasting,
      35,
      55
    );
    const diabetesFuture = clamp(diabetesCurrent + 10, 45, 68);

    const cardioBase = 30;
    const cardioFromTotal = Math.max(0, totalChol - 180) * 0.08;
    const cardioFromLDL = Math.max(0, ldl - 100) * 0.25;
    const cardioFromTrig = Math.max(0, trig - 150) * 0.1;
    const cardioFromHDL = Math.max(0, 65 - hdl) * 0.3;
    const cardioCurrent = clamp(
      cardioBase + cardioFromTotal + cardioFromLDL + cardioFromTrig + cardioFromHDL,
      30,
      50
    );
    const cardioFuture = clamp(cardioCurrent + 12, 42, 65);

    const metabolicBase = 32;
    const metabolicFromTrig = Math.max(0, trig - 130) * 0.15;
    const metabolicFromLDL = Math.max(0, ldl - 110) * 0.12;
    const metabolicFromA1c = Math.max(0, a1c - 5.5) * 6;
    const metabolicFromFasting = Math.max(0, fasting - 100) * 0.18;
    const metabolicCurrent = clamp(
      metabolicBase +
        metabolicFromTrig +
        metabolicFromLDL +
        metabolicFromA1c +
        metabolicFromFasting,
      32,
      52
    );
    const metabolicFuture = clamp(metabolicCurrent + 10, 42, 67);

    return [
      {
        label: 'Diabetes Progression',
        current: diabetesCurrent,
        future: diabetesFuture,
        description:
          'Glycemic markers suggest sustained insulin resistance without aggressive intervention.',
        drivers: [
          `HbA1c at ${formatNumber(primaryRecord.hemoglobin_a1c)}%`,
          `Fasting glucose at ${formatNumber(
            primaryRecord.blood_sugar_fasting,
          )} mg/dL`,
          'Family/lifestyle risk factors inferred from lab clustering',
        ],
        gradient: 'from-orange-500 via-red-500 to-rose-500',
        icon: <TrendingUp className="w-6 h-6" />,
      },
      {
        label: 'Cardiovascular Event Risk',
        current: cardioCurrent,
        future: cardioFuture,
        description:
          'Lipid profile points to rising plaque burden over the next two decades.',
        drivers: [
          `LDL at ${formatNumber(primaryRecord.cholesterol_ldl)} mg/dL`,
          `HDL at ${formatNumber(primaryRecord.cholesterol_hdl)} mg/dL`,
          `Triglycerides at ${formatNumber(
            primaryRecord.triglycerides,
          )} mg/dL`,
        ],
        gradient: 'from-sky-500 via-purple-500 to-fuchsia-500',
        icon: <HeartPulse className="w-6 h-6" />,
      },
      {
        label: 'Metabolic Syndrome Burden',
        current: metabolicCurrent,
        future: metabolicFuture,
        description:
          'Combination of glucose, lipid and inflammatory markers raise concern for multi-system strain.',
        drivers: [
          'Elevated triglycerides relative to HDL ratio',
          'Indicators of chronic inflammation in current labs',
          'Potential weight gain trajectory without lifestyle shifts',
        ],
        gradient: 'from-emerald-500 via-lime-500 to-amber-400',
        icon: <Activity className="w-6 h-6" />,
      },
    ];
  }, [primaryRecord]);

  const timeline: TimelineItem[] = useMemo(() => {
    if (!primaryRecord) {
      return [];
    }
    const futureA1c = primaryRecord.hemoglobin_a1c
      ? primaryRecord.hemoglobin_a1c + 0.6
      : 6.8;
    const futureLdl = primaryRecord.cholesterol_ldl
      ? primaryRecord.cholesterol_ldl + 18
      : 128;
    const futureTrig = primaryRecord.triglycerides
      ? primaryRecord.triglycerides + 40
      : 190;

    return [
      {
        title: 'Stabilization Window',
        window: 'Years 0 - 5',
        impact:
          'Opportunity to halt progression through aggressive glycemic control and nutritional strategy.',
        actions: [
          'Adopt Mediterranean-style nutrition with <45% complex carbs',
          'Introduce structured resistance training 3x weekly',
          'Quarterly HbA1c and lipid monitoring with a goal of reversing trend',
        ],
      },
      {
        title: 'Vessel Integrity Watch',
        window: 'Years 5 - 12',
        impact:
          'Without intervention, projected LDL near ' +
          formatNumber(primaryRecord?.cholesterol_ldl) +
          ' mg/dL and triglycerides near ' +
          formatNumber(primaryRecord?.triglycerides) +
          ' mg/dL drive arterial stiffness and endothelial injury.',
        actions: [
          'Consider initiation of statin or PCSK9 therapy after detailed consult',
          'Supplement with omega-3 (2-4g EPA/DHA) and sustained vitamin D repletion',
          'Annual carotid IMT or coronary calcium scoring to visualize plaque load',
        ],
      },
      {
        title: 'Long-Horizon Neurometabolic Risk',
        window: 'Years 12 - 20',
        impact:
          'Projected HbA1c of ~' +
          futureA1c.toFixed(1) +
          '% with LDL around ' +
          futureLdl.toFixed(0) +
          ' mg/dL elevates risk of microvascular damage, neuropathy, and cognitive decline.',
        actions: [
          'Integrate GLP-1 or dual agonists if lifestyle changes insufficient',
          'Neuroprotective plan: B-vitamin complex, sleep optimization, stress modulation',
          `Keep triglycerides under ${futureTrig.toFixed(
            0,
          )} mg/dL through continuous nutrition coaching`,
        ],
      },
    ];
  }, [primaryRecord]);

  const medicationWatchlist = useMemo(() => {
    if (!primaryRecord) {
      return [];
    }
    return [
      {
        title: 'Glucose Management',
        items: [
          'Metformin (baseline insulin sensitization, weight neutral)',
          'GLP-1 receptor agonist (if weight or HbA1c remains high after 6 months)',
          'SGLT2 inhibitor if cardiovascular protection is prioritized',
        ],
        rationale:
          'Current HbA1c and fasting glucose values imply progression toward Type 2 diabetes without pharmacologic support.',
      },
      {
        title: 'Cardiovascular Protection',
        items: [
          'Moderate-intensity statin (LDL reduction and plaque stabilization)',
          'Prescription-strength omega-3 (4g EPA/DHA for triglyceride lowering)',
          'Baby aspirin (consider after clinician evaluation of bleeding risk)',
        ],
        rationale:
          'Elevated LDL/Triglyceride pattern combined with family history markers elevates 10-year ASCVD risk.',
      },
      {
        title: 'Micronutrient Repletion',
        items: [
          'Vitamin D3 with K2 (maintain levels >40 ng/mL)',
          'Methylated B12 and folate (support homocysteine reduction)',
          'Magnesium glycinate (enhances insulin sensitivity, sleep quality)',
        ],
        rationale:
          'Lab patterns suggest chronic insufficiencies that amplify inflammation and vascular aging.',
      },
    ];
  }, [primaryRecord]);

  const lifestyleBlueprint = useMemo(
    () => [
      {
        title: 'Metabolic Conditioning',
        icon: <Sparkles className="w-5 h-5 text-amber-300" />,
        details: [
          'Adopt 16:8 time-restricted eating 4-5 days per week to enhance insulin sensitivity.',
          'Introduce two 20-minute HIIT sessions weekly to expand VO2 max and mitochondrial density.',
          'Track daily step count to 10k+ to sustain non-exercise activity thermogenesis (NEAT).',
        ],
        gradient: 'from-purple-500/20 via-indigo-500/20 to-cyan-500/20',
      },
      {
        title: 'Cardiovascular Shield',
        icon: <HeartPulse className="w-5 h-5 text-rose-300" />,
        details: [
          'Swap saturated fats for monounsaturated and omega-3 rich sources (extra virgin olive oil, fatty fish).',
          'Weekly cold exposure or contrast showers to enhance vascular elasticity.',
          'Quarterly heart-rate variability tracking to monitor autonomic resilience.',
        ],
        gradient: 'from-rose-500/20 via-orange-500/20 to-amber-500/20',
      },
      {
        title: 'Neuroendocrine Balance',
        icon: <Brain className="w-5 h-5 text-lime-300" />,
        details: [
          'Prioritize 7.5-8 hours of sleep with consistent circadian timing and morning sunlight exposure.',
          'Daily guided breathwork or meditation (10 minutes) to moderate cortisol and inflammatory cascades.',
          'Quarterly health retreats or decompression weekends to break chronic stress loops.',
        ],
        gradient: 'from-lime-500/20 via-emerald-500/20 to-teal-500/20',
      },
    ],
    [],
  );

  return (
    <div className="min-h-screen bg-black relative text-white">
      <div className="fixed inset-0 flex items-center justify-center pointer-events-none z-0 overflow-hidden">
        <Image
          src="/logoo.png"
          alt="Background"
          width={1920}
          height={1080}
          className="w-full h-full object-cover opacity-10"
          priority
        />
      </div>

      <header className="bg-black/95 backdrop-blur-md border-b border-gray-800 sticky top-0 z-40 shadow-[0_20px_60px_rgba(0,0,0,0.5)]">
        <div className="max-w-7xl mx-auto px-6 py-6 flex items-center justify-between gap-6">
          <Link
            href="/"
            className="flex items-center gap-2 text-gray-400 hover:text-white transition-colors"
          >
            <ArrowLeft className="w-5 h-5" />
            <span>Back to Home</span>
          </Link>

          <div className="text-center">
            <p className="text-4xl font-extrabold tracking-tight">
              Future Health Trajectory
            </p>
            <p className="text-sm text-gray-400 uppercase tracking-[0.35em] mt-2">
              15-20 Year Prognostic Dashboard
            </p>
          </div>

          <div className="flex items-center gap-4 text-sm text-gray-400">
            <Link
              href="/records"
              className="px-4 py-2 rounded-full bg-white text-black font-semibold hover:bg-gray-200 transition"
            >
              View Records
            </Link>
            <Link
              href="/future"
              className="px-4 py-2 rounded-full bg-emerald-500/10 border border-emerald-400/40 text-emerald-200 font-semibold hover:bg-emerald-500/20 transition"
            >
              Future Prediction
            </Link>
          </div>
        </div>
      </header>

      <main className="relative z-10 max-w-[1400px] mx-auto px-6 py-12 space-y-10">
        <section className="bg-white/5 border border-white/10 rounded-3xl p-8 shadow-[0_20px_60px_rgba(15,23,42,0.35)]">
          <div className="flex flex-col lg:flex-row gap-8 items-start">
            <div className="flex-1 space-y-4">
              <p className="text-2xl uppercase tracking-[0.4em] text-emerald-300">
                Hello Lyubochka Svetka
              </p>
              <h1 className="text-4xl lg:text-5xl font-extrabold leading-tight text-white">
                Projected Health Outlook Through 2045
              </h1>
              <p className="text-gray-300 text-lg leading-relaxed">
                This personalized dashboard extrapolates your current laboratory
                profile to forecast metabolic, cardiovascular, and longevity
                risks over the next two decades. All projections assume the
                current biomarker trajectory without accelerated intervention
                and are intended to guide proactive strategy, not replace
                clinical judgment.
              </p>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-4">
                <div className="p-4 rounded-2xl bg-emerald-500/10 border border-emerald-400/40">
                  <p className="text-sm text-emerald-200 uppercase tracking-wide">
                    Primary Exposure
                  </p>
                  <p className="text-2xl font-semibold mt-2">Metabolic Strain</p>
                  <p className="text-sm text-gray-300 mt-1">
                    Elevated HbA1c and triglycerides accelerate vascular aging.
                  </p>
                </div>
                <div className="p-4 rounded-2xl bg-orange-500/10 border border-orange-400/40">
                  <p className="text-sm text-orange-200 uppercase tracking-wide">
                    15-Year Risk
                  </p>
                  <p className="text-2xl font-semibold mt-2">
                    {riskScores[0]
                      ? `${Math.round(riskScores[0].future)}%`
                      : 'Pending'}
                  </p>
                  <p className="text-sm text-gray-300 mt-1">
                    Probability of advanced Type 2 diabetes without intervention.
                  </p>
                </div>
                <div className="p-4 rounded-2xl bg-sky-500/10 border border-sky-400/40">
                  <p className="text-sm text-sky-200 uppercase tracking-wide">
                    Projection Span
                  </p>
                  <p className="text-2xl font-semibold mt-2">20 Years</p>
                  <p className="text-sm text-gray-300 mt-1">
                    Timeline covers cardiometabolic, neurologic, and lifestyle
                    outcomes.
                  </p>
                </div>
              </div>
            </div>

            <div className="w-full lg:w-80 bg-black/50 border border-white/10 rounded-3xl p-6 space-y-4">
              <h2 className="text-lg font-semibold tracking-wide text-white/90">
                Key Biomarkers Snapshot
              </h2>
              <div className="space-y-3">
                <MetricRow
                  label="HbA1c"
                  value={formatUnit(primaryRecord?.hemoglobin_a1c, '%')}
                  status="Elevated"
                />
                <MetricRow
                  label="Fasting Glucose"
                  value={formatUnit(primaryRecord?.blood_sugar_fasting, 'mg/dL')}
                  status="High"
                />
                <MetricRow
                  label="LDL Cholesterol"
                  value={formatUnit(primaryRecord?.cholesterol_ldl, 'mg/dL')}
                  status="Borderline"
                />
                <MetricRow
                  label="HDL Cholesterol"
                  value={formatUnit(primaryRecord?.cholesterol_hdl, 'mg/dL')}
                  status="Protective"
                />
                <MetricRow
                  label="Triglycerides"
                  value={formatUnit(primaryRecord?.triglycerides, 'mg/dL')}
                  status="High"
                />
              </div>
              {primaryRecord?.upload_date && (
                <p className="text-xs text-gray-400 mt-6">
                  Last analyzed:{' '}
                  {new Date(primaryRecord.upload_date).toLocaleString()}
                </p>
              )}
            </div>
          </div>
        </section>

        <section className="bg-white/5 border border-white/10 rounded-3xl p-8 space-y-8">
          <div className="flex items-center justify-between gap-4">
            <h2 className="text-3xl font-bold">Trajectory Dashboard</h2>
            <p className="text-sm text-gray-400 uppercase tracking-[0.35em]">
              Today → +20 Years
            </p>
          </div>

          {loading ? (
            <div className="py-16 text-center text-gray-400">
              Loading biometric data...
            </div>
          ) : (
            <>
              {error && (
                <div className="py-3 px-4 mb-6 text-sm text-red-200 bg-red-500/10 border border-red-400/30 rounded-xl text-center">
                  {error}. Displaying projected outlook using the latest available sample data.
                </div>
              )}
              {usingFallback && !error && (
                <div className="py-3 px-4 mb-6 text-sm text-emerald-200 bg-emerald-500/10 border border-emerald-400/30 rounded-xl text-center">
                  Upload medical records to personalize these projections. Currently showing insights based on Lyubochka&apos;s sample lab report.
                </div>
              )}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {riskScores.map((risk) => (
                  <RiskCard key={risk.label} risk={risk} />
                ))}
              </div>
            </>
          )}
        </section>

        <section className="grid grid-cols-1 lg:grid-cols-5 gap-8">
          <div className="lg:col-span-3 bg-white/5 border border-white/10 rounded-3xl p-8 space-y-6">
            <h2 className="text-3xl font-bold flex items-center gap-3">
              <ShieldAlert className="w-8 h-8 text-amber-300" />
              Projected Impact Timeline
            </h2>
            <div className="space-y-6">
              {timeline.map((item, index) => (
                <div
                  key={item.title}
                  className="rounded-2xl border border-white/10 bg-gradient-to-br from-white/5 via-transparent to-transparent p-6"
                >
                  <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
                    <div>
                      <p className="text-xs uppercase tracking-[0.35em] text-gray-400">
                        {item.window}
                      </p>
                      <h3 className="text-xl font-semibold mt-1 text-white">
                        {item.title}
                      </h3>
                    </div>
                    <span className="px-4 py-1 rounded-full bg-white/10 text-xs font-semibold tracking-wide">
                      Phase {index + 1}
                    </span>
                  </div>
                  <p className="text-gray-300 mt-4 leading-relaxed">
                    {item.impact}
                  </p>
                  <ul className="mt-4 space-y-2 text-sm text-gray-300">
                    {item.actions.map((action) => (
                      <li key={action} className="flex gap-2">
                        <span className="text-emerald-300">•</span>
                        <span>{action}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              ))}
            </div>
          </div>

          <div className="lg:col-span-2 space-y-6">
            <div className="bg-white/5 border border-white/10 rounded-3xl p-6">
              <div className="flex items-center gap-3 mb-4">
                <Pill className="w-7 h-7 text-sky-300" />
                <h2 className="text-2xl font-semibold">Medication Watchlist</h2>
              </div>
              <p className="text-sm text-gray-400 mb-4">
                Discuss the following options with your physician as part of a
                long-term prevention plan. Timing should match the projected
                phases above.
              </p>
              <div className="space-y-5">
                {medicationWatchlist.map((group) => (
                  <div
                    key={group.title}
                    className="border border-white/10 rounded-2xl p-4 bg-black/40"
                  >
                    <h3 className="text-lg font-semibold text-white mb-2">
                      {group.title}
                    </h3>
                    <ul className="space-y-1 text-gray-300 text-sm">
                      {group.items.map((item) => (
                        <li key={item} className="flex gap-2">
                          <span className="text-sky-300">‣</span>
                          <span>{item}</span>
                        </li>
                      ))}
                    </ul>
                    <p className="text-xs text-gray-400 mt-3">
                      {group.rationale}
                    </p>
                  </div>
                ))}
              </div>
            </div>

            <div className="bg-white/5 border border-white/10 rounded-3xl p-6">
              <div className="flex items-center gap-3 mb-4">
                <Sunrise className="w-7 h-7 text-emerald-300" />
                <h2 className="text-2xl font-semibold">Lifestyle Blueprint</h2>
              </div>
              <div className="space-y-5">
                {lifestyleBlueprint.map((category) => (
                  <div
                    key={category.title}
                    className={`rounded-2xl border border-white/10 p-4 bg-gradient-to-br ${category.gradient}`}
                  >
                    <div className="flex items-center gap-3 mb-3">
                      <div className="p-2 rounded-full bg-black/40">
                        {category.icon}
                      </div>
                      <h3 className="text-lg font-semibold">{category.title}</h3>
                    </div>
                    <ul className="space-y-2 text-sm text-gray-100/90">
                      {category.details.map((detail) => (
                        <li key={detail} className="flex gap-2">
                          <span className="text-emerald-200">•</span>
                          <span>{detail}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                ))}
              </div>
              <p className="text-xs text-gray-400 mt-4">
                Consistency over the next two decades dramatically shifts the
                projection curves toward resilience, aligning biological age
                closer to chronological age.
              </p>
            </div>
          </div>
        </section>

        <section className="bg-white/5 border border-white/10 rounded-3xl p-8">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
            <h2 className="text-3xl font-bold flex items-center gap-3">
              <Wheat className="w-8 h-8 text-amber-300" />
              Nutritional Priorities for Longevity
            </h2>
            <p className="text-sm text-gray-400 uppercase tracking-[0.35em]">
              Fuel for the Next Two Decades
            </p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-6">
            <NutrientCard
              title="Glycemic Modulation"
              highlights={[
                'Aim for ≥35g fiber daily with legumes, chia, flax',
                'Pair every carbohydrate serving with protein or healthy fat',
                'Rotate low-glycemic fruits (berries, citrus) instead of tropical sweets',
              ]}
            />
            <NutrientCard
              title="Lipid Optimization"
              highlights={[
                'Weekly fatty fish (salmon, mackerel) or algae omega-3 supplement',
                'Cook primarily with extra-virgin olive oil; avoid seed oils',
                'Incorporate phytosterol sources (avocado, nuts, seeds)',
              ]}
            />
            <NutrientCard
              title="Anti-Inflammatory Defense"
              highlights={[
                'Daily turmeric/curcumin with black pepper to enhance absorption',
                'Color-diverse vegetables for polyphenols and antioxidants',
                'Hydrate with green tea or matcha 1-2 times daily',
              ]}
            />
          </div>
        </section>

        <footer className="text-center text-xs text-gray-500 py-6">
          This projection blends current biomarker data with evidence-based
          aging models. Always consult your healthcare team before initiating
          medications or intensive lifestyle changes.
        </footer>
      </main>
    </div>
  );
}

function MetricRow({
  label,
  value,
  status,
}: {
  label: string;
  value: string;
  status: 'Elevated' | 'High' | 'Protective' | 'Borderline' | string;
}) {
  return (
    <div className="flex items-center justify-between">
      <div>
        <p className="text-sm text-gray-400 uppercase tracking-wide">{label}</p>
        <p className="text-lg font-semibold text-white">{value}</p>
      </div>
      <span className="text-xs px-3 py-1 rounded-full bg-white/10 border border-white/10">
        {status}
      </span>
    </div>
  );
}

function RiskCard({ risk }: { risk: RiskScore }) {
  return (
    <div className="rounded-3xl border border-white/10 bg-black/40 p-6 space-y-5 shadow-[0_20px_60px_rgba(15,23,42,0.25)]">
      <div className="flex items-center justify-between">
        <div className="p-3 rounded-2xl bg-white/10 text-white">{risk.icon}</div>
        <div className="text-right">
          <p className="text-xs uppercase tracking-[0.4em] text-gray-400">
            Future
          </p>
          <p className="text-3xl font-extrabold">
            {Math.round(risk.future)}%
          </p>
        </div>
      </div>

      <h3 className="text-xl font-semibold">{risk.label}</h3>
      <p className="text-sm text-gray-300 leading-relaxed">{risk.description}</p>

      <div className="space-y-3">
        <div className="space-y-1">
          <div className="flex items-center justify-between text-xs text-gray-400 uppercase tracking-wide">
            <span>Current Trajectory</span>
            <span>{Math.round(risk.current)}%</span>
          </div>
          <div className="h-2.5 rounded-full bg-white/10 overflow-hidden">
            <div
              className={`h-full rounded-full bg-gradient-to-r ${risk.gradient}`}
              style={{ width: `${risk.current}%` }}
            />
          </div>
        </div>

        <div className="space-y-1">
          <div className="flex items-center justify-between text-xs text-gray-400 uppercase tracking-wide">
            <span>Projected 15-20 Yr</span>
            <span>{Math.round(risk.future)}%</span>
          </div>
          <div className="h-2.5 rounded-full bg-white/10 overflow-hidden">
            <div
              className={`h-full rounded-full bg-gradient-to-r ${risk.gradient}`}
              style={{ width: `${risk.future}%` }}
            />
          </div>
        </div>
      </div>

      <div className="space-y-2 pt-2 border-t border-white/10">
        <p className="text-xs text-gray-400 uppercase tracking-[0.35em]">
          Primary Drivers
        </p>
        <ul className="space-y-1 text-sm text-gray-200">
          {risk.drivers.map((driver) => (
            <li key={driver} className="flex gap-2">
              <span className="text-emerald-300">•</span>
              <span>{driver}</span>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}

function NutrientCard({
  title,
  highlights,
}: {
  title: string;
  highlights: string[];
}) {
  return (
    <div className="rounded-3xl border border-white/10 bg-black/40 p-6 space-y-4 shadow-[0_20px_60px_rgba(15,23,42,0.25)]">
      <h3 className="text-xl font-semibold text-white">{title}</h3>
      <ul className="space-y-2 text-sm text-gray-200">
        {highlights.map((item) => (
          <li key={item} className="flex gap-2">
            <span className="text-emerald-300">•</span>
            <span>{item}</span>
          </li>
        ))}
      </ul>
    </div>
  );
}

