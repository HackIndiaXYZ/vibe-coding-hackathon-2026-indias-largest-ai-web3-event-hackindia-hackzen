import React, { useState, useEffect } from 'react'
import { useAuth } from '../App'
import { User, Trash2, AlertTriangle, ShieldAlert, Check } from 'lucide-react'

interface SettingsProps {
  projects: any[]
  fetchProjects: () => Promise<void>
}

const Settings: React.FC<SettingsProps> = ({ projects, fetchProjects }) => {
  const { user, token, logout } = useAuth()
  
  const [wiping, setWiping] = useState(false)
  const [success, setSuccess] = useState(false)

  const [selectedProjectId, setSelectedProjectId] = useState<string>('')
  const [deletingProject, setDeletingProject] = useState(false)
  const [deleteSuccess, setDeleteSuccess] = useState(false)

  useEffect(() => {
    if (projects && projects.length > 0 && !selectedProjectId) {
      setSelectedProjectId(projects[0].id.toString())
    }
  }, [projects, selectedProjectId])

  const handleDeleteProject = async () => {
    if (!selectedProjectId) return
    const project = projects.find(p => p.id.toString() === selectedProjectId)
    if (!project) return
    if (!confirm(`Are you sure you want to permanently delete the project "${project.name}" and all its scans?`)) return
    
    setDeletingProject(true)
    try {
      const res = await fetch(`/api/projects/${selectedProjectId}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` }
      })
      if (res.ok) {
        await fetchProjects()
        setDeleteSuccess(true)
        setTimeout(() => setDeleteSuccess(false), 3000)
        // Reset selected project
        if (projects.length > 1) {
          const remaining = projects.filter(p => p.id.toString() !== selectedProjectId)
          setSelectedProjectId(remaining.length > 0 ? remaining[0].id.toString() : '')
        } else {
          setSelectedProjectId('')
        }
      } else if (res.status === 401) {
        logout()
      }
    } catch (e) {
      console.error(e)
    } finally {
      setDeletingProject(false)
    }
  }

  const handleClearHistory = async () => {
    if (!confirm("Are you sure you want to permanently clear all project scans, reports, and analysis data? This action is irreversible.")) return
    
    setWiping(true)
    try {
      // Loop and delete each project in parallel
      const deletePromises = projects.map(async p => {
        const res = await fetch(`/api/projects/${p.id}`, {
          method: 'DELETE',
          headers: { Authorization: `Bearer ${token}` }
        })
        if (res.status === 401) logout()
        return res
      })
      await Promise.all(deletePromises)
      await fetchProjects()
      setSelectedProjectId('')
      setSuccess(true)
      setTimeout(() => setSuccess(false), 3000)
    } catch (e) {
      console.error(e)
    } finally {
      setWiping(false)
    }
  }

  return (
    <div className="p-8 max-w-4xl mx-auto w-full space-y-8 animate-fade-in-up">
      {/* Header */}
      <div className="border-b border-gray-900 pb-6">
        <h1 className="text-3xl font-extrabold tracking-tight">Global Settings</h1>
        <p className="text-sm text-gray-400 mt-1 font-medium font-semibold">Review your local offline credentials, database targets, and workspace properties.</p>
      </div>

      <div className="space-y-6">
        {/* User Card */}
        <div className="glass-panel border border-gray-900 rounded-3xl p-6 space-y-4 shadow-xl">
          <h3 className="font-bold text-sm text-gray-400 uppercase tracking-wider flex items-center gap-2">
            <User className="w-4 h-4 text-primary-400" />
            User Account Profile
          </h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2">
            <div className="space-y-1">
              <span className="text-[10px] text-gray-500 font-bold uppercase">Full Name</span>
              <p className="text-sm font-semibold text-gray-200">{user?.fullname}</p>
            </div>
            <div className="space-y-1">
              <span className="text-[10px] text-gray-500 font-bold uppercase">Email Address</span>
              <p className="text-sm font-semibold text-gray-200">{user?.email}</p>
            </div>
          </div>
        </div>

        {/* Delete Particular Project Scan */}
        <div className="glass-panel border border-gray-900 rounded-3xl p-6 space-y-4 shadow-xl">
          <h3 className="font-bold text-sm text-gray-400 uppercase tracking-wider flex items-center gap-2">
            <Trash2 className="w-4 h-4 text-emerald-400" />
            Delete Individual Project Scan
          </h3>
          <div className="pt-2 space-y-4">
            <p className="text-xs text-gray-400 leading-relaxed">
              Select a single scanned project to delete its analysis data, microservice visual diagrams, and compiled PDF reports.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 items-stretch sm:items-center">
              <div className="flex-1">
                <select
                  disabled={projects.length === 0}
                  value={selectedProjectId}
                  onChange={(e) => setSelectedProjectId(e.target.value)}
                  className="w-full bg-gray-950/50 border border-gray-900 rounded-xl py-3 px-4 text-xs focus:border-primary-500 focus:outline-none transition-colors text-gray-200"
                >
                  {projects.length === 0 ? (
                    <option value="">No projects scanned yet</option>
                  ) : (
                    projects.map(p => (
                      <option key={p.id} value={p.id.toString()}>
                        {p.name} (Score: {p.potential_score}/100)
                      </option>
                    ))
                  )}
                </select>
              </div>
              <button
                onClick={handleDeleteProject}
                disabled={deletingProject || !selectedProjectId}
                className="px-5 py-3 rounded-xl bg-emerald-950/30 hover:bg-emerald-900/40 border border-emerald-900/60 text-emerald-400 font-bold text-xs transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-1.5"
              >
                {deletingProject ? (
                  <div className="w-4 h-4 border-2 border-emerald-400 border-t-transparent rounded-full animate-spin"></div>
                ) : deleteSuccess ? (
                  <>
                    <Check className="w-4 h-4" />
                    Deleted Successfully
                  </>
                ) : (
                  <>
                    <Trash2 className="w-4 h-4" />
                    Delete Selected Scan
                  </>
                )}
              </button>
            </div>
          </div>
        </div>

        {/* Danger Zone */}
        <div className="glass-panel border border-red-950/40 rounded-3xl p-6 space-y-6 shadow-xl relative overflow-hidden">
          <div className="absolute top-0 left-0 w-1.5 h-full bg-red-600"></div>
          
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-red-950/40 border border-red-900/40 text-red-400">
              <ShieldAlert className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-bold text-sm text-red-400 uppercase tracking-wider">Danger Zone</h3>
              <p className="text-[10px] text-gray-500">Actions that delete system data records.</p>
            </div>
          </div>

          <p className="text-xs text-gray-400 leading-relaxed max-w-xl">
            Clearing your analysis history will delete all codebase statistics, microservice maps, and compiled ReportLab PDF dossiers from your local drive. This database transaction cannot be rolled back.
          </p>

          <div className="flex items-center gap-3">
            <button 
              onClick={handleClearHistory}
              disabled={wiping || projects.length === 0}
              className="px-5 py-3 rounded-xl bg-red-950/30 hover:bg-red-900/40 border border-red-900/60 text-red-400 font-bold text-xs transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-1.5"
            >
              {wiping ? (
                <div className="w-4 h-4 border-2 border-red-400 border-t-transparent rounded-full animate-spin"></div>
              ) : success ? (
                <>
                  <Check className="w-4 h-4" />
                  Wiped Successfully
                </>
              ) : (
                <>
                  <AlertTriangle className="w-4 h-4" />
                  Clear Scan History ({projects.length})
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}

export default Settings
