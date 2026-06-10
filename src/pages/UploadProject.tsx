import React, { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../App'
import { Upload, GitBranch, AlertCircle, FileArchive, ArrowRight, HelpCircle } from 'lucide-react'
import { motion } from 'framer-motion'

interface UploadProjectProps {
  fetchProjects: (selectLatest?: boolean) => Promise<void>
}

const UploadProject: React.FC<UploadProjectProps> = ({ fetchProjects }) => {
  const { token, logout } = useAuth()
  const navigate = useNavigate()
  
  const [activeTab, setActiveTab] = useState<'zip' | 'git'>('zip')
  const [projectName, setProjectName] = useState('')
  const [gitUrl, setGitUrl] = useState('')
  const [selectedFile, setSelectedFile] = useState<File | null>(null)
  
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [isDragOver, setIsDragOver] = useState(false)

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault()
    setIsDragOver(true)
  }

  const handleDragLeave = () => {
    setIsDragOver(false)
  }

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault()
    setIsDragOver(false)
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      const file = e.dataTransfer.files[0]
      if (file.name.endsWith('.zip')) {
        setSelectedFile(file)
        if (!projectName) {
          // Auto-fill project name from file name
          setProjectName(file.name.replace('.zip', ''))
        }
      } else {
        setError("Only ZIP files are supported for local scan.")
      }
    }
  }

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      const file = e.target.files[0]
      setSelectedFile(file)
      if (!projectName) {
        setProjectName(file.name.replace('.zip', ''))
      }
    }
  }

  const handleScan = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)
    setLoading(true)

    try {
      if (activeTab === 'zip') {
        if (!selectedFile) throw new Error("Please select a ZIP file to scan.")
        if (!projectName) throw new Error("Please specify a project name.")

        const formData = new FormData()
        formData.append('name', projectName)
        formData.append('file', selectedFile)

        const res = await fetch('/api/projects/upload', {
          method: 'POST',
          headers: { Authorization: `Bearer ${token}` },
          body: formData
        })

        if (!res.ok) {
          if (res.status === 401) logout()
          const errData = await res.json()
          throw new Error(errData.detail || "ZIP scan pipeline failed.")
        }

        const data = await res.json()
        await fetchProjects(true)
        // Navigate to the analysis loading view
        navigate(`/dashboard/analysis/${data.project_id}`)

      } else {
        if (!gitUrl) throw new Error("Please specify a GitHub Repository URL.")
        if (!projectName) throw new Error("Please specify a project name.")

        const res = await fetch('/api/projects/analyze-url', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${token}`
          },
          body: JSON.stringify({ name: projectName, repo_url: gitUrl })
        })

        if (!res.ok) {
          if (res.status === 401) logout()
          const errData = await res.json()
          throw new Error(errData.detail || "Git URL scan pipeline failed.")
        }

        const data = await res.json()
        await fetchProjects(true)
        navigate(`/dashboard/analysis/${data.project_id}`)
      }
    } catch (err: any) {
      setError(err.message || "An unexpected error occurred during scan orchestration.")
      setLoading(false)
    }
  }

  return (
    <div className="p-8 max-w-3xl mx-auto w-full space-y-8 animate-fade-in-up">
      {/* Header */}
      <div className="border-b border-gray-900 pb-6">
        <h1 className="text-3xl font-extrabold tracking-tight">Upload Codebase</h1>
        <p className="text-sm text-gray-400 mt-1 font-medium">Submit a local repository bundle or clone a public repository to launch product engines.</p>
      </div>

      {error && (
        <div className="p-4 rounded-2xl bg-red-950/40 border border-red-900/60 flex items-start gap-2.5 text-xs text-red-300 font-semibold">
          <AlertCircle className="w-4.5 h-4.5 text-red-400 flex-shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {/* Tabs */}
      <div className="flex bg-gray-950/40 p-1.5 rounded-2xl border border-gray-900 w-fit">
        <button
          onClick={() => { setActiveTab('zip'); setError(null); }}
          className={`flex items-center gap-2 px-5 py-2.5 rounded-xl text-xs font-bold transition-all ${activeTab === 'zip' ? 'bg-primary-600 text-white shadow-md shadow-primary-500/10' : 'text-gray-400 hover:text-white'}`}
        >
          <FileArchive className="w-4 h-4" />
          Local ZIP Upload
        </button>
        <button
          onClick={() => { setActiveTab('git'); setError(null); }}
          className={`flex items-center gap-2 px-5 py-2.5 rounded-xl text-xs font-bold transition-all ${activeTab === 'git' ? 'bg-primary-600 text-white shadow-md shadow-primary-500/10' : 'text-gray-400 hover:text-white'}`}
        >
          <GitBranch className="w-4 h-4" />
          GitHub Repository
        </button>
      </div>

      {/* Upload Panel */}
      <form onSubmit={handleScan} className="space-y-6">
        <div className="glass-panel border border-gray-900 rounded-3xl p-8 space-y-6 shadow-2xl">
          {/* Project Name */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <label className="text-xs text-gray-400 font-bold uppercase tracking-wide">Project Tag/Name</label>
              <span className="text-[10px] text-gray-500 font-medium">Identifies this scan report.</span>
            </div>
            <input 
              type="text" 
              required
              placeholder="e.g. Hospital Management System" 
              value={projectName}
              onChange={(e) => setProjectName(e.target.value)}
              className="w-full bg-gray-950/50 border border-gray-900 rounded-xl py-3.5 px-4 text-sm focus:border-primary-500 focus:outline-none transition-colors"
            />
          </div>

          {activeTab === 'zip' ? (
            /* ZIP Drag-and-drop */
            <div className="space-y-2">
              <label className="text-xs text-gray-400 font-bold uppercase tracking-wide">Repository File Archive</label>
              <div 
                onDragOver={handleDragOver}
                onDragLeave={handleDragLeave}
                onDrop={handleDrop}
                className={`border-2 border-dashed rounded-2xl p-10 text-center flex flex-col items-center justify-center gap-4 cursor-pointer transition-all ${isDragOver ? 'border-primary-500 bg-primary-950/15' : 'border-gray-900 hover:border-gray-800 bg-gray-950/20'}`}
                onClick={() => document.getElementById('zipFileSelector')?.click()}
              >
                <input 
                  type="file" 
                  id="zipFileSelector"
                  accept=".zip"
                  onChange={handleFileChange}
                  className="hidden"
                />
                
                <div className={`p-4 rounded-full bg-gray-950/80 border border-gray-900 text-gray-400 ${selectedFile ? 'text-primary-400 border-primary-500/20 bg-primary-950/30' : ''}`}>
                  <Upload className="w-8 h-8" />
                </div>
                
                {selectedFile ? (
                  <div className="space-y-1">
                    <p className="text-xs font-semibold text-gray-200">{selectedFile.name}</p>
                    <p className="text-[10px] text-gray-500">{(selectedFile.size / (1024 * 1024)).toFixed(2)} MB &bull; Ready to scan</p>
                  </div>
                ) : (
                  <div className="space-y-1">
                    <p className="text-xs font-bold text-gray-300">Drag and drop your project ZIP here</p>
                    <p className="text-[10px] text-gray-500">or click to browse your local filesystem</p>
                  </div>
                )}
              </div>
            </div>
          ) : (
            /* Git Repository URL */
            <div className="space-y-2">
              <label className="text-xs text-gray-400 font-bold uppercase tracking-wide">Public GitHub Repository URL</label>
              <div className="relative">
                <GitBranch className="absolute left-3.5 top-3.5 w-4.5 h-4.5 text-gray-500" />
                <input 
                  type="url" 
                  required
                  placeholder="https://github.com/username/repository" 
                  value={gitUrl}
                  onChange={(e) => setGitUrl(e.target.value)}
                  className="w-full bg-gray-950/50 border border-gray-900 rounded-xl py-3.5 pl-11 pr-4 text-sm focus:border-primary-500 focus:outline-none transition-colors"
                />
              </div>
              <p className="text-[10px] text-gray-500 font-medium flex items-center gap-1 mt-1">
                <HelpCircle className="w-3.5 h-3.5" />
                Supports cloning public repositories.
              </p>
            </div>
          )}
        </div>

        <button 
          type="submit" 
          disabled={loading}
          className="w-full bg-primary-600 hover:bg-primary-700 disabled:bg-primary-800 text-white rounded-xl py-4 font-bold shadow-xl shadow-primary-500/10 hover:shadow-primary-500/30 transition-all flex items-center justify-center gap-2 group"
        >
          {loading ? (
            <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
          ) : (
            <>
              Orchestrate Scan Pipeline
              <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
            </>
          )}
        </button>
      </form>
    </div>
  )
}

export default UploadProject
