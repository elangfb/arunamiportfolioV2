// Shared UI primitives. Keep screens short by composing these.
import { useId, type ButtonHTMLAttributes, type InputHTMLAttributes, type ReactNode, type SelectHTMLAttributes, type TextareaHTMLAttributes } from 'react'
import clsx from 'clsx'
import type { HealthLevel } from '../data/types'

// ── Buttons ────────────────────────────────────────────────────
type BtnVariant = 'primary' | 'secondary' | 'danger'
export function Button({ variant = 'secondary', sm, className, ...p }: ButtonHTMLAttributes<HTMLButtonElement> & { variant?: BtnVariant; sm?: boolean }) {
  return <button className={clsx(`btn-${variant}`, sm && 'btn-sm', className)} {...p} />
}

// ── Card & layout bits ─────────────────────────────────────────
export function Card({ className, children }: { className?: string; children: ReactNode }) {
  return <div className={clsx('card', className)}>{children}</div>
}
export function SectionTitle({ children, right }: { children: ReactNode; right?: ReactNode }) {
  return (
    <div className="flex items-center justify-between mb-3">
      <h2 className="text-sm font-semibold text-ink">{children}</h2>
      {right}
    </div>
  )
}
export function StatCard({ label, value, sub, tone = 'neutral' }: { label: string; value: ReactNode; sub?: ReactNode; tone?: 'neutral' | 'up' | 'down' }) {
  const toneCls = tone === 'up' ? 'text-ok' : tone === 'down' ? 'text-danger' : 'text-ink-soft'
  return (
    <div className="card !p-4">
      <div className="stat-label">{label}</div>
      <div className="stat-value mt-1">{value}</div>
      {sub != null && <div className={clsx('text-xs mt-1', toneCls)}>{sub}</div>}
    </div>
  )
}
export function EmptyState({ title, desc }: { title: string; desc?: string }) {
  return (
    <div className="border border-dashed border-gray-300 rounded-xl py-10 text-center bg-white">
      <div className="text-sm font-semibold text-ink-soft">{title}</div>
      {desc && <div className="text-xs text-ink-faint mt-1 max-w-sm mx-auto">{desc}</div>}
    </div>
  )
}

// ── Pills & badges ─────────────────────────────────────────────
type Tone = 'green' | 'amber' | 'red' | 'blue' | 'gray'
const TONE: Record<Tone, string> = {
  green: 'bg-emerald-50 text-ok',
  amber: 'bg-amber-50 text-warn',
  red: 'bg-red-50 text-danger',
  blue: 'bg-blue-50 text-info',
  gray: 'bg-gray-100 text-ink-soft',
}
export function Pill({ tone = 'gray', children }: { tone?: Tone; children: ReactNode }) {
  return <span className={clsx('pill', TONE[tone])}>{children}</span>
}

const HEALTH: Record<HealthLevel, { label: string; tone: Tone }> = {
  sehat: { label: 'Sehat', tone: 'green' },
  siaga1: { label: 'Siaga 1', tone: 'amber' },
  siaga2: { label: 'Siaga 2', tone: 'red' },
  siaga3: { label: 'Siaga 3', tone: 'red' },
}
export function HealthBadge({ level }: { level: HealthLevel }) {
  const h = HEALTH[level]
  return <Pill tone={h.tone}>{h.label}</Pill>
}

export function Avatar({ name, color = '#0F2744' }: { name: string; color?: string }) {
  const init = name.split(' ').map((w) => w[0]).slice(0, 2).join('').toUpperCase()
  return (
    <span className="inline-flex items-center justify-center w-8 h-8 rounded-full text-xs font-semibold flex-shrink-0"
      style={{ background: color + '22', color }}>
      {init}
    </span>
  )
}

// ── Form controls ──────────────────────────────────────────────
export function Field({ label, children }: { label: string; children: ReactNode }) {
  return (
    <label className="block">
      <span className="field-label">{label}</span>
      {children}
    </label>
  )
}
export function Input(p: InputHTMLAttributes<HTMLInputElement>) {
  return <input {...p} className={clsx('field-input', p.className)} />
}
export function Select(p: SelectHTMLAttributes<HTMLSelectElement>) {
  return <select {...p} className={clsx('field-input', p.className)} />
}
export function Textarea(p: TextareaHTMLAttributes<HTMLTextAreaElement>) {
  return <textarea {...p} className={clsx('field-input min-h-[80px]', p.className)} />
}

/** Styled file picker — calls onPick with the chosen File. */
export function FileButton({ label, onPick, accept = '.pdf,image/*', disabled }: { label: string; onPick: (file: File) => void; accept?: string; disabled?: boolean }) {
  const id = useId()
  return (
    <>
      <input id={id} type="file" accept={accept} className="hidden" disabled={disabled}
        onChange={(e) => { const f = e.target.files?.[0]; if (f) onPick(f); e.target.value = '' }} />
      <label htmlFor={id} className={clsx('btn-secondary btn-sm cursor-pointer', disabled && 'opacity-50 pointer-events-none')}>{label}</label>
    </>
  )
}

// ── Modal ──────────────────────────────────────────────────────
export function Modal({ open, onClose, title, children, wide }: { open: boolean; onClose: () => void; title: string; children: ReactNode; wide?: boolean }) {
  if (!open) return null
  return (
    <div className="fixed inset-0 z-50 bg-slate-900/45 backdrop-blur-sm flex items-center justify-center p-4" onClick={onClose}>
      <div className={clsx('bg-white rounded-2xl border border-gray-200 shadow-2xl w-full max-h-[90vh] overflow-y-auto p-6', wide ? 'max-w-3xl' : 'max-w-lg')}
        onClick={(e) => e.stopPropagation()}>
        <h3 className="text-base font-semibold text-ink mb-4">{title}</h3>
        {children}
      </div>
    </div>
  )
}

// ── Toast (imperative, dependency-free) ────────────────────────
export function toast(msg: string) {
  const el = document.createElement('div')
  el.textContent = msg
  el.className = 'fixed bottom-6 left-1/2 -translate-x-1/2 z-[100] bg-navy text-white px-4 py-2.5 rounded-lg text-sm shadow-xl'
  document.body.appendChild(el)
  setTimeout(() => {
    el.style.transition = 'opacity .3s'
    el.style.opacity = '0'
    setTimeout(() => el.remove(), 300)
  }, 2200)
}
