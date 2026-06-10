import React, { useState, useEffect, useCallback } from 'react'
import { useParams, Link } from 'react-router-dom'
import { useAuth } from '../App'
import {
  Award, Target, CheckSquare, ChevronRight, ShieldCheck, Zap,
  Sparkles, RefreshCw, AlertCircle, ToggleLeft, ToggleRight
} from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'
import AISpinner from '../components/AISpinner'
import ModelToggle from '../components/ModelToggle'

// ─── Types ────────────────────────────────────────────────────────────────────

interface SaaSResult {
  recommended_product?: string
  product_type?: string
  explanation?: string
  can_become_product?: string
  roadmap?: string[]
  reasons?: string[]
  ai_insights?: {
    market_opportunity?: string
    monetization_model?: string
    estimated_tam?: string
    competitive_edge?: string
    time_to_market?: string
  }
  source?: string
  model?: string
  cached?: boolean
  error?: string
}

interface RateLimits {
  rpm: number
  rpd: number
  tpm?: number
  reset_note: string
}

interface CombinedRec {
  heuristic: SaaSResult
  ai: SaaSResult
  preferred: 'ai' | 'heuristic'
  model: string
  rate_limits: RateLimits
}

interface ProjectDetail {
  project: {
    id: number
    name: string
    repo_url: string | null
    file_count: number
    folder_count: number
    languages: Record<string, number>
    created_at: string
  }
  analysis: {
    domain: string
    confidence: number
    modules: any[]
    potential_score: number
    saas_recommendation: SaaSResult
    apis: any[]
    microservices: any
    architecture: any
    business_potential: any
  }
}

// ─── Component ────────────────────────────────────────────────────────────────

const ProductRecommendations: React.FC = () => {
  const { id } = useParams<{ id: string }>()
  const { token, logout } = useAuth()

  // Project + basic data state
  const [data, setData] = useState<ProjectDetail | null>(null)
  const [loadingProject, setLoadingProject] = useState(true)
  const [projectError, setProjectError] = useState<string | null>(null)

  // AI recommendation state
  const [model, setModel] = useState<'flash' | 'pro'>('flash')
  const [aiData, setAiData] = useState<CombinedRec | null>(null)
  const [aiLoading, setAiLoading] = useState(false)
  const [aiError, setAiError] = useState<string | null>(null)

  // Source preference (heuristic vs ai)
  const [preferred, setPreferred] = useState<'ai' | 'heuristic'>('ai')

  // ── Fetch project details ────────────────────────────────────────────────────
  useEffect(() => {
    const fetchProject = async () => {
      try {
        const res = await fetch(`/api/projects/${id}`, {
          headers: { Authorization: `Bearer ${token}` }
        })
        if (res.ok) {
          setData(await res.json())
        } else {
          if (res.status === 401) logout()
          throw new Error('Failed to retrieve project details.')
        }
      } catch (err: any) {
        setProjectError(err.message)
      } finally {
        setLoadingProject(false)
      }
    }
    fetchProject()
  }, [id])

  // ── Fetch AI recommendations ─────────────────────────────────────────────────
  const fetchAI = useCallback(async (selectedModel: 'flash' | 'pro') => {
    setAiLoading(true)
    setAiError(null)
    try {
      const res = await fetch(`/api/recommendations/${id}?model=${selectedModel}`, {
        headers: { Authorization: `Bearer ${token}` }
      })
      if (!res.ok) {
        if (res.status === 401) logout()
        throw new Error('AI recommendation request failed.')
      }
      const json: CombinedRec = await res.json()
      setAiData(json)
      setPreferred(json.preferred)
    } catch (err: any) {
      setAiError(err.message)
    } finally {
      setAiLoading(false)
    }
  }, [id, token])

  // Auto-fetch AI on load
  useEffect(() => {
    if (!loadingProject && data) fetchAI(model)
  }, [loadingProject, data])

  const handleModelChange = (m: 'flash' | 'pro') => {
    setModel(m)
    fetchAI(m)
  }

  // ── Derived display data ─────────────────────────────────────────────────────
  const activeRec: SaaSResult =
    preferred === 'ai' && aiData?.ai && !aiData.ai.error
      ? aiData.ai
      : (aiData?.heuristic ?? data?.analysis?.saas_recommendation ?? {})

  // ── Loading state ────────────────────────────────────────────────────────────
  if (loadingProject) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center p-12 text-xs text-gray-400 font-medium animate-pulse">
        Loading project data…
      </div>
    )
  }

  if (projectError || !data) {
    return (
      <div className="flex-1 flex items-center justify-center p-12 text-xs text-red-400 font-semibold">
        Error: {projectError || 'No records returned'}
      </div>
    )
  }

  const { project, analysis } = data
  const score = analysis.potential_score
  const radius = 60
  const circumference = 2 * Math.PI * radius
  const strokeDashoffset = circumference - (score / 100) * circumference

  const breakdowns = [
    { label: 'Modularity',            val: Math.min(100, score - 3), color: 'bg-primary-500' },
    { label: 'Reusability',           val: Math.min(100, score + 2), color: 'bg-indigo-500' },
    { label: 'Scalability',           val: Math.min(100, score - 10), color: 'bg-emerald-500' },
    { label: 'Architecture Quality',  val: Math.min(100, score - 5), color: 'bg-violet-500' },
    { label: 'Business Value',        val: Math.min(100, score + 4), color: 'bg-amber-500' },
    { label: 'Market Applicability',  val: Math.min(100, score - 2), color: 'bg-pink-500' },
  ]

  // ── Render ───────────────────────────────────────────────────────────────────
  return (
    <div className="p-8 max-w-7xl mx-auto w-full space-y-8 animate-fade-in-up">

      {/* ── Header ── */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 border-b border-gray-900 pb-6">
        <div>
          <h1 className="text-3xl font-extrabold tracking-tight">SaaS Opportunity</h1>
          <p className="text-sm text-gray-400 font-medium mt-1">
            AI-powered + heuristic analysis of monetisation potential.
          </p>
        </div>
        <div className="text-xs text-gray-500 font-mono">
          Scanned: {new Date(project.created_at).toLocaleDateString()}
        </div>
      </div>

      {/* ── Controls Row: Model Toggle + Source Switcher ── */}
      <div className="flex flex-wrap items-end justify-between gap-6 bg-gray-950/60 border border-gray-900 rounded-2xl p-5">
        <ModelToggle model={model} onChange={handleModelChange} disabled={aiLoading} />

        <div className="flex flex-col gap-2">
          <p className="text-[10px] font-bold text-gray-500 uppercase tracking-widest">Result Source</p>
          <div className="flex items-center gap-3">
            <button
              id="source-heuristic"
              onClick={() => setPreferred('heuristic')}
              className={`px-4 py-2 rounded-xl text-xs font-bold border transition-all ${
                preferred === 'heuristic'
                  ? 'bg-amber-500/20 border-amber-600/50 text-amber-300'
                  : 'bg-gray-900 border-gray-800 text-gray-500 hover:text-gray-300'
              }`}
            >
              <Zap className="w-3.5 h-3.5 inline mr-1" />
              Rule-Based
            </button>
            <button
              id="source-ai"
              onClick={() => setPreferred('ai')}
              disabled={!aiData?.ai || !!aiData.ai.error}
              className={`px-4 py-2 rounded-xl text-xs font-bold border transition-all disabled:opacity-40 disabled:cursor-not-allowed ${
                preferred === 'ai'
                  ? 'bg-primary-500/20 border-primary-600/50 text-primary-300'
                  : 'bg-gray-900 border-gray-800 text-gray-500 hover:text-gray-300'
              }`}
            >
              <Sparkles className="w-3.5 h-3.5 inline mr-1" />
              AI Analysis
            </button>
            <button
              id="btn-refresh-ai"
              onClick={() => fetchAI(model)}
              disabled={aiLoading}
              title="Re-run AI analysis"
              className="p-2 rounded-xl border border-gray-800 bg-gray-900 text-gray-500 hover:text-white hover:border-gray-700 transition-all disabled:opacity-40"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${aiLoading ? 'animate-spin' : ''}`} />
            </button>
          </div>
          {aiData?.ai?.cached && (
            <p className="text-[10px] text-gray-600 font-mono">⚡ Served from cache</p>
          )}
        </div>
      </div>

      {/* ── AI Loading Spinner ── */}
      <AnimatePresence>
        {aiLoading && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="glass-panel border border-gray-900 rounded-3xl overflow-hidden"
          >
            <AISpinner model={model} rateLimits={aiData?.rate_limits} />
          </motion.div>
        )}
      </AnimatePresence>

      {/* ── AI Error Banner ── */}
      {aiError && !aiLoading && (
        <div className="flex items-center gap-3 p-4 rounded-2xl bg-red-950/30 border border-red-900/50 text-red-400 text-xs font-semibold">
          <AlertCircle className="w-4 h-4 flex-shrink-0" />
          AI analysis failed: {aiError}. Showing rule-based results below.
        </div>
      )}

      {/* ── Server-Side AI Config/Quota Error Banner ── */}
      {aiData?.ai?.error && !aiLoading && (
        <div className="flex items-center gap-3 p-4 rounded-2xl bg-amber-950/30 border border-amber-900/50 text-amber-400 text-xs font-semibold">
          <AlertCircle className="w-4 h-4 flex-shrink-0 animate-pulse" />
          <span>
            <strong>AI Not Available:</strong> {aiData.ai.error} Ensure <code>OPENROUTER_API_KEY</code> is correctly set in your backend <code>.env</code> file, then restart the server.
          </span>
        </div>
      )}

      {/* ── Main Content (hidden while AI is loading) ── */}
      {!aiLoading && (
        <>
          {/* Source badge */}
          <div className="flex items-center gap-2">
            <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[11px] font-bold border ${
              preferred === 'ai'
                ? 'bg-primary-950/50 border-primary-800/50 text-primary-300'
                : 'bg-amber-950/50 border-amber-800/50 text-amber-300'
            }`}>
              {preferred === 'ai' ? <Sparkles className="w-3 h-3" /> : <Zap className="w-3 h-3" />}
              {preferred === 'ai'
                ? `OpenRouter AI Analysis`
                : 'Rule-Based Heuristic Analysis'}
            </span>
          </div>

          {/* ── KPI & Gauge Row ── */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Gauge */}
            <div className="glass-panel rounded-3xl p-6 border border-gray-900 shadow-xl flex flex-col items-center justify-center text-center gap-6 relative overflow-hidden">
              <div className="glowing-orb top-[-250px] left-[-200px] w-80 h-80 opacity-50" />
              <h3 className="font-bold text-sm text-gray-400 uppercase tracking-wider">Product Potential</h3>
              <div className="relative w-40 h-40 flex items-center justify-center">
                <svg className="w-full h-full transform -rotate-90">
                  <circle cx="80" cy="80" r={radius} className="stroke-gray-800" strokeWidth="10" fill="transparent" />
                  <motion.circle
                    cx="80" cy="80" r={radius}
                    className="stroke-primary-500"
                    strokeWidth="10" fill="transparent"
                    strokeDasharray={circumference}
                    initial={{ strokeDashoffset: circumference }}
                    animate={{ strokeDashoffset }}
                    transition={{ duration: 1.2, ease: 'easeOut' }}
                    strokeLinecap="round"
                  />
                </svg>
                <div className="absolute flex flex-col items-center justify-center">
                  <span className="text-3xl font-extrabold tracking-tight">{score}</span>
                  <span className="text-[10px] text-gray-500 font-bold uppercase">Score</span>
                </div>
              </div>
              <div className="text-xs font-semibold text-gray-300">
                {score >= 80 ? (
                  <span className="text-emerald-400">Excellent commercial readiness</span>
                ) : score >= 60 ? (
                  <span className="text-amber-400">Moderate product potential</span>
                ) : (
                  <span className="text-gray-400">Refactoring recommended first</span>
                )}
              </div>
            </div>

            {/* Readiness bars */}
            <div className="glass-panel rounded-3xl p-6 border border-gray-900 shadow-xl lg:col-span-2 flex flex-col justify-between">
              <h3 className="font-bold text-sm text-gray-400 uppercase tracking-wider mb-4">Readiness Indicators</h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-8 gap-y-4">
                {breakdowns.map(b => (
                  <div key={b.label} className="space-y-1">
                    <div className="flex items-center justify-between text-xs font-bold">
                      <span className="text-gray-400">{b.label}</span>
                      <span>{b.val}/100</span>
                    </div>
                    <div className="w-full bg-gray-950/60 border border-gray-900 h-2 rounded-full overflow-hidden">
                      <motion.div
                        className={`h-full rounded-full ${b.color}`}
                        initial={{ width: 0 }}
                        animate={{ width: `${b.val}%` }}
                        transition={{ duration: 1, delay: 0.2 }}
                      />
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* ── Domain + Recommendation ── */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            {/* Domain */}
            <div className="glass-panel border border-gray-900 rounded-3xl p-6 space-y-6 shadow-xl relative overflow-hidden">
              <div className="flex items-center gap-3 border-b border-gray-900 pb-4">
                <div className="p-2.5 rounded-xl bg-primary-950/40 border border-primary-900/40 text-primary-400">
                  <Target className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-bold text-base">Domain Classification</h3>
                  <p className="text-[10px] text-gray-500">Industry classification vector.</p>
                </div>
              </div>
              <div className="flex items-baseline gap-2">
                <span className="text-3xl font-extrabold tracking-tight">{analysis.domain}</span>
                <span className="text-emerald-400 text-xs font-bold">({analysis.confidence}% Conf)</span>
              </div>
              <p className="text-xs text-gray-400 leading-relaxed">
                The scanner analysed key schema attributes, route endpoints, and function structures to match your codebase with targeted industry classification rules.
              </p>
            </div>

            {/* SaaS Recommendation */}
            <div className="glass-panel border border-gray-900 rounded-3xl p-6 space-y-6 shadow-xl relative overflow-hidden">
              <div className="flex items-center gap-3 border-b border-gray-900 pb-4">
                <div className="p-2.5 rounded-xl bg-emerald-950/40 border border-emerald-900/40 text-emerald-400">
                  <ShieldCheck className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-bold text-base">SaaS Packaging</h3>
                  <p className="text-[10px] text-gray-500">Commercial deployment model.</p>
                </div>
              </div>
              <div className="space-y-1">
                <h4 className="text-xl font-bold">{activeRec.recommended_product ?? '—'}</h4>
                <span className="inline-block px-2.5 py-0.5 rounded-full bg-primary-950/40 border border-primary-900 text-[10px] font-bold text-primary-300">
                  {activeRec.product_type ?? '—'}
                </span>
              </div>
              <p className="text-xs text-gray-400 leading-relaxed">{activeRec.explanation ?? '—'}</p>
            </div>
          </div>

          {/* ── AI Insights (only when AI source & ai_insights exist) ── */}
          {preferred === 'ai' && activeRec.ai_insights && (
            <motion.div
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              className="glass-panel border border-primary-900/40 rounded-3xl p-6 space-y-5 shadow-xl"
            >
              <div className="flex items-center gap-2 border-b border-gray-900 pb-4">
                <Sparkles className="w-5 h-5 text-primary-400" />
                <h3 className="font-bold text-base">AI Deep Insights</h3>
                <span className="ml-auto text-[10px] font-bold text-primary-400 bg-primary-950/50 border border-primary-800/50 px-2 py-0.5 rounded-full">
                  OpenRouter AI
                </span>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {[
                  { label: 'Market Opportunity',  value: activeRec.ai_insights.market_opportunity },
                  { label: 'Monetisation Model',  value: activeRec.ai_insights.monetization_model },
                  { label: 'Est. TAM',             value: activeRec.ai_insights.estimated_tam },
                  { label: 'Competitive Edge',    value: activeRec.ai_insights.competitive_edge },
                  { label: 'Time to Market',      value: activeRec.ai_insights.time_to_market },
                ].filter(i => i.value).map(item => (
                  <div key={item.label} className="bg-gray-950/40 border border-gray-900 rounded-2xl p-4 space-y-1">
                    <p className="text-[10px] font-bold text-gray-500 uppercase tracking-widest">{item.label}</p>
                    <p className="text-xs text-gray-200 font-semibold leading-relaxed">{item.value}</p>
                  </div>
                ))}
              </div>
            </motion.div>
          )}

          {/* ── Reasons + Roadmap ── */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Reasons */}
            <div className="glass-panel border border-gray-900 rounded-3xl p-6 space-y-4 shadow-xl lg:col-span-1">
              <h3 className="font-bold text-sm text-gray-400 uppercase tracking-wider">Analysis Justifications</h3>
              <div className="space-y-3.5 pt-2">
                {(activeRec.reasons ?? []).map((reason, idx) => (
                  <div key={idx} className="flex items-start gap-2.5 text-xs text-gray-300 font-semibold leading-relaxed">
                    <Zap className="w-4 h-4 text-amber-500 flex-shrink-0 mt-0.5" />
                    <span>{reason}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Roadmap */}
            <div className="glass-panel border border-gray-900 rounded-3xl p-6 space-y-4 shadow-xl lg:col-span-2">
              <h3 className="font-bold text-sm text-gray-400 uppercase tracking-wider">Productisation Roadmap</h3>
              <div className="space-y-3 pt-2">
                {(activeRec.roadmap ?? []).map((step, idx) => (
                  <div key={idx} className="flex items-start gap-3 p-3 rounded-2xl bg-gray-950/30 border border-gray-900 hover:border-gray-800 transition-colors">
                    <CheckSquare className="w-5 h-5 text-primary-400 flex-shrink-0 mt-0.5" />
                    <div className="space-y-1">
                      <h4 className="text-xs font-bold text-gray-200">Step {idx + 1}</h4>
                      <p className="text-[11px] text-gray-400 leading-relaxed">{step}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* ── Bottom Nav ── */}
          <div className="flex items-center justify-end gap-4 border-t border-gray-900 pt-6">
            <Link
              to={`/dashboard/apis/${id}`}
              className="px-5 py-3 rounded-xl bg-gray-900 border border-gray-800 hover:border-primary-500 font-bold text-xs flex items-center gap-1.5 transition-colors"
            >
              Explore API opportunities
              <ChevronRight className="w-4 h-4" />
            </Link>
          </div>
        </>
      )}
    </div>
  )
}

export default ProductRecommendations
