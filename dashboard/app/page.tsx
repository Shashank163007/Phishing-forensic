"use client"

import { useState, useEffect, useMemo, useCallback } from "react"
import { X, Search, RefreshCw, Download, Trash2, Shield, AlertTriangle, CheckCircle, Activity, LogIn, LogOut } from "lucide-react"
import { ShadowOverlay } from "@/components/shadow-overlay"

const BACKEND_URL = 'http://localhost:5000'

// Types
interface Report {
  id: string
  sender: string
  subject: string
  level: "red" | "amber" | "green"
  score: number
  verdict: string
  flags: string[]
  suspicious_phrases: string[]
  timestamp: Date
}

// Animated counter hook
function useAnimatedCounter(target: number, duration: number = 400) {
  const [count, setCount] = useState(0)
  useEffect(() => {
    let startTime: number | null = null
    const startValue = count
    const animate = (currentTime: number) => {
      if (!startTime) startTime = currentTime
      const progress = Math.min((currentTime - startTime) / duration, 1)
      const easeOut = 1 - Math.pow(1 - progress, 3)
      setCount(Math.floor(startValue + (target - startValue) * easeOut))
      if (progress < 1) requestAnimationFrame(animate)
    }
    requestAnimationFrame(animate)
  }, [target, duration])
  return count
}

function StatBox({ label, value, color, icon: Icon }: { label: string; value: number; color: "cyan" | "red" | "amber" | "green"; icon: React.ElementType }) {
  const animatedValue = useAnimatedCounter(value)
  const colorMap = { cyan: "#00ffff", red: "#ff0040", amber: "#ffcc00", green: "#00ff88" }
  return (
    <div className="glass rounded-lg p-4 cyber-transition hover:bg-white/[0.04] group cursor-pointer" style={{ borderColor: 'transparent' }}
      onMouseEnter={(e) => { e.currentTarget.style.borderColor = `${colorMap[color]}30` }}
      onMouseLeave={(e) => { e.currentTarget.style.borderColor = 'transparent' }}>
      <div className="flex items-center justify-between mb-3">
        <Icon className="w-4 h-4 cyber-transition group-hover:opacity-100" style={{ color: colorMap[color], opacity: 0.7 }} />
        <span className="text-[10px] uppercase tracking-[0.15em] text-white/40 font-sans">{label}</span>
      </div>
      <div className="text-3xl font-mono font-bold tracking-tight" style={{ color: colorMap[color] }}>{animatedValue}</div>
    </div>
  )
}

function FilterButton({ active, onClick, children }: { active: boolean; onClick: () => void; children: React.ReactNode }) {
  return (
    <button onClick={onClick} className={`w-full px-4 py-2.5 rounded-lg text-left text-sm font-sans cyber-transition ${active ? "bg-[#00ffff]/10 text-[#00ffff] border border-[#00ffff]/30" : "glass hover:bg-white/[0.04] text-white/60 hover:text-white/80"}`}>
      {children}
    </button>
  )
}

function ActionButton({ onClick, children, variant = "default", icon: Icon }: { onClick: () => void; children: React.ReactNode; variant?: "default" | "danger"; icon: React.ElementType }) {
  return (
    <button onClick={onClick} className={`flex items-center gap-2 px-4 py-2.5 rounded-lg text-sm font-sans glass cyber-transition ${variant === "danger" ? "hover:bg-[#ff0040]/10 hover:text-[#ff0040] hover:border-[#ff0040]/30" : "hover:bg-[#00ffff]/10 hover:text-[#00ffff] hover:border-[#00ffff]/30"} text-white/60`}>
      <Icon className="w-4 h-4" />
      {children}
    </button>
  )
}

function ScoreBar({ score, level }: { score: number; level: "red" | "amber" | "green" }) {
  const colorMap = { red: "#ff0040", amber: "#ffcc00", green: "#00ff88" }
  return (
    <div className="w-full h-1.5 rounded-full bg-white/[0.06] overflow-hidden">
      <div className="h-full rounded-full transition-all duration-500 ease-out" style={{ width: `${score}%`, backgroundColor: colorMap[level] }} />
    </div>
  )
}

function ReportCard({ report, index, onClick, onDelete }: { report: Report; index: number; onClick: () => void; onDelete: (e: React.MouseEvent) => void }) {
  const levelColors = {
    red: { accent: "#ff0040", badge: "bg-[#ff0040]/10 text-[#ff0040] border-[#ff0040]/20" },
    amber: { accent: "#ffcc00", badge: "bg-[#ffcc00]/10 text-[#ffcc00] border-[#ffcc00]/20" },
    green: { accent: "#00ff88", badge: "bg-[#00ff88]/10 text-[#00ff88] border-[#00ff88]/20" },
  }
  const colors = levelColors[report.level]
  const formatTime = (date: Date) => {
    const now = new Date()
    const diff = now.getTime() - date.getTime()
    const minutes = Math.floor(diff / 60000)
    const hours = Math.floor(diff / 3600000)
    const days = Math.floor(diff / 86400000)
    if (minutes < 60) return `${minutes}m`
    if (hours < 24) return `${hours}h`
    return `${days}d`
  }
  return (
    <div onClick={onClick} style={{ animationDelay: `${index * 0.03}s`, borderLeftColor: colors.accent }}
      className="animate-slideInUp opacity-0 cursor-pointer rounded-lg p-4 bg-[#0a0a0a] border border-white/[0.06] border-l-2 cyber-transition hover:bg-[#111111] hover:border-white/[0.1] group">
      <div className="flex items-start justify-between mb-3">
        <div className="flex-1 min-w-0 pr-3">
          <p className="font-sans font-semibold text-sm text-white/90 truncate">{report.sender}</p>
          <p className="text-xs text-white/40 truncate mt-1">{report.subject}</p>
        </div>
        <span className={`px-2 py-1 rounded text-[10px] uppercase tracking-wider font-medium border ${colors.badge}`}>
          {report.level === "red" ? "CRIT" : report.level === "amber" ? "WARN" : "SAFE"}
        </span>
      </div>
      <div className="flex items-center gap-4 text-xs mb-3">
        <div className="flex items-center gap-2">
          <span className="text-white/30">Score</span>
          <span className="font-mono" style={{ color: colors.accent }}>{report.score}</span>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-white/30">Time</span>
          <span className="text-white/50">{formatTime(report.timestamp)}</span>
        </div>
      </div>
      <p className="text-xs text-white/50 mb-3 line-clamp-1">{report.verdict}</p>
      <div className="flex items-center justify-between pt-2 border-t border-white/[0.04]">
        <span className="text-[10px] text-white/20 font-mono">{report.id}</span>
        <button onClick={onDelete} className="p-1 rounded text-white/20 cyber-transition hover:text-[#ff0040] hover:bg-[#ff0040]/10">
          <Trash2 className="w-3 h-3" />
        </button>
      </div>
    </div>
  )
}

function DetailModal({ report, onClose }: { report: Report; onClose: () => void }) {
  const levelColors = {
    red: { accent: "#ff0040", badge: "bg-[#ff0040]/10 text-[#ff0040] border-[#ff0040]/20" },
    amber: { accent: "#ffcc00", badge: "bg-[#ffcc00]/10 text-[#ffcc00] border-[#ffcc00]/20" },
    green: { accent: "#00ff88", badge: "bg-[#00ff88]/10 text-[#00ff88] border-[#00ff88]/20" },
  }
  const colors = levelColors[report.level]
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4" onClick={onClose}>
      <div className="absolute inset-0 bg-black/80 backdrop-blur-sm animate-backdropFadeIn" />
      <div onClick={(e) => e.stopPropagation()} className="relative w-full max-w-xl max-h-[85vh] overflow-y-auto rounded-lg p-6 bg-[#0a0a0a] border border-white/[0.08] animate-modalSlideUp">
        <button onClick={onClose} className="absolute top-4 right-4 p-2 rounded-lg glass cyber-transition hover:bg-white/[0.06]">
          <X className="w-4 h-4 text-white/40" />
        </button>
        <div className="space-y-5">
          <div>
            <h2 className="text-lg font-mono font-bold text-[#00ffff] mb-1">Analysis Report</h2>
            <p className="text-[10px] text-white/30 font-mono tracking-wider">{report.id}</p>
          </div>
          <div className="space-y-3">
            <div className="glass rounded-lg p-4">
              <span className="text-[10px] uppercase tracking-[0.15em] text-white/30 block mb-1">Sender</span>
              <p className="font-sans font-medium text-sm text-white/90">{report.sender}</p>
            </div>
            <div className="glass rounded-lg p-4">
              <span className="text-[10px] uppercase tracking-[0.15em] text-white/30 block mb-1">Subject</span>
              <p className="font-sans text-sm text-white/70">{report.subject}</p>
            </div>
          </div>
          <div className="flex items-center gap-4">
            <span className={`px-3 py-1.5 rounded text-[10px] uppercase tracking-wider font-bold border ${colors.badge}`}>
              {report.level === "red" ? "Critical" : report.level === "amber" ? "Warning" : "Safe"}
            </span>
            <div className="flex-1">
              <div className="flex items-center justify-between mb-2">
                <span className="text-[10px] uppercase tracking-[0.15em] text-white/30">Risk Score</span>
                <span className="font-mono font-bold text-sm" style={{ color: colors.accent }}>{report.score}/100</span>
              </div>
              <ScoreBar score={report.score} level={report.level} />
            </div>
          </div>
          <div className="glass rounded-lg p-4">
            <span className="text-[10px] uppercase tracking-[0.15em] text-white/30 block mb-2">Verdict</span>
            <p className="font-sans text-sm text-white/80">{report.verdict}</p>
          </div>
          <div className="pt-4 border-t border-white/[0.06]">
            <span className="text-[10px] uppercase tracking-[0.15em] text-white/30">Scanned</span>
            <p className="text-xs text-white/50 mt-1 font-mono">{report.timestamp.toLocaleString()}</p>
          </div>
        </div>
      </div>
    </div>
  )
}

function EmptyState() {
  return (
    <div className="flex flex-col items-center justify-center py-20 animate-slideInUp">
      <div className="w-12 h-12 rounded-lg glass flex items-center justify-center mb-4">
        <Shield className="w-6 h-6 text-white/20" />
      </div>
      <p className="text-sm text-white/40 text-center">No reports found</p>
    </div>
  )
}

// Login Modal
function LoginModal({ onLogin, error }: { onLogin: (email: string, password: string) => void; error: string }) {
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [loading, setLoading] = useState(false)
  const handleSubmit = async () => {
    setLoading(true)
    await onLogin(email, password)
    setLoading(false)
  }
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/90 backdrop-blur-sm" />
      <div className="relative w-full max-w-sm rounded-lg p-8 bg-[#0a0a0a] border border-white/[0.08] animate-modalSlideUp">
        <div className="flex items-center gap-3 mb-8">
          <Shield className="w-6 h-6 text-[#00ffff] animate-pulse-glow" />
          <span className="font-mono font-bold text-lg tracking-wider text-[#00ffff]">PHISHGUARD</span>
        </div>
        <h2 className="text-sm uppercase tracking-[0.15em] text-white/40 mb-6">Admin Access Required</h2>
        <div className="space-y-4">
          <input type="email" placeholder="Email" value={email} onChange={(e) => setEmail(e.target.value)}
            className="w-full px-4 py-3 rounded-lg glass text-sm font-sans bg-transparent placeholder:text-white/30 text-white/80 focus:outline-none focus:border-[#00ffff]/30 cyber-transition" />
          <input type="password" placeholder="Password" value={password} onChange={(e) => setPassword(e.target.value)}
            className="w-full px-4 py-3 rounded-lg glass text-sm font-sans bg-transparent placeholder:text-white/30 text-white/80 focus:outline-none focus:border-[#00ffff]/30 cyber-transition" />
          <button onClick={handleSubmit} disabled={loading}
            className="w-full flex items-center justify-center gap-2 px-4 py-3 rounded-lg text-sm font-sans bg-[#00ffff]/10 border border-[#00ffff]/30 text-[#00ffff] cyber-transition hover:bg-[#00ffff]/20 disabled:opacity-50">
            <LogIn className="w-4 h-4" />
            {loading ? "Authenticating..." : "Login to SOC"}
          </button>
          {error && <p className="text-xs text-[#ff0040] text-center">{error}</p>}
        </div>
      </div>
    </div>
  )
}

// Main Dashboard Component
export default function EmailForensicsDashboard() {
  const [user, setUser] = useState<any>(null)
  const [authLoading, setAuthLoading] = useState(true)
  const [authError, setAuthError] = useState("")
  const [reports, setReports] = useState<Report[]>([])
  const [selectedReport, setSelectedReport] = useState<Report | null>(null)
  const [riskFilter, setRiskFilter] = useState<"all" | "red" | "amber" | "green">("all")
  const [timeFilter, setTimeFilter] = useState<"24h" | "7d" | "30d" | "all">("all")
  const [searchQuery, setSearchQuery] = useState("")
  const [debouncedSearch, setDebouncedSearch] = useState("")
  const [isRefreshing, setIsRefreshing] = useState(false)

  // Auto-load — no auth needed for demo
  useEffect(() => {
    setUser({ id: 'demo', email: 'demo@soc.local' })
    setAuthLoading(false)
  }, [])

  useEffect(() => {
    if (!user) return
    const fetchHistory = async () => {
      try {
        const res = await fetch(`${BACKEND_URL}/api/history`)
        const data = await res.json()
        setReports(data.map((d: any, i: number) => ({
          id: `RPT-${String(i + 1).padStart(3, "0")}`,
          sender: d.sender || "Unknown",
          subject: d.subject || "No Subject",
          level: (d.level || "green") as "red" | "amber" | "green",
          score: d.score || 0,
          verdict: d.verdict || "Analysis complete",
          flags: d.flags || [],
          suspicious_phrases: d.suspicious_phrases || [],
          timestamp: new Date(d.timestamp),
        })))
      } catch (err) { console.error(err) }
    }
    fetchHistory()
  }, [user])

  const handleLogin = async (email: string, password: string) => {
    try {
      setAuthError("")
      const res = await fetch(`${BACKEND_URL}/api/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password })
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error)
      setUser(data)
      localStorage.setItem('user', JSON.stringify(data))
    } catch (err: any) {
      setAuthError(err.message)
    }
  }
  const handleLogout = () => {
    setUser(null)
    localStorage.removeItem('user')
  }
  useEffect(() => {
    const timer = setTimeout(() => setDebouncedSearch(searchQuery), 300)
    return () => clearTimeout(timer)
  }, [searchQuery])

  const filteredReports = useMemo(() => {
    return reports.filter((report) => {
      if (riskFilter !== "all" && report.level !== riskFilter) return false
      const now = new Date()
      const hoursDiff = (now.getTime() - report.timestamp.getTime()) / 3600000
      if (timeFilter === "24h" && hoursDiff > 24) return false
      if (timeFilter === "7d" && hoursDiff > 168) return false
      if (timeFilter === "30d" && hoursDiff > 720) return false
      if (debouncedSearch) {
        const search = debouncedSearch.toLowerCase()
        return report.sender.toLowerCase().includes(search) || report.subject.toLowerCase().includes(search) || report.verdict.toLowerCase().includes(search)
      }
      return true
    })
  }, [reports, riskFilter, timeFilter, debouncedSearch])

  const stats = useMemo(() => ({
    total: filteredReports.length,
    critical: filteredReports.filter((r) => r.level === "red").length,
    warning: filteredReports.filter((r) => r.level === "amber").length,
    safe: filteredReports.filter((r) => r.level === "green").length,
  }), [filteredReports])

  const handleRefresh = useCallback(() => {
    setIsRefreshing(true)
    setTimeout(() => setIsRefreshing(false), 800)
  }, [])
  const handleDelete = useCallback((e: React.MouseEvent, id: string) => {
    e.stopPropagation()
    setReports((prev) => prev.filter((r) => r.id !== id))
  }, [])
  const handleExport = useCallback(() => {
    const csv = [
      ["ID", "Sender", "Subject", "Level", "Score", "Verdict", "Timestamp"],
      ...filteredReports.map((r) => [r.id, r.sender, r.subject, r.level, r.score.toString(), r.verdict, r.timestamp.toISOString()]),
    ].map((row) => row.map((cell) => `"${cell}"`).join(",")).join("\n")
    const blob = new Blob([csv], { type: "text/csv" })
    const url = URL.createObjectURL(blob)
    const a = document.createElement("a")
    a.href = url
    a.download = "email-forensics-report.csv"
    a.click()
    URL.revokeObjectURL(url)
  }, [filteredReports])

  if (authLoading) return <div className="min-h-screen bg-[#0d1117] flex items-center justify-center"><Shield className="w-8 h-8 text-[#00ffff] animate-pulse-glow" /></div>

  return (
    <ShadowOverlay color="rgba(0, 255, 255, 0.08)" animation={{ scale: 40, speed: 20 }} noise={{ opacity: 0.04, scale: 1 }} className="min-h-screen bg-[#0d1117]">
      <div className="min-h-screen text-white flex relative z-10">
        <aside className="w-72 shrink-0 p-5 border-r border-white/[0.06] flex flex-col gap-5 overflow-y-auto bg-[#161b22]">
          <div className="flex items-center gap-3 pb-4 border-b border-white/[0.06]"><Shield className="w-6 h-6 text-[#00ffff] animate-pulse-glow" /><span className="font-mono font-bold text-lg tracking-wider text-[#00ffff]">PHISHGUARD</span></div>
          <div className="grid grid-cols-2 gap-2"><StatBox label="Total" value={stats.total} color="cyan" icon={Activity} /><StatBox label="Critical" value={stats.critical} color="red" icon={AlertTriangle} /><StatBox label="Warning" value={stats.warning} color="amber" icon={AlertTriangle} /><StatBox label="Safe" value={stats.safe} color="green" icon={CheckCircle} /></div>
          <div><h3 className="text-[10px] uppercase tracking-[0.15em] text-white/30 mb-2 font-sans">Risk Level</h3><div className="space-y-1">{([{ key: "all", label: "All" }, { key: "red", label: "Critical" }, { key: "amber", label: "Warning" }, { key: "green", label: "Safe" }] as const).map((filter) => (<FilterButton key={filter.key} active={riskFilter === filter.key} onClick={() => setRiskFilter(filter.key)}>{filter.label}</FilterButton>))}</div></div>
          <div><h3 className="text-[10px] uppercase tracking-[0.15em] text-white/30 mb-2 font-sans">Time Range</h3><div className="space-y-1">{([{ key: "24h", label: "24 Hours" }, { key: "7d", label: "7 Days" }, { key: "30d", label: "30 Days" }, { key: "all", label: "All Time" }] as const).map((filter) => (<FilterButton key={filter.key} active={timeFilter === filter.key} onClick={() => setTimeFilter(filter.key)}>{filter.label}</FilterButton>))}</div></div>
          <div className="mt-auto space-y-1 pt-4 border-t border-white/[0.06]"><ActionButton onClick={handleRefresh} icon={RefreshCw}>{isRefreshing ? "Syncing..." : "Sync"}</ActionButton><ActionButton onClick={handleExport} icon={Download}>Export</ActionButton><ActionButton onClick={handleLogout} icon={LogOut} variant="danger">Logout</ActionButton></div>
        </aside>
        <main className="flex-1 p-6 overflow-y-auto">
          <header className="flex items-center justify-between mb-6"><h1 className="font-mono font-bold text-xl tracking-wider text-[#00ffff]">REPORTS</h1><div className="flex items-center gap-3"><div className="relative"><Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-white/30" /><input type="text" placeholder="Search..." value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} className="w-56 pl-10 pr-4 py-2 rounded-lg glass text-sm font-sans bg-transparent placeholder:text-white/30 text-white/80 focus:outline-none focus:border-[#00ffff]/30 cyber-transition" /></div><button onClick={handleRefresh} disabled={isRefreshing} className="p-2.5 rounded-lg bg-[#00ffff]/10 border border-[#00ffff]/30 cyber-transition hover:bg-[#00ffff]/20 disabled:opacity-50"><RefreshCw className={`w-4 h-4 text-[#00ffff] ${isRefreshing ? "animate-spin" : ""}`} /></button></div></header>
          {filteredReports.length > 0 ? (<div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-3">{filteredReports.map((report, index) => (<ReportCard key={report.id} report={report} index={index} onClick={() => setSelectedReport(report)} onDelete={(e) => handleDelete(e, report.id)} />))}</div>) : (<EmptyState />)}
        </main>
        {selectedReport && <DetailModal report={selectedReport} onClose={() => setSelectedReport(null)} />}
      </div>
    </ShadowOverlay>
  )
}
