import { motion } from 'motion/react'
import { ExternalLink, FileText, FolderOpen, Image as ImageIcon, Play } from 'lucide-react'
import { useState } from 'react'
import { MorphingDialog } from './components/ui/morphing-dialog'
import './App.css'

type DriveCollection = {
  id: string
  title: string
  icon: typeof ImageIcon
  accent: string
  href: string
  image: string
}

type DriveFile = {
  id: string
  name: string
  mimeType: string
  modifiedTime?: string
  size?: string
  thumbnailLink?: string
  webViewLink?: string
  webContentLink?: string
}

const collections: DriveCollection[] = [
  { id: '1FDc2RnuPPXQCOm0MfN8Btk8KtoWzFHhD', title: 'รูปภาพ', icon: ImageIcon, accent: '#e9a84c', href: 'https://drive.google.com/drive/folders/1FDc2RnuPPXQCOm0MfN8Btk8KtoWzFHhD?usp=drive_link', image: 'https://images.unsplash.com/photo-1516035069371-29a1b244cc32?auto=format&fit=crop&w=1200&q=85' },
  { id: '1kHjmwNLuHBqAGe-j5nmqnqfIx1eJJXAC', title: 'วีดีโอ', icon: Play, accent: '#e86e5d', href: 'https://drive.google.com/drive/folders/1kHjmwNLuHBqAGe-j5nmqnqfIx1eJJXAC?usp=drive_link', image: 'https://images.unsplash.com/photo-1492619375914-88005aa9e8fb?auto=format&fit=crop&w=1200&q=85' },
  { id: '1lcxPzZr2vewmBPl0mTIiwgGn_eZy2HIs', title: 'ไฟล์', icon: FolderOpen, accent: '#77a9a1', href: 'https://drive.google.com/drive/folders/1lcxPzZr2vewmBPl0mTIiwgGn_eZy2HIs?usp=drive_link', image: 'https://images.unsplash.com/photo-1554224155-6726b3ff858f?auto=format&fit=crop&w=1200&q=85' },
  { id: '1h59rAgwIP5soqJVIgCrEr9KwiDqWDrOy', title: 'ไฟล์สอนแทน', icon: FileText, accent: '#9c8bc2', href: 'https://drive.google.com/drive/folders/1h59rAgwIP5soqJVIgCrEr9KwiDqWDrOy?usp=sharing', image: 'https://images.unsplash.com/photo-1524178232363-1fb2b075b655?auto=format&fit=crop&w=1200&q=85' },
]

const apiKey = import.meta.env.VITE_GOOGLE_DRIVE_API_KEY

function getFileIcon(mimeType: string) {
  if (mimeType.startsWith('image/')) return ImageIcon
  if (mimeType.startsWith('video/')) return Play
  return FileText
}

function getFilePreview(file: DriveFile) {
  if (file.mimeType.startsWith('image/')) return `https://drive.google.com/thumbnail?id=${file.id}&sz=w2000`
  if (file.thumbnailLink) return file.thumbnailLink.replace(/=s\d+$/, '=s1200')
  return ''
}

function App() {
  const [activeCollection, setActiveCollection] = useState(collections[0])
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [files, setFiles] = useState<DriveFile[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState('')

  const loadFiles = async (collection: DriveCollection) => {
    setActiveCollection(collection)
    setIsDialogOpen(true)
    setFiles([])
    setError('')
    if (!apiKey) return

    setIsLoading(true)
    try {
      const query = encodeURIComponent(`'${collection.id}' in parents and trashed = false`)
      const fields = encodeURIComponent('files(id,name,mimeType,modifiedTime,size,thumbnailLink,webViewLink,webContentLink)')
      const response = await fetch(`https://www.googleapis.com/drive/v3/files?q=${query}&pageSize=100&orderBy=name&fields=${fields}&key=${apiKey}`)
      if (!response.ok) {
        if (response.status === 403) throw new Error('Google Drive API ไม่อนุญาตคำขอ: เปิด Drive API และตรวจสอบข้อจำกัดของ API key ใน Google Cloud Console')
        throw new Error('ไม่สามารถโหลดรายการไฟล์ได้')
      }
      const data = await response.json() as { files?: DriveFile[] }
      setFiles(data.files ?? [])
    } catch (loadError) {
      setError(loadError instanceof Error ? loadError.message : 'ไม่สามารถโหลดรายการไฟล์ได้')
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <main className="drive-app">
      <div className="drive-container">
        <section className="folder-picker" aria-label="เลือกโฟลเดอร์">
          {collections.map((collection, index) => { const Icon = collection.icon; const isActive = activeCollection.id === collection.id; return <motion.button key={collection.id} className={`folder-button ${isActive ? 'is-active' : ''}`} style={{ '--folder-accent': collection.accent } as React.CSSProperties} onClick={() => void loadFiles(collection)} whileTap={{ scale: .98 }}><img className="folder-image" src={collection.image} alt="" /><span className="folder-shade" /><span className="folder-number">0{index + 1}</span><Icon className="folder-icon" size={24} strokeWidth={1.6} /><span className="folder-title">{collection.title}</span><ExternalLink className="folder-arrow" size={16} /></motion.button> })}
        </section>
        <MorphingDialog open={isDialogOpen} title={activeCollection.title} items={files.map((file) => ({ id: file.id, title: file.name, subtitle: file.mimeType.split('/').pop()?.toUpperCase() ?? 'FILE', description: file.size ? `ขนาดไฟล์ ${Math.ceil(Number(file.size) / 1024)} KB` : 'เปิดดูไฟล์จาก Google Drive ได้ทันที', image: getFilePreview(file), href: file.webContentLink || file.webViewLink || activeCollection.href, download: Boolean(file.webContentLink), accent: activeCollection.accent, icon: getFileIcon(file.mimeType) }))} isLoading={isLoading} error={error} apiKeyMissing={!apiKey} folderHref={activeCollection.href} onClose={() => setIsDialogOpen(false)} onRetry={() => void loadFiles(activeCollection)} />
      </div>
    </main>
  )
}

export default App
