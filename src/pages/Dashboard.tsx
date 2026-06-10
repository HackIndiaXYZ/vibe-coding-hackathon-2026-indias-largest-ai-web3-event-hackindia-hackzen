import React, { useState, useEffect } from 'react'
import { Routes, Route, Link, useLocation, useNavigate } from 'react-router-dom'
import { useAuth } from '../App'
import { 
  LayoutDashboard, Upload, Shield, Code, Cpu, 
  Layers, FileText, Settings, LogOut, ChevronDown
} from 'lucide-react'

// Subpages
import Overview from './Overview'
import UploadProject from './UploadProject'
import Analysis from './Analysis'
import ProductRecommendations from './ProductRecommendations'
import APIOpportunities from './APIOpportunities'
import Microservices from './Microservices'
import Architecture from './Architecture'
import Reports from './Reports'
import SettingsPage from './Settings'

export interface ProjectSummary {
  id: number
  name: string
  repo_url: string | null
  file_count: number
  folder_count: number
  languages: Record<string, number>
  domain: string
  potential_score: number
  created_at: string
}

const Dashboard: React.FC = () => {
  const { user, logout, token } = useAuth()
  const location = useLocation()
  const navigate = useNavigate()
  
  const [projects, setProjects] = useState<ProjectSummary[]>([])
  const [selectedProjectId, setSelectedProjectId] = useState<number | null>(null)
  const [projectDropdownOpen, setProjectDropdownOpen] = useState(false)
  const [loadingProjects, setLoadingProjects] = useState(true)

  // Fetch projects list
  const fetchProjects = async (selectLatest = false) => {
    try {
      const res = await fetch('/api/projects', {
        headers: { Authorization: `Bearer ${token}` }
      })
      if (res.ok) {
        const data = await res.json()
        setProjects(data)
        if (data.length > 0 && (selectLatest || selectedProjectId === null)) {
          // Auto-select latest project scanned
          setSelectedProjectId(data[0].id)
        }
      } else if (res.status === 401) {
        logout()
      }
    } catch (e) {
      console.error("Failed to fetch projects", e)
    } finally {
      setLoadingProjects(false)
    }
  }

  useEffect(() => {
    fetchProjects()
  }, [])

  // Auto-detect project ID from URL parameters
  useEffect(() => {
    const parts = location.pathname.split('/')
    const lastPart = parts[parts.length - 1]
    const id = parseInt(lastPart)
    if (!isNaN(id) && projects.some(p => p.id === id)) {
      setSelectedProjectId(id)
    }
  }, [location.pathname, projects])

  const handleProjectSelect = (id: number) => {
    setSelectedProjectId(id)
    setProjectDropdownOpen(false)
    
    // If we're on a project page, reload for new ID
    const pathParts = location.pathname.split('/')
    if (pathParts.length > 3) {
      const pageType = pathParts[2]
      navigate(`/dashboard/${pageType}/${id}`)
    } else {
      navigate(`/dashboard/recommendations/${id}`)
    }
  }

  const activeProject = projects.find(p => p.id === selectedProjectId)

  const navLinks = [
    { label: 'Overview', path: '/dashboard', icon: LayoutDashboard, category: 'general' },
    { label: 'Upload Project', path: '/dashboard/upload', icon: Upload, category: 'general' },
    { label: 'SaaS Opportunity', path: `/dashboard/recommendations/${selectedProjectId}`, icon: Shield, category: 'project', requireProject: true },
    { label: 'API Opportunities', path: `/dashboard/apis/${selectedProjectId}`, icon: Code, category: 'project', requireProject: true },
    { label: 'Microservices', path: `/dashboard/microservices/${selectedProjectId}`, icon: Cpu, category: 'project', requireProject: true },
    { label: 'Architecture', path: `/dashboard/architecture/${selectedProjectId}`, icon: Layers, category: 'project', requireProject: true },
    { label: 'AI Dossier Reports', path: `/dashboard/reports/${selectedProjectId}`, icon: FileText, category: 'project', requireProject: true },
    { label: 'Global Settings', path: '/dashboard/settings', icon: Settings, category: 'general' }
  ]

  return (
    <div className="min-h-screen bg-background text-gray-100 flex overflow-hidden">
      {/* Sidebar Navigation */}
      <aside className="w-64 bg-gray-950/70 border-r border-gray-900 flex flex-col justify-between h-screen sticky top-0 z-30 backdrop-blur-md">
        <div className="flex-1 flex flex-col pt-6 overflow-y-auto">
          {/* Logo */}
          <div className="px-6 mb-8 flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-primary-600 flex items-center justify-center">
              <Cpu className="w-4 h-4 text-white" />
            </div>
            <span className="font-bold text-sm tracking-wide">SaaSMiner AI</span>
          </div>

          {/* Project Selector Dropdown */}
          <div className="px-4 mb-6 relative">
            <label className="text-[10px] text-gray-500 font-bold uppercase tracking-wider px-2 block mb-1.5">Active Project</label>
            {projects.length === 0 ? (
              <Link 
                to="/dashboard/upload" 
                className="w-full text-left px-3 py-2.5 rounded-xl border border-dashed border-gray-800 hover:border-primary-500 text-xs text-gray-400 hover:text-white flex items-center justify-center gap-1.5 transition-colors"
              >
                <Upload className="w-3.5 h-3.5" />
                Upload first project
              </Link>
            ) : (
              <>
                <button 
                  onClick={() => setProjectDropdownOpen(!projectDropdownOpen)}
                  className="w-full bg-gray-900 hover:bg-gray-800/80 border border-gray-800 rounded-xl px-3 py-2.5 text-xs text-left font-semibold flex items-center justify-between transition-colors"
                >
                  <span className="truncate">{activeProject ? activeProject.name : 'Select Project'}</span>
                  <ChevronDown className="w-3.5 h-3.5 text-gray-500 flex-shrink-0" />
                </button>

                {projectDropdownOpen && (
                  <div className="absolute left-4 right-4 mt-1 bg-gray-900 border border-gray-800 rounded-xl shadow-2xl py-1.5 z-40 max-h-48 overflow-y-auto">
                    {projects.map(p => (
                      <button 
                        key={p.id}
                        onClick={() => handleProjectSelect(p.id)}
                        className={`w-full text-left px-3 py-2 text-xs transition-colors hover:bg-primary-950/40 hover:text-primary-400 ${selectedProjectId === p.id ? 'text-primary-400 font-bold bg-primary-950/20' : 'text-gray-300'}`}
                      >
                        {p.name}
                      </button>
                    ))}
                  </div>
                )}
              </>
            )}
          </div>

          {/* Navigation Links */}
          <nav className="px-3 space-y-5">
            <div>
              <span className="text-[10px] text-gray-500 font-bold uppercase tracking-wider px-3 block mb-2">Workspace</span>
              <div className="space-y-1">
                {navLinks.filter(l => l.category === 'general').map(link => {
                  const Icon = link.icon
                  const isActive = location.pathname === link.path
                  return (
                    <Link 
                      key={link.label}
                      to={link.path}
                      className={`flex items-center gap-3 px-3 py-2.5 rounded-xl text-xs font-semibold transition-colors ${isActive ? 'bg-primary-950/40 text-primary-400 border border-primary-900/50' : 'text-gray-400 hover:text-white hover:bg-gray-900/40'}`}
                    >
                      <Icon className="w-4 h-4" />
                      {link.label}
                    </Link>
                  )
                })}
              </div>
            </div>

            <div>
              <span className="text-[10px] text-gray-500 font-bold uppercase tracking-wider px-3 block mb-2">Analysis Engines</span>
              <div className="space-y-1">
                {navLinks.filter(l => l.category === 'project').map(link => {
                  const Icon = link.icon
                  const disabled = link.requireProject && !selectedProjectId
                  const isActive = location.pathname.startsWith(link.path.split('/').slice(0, 3).join('/'))
                  
                  if (disabled) {
                    return (
                      <div 
                        key={link.label}
                        className="flex items-center gap-3 px-3 py-2.5 rounded-xl text-xs font-semibold text-gray-600 cursor-not-allowed opacity-50"
                        title="Upload/select a project first"
                      >
                        <Icon className="w-4 h-4" />
                        {link.label}
                      </div>
                    )
                  }

                  return (
                    <Link 
                      key={link.label}
                      to={link.path}
                      className={`flex items-center gap-3 px-3 py-2.5 rounded-xl text-xs font-semibold transition-colors ${isActive ? 'bg-primary-950/40 text-primary-400 border border-primary-900/50' : 'text-gray-400 hover:text-white hover:bg-gray-900/40'}`}
                    >
                      <Icon className="w-4 h-4" />
                      {link.label}
                    </Link>
                  )
                })}
              </div>
            </div>
          </nav>
        </div>

        {/* User Account Info / Logout */}
        <div className="p-4 border-t border-gray-900 flex flex-col gap-3 bg-gray-950/40">
          <div className="flex items-center gap-2 overflow-hidden">
            <div className="w-8 h-8 rounded-full bg-primary-900/40 flex items-center justify-center text-primary-300 font-bold text-xs flex-shrink-0">
              {user ? user.fullname.charAt(0).toUpperCase() : 'U'}
            </div>
            <div className="overflow-hidden">
              <p className="text-xs font-semibold truncate text-gray-200">{user?.fullname}</p>
              <p className="text-[10px] text-gray-500 truncate">{user?.email}</p>
            </div>
          </div>
          <button 
            onClick={logout}
            className="w-full flex items-center justify-center gap-2 px-3 py-2.5 rounded-xl bg-red-950/20 hover:bg-red-950/40 border border-red-900/40 hover:border-red-700/60 text-red-400 hover:text-red-300 font-bold text-xs transition-all"
          >
            <LogOut className="w-4 h-4" />
            Sign Out
          </button>
        </div>
      </aside>

      {/* Main View Shell */}
      <div className="flex-1 flex flex-col h-screen overflow-y-auto relative">
        {/* Top header bar */}
        <header className="sticky top-0 z-20 flex items-center justify-between px-8 py-3 border-b border-gray-900 bg-background/80 backdrop-blur-md flex-shrink-0">
          <div className="flex items-center gap-2">
            <span className="text-[10px] text-gray-500 font-bold uppercase tracking-wider">SaaSMiner AI</span>
            <span className="text-gray-700 text-xs">·</span>
            <span className="text-[10px] text-primary-400 font-semibold">Analysis Platform</span>
          </div>
          <button
            onClick={logout}
            className="flex items-center gap-2 px-4 py-2 rounded-xl bg-gray-900 hover:bg-red-950/30 border border-gray-800 hover:border-red-900/50 text-gray-400 hover:text-red-400 font-bold text-xs transition-all"
          >
            <LogOut className="w-3.5 h-3.5" />
            Sign Out
          </button>
        </header>
        <Routes>
          <Route path="/" element={<Overview projects={projects} loading={loadingProjects} fetchProjects={fetchProjects} />} />
          <Route path="/upload" element={<UploadProject fetchProjects={fetchProjects} />} />
          <Route path="/analysis/:id" element={<Analysis />} />
          <Route path="/recommendations/:id" element={<ProductRecommendations />} />
          <Route path="/apis/:id" element={<APIOpportunities />} />
          <Route path="/microservices/:id" element={<Microservices />} />
          <Route path="/architecture/:id" element={<Architecture />} />
          <Route path="/reports/:id" element={<Reports />} />
          <Route path="/settings" element={<SettingsPage fetchProjects={fetchProjects} projects={projects} />} />
        </Routes>
      </div>
    </div>
  )
}

export default Dashboard
