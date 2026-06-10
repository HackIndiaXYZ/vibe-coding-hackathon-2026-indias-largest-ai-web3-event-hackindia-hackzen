import React, { useState, useEffect, useRef } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { motion } from 'framer-motion'
import { Terminal, Shield, Check, Play, LogOut } from 'lucide-react'
import { useAuth } from '../App'

interface LogMessage {
  text: string
  type: 'info' | 'success' | 'warn'
}

const Analysis: React.FC = () => {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const { logout } = useAuth()
  
  const [currentStep, setCurrentStep] = useState(0)
  const [logs, setLogs] = useState<LogMessage[]>([])
  const [completed, setCompleted] = useState(false)
  
  const terminalEndRef = useRef<HTMLDivElement>(null)

  const steps = [
    { label: 'Repository Scanner', desc: 'Listing files and technology stacks.' },
    { label: 'AST & Regex Parser', desc: 'Parsing classes, models, and HTTP routes.' },
    { label: 'Module Detector', desc: 'Isolating Authentication, Billing, and CRMs.' },
    { label: 'Domain Classifier', desc: 'Identifying project target industry focus.' },
    { label: 'Product potential Scorer', desc: 'Aggregating modularity and quality.' },
    { label: 'SaaS & Architecture Blueprinting', desc: 'Designing microservices and React Flow nodes.' }
  ]

  const simulatedLogs: LogMessage[][] = [
    [
      { text: '[SYSTEM] Initializing offline scanning pipeline...', type: 'info' },
      { text: `[SYSTEM] Target Project Identifier: ${id}`, type: 'info' },
      { text: '[SCANNER] Traversing codebase files recursively...', type: 'info' },
      { text: '[SCANNER] Ignoring node_modules, dist, target, venv directory trees.', type: 'info' },
      { text: '[SCANNER] Technology indicators found: package.json, tailwind.config.js', type: 'success' },
      { text: '[SCANNER] Completed scanning directory tree structures.', type: 'success' }
    ],
    [
      { text: '[PARSER] Invoking AST recursive scanners on source code structures...', type: 'info' },
      { text: '[PARSER] Building Python AST definitions & class hierarchies.', type: 'info' },
      { text: '[PARSER] Parsing javascript/typescript router controller models.', type: 'info' },
      { text: '[PARSER] Extracted function signatures: registerUser, createSession, listPatients', type: 'success' },
      { text: '[PARSER] Extracted routes: POST /api/login, GET /api/patients', type: 'success' },
      { text: '[PARSER] Code structure map compiled successfully.', type: 'success' }
    ],
    [
      { text: '[MODULES] Matching keyword tokens to identify modular boundaries...', type: 'info' },
      { text: '[MODULES] Found auth token decorators on route endpoints.', type: 'success' },
      { text: '[MODULES] Billing indicators match: Stripe gateway integration found.', type: 'success' },
      { text: '[MODULES] User management records mapped to workspace database.', type: 'success' },
      { text: '[MODULES] Mapped 4 core system domains.', type: 'success' }
    ],
    [
      { text: '[DOMAIN] Matching vocabulary dictionary records against target domains...', type: 'info' },
      { text: '[DOMAIN] Target keywords matched: clinic, doctor, appointment, patient', type: 'info' },
      { text: '[DOMAIN] High-weight matches recorded on clinical scheduling structures.', type: 'info' },
      { text: '[DOMAIN] Domain classification resolved: Healthcare.', type: 'success' },
      { text: '[DOMAIN] Classifier confidence rating: 94%.', type: 'success' }
    ],
    [
      { text: '[SCORER] Invoking product potential logic scripts...', type: 'info' },
      { text: '[SCORER] Modularity metrics: high (file split distribution optimal).', type: 'info' },
      { text: '[SCORER] Reusability index: high (class declarations decoupled).', type: 'info' },
      { text: '[SCORER] Scalability index: medium (monolith schema requires partition).', type: 'info' },
      { text: '[SCORER] Computed composite score: 91/100.', type: 'success' }
    ],
    [
      { text: '[SAAS] Compiling Go-To-Market recommendations and roadmaps...', type: 'info' },
      { text: '[SAAS] Target monetization style: Multi-tenant SaaS.', type: 'success' },
      { text: '[ARCHITECTURE] Formulating microservices boundaries.', type: 'info' },
      { text: '[ARCHITECTURE] Positioning React Flow layout grids.', type: 'info' },
      { text: '[SYSTEM] Generating downloadable PDF reports inside workspace.', type: 'info' },
      { text: '[SYSTEM] Dossier compiled. Pipeline completed successfully.', type: 'success' }
    ]
  ]

  useEffect(() => {
    let stepIdx = 0
    let logIdx = 0
    let interval: ReturnType<typeof setInterval>

    const printNextLog = () => {
      if (stepIdx >= steps.length || stepIdx >= simulatedLogs.length) {
        setCompleted(true)
        clearInterval(interval)
        return
      }

      const stepLogs = simulatedLogs[stepIdx]
      if (!stepLogs) {
        stepIdx++
        return
      }

      if (logIdx < stepLogs.length) {
        const nextLog = stepLogs[logIdx]
        if (nextLog) {
          setLogs(prev => [...prev, nextLog])
        }
        logIdx++
      } else {
        stepIdx++
        if (stepIdx < steps.length) {
          setCurrentStep(stepIdx)
          logIdx = 0
        }
      }
    }

    interval = setInterval(printNextLog, 400)

    return () => clearInterval(interval)
  }, [])

  useEffect(() => {
    terminalEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [logs])

  return (
    <div className="p-8 max-w-5xl mx-auto w-full space-y-8 flex-1 flex flex-col justify-center animate-fade-in-up">
      {/* Header */}
      <div className="text-center space-y-3">
        <div className="w-12 h-12 rounded-2xl bg-primary-600/10 border border-primary-500/20 text-primary-400 flex items-center justify-center mx-auto shadow-md">
          <Terminal className="w-6 h-6 animate-pulse" />
        </div>
        <h1 className="text-3xl font-extrabold tracking-tight">AI Analysis Pipeline</h1>
        <p className="text-sm text-gray-400 max-w-md mx-auto font-medium">Running static parsers, scoring calculations, and roadmap recommendations locally.</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8 items-stretch">
        {/* Step Checkpoints */}
        <div className="glass-panel border border-gray-900 rounded-3xl p-6 flex flex-col justify-between shadow-2xl">
          <div className="space-y-6">
            <h3 className="font-bold text-base px-2 border-b border-gray-900 pb-3">Orchestration Stages</h3>
            <div className="space-y-4">
              {steps.map((step, idx) => {
                const isActive = currentStep === idx
                const isCompleted = currentStep > idx || completed
                return (
                  <div key={idx} className={`flex items-start gap-4 p-2 rounded-2xl transition-colors ${isActive ? 'bg-primary-950/20' : ''}`}>
                    <div className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold border flex-shrink-0 mt-0.5 ${isCompleted ? 'bg-emerald-950/40 border-emerald-500 text-emerald-400' : isActive ? 'bg-primary-600 border-primary-500 text-white animate-pulse' : 'bg-gray-950 border-gray-900 text-gray-500'}`}>
                      {isCompleted ? <Check className="w-3.5 h-3.5" /> : idx + 1}
                    </div>
                    <div>
                      <h4 className={`text-xs font-bold transition-colors ${isActive || isCompleted ? 'text-gray-100' : 'text-gray-500'}`}>{step.label}</h4>
                      <p className="text-[10px] text-gray-500 font-medium">{step.desc}</p>
                    </div>
                  </div>
                )
              })}
            </div>
          </div>

          {completed && (
            <div className="flex gap-3 mt-6">
              <motion.button
                initial={{ scale: 0.95, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                onClick={() => navigate(`/dashboard/recommendations/${id}`)}
                className="flex-1 bg-primary-600 hover:bg-primary-700 text-white rounded-xl py-3.5 text-xs font-bold shadow-xl shadow-primary-500/25 hover:shadow-primary-500/35 transition-all flex items-center justify-center gap-2"
              >
                Explore Dossier
                <Play className="w-4 h-4 fill-current" />
              </motion.button>
              <motion.button
                initial={{ scale: 0.95, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                onClick={logout}
                className="px-5 bg-gray-900 hover:bg-red-950/30 border border-gray-800 hover:border-red-900/40 text-gray-400 hover:text-red-400 rounded-xl py-3.5 text-xs font-bold transition-all flex items-center justify-center gap-2"
              >
                Logout
                <LogOut className="w-4 h-4" />
              </motion.button>
            </div>
          )}
        </div>

        {/* Terminal logs */}
        <div className="glass-panel border border-gray-900 rounded-3xl p-6 bg-gray-950/50 flex flex-col h-[480px] shadow-2xl relative">
          {/* Header */}
          <div className="flex items-center justify-between border-b border-gray-900 pb-3 mb-4 flex-shrink-0">
            <span className="text-xs text-gray-400 font-bold flex items-center gap-1.5">
              <Terminal className="w-4 h-4 text-primary-400" />
              Engine output.log
            </span>
            <span className="w-2 h-2 rounded-full bg-primary-500 animate-ping"></span>
          </div>

          {/* Messages */}
          <div className="flex-1 overflow-y-auto font-mono text-[10px] space-y-2.5 pr-2 select-text">
            {logs.map((log, idx) => log ? (
              <div key={idx} className={`leading-relaxed ${log.type === 'success' ? 'text-emerald-400' : log.type === 'warn' ? 'text-amber-400' : 'text-gray-300'}`}>
                {log.text}
              </div>
            ) : null)}
            <div ref={terminalEndRef} />
          </div>
        </div>
      </div>
    </div>
  )
}

export default Analysis
