import React, { useEffect, useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Cpu, Zap, Sparkles, Brain, Layers, Code2 } from 'lucide-react'

interface AISpinnerProps {
  model: 'flash' | 'pro'
  rateLimits?: {
    rpm: number
    rpd: number
    reset_note: string
    remaining?: number | null
  }
}

const MESSAGES = [
  'Waking up Gemini neurons…',
  'Mapping your codebase to market opportunities…',
  'Consulting the AI oracle…',
  'Decoding architectural patterns…',
  'Calibrating SaaS potential score…',
  'Generating monetisation roadmap…',
  'Almost there — polishing insights…',
]

const ICONS = [Cpu, Zap, Sparkles, Brain, Layers, Code2]

const AISpinner: React.FC<AISpinnerProps> = ({ model, rateLimits }) => {
  const [msgIdx, setMsgIdx] = useState(0)
  const [iconIdx, setIconIdx] = useState(0)
  const [elapsed, setElapsed] = useState(0)

  useEffect(() => {
    const msgTimer = setInterval(() => {
      setMsgIdx(i => (i + 1) % MESSAGES.length)
    }, 1800)
    const iconTimer = setInterval(() => {
      setIconIdx(i => (i + 1) % ICONS.length)
    }, 900)
    const elapsedTimer = setInterval(() => {
      setElapsed(s => s + 1)
    }, 1000)
    return () => {
      clearInterval(msgTimer)
      clearInterval(iconTimer)
      clearInterval(elapsedTimer)
    }
  }, [])

  const Icon = ICONS[iconIdx]

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.92 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.92 }}
      className="flex flex-col items-center justify-center gap-8 py-14 px-8 text-center"
    >
      {/* Animated orb cluster */}
      <div className="relative w-40 h-40 flex items-center justify-center">
        {/* Outer slow-spin ring */}
        <motion.div
          className="absolute inset-0 rounded-full border-2 border-dashed border-primary-500/30"
          animate={{ rotate: 360 }}
          transition={{ duration: 12, repeat: Infinity, ease: 'linear' }}
        />
        {/* Mid pulse ring */}
        <motion.div
          className="absolute w-28 h-28 rounded-full border border-indigo-400/40"
          animate={{ scale: [1, 1.15, 1], opacity: [0.4, 0.9, 0.4] }}
          transition={{ duration: 2, repeat: Infinity, ease: 'easeInOut' }}
        />
        {/* Glow backdrop */}
        <motion.div
          className="absolute w-20 h-20 rounded-full bg-primary-600/20 blur-2xl"
          animate={{ scale: [1, 1.3, 1] }}
          transition={{ duration: 1.8, repeat: Infinity, ease: 'easeInOut' }}
        />
        {/* Orbiting dot */}
        <motion.div
          className="absolute w-3 h-3 rounded-full bg-primary-400 shadow-lg shadow-primary-400/60"
          style={{ top: 0, left: '50%', marginLeft: -6, originX: 0, originY: '70px' }}
          animate={{ rotate: 360 }}
          transition={{ duration: 2.5, repeat: Infinity, ease: 'linear' }}
        />
        {/* Core icon */}
        <motion.div
          className="relative w-16 h-16 rounded-2xl bg-gradient-to-br from-primary-500 to-indigo-600 shadow-xl shadow-primary-500/40 flex items-center justify-center"
          animate={{ rotate: [0, 5, -5, 0] }}
          transition={{ duration: 3, repeat: Infinity, ease: 'easeInOut' }}
        >
          <AnimatePresence mode="wait">
            <motion.div
              key={iconIdx}
              initial={{ opacity: 0, scale: 0.6 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.6 }}
              transition={{ duration: 0.3 }}
            >
              <Icon className="w-7 h-7 text-white" />
            </motion.div>
          </AnimatePresence>
        </motion.div>
      </div>

      {/* Model badge */}
      <div className="flex items-center gap-2">
        <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold border
          ${model === 'pro'
            ? 'bg-violet-950/60 border-violet-700/50 text-violet-300'
            : 'bg-primary-950/60 border-primary-700/50 text-primary-300'
          }`}>
          <span className="w-1.5 h-1.5 rounded-full bg-current animate-pulse" />
          Gemini 1.5 {model === 'pro' ? 'Pro' : 'Flash'} · Thinking…
        </span>
      </div>

      {/* Animated status message */}
      <AnimatePresence mode="wait">
        <motion.p
          key={msgIdx}
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -8 }}
          transition={{ duration: 0.4 }}
          className="text-sm font-semibold text-gray-300 max-w-xs"
        >
          {MESSAGES[msgIdx]}
        </motion.p>
      </AnimatePresence>

      {/* Elapsed time */}
      <p className="text-xs text-gray-600 font-mono">
        {elapsed}s elapsed
      </p>

      {/* Rate-limit info */}
      {rateLimits && (
        <div className="w-full max-w-sm bg-gray-950/60 border border-gray-800 rounded-2xl p-4 text-left space-y-2">
          <p className="text-[10px] font-bold text-gray-500 uppercase tracking-widest">Quota Info</p>
          <div className="grid grid-cols-2 gap-2 text-xs">
            <div className="bg-gray-900/50 rounded-xl p-2 text-center">
              <p className="text-gray-500 text-[10px]">Req / Min</p>
              <p className="font-bold text-gray-200">{rateLimits.rpm}</p>
            </div>
            <div className="bg-gray-900/50 rounded-xl p-2 text-center">
              <p className="text-gray-500 text-[10px]">Req / Day</p>
              <p className="font-bold text-gray-200">{rateLimits.rpd.toLocaleString()}</p>
            </div>
          </div>
          <p className="text-[10px] text-gray-600 leading-relaxed">{rateLimits.reset_note}</p>
        </div>
      )}
    </motion.div>
  )
}

export default AISpinner
