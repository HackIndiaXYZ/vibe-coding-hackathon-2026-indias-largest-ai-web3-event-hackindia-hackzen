import React, { useState, useEffect } from 'react'
import { useParams, Link } from 'react-router-dom'
import { useAuth } from '../App'
import { Cpu, Server, Database, ChevronRight, HelpCircle, GitCommit } from 'lucide-react'

interface Microservice {
  name: string
  tech_stack: string
  database: string
  responsibilities: string[]
  dependencies: string[]
}

interface ProjectDetail {
  project: { name: string }
  analysis: {
    domain: string
    microservices: {
      services: Microservice[]
      rationale: string
    }
  }
}

const Microservices: React.FC = () => {
  const { id } = useParams<{ id: string }>()
  const { token, logout } = useAuth()
  
  const [data, setData] = useState<ProjectDetail | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const fetchMicroservices = async () => {
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
    fetchMicroservices()
  }, [id])

  if (loading) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center p-12 text-xs text-gray-400 font-medium animate-pulse">
        Generating microservices splits...
      </div>
    )
  }

  if (!data) {
    return (
      <div className="flex-1 flex items-center justify-center p-12 text-xs text-red-400 font-semibold">
        Error loading microservice configurations.
      </div>
    )
  }

  const { analysis } = data
  const proposal = analysis.microservices || { services: [], rationale: '' }

  return (
    <div className="p-8 max-w-7xl mx-auto w-full space-y-8 animate-fade-in-up">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 border-b border-gray-900 pb-6">
        <div>
          <h1 className="text-3xl font-extrabold tracking-tight">Microservices Transition</h1>
          <p className="text-sm text-gray-400 font-medium mt-1">Review the proposed decomposition of monolithic modules into microservices.</p>
        </div>
        <div className="px-3.5 py-1.5 rounded-full bg-emerald-950/40 border border-emerald-900 text-xs font-bold text-emerald-300">
          {proposal.services.length} Isolated Services
        </div>
      </div>

      {/* Rationale Banner */}
      <div className="p-5 bg-primary-950/30 border border-primary-900 rounded-3xl flex items-start gap-4">
        <HelpCircle className="w-5 h-5 text-primary-400 flex-shrink-0 mt-0.5" />
        <div className="space-y-1">
          <h4 className="text-xs font-bold text-gray-200">Decomposition Rationale</h4>
          <p className="text-[11px] text-gray-400 leading-relaxed font-semibold">{proposal.rationale}</p>
        </div>
      </div>

      {/* Service Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {proposal.services.map((svc, idx) => (
          <div key={idx} className="glass-card rounded-3xl p-6 border border-gray-900 flex flex-col justify-between gap-5 relative overflow-hidden shadow-xl">
            <div className="space-y-4">
              {/* Header */}
              <div className="flex items-center gap-3">
                <div className="p-2.5 rounded-xl bg-gray-950 border border-gray-900 text-primary-400">
                  <Server className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-bold text-sm text-gray-100">{svc.name}</h3>
                  <span className="text-[10px] text-gray-500 font-mono font-semibold">{svc.tech_stack}</span>
                </div>
              </div>

              {/* Database */}
              {svc.database && (
                <div className="flex items-center gap-2 p-2.5 rounded-xl bg-gray-950/50 border border-gray-900 text-[10px] font-semibold text-gray-400">
                  <Database className="w-4 h-4 text-emerald-400 flex-shrink-0" />
                  <span className="truncate">Isolated DB: {svc.database}</span>
                </div>
              )}

              {/* Responsibilities list */}
              <div className="space-y-2">
                <h4 className="text-[10px] text-gray-500 font-bold uppercase tracking-wider">Responsibilities</h4>
                <ul className="space-y-1.5">
                  {svc.responsibilities.map((resp, rIdx) => (
                    <li key={rIdx} className="flex items-start gap-2 text-[11px] text-gray-300 font-semibold leading-relaxed">
                      <span className="text-primary-500 mt-1">&bull;</span>
                      <span>{resp}</span>
                    </li>
                  ))}
                </ul>
              </div>
            </div>

            {/* Dependencies footer */}
            {svc.dependencies.length > 0 && (
              <div className="border-t border-gray-900/60 pt-4 flex flex-wrap items-center gap-1.5 text-[10px]">
                <span className="text-gray-500 font-bold uppercase tracking-wider mr-1">Depends on:</span>
                {svc.dependencies.map(dep => (
                  <span key={dep} className="px-2 py-0.5 bg-gray-950 border border-gray-900 rounded-md font-bold text-gray-400">
                    {dep}
                  </span>
                ))}
              </div>
            )}
          </div>
        ))}
      </div>

      {/* Bottom Nav Links */}
      <div className="flex items-center justify-end gap-4 border-t border-gray-900 pt-6">
        <Link 
          to={`/dashboard/architecture/${id}`}
          className="px-5 py-3 rounded-xl bg-gray-900 border border-gray-800 hover:border-primary-500 font-bold text-xs flex items-center gap-1.5 transition-colors"
        >
          View interactive architecture
          <ChevronRight className="w-4 h-4" />
        </Link>
      </div>
    </div>
  )
}

export default Microservices
