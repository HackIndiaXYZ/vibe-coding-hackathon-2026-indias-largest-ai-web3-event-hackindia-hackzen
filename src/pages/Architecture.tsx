import React, { useState, useEffect } from 'react'
import { useParams, Link } from 'react-router-dom'
import ReactFlow, { 
  MiniMap, Controls, Background, useNodesState, useEdgesState, Handle, Position 
} from 'reactflow'
import { useAuth } from '../App'
import { Layout, Shuffle, Shield, Cpu, Database, ExternalLink, ChevronRight } from 'lucide-react'

import 'reactflow/dist/style.css'

// 1. Custom Node Component
interface CustomNodeProps {
  data: {
    label: string
    subtitle: string
    category: 'frontend' | 'gateway' | 'auth' | 'service' | 'database' | 'thirdparty'
    icon: string
  }
}

const CustomNode: React.FC<CustomNodeProps> = ({ data }) => {
  const borderColors = {
    frontend: 'border-l-indigo-500',
    gateway: 'border-l-slate-500',
    auth: 'border-l-violet-500',
    service: 'border-l-primary-500',
    database: 'border-l-emerald-500',
    thirdparty: 'border-l-amber-500',
  }

  const bgColors = {
    frontend: 'bg-indigo-950/20 border-indigo-900/40',
    gateway: 'bg-slate-950/20 border-slate-900/40',
    auth: 'bg-violet-950/20 border-violet-900/40',
    service: 'bg-primary-950/20 border-primary-900/40',
    database: 'bg-emerald-950/20 border-emerald-900/40',
    thirdparty: 'bg-amber-950/20 border-amber-900/40',
  }

  const textColors = {
    frontend: 'text-indigo-400',
    gateway: 'text-slate-400',
    auth: 'text-violet-400',
    service: 'text-primary-400',
    database: 'text-emerald-400',
    thirdparty: 'text-amber-400',
  }

  const getIcon = () => {
    switch (data.icon) {
      case 'layout': return <Layout className="w-4 h-4" />
      case 'shuffle': return <Shuffle className="w-4 h-4" />
      case 'shield': return <Shield className="w-4 h-4" />
      case 'cpu': return <Cpu className="w-4 h-4" />
      case 'database': return <Database className="w-4 h-4" />
      default: return <ExternalLink className="w-4 h-4" />
    }
  }

  return (
    <div className={`px-4 py-3 rounded-xl border border-l-4 shadow-xl glass-card flex items-center gap-3 w-56 ${borderColors[data.category] || 'border-l-primary-500'} ${bgColors[data.category] || 'bg-gray-900 border-gray-800'}`}>
      <Handle type="target" position={Position.Left} className="w-2 h-2 bg-primary-500 border border-gray-900" />
      
      <div className={`p-2 rounded-lg bg-gray-950 border border-gray-900/60 ${textColors[data.category] || 'text-primary-400'}`}>
        {getIcon()}
      </div>

      <div className="overflow-hidden">
        <h4 className="text-[11px] font-bold text-gray-100 truncate">{data.label}</h4>
        <p className="text-[9px] text-gray-500 font-medium truncate">{data.subtitle}</p>
      </div>

      <Handle type="source" position={Position.Right} className="w-2 h-2 bg-primary-500 border border-gray-900" />
    </div>
  )
}

const nodeTypes = {
  customNode: CustomNode,
}

// 2. Main Page Component
const Architecture: React.FC = () => {
  const { id } = useParams<{ id: string }>()
  const { token, logout } = useAuth()
  
  const [nodes, setNodes, onNodesChange] = useNodesState([])
  const [edges, setEdges, onEdgesChange] = useEdgesState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const fetchArchitecture = async () => {
      try {
        const res = await fetch(`/api/projects/${id}`, {
          headers: { Authorization: `Bearer ${token}` }
        })
        if (res.ok) {
          const detail = await res.json()
          const arch = detail.analysis.architecture
          if (arch) {
            setNodes(arch.nodes || [])
            setEdges(arch.edges || [])
          }
        } else if (res.status === 401) {
          logout()
        }
      } catch (e) {
        console.error(e)
      } finally {
        setLoading(false)
      }
    }
    fetchArchitecture()
  }, [id])

  if (loading) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center p-12 text-xs text-gray-400 font-medium animate-pulse">
        Generating interactive architecture blueprint...
      </div>
    )
  }

  return (
    <div className="p-8 h-screen w-full flex flex-col justify-between space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 border-b border-gray-900 pb-6 flex-shrink-0">
        <div>
          <h1 className="text-3xl font-extrabold tracking-tight">System Architecture</h1>
          <p className="text-sm text-gray-400 font-medium mt-1">Interactive React Flow schematic mapping the target API gateways and backend microservices.</p>
        </div>
        <div className="px-3.5 py-1.5 rounded-full bg-primary-950/40 border border-primary-900 text-xs font-bold text-primary-300">
          React Flow Grid
        </div>
      </div>

      {/* Canvas */}
      <div className="flex-1 border border-gray-900 rounded-3xl overflow-hidden bg-gray-950/30 shadow-2xl relative">
        <ReactFlow
          nodes={nodes}
          edges={edges}
          onNodesChange={onNodesChange}
          onEdgesChange={onEdgesChange}
          nodeTypes={nodeTypes}
          fitView
          attributionPosition="bottom-right"
        >
          <Background color="#1f2937" gap={16} />
          <Controls className="bg-gray-900 border border-gray-800 rounded-xl overflow-hidden fill-white" />
          <MiniMap 
            nodeColor={(node) => {
              if (node.data?.category === 'database') return '#10b981'
              if (node.data?.category === 'frontend') return '#6366f1'
              return '#8b5cf6'
            }}
            maskColor="rgba(3, 7, 18, 0.7)"
            className="bg-gray-900 border border-gray-800 rounded-xl"
          />
        </ReactFlow>
      </div>

      {/* Bottom Nav Links */}
      <div className="flex items-center justify-end gap-4 border-t border-gray-900 pt-6 flex-shrink-0">
        <Link 
          to={`/dashboard/reports/${id}`}
          className="px-5 py-3 rounded-xl bg-gray-900 border border-gray-800 hover:border-primary-500 font-bold text-xs flex items-center gap-1.5 transition-colors"
        >
          Generate dossier reports
          <ChevronRight className="w-4 h-4" />
        </Link>
      </div>
    </div>
  )
}

export default Architecture
