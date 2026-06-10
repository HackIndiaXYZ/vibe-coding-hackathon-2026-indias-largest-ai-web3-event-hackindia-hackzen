import React, { useState, useEffect } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { motion } from 'framer-motion'
import { useAuth } from '../App'
import { 
  FolderCog, Award, Code, CheckCircle, Trash2, 
  ArrowRight, ExternalLink, RefreshCw 
} from 'lucide-react'
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell } from 'recharts'

interface OverviewProps {
  projects: any[]
  loading: boolean
  fetchProjects: (selectLatest?: boolean) => Promise<void>
}

interface DashboardStats {
  total_projects: number
  avg_score: number
  highest_score: number
  language_counts: Record<string, number>
  scanned_apis: number
}

const Overview: React.FC<OverviewProps> = ({ projects, loading, fetchProjects }) => {
  const { token, logout } = useAuth()
  const navigate = useNavigate()
  const [stats, setStats] = useState<DashboardStats>({
    total_projects: 0,
    avg_score: 0,
    highest_score: 0,
    language_counts: {},
    scanned_apis: 0
  })
  const [loadingStats, setLoadingStats] = useState(true)

  const fetchStats = async () => {
    try {
      const res = await fetch('/api/dashboard/stats', {
        headers: { Authorization: `Bearer ${token}` }
      })
      if (res.ok) {
        const data = await res.json()
        setStats(data)
      } else if (res.status === 401) {
        logout()
      }
    } catch (e) {
      console.error(e)
    } finally {
      setLoadingStats(false)
    }
  }

  useEffect(() => {
    fetchStats()
  }, [projects])

  const handleDelete = async (id: number, e: React.MouseEvent) => {
    e.stopPropagation()
    e.preventDefault()
    if (!confirm("Are you sure you want to delete this scan and its reports?")) return
    
    try {
      const res = await fetch(`/api/projects/${id}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` }
      })
      if (res.ok) {
        fetchProjects()
      } else if (res.status === 401) {
        logout()
      }
    } catch (e) {
      console.error(e)
    }
  }

  const kpis = [
    { label: 'Total Analyzed', value: stats.total_projects, icon: FolderCog, color: 'text-primary-400' },
    { label: 'Avg Potential Score', value: `${stats.avg_score}/100`, icon: Award, color: 'text-amber-400' },
    { label: 'Total APIs Found', value: stats.scanned_apis, icon: Code, color: 'text-emerald-400' },
    { label: 'Highest Product Score', value: `${stats.highest_score}/100`, icon: CheckCircle, color: 'text-indigo-400' },
  ]

  // Prepare chart data
  const chartData = projects.slice().reverse().map(p => ({
    name: p.name.length > 15 ? p.name.substring(0, 12) + '...' : p.name,
    score: p.potential_score,
    fullName: p.name
  }))

  const colors = ['#8b5cf6', '#a78bfa', '#6366f1', '#4f46e5', '#4338ca']

  return (
    <div className="p-8 max-w-7xl mx-auto w-full space-y-8 animate-fade-in-up">
      {/* Header Banner */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 border-b border-gray-900 pb-6">
        <div>
          <h1 className="text-3xl font-extrabold tracking-tight">Console Overview</h1>
          <p className="text-sm text-gray-400 font-medium mt-1">Review aggregated project statistics, product readiness levels, and code scans.</p>
        </div>
        <Link 
          to="/dashboard/upload" 
          className="px-5 py-2.5 text-xs font-bold bg-primary-600 hover:bg-primary-700 text-white rounded-xl shadow-lg shadow-primary-500/10 hover:shadow-primary-500/25 transition-all flex items-center gap-1.5"
        >
          Scan New Project
          <ArrowRight className="w-4 h-4" />
        </Link>
      </div>

      {/* KPI Cards Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        {kpis.map((kpi, idx) => {
          const Icon = kpi.icon
          return (
            <div key={idx} className="glass-card rounded-2xl p-6 border border-gray-900 shadow-xl flex items-center justify-between relative overflow-hidden">
              <div className="space-y-1">
                <p className="text-xs text-gray-500 font-bold uppercase tracking-wider">{kpi.label}</p>
                <p className="text-3xl font-extrabold tracking-tight">{loadingStats ? '...' : kpi.value}</p>
              </div>
              <div className={`p-3 rounded-xl bg-gray-950/60 border border-gray-900 ${kpi.color}`}>
                <Icon className="w-6 h-6" />
              </div>
            </div>
          )
        })}
      </div>

      {/* Visual Charts Section */}
      {projects.length > 0 && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Recharts Bar Chart of Project Scores */}
          <div className="glass-panel rounded-3xl p-6 border border-gray-900 lg:col-span-2 flex flex-col justify-between">
            <div className="mb-6">
              <h3 className="font-bold text-base">Product Potential Comparison</h3>
              <p className="text-xs text-gray-400">Compares overall scoring ranges across scanned repositories.</p>
            </div>
            <div className="h-60 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={chartData} margin={{ top: 10, right: 10, left: -25, bottom: 0 }}>
                  <XAxis dataKey="name" stroke="#64748b" fontSize={10} tickLine={false} />
                  <YAxis domain={[0, 100]} stroke="#64748b" fontSize={10} tickLine={false} />
                  <Tooltip 
                    contentStyle={{ backgroundColor: '#0f172a', borderColor: '#1e293b', borderRadius: '12px' }}
                    labelStyle={{ color: '#fff', fontSize: '12px', fontWeight: 'bold' }}
                    itemStyle={{ color: '#a78bfa', fontSize: '11px' }}
                  />
                  <Bar dataKey="score" radius={[8, 8, 0, 0]}>
                    {chartData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={colors[index % colors.length]} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Code Language Distribution List */}
          <div className="glass-panel rounded-3xl p-6 border border-gray-900 flex flex-col justify-between">
            <div className="mb-6">
              <h3 className="font-bold text-base">Scanned Languages</h3>
              <p className="text-xs text-gray-400">Total lines/file proportions of scanned code formats.</p>
            </div>
            <div className="space-y-4 flex-1 overflow-y-auto pr-1">
              {Object.keys(stats.language_counts).length === 0 ? (
                <div className="text-xs text-gray-500 italic text-center py-12">No files scanned yet</div>
              ) : (
                Object.entries(stats.language_counts)
                  .sort((a, b) => b[1] - a[1])
                  .slice(0, 5)
                  .map(([lang, count], idx) => {
                    const total = Object.values(stats.language_counts).reduce((s, c) => s + c, 0)
                    const percent = Math.round((count / total) * 100)
                    return (
                      <div key={lang} className="space-y-1">
                        <div className="flex items-center justify-between text-xs font-semibold">
                          <span className="text-gray-300">{lang}</span>
                          <span className="text-gray-400">{count} files ({percent}%)</span>
                        </div>
                        <div className="w-full bg-gray-950/60 border border-gray-900/60 h-2 rounded-full overflow-hidden">
                          <div 
                            className="bg-primary-500 h-full rounded-full transition-all duration-500" 
                            style={{ width: `${percent}%`, backgroundColor: colors[idx % colors.length] }}
                          ></div>
                        </div>
                      </div>
                    )
                  })
              )}
            </div>
          </div>
        </div>
      )}

      {/* Projects Table */}
      <div className="glass-panel rounded-3xl border border-gray-900 overflow-hidden shadow-2xl">
        <div className="p-6 border-b border-gray-900 flex items-center justify-between">
          <div>
            <h3 className="font-bold text-base">Scan Repositories</h3>
            <p className="text-xs text-gray-400">Select any project to explore full SaaS opportunity roadmaps.</p>
          </div>
          <button 
            onClick={() => { fetchProjects(); fetchStats(); }}
            className="p-2 bg-gray-900 border border-gray-800 rounded-xl hover:border-primary-500 text-gray-400 hover:text-white transition-colors"
            title="Refresh Scan List"
          >
            <RefreshCw className="w-4 h-4" />
          </button>
        </div>

        {loading ? (
          <div className="p-12 text-center text-xs text-gray-400 animate-pulse font-medium">
            Fetching project registry...
          </div>
        ) : projects.length === 0 ? (
          <div className="p-16 text-center space-y-4">
            <p className="text-xs text-gray-500 italic">No codebase scans registered in database.</p>
            <Link 
              to="/dashboard/upload" 
              className="inline-flex items-center gap-1.5 px-4 py-2 bg-primary-600/20 hover:bg-primary-600/35 border border-primary-500/20 text-primary-400 font-bold rounded-xl text-xs transition-colors"
            >
              Analyze your first project
            </Link>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="border-b border-gray-900 bg-gray-950/30 text-gray-400 font-bold uppercase tracking-wider">
                  <th className="py-4 px-6">Project Name</th>
                  <th className="py-4 px-6">Domain Type</th>
                  <th className="py-4 px-6 text-center">Modules</th>
                  <th className="py-4 px-6 text-center">Product Readiness</th>
                  <th className="py-4 px-6 text-right">Actions</th>
                </tr>
              </thead>
              <tbody>
                {projects.map((project) => (
                  <tr 
                    key={project.id}
                    onClick={() => navigate(`/dashboard/recommendations/${project.id}`)}
                    className="border-b border-gray-900 hover:bg-gray-900/10 cursor-pointer transition-colors"
                  >
                    <td className="py-4 px-6 font-semibold">
                      <div className="space-y-0.5">
                        <div className="text-gray-100 flex items-center gap-1.5">
                          {project.name}
                          {project.repo_url && <ExternalLink className="w-3 h-3 text-gray-500" />}
                        </div>
                        <div className="text-[10px] text-gray-500">{project.file_count} files in {project.folder_count} folders</div>
                      </div>
                    </td>
                    <td className="py-4 px-6 text-gray-300 font-medium">{project.domain}</td>
                    <td className="py-4 px-6 text-center text-gray-400 font-mono font-medium">
                      {project.languages ? Object.keys(project.languages).slice(0, 2).join(', ') : 'N/A'}
                    </td>
                    <td className="py-4 px-6">
                      <div className="flex items-center justify-center gap-2">
                        <span className={`px-2 py-1 rounded-full text-[10px] font-bold ${project.potential_score >= 80 ? 'bg-emerald-950/40 text-emerald-400 border border-emerald-900/40' : project.potential_score >= 60 ? 'bg-amber-950/40 text-amber-400 border border-amber-900/40' : 'bg-gray-900 text-gray-400 border border-gray-800'}`}>
                          {project.potential_score}/100
                        </span>
                      </div>
                    </td>
                    <td className="py-4 px-6 text-right" onClick={(e) => e.stopPropagation()}>
                      <button 
                        onClick={(e) => handleDelete(project.id, e)}
                        className="p-2 rounded-lg bg-gray-900 hover:bg-red-950/30 text-gray-500 hover:text-red-400 border border-gray-800 hover:border-red-900/40 transition-colors"
                        title="Delete project"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  )
}

export default Overview
