import { AnimatePresence, LayoutGroup, motion } from 'motion/react'
import { ArrowUpRight, CalendarDays, Download, ExternalLink, LoaderCircle, RefreshCw, X } from 'lucide-react'
import { useState, type ReactNode } from 'react'

type MorphingItem = {
  id: string
  title: string
  subtitle: string
  description: string
  image?: string
  href: string
  download?: boolean
  visual?: boolean
  modifiedTime?: string
  accent: string
  icon: React.ComponentType<{ size?: number; strokeWidth?: number; className?: string }>
  content?: ReactNode
}

type MorphingDialogProps = {
  open: boolean
  title: string
  items: MorphingItem[]
  isLoading: boolean
  error: string
  apiKeyMissing: boolean
  folderHref: string
  onClose: () => void
  onRetry: () => void
  isImageFolder: boolean
}

export function MorphingDialog({ open, title, items, isLoading, error, apiKeyMissing, folderHref, onClose, onRetry, isImageFolder }: MorphingDialogProps) {
  const [activeItem, setActiveItem] = useState<MorphingItem | null>(null)
  const [selectedPeriod, setSelectedPeriod] = useState<string | null>(null)
  if (!open) return null

  const datedItems = items.filter((item) => item.modifiedTime).sort((first, second) => new Date(second.modifiedTime ?? 0).getTime() - new Date(first.modifiedTime ?? 0).getTime())
  const latestDate = datedItems[0] ? new Date(datedItems[0].modifiedTime ?? 0) : new Date(0)
  const periods = isImageFolder && datedItems.length > 0 ? Array.from({ length: Math.ceil((latestDate.getTime() - new Date(datedItems[datedItems.length - 1].modifiedTime ?? 0).getTime()) / (1000 * 60 * 60 * 24 * 30 * 6)) + 1 }, (_, index) => {
    const end = new Date(latestDate)
    end.setMonth(end.getMonth() - index * 6)
    const start = new Date(end)
    start.setMonth(start.getMonth() - 6)
    return { key: `${start.toISOString()}-${end.toISOString()}`, start, end, label: index === 0 ? 'ล่าสุด 6 เดือน' : `${start.toLocaleDateString('th-TH', { month: 'short', year: 'numeric' })} - ${end.toLocaleDateString('th-TH', { month: 'short', year: 'numeric' })}` }
  }) : []
  const activePeriod = selectedPeriod ?? periods[0]?.key
  const visibleItems = isImageFolder && activePeriod
    ? items.filter((item) => { const period = periods.find((entry) => entry.key === activePeriod); if (!period || !item.modifiedTime) return false; const time = new Date(item.modifiedTime).getTime(); return time > period.start.getTime() && time <= period.end.getTime() }).sort((first, second) => new Date(second.modifiedTime ?? 0).getTime() - new Date(first.modifiedTime ?? 0).getTime())
    : items

  return <LayoutGroup>
    <AnimatePresence>
      <motion.div className="morphing-overlay" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={onClose}>
        <motion.div className="folder-dialog" initial={{ opacity: 0, y: 22, scale: .97 }} animate={{ opacity: 1, y: 0, scale: 1 }} exit={{ opacity: 0, y: 22, scale: .97 }} onClick={(event) => event.stopPropagation()} role="dialog" aria-modal="true" aria-label={title}>
          <div className="folder-dialog-header"><div><p>FOLDER CONTENTS</p><h2>{title}</h2></div><button className="morphing-close" onClick={onClose} aria-label="ปิด"><X size={18} /></button></div>
          {apiKeyMissing && <div className="dialog-notice"><strong>ยังไม่ได้เชื่อมต่อ Google Drive API</strong><span>เพิ่ม VITE_GOOGLE_DRIVE_API_KEY ใน .env.local เพื่อดึงไฟล์มาแสดงที่นี่</span><a href={folderHref} target="_blank" rel="noreferrer">เปิดโฟลเดอร์ใน Drive <ExternalLink size={15} /></a></div>}
          {isLoading && <div className="state-message"><LoaderCircle className="spin" size={24} /><span>กำลังโหลดไฟล์...</span></div>}
          {error && <div className="state-message error-message"><span>{error}</span><button onClick={onRetry}><RefreshCw size={16} /> ลองใหม่</button></div>}
          {!apiKeyMissing && !isLoading && !error && items.length === 0 && <div className="state-message"><span>ยังไม่มีไฟล์ในโฟลเดอร์นี้</span></div>}
          {!apiKeyMissing && !isLoading && !error && isImageFolder && visibleItems.length === 0 && <div className="state-message"><span>ไม่พบรูปภาพในช่วงเวลานี้</span></div>}
          {!apiKeyMissing && !isLoading && !error && (!isImageFolder || visibleItems.length > 0) && <div className={`morphing-grid ${visibleItems.every((item) => item.visual) ? 'image-grid' : ''}`}>{visibleItems.map((item, index) => { const Icon = item.icon; return <motion.button key={item.id} className={`morphing-card ${item.visual ? 'visual-card' : 'document-card'}`} onClick={() => setActiveItem(item)} style={{ '--item-accent': item.accent } as React.CSSProperties} layoutId={`card-${item.id}`} initial={{ opacity: 0, y: 18 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: index * .04 }} whileHover={{ y: -5 }}><div className="morphing-preview">{item.image ? <img src={item.image} alt={item.visual ? '' : item.title} loading="lazy" /> : <Icon size={43} strokeWidth={1.2} />}</div>{!item.visual && <div className="morphing-info"><p>{item.subtitle}</p><h3>{item.title}</h3><span>{item.download ? <Download size={15} /> : <ArrowUpRight size={15} />} {item.download ? 'ดาวน์โหลดได้' : 'เปิดดูไฟล์'}</span></div>}</motion.button> })}</div>}
          {!apiKeyMissing && !isLoading && !error && isImageFolder && periods.length > 1 && <div className="half-picker"><p><CalendarDays size={16} /> เลือกช่วงรูปภาพเพิ่มเติม</p><div className="period-options">{periods.slice(1).map((period) => <button key={period.key} className={activePeriod === period.key ? 'selected' : ''} onClick={() => setSelectedPeriod(period.key)}>{period.label}</button>)}</div></div>}
        </motion.div>
      </motion.div>
      {activeItem && <motion.div className="morphing-overlay nested-overlay" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => setActiveItem(null)}><motion.div className="morphing-dialog" layoutId={`card-${activeItem.id}`} style={{ '--item-accent': activeItem.accent } as React.CSSProperties} onClick={(event) => event.stopPropagation()} role="dialog" aria-modal="true" aria-label={activeItem.title}><button className="morphing-close" onClick={() => setActiveItem(null)} aria-label="ปิด"><X size={18} /></button><div className="morphing-dialog-preview">{activeItem.image ? <img src={activeItem.image} alt={activeItem.title} /> : <activeItem.icon size={64} strokeWidth={1.1} />}</div><div className="morphing-dialog-body"><p>{activeItem.subtitle}</p><h2>{activeItem.title}</h2><div className="morphing-description">{activeItem.content ?? activeItem.description}</div><a className="morphing-action" href={activeItem.href} target="_blank" rel="noreferrer">{activeItem.download ? <Download size={17} /> : <ArrowUpRight size={17} />} {activeItem.download ? 'ดาวน์โหลดไฟล์' : 'เปิดไฟล์ใน Drive'}</a></div></motion.div></motion.div>}
    </AnimatePresence>
  </LayoutGroup>
}
