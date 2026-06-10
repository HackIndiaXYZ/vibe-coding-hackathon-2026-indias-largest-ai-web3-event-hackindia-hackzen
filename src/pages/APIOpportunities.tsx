import React, { useState, useEffect } from 'react'
import { useParams, Link } from 'react-router-dom'
import { useAuth } from '../App'
import { Code, Search, ChevronRight, CornerRightDown } from 'lucide-react'

interface APIOpportunity {
  path: string
  method: string
  handler: string
  description: string
}

interface ProjectDetail {
  project: { name: string }
  analysis: { apis: APIOpportunity[] }
}

const APIOpportunities: React.FC = () => {
  const { id } = useParams<{ id: string }>()
  const { token, logout } = useAuth()
  
  const [data, setData] = useState<ProjectDetail | null>(null)
  const [loading, setLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState('')
  const [methodFilter, setMethodFilter] = useState('ALL')

  useEffect(() => {
    const fetchApis = async () => {
      try {
        const res = await fetch(`/api/projects/${id}`, {
          headers: { Authorization: `Bearer ${token}` }
        })
        if (res.ok) {
          const detail = await res.json()
          setData(detail)
        } else if (res.status === 401) {
          logout()
        }
      } catch (e) {
        console.error(e)
      } finally {
        setLoading(false)
      }
    }
    fetchApis()
  }, [id])

  if (loading) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center p-12 text-xs text-gray-400 font-medium animate-pulse">
        Extracting API schemas...
      </div>
    )
  }

  if (!data) {
    return (
      <div className="flex-1 flex items-center justify-center p-12 text-xs text-red-400 font-semibold">
        Error loading API opportunities.
      </div>
    )
  }

  const { project, analysis } = data
  const apis = analysis.apis || []

  // Filter APIs
  const filteredApis = apis.filter(api => {
    const matchesSearch = 
      api.path.toLowerCase().includes(searchQuery.toLowerCase()) ||
      api.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
      api.handler.toLowerCase().includes(searchQuery.toLowerCase())
      
    const matchesMethod = methodFilter === 'ALL' || api.method === methodFilter
    return matchesSearch && matchesMethod
  })

  const methodColors: Record<string, string> = {
    'GET': 'bg-emerald-950/40 text-emerald-400 border-emerald-900/50',
    'POST': 'bg-primary-950/40 text-primary-400 border-primary-900/50',
    'PUT': 'bg-amber-950/40 text-amber-400 border-amber-900/50',
    'DELETE': 'bg-red-950/40 text-red-400 border-red-900/50',
    'PATCH': 'bg-indigo-950/40 text-indigo-400 border-indigo-900/50'
  }

  const uniqueMethods = Array.from(new Set(apis.map(a => a.method)))

  return (
    <div className="p-8 max-w-7xl mx-auto w-full space-y-8 animate-fade-in-up">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 border-b border-gray-900 pb-6">
        <div>
          <h1 className="text-3xl font-extrabold tracking-tight">API Opportunities</h1>
          <p className="text-sm text-gray-400 font-medium mt-1">Review the API endpoint schema extracted from system routing templates.</p>
        </div>
        <div className="px-3.5 py-1.5 rounded-full bg-primary-950/40 border border-primary-900 text-xs font-bold text-primary-300">
          {apis.length} Endpoints Mapped
        </div>
      </div>

      {/* Filter Row */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-4 bg-gray-950/20 border border-gray-900 p-4 rounded-2xl">
        {/* Search Input */}
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3.5 top-3.5 w-4 h-4 text-gray-500" />
          <input 
            type="text" 
            placeholder="Search endpoints, handlers, descriptions..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full bg-gray-950/40 border border-gray-900 rounded-xl py-3 pl-11 pr-4 text-xs focus:border-primary-500 focus:outline-none transition-colors"
          />
        </div>

        {/* Method Filter Buttons */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 sm:pb-0">
          <button 
            onClick={() => setMethodFilter('ALL')}
            className={`px-3 py-1.5 rounded-lg border text-[10px] font-bold uppercase transition-all ${methodFilter === 'ALL' ? 'bg-primary-600 border-primary-500 text-white shadow-md' : 'bg-gray-900 border-gray-800 text-gray-400 hover:text-white'}`}
          >
            All Methods
          </button>
          {uniqueMethods.map(m => (
            <button 
              key={m}
              onClick={() => setMethodFilter(m)}
              className={`px-3 py-1.5 rounded-lg border text-[10px] font-bold uppercase transition-all ${methodFilter === m ? 'bg-primary-600 border-primary-500 text-white shadow-md' : 'bg-gray-900 border-gray-800 text-gray-400 hover:text-white'}`}
            >
              {m}
            </button>
          ))}
        </div>
      </div>

      {/* API Table */}
      <div className="glass-panel rounded-3xl border border-gray-900 overflow-hidden shadow-2xl">
        {filteredApis.length === 0 ? (
          <div className="p-16 text-center text-xs text-gray-500 italic">
            No endpoints match your query filters.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="border-b border-gray-900 bg-gray-950/30 text-gray-400 font-bold uppercase tracking-wider">
                  <th className="py-4 px-6">Method</th>
                  <th className="py-4 px-6">Route Endpoint</th>
                  <th className="py-4 px-6">Controller Handler</th>
                  <th className="py-4 px-6">Functional Purpose</th>
                </tr>
              </thead>
              <tbody>
                {filteredApis.map((api, idx) => (
                  <tr 
                    key={idx}
                    className="border-b border-gray-900 hover:bg-gray-900/10 transition-colors"
                  >
                    <td className="py-4 px-6">
                      <span className={`px-2 py-0.5 rounded-md text-[9px] font-bold border ${methodColors[api.method] || 'bg-gray-900 text-gray-400 border-gray-800'}`}>
                        {api.method}
                      </span>
                    </td>
                    <td className="py-4 px-6 font-mono font-semibold text-gray-100">{api.path}</td>
                    <td className="py-4 px-6 font-mono text-[11px] text-gray-400">{api.handler || 'router.endpoint'}</td>
                    <td className="py-4 px-6 text-gray-300 font-semibold leading-relaxed">{api.description}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Bottom Nav Links */}
      <div className="flex items-center justify-end gap-4 border-t border-gray-900 pt-6">
        <Link 
          to={`/dashboard/microservices/${id}`}
          className="px-5 py-3 rounded-xl bg-gray-900 border border-gray-800 hover:border-primary-500 font-bold text-xs flex items-center gap-1.5 transition-colors"
        >
          Review microservice proposals
          <ChevronRight className="w-4 h-4" />
        </Link>
      </div>
    </div>
  )
}

export default APIOpportunities
