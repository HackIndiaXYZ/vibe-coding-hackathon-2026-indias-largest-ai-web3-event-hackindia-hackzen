import React, { useState, useEffect } from 'react'
import { useParams, Link } from 'react-router-dom'
import { useAuth } from '../App'
import { FileText, Download, Check, AlertCircle, RefreshCw } from 'lucide-react'

interface ProjectDetail {
  project: { name: string }
  report_ready: boolean
}

const Reports: React.FC = () => {
  const { id } = useParams<{ id: string }>()
  const { token, logout } = useAuth()
  
  const [data, setData] = useState<ProjectDetail | null>(null)
  const [loading, setLoading] = useState(true)
  const [downloading, setDownloading] = useState(false)

  const fetchDetails = async () => {
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

  useEffect(() => {
    fetchDetails()
  }, [id])

  const handleDownload = async () => {
    if (!data) return
    setDownloading(true)
    
    try {
      const response = await fetch(`/api/projects/${id}/report`, {
        headers: { Authorization: `Bearer ${token}` }
      })
      
      if (!response.ok) {
        if (response.status === 401) logout()
        throw new Error("Failed to compile PDF report file.")
      }
      
      const blob = await response.blob()
      const url = window.URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `Report_${data.project.name.replace(/\s+/g, '_')}.pdf`
      document.body.appendChild(a)
      a.click()
      a.remove()
      window.URL.revokeObjectURL(url)
    } catch (e: any) {
      alert(e.message || "Failed to download PDF report.")
    } finally {
      setDownloading(false)
    }
  }

  if (loading) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center p-12 text-xs text-gray-400 font-medium animate-pulse">
        Retrieving report records...
      </div>
    )
  }

  if (!data) {
    return (
      <div className="flex-1 flex items-center justify-center p-12 text-xs text-red-400 font-semibold">
        Error loading report configuration.
      </div>
    )
  }

  const sections = [
    'Project Executive Summary',
    'Repository Structure & Tech Stack counts',
    'Detected Modular capabilities (e.g. Auth, Billing)',
    'Domain identification & Classifier confidence ratings',
    'SaaS Recommendations & Product roadmaps',
    'Extracted REST API Opportunities',
    'Microservice decomposition layout splits',
    'Market sizing, demographics & monetization channels'
  ]

  return (
    <div className="p-8 max-w-4xl mx-auto w-full space-y-8 animate-fade-in-up">
      {/* Header */}
      <div className="border-b border-gray-900 pb-6">
        <h1 className="text-3xl font-extrabold tracking-tight">AI Dossier Reports</h1>
        <p className="text-sm text-gray-400 mt-1 font-medium">Download offline PDF blueprints detailing your code analysis and monetization strategy.</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-8 items-start">
        {/* Dossier Card */}
        <div className="glass-panel border border-gray-900 rounded-3xl p-6 md:col-span-2 space-y-6 shadow-xl relative overflow-hidden">
          <div className="flex items-center gap-3 border-b border-gray-900 pb-4">
            <div className="p-2.5 rounded-xl bg-primary-950/40 border border-primary-900/40 text-primary-400">
              <FileText className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-bold text-base">Executive Dossier</h3>
              <p className="text-[10px] text-gray-500">Offline printable PDF dossier.</p>
            </div>
          </div>

          <p className="text-xs text-gray-400 leading-relaxed">
            This PDF dossier includes structural statistics, microservices designs, target REST paths, and business opportunity assessments. Ideal for sharing with developers, founders, or investors.
          </p>

          <div className="space-y-3 pt-2">
            <h4 className="text-[10px] text-gray-500 font-bold uppercase tracking-wider">Report Chapters Included</h4>
            <div className="space-y-2">
              {sections.map((sec, idx) => (
                <div key={idx} className="flex items-center gap-2.5 text-xs text-gray-300 font-semibold">
                  <Check className="w-4 h-4 text-emerald-400 flex-shrink-0" />
                  <span>{sec}</span>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Download Action Box */}
        <div className="glass-panel border border-gray-900 rounded-3xl p-6 md:col-span-1 space-y-6 shadow-xl text-center relative overflow-hidden">
          <h3 className="font-bold text-sm text-gray-400 uppercase tracking-wider">Dossier Status</h3>
          
          <div className="space-y-4">
            {data.report_ready ? (
              <div className="space-y-4">
                <div className="w-16 h-16 rounded-full bg-emerald-950/40 border border-emerald-900 text-emerald-400 flex items-center justify-center mx-auto shadow-md">
                  <Check className="w-8 h-8" />
                </div>
                <p className="text-xs font-bold text-emerald-400">Dossier compiled successfully</p>
                
                <button 
                  onClick={handleDownload}
                  disabled={downloading}
                  className="w-full bg-primary-600 hover:bg-primary-700 disabled:bg-primary-800 text-white rounded-xl py-3.5 font-bold shadow-lg shadow-primary-500/10 hover:shadow-primary-500/35 transition-all flex items-center justify-center gap-2 group text-xs"
                >
                  {downloading ? (
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                  ) : (
                    <>
                      <Download className="w-4 h-4" />
                      Download Dossier
                    </>
                  )}
                </button>
              </div>
            ) : (
              <div className="space-y-4">
                <div className="w-16 h-16 rounded-full bg-red-950/40 border border-red-900 text-red-400 flex items-center justify-center mx-auto shadow-md">
                  <AlertCircle className="w-8 h-8" />
                </div>
                <p className="text-xs font-bold text-red-400">Dossier not found</p>
                <button 
                  onClick={fetchDetails}
                  className="w-full bg-gray-900 hover:bg-gray-800 border border-gray-800 hover:border-primary-500 text-gray-300 rounded-xl py-3 text-xs font-bold transition-all flex items-center justify-center gap-1.5"
                >
                  <RefreshCw className="w-4 h-4" />
                  Retry compilation
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}

export default Reports
