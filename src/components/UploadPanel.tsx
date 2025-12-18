import React, { useRef, useState } from 'react'

type Props = {
  onImageUrl: (url: string) => void
  onGltfUrl: (url: string) => void
  onTextSubmit?: (text: string) => void
  imageFit?: 'contain'|'cover'
  onImageFitChange?: (v: 'contain'|'cover') => void
  imageColorFidelity?: boolean
  onImageColorFidelityChange?: (v: boolean) => void
  imageThresholdQuantile?: number
  onImageThresholdQuantileChange?: (v: number) => void
  imageGamma?: number
  onImageGammaChange?: (v: number) => void
  imageAlphaMin?: number
  onImageAlphaMinChange?: (v: number) => void
  imageSaturationMin?: number
  onImageSaturationMinChange?: (v: number) => void
  imageSkipWhites?: boolean
  onImageSkipWhitesChange?: (v: boolean) => void
  imageWhiteBrightMin?: number
  onImageWhiteBrightMinChange?: (v: number) => void
}

export default function UploadPanel({ onImageUrl, onGltfUrl, onTextSubmit, imageFit = 'contain', onImageFitChange, imageColorFidelity = true, onImageColorFidelityChange, imageThresholdQuantile = 0.4, onImageThresholdQuantileChange, imageGamma = 0.9, onImageGammaChange, imageAlphaMin = 20, onImageAlphaMinChange, imageSaturationMin = 0.15, onImageSaturationMinChange, imageSkipWhites = true, onImageSkipWhitesChange, imageWhiteBrightMin = 220, onImageWhiteBrightMinChange }: Props) {
  const imgInputRef = useRef<HTMLInputElement>(null)
  const glbInputRef = useRef<HTMLInputElement>(null)
  const textInputRef = useRef<HTMLInputElement>(null)
  const [showContent, setShowContent] = useState(true)
  const [selectedTab, setSelectedTab] = useState<'image'|'gltf'|'text'>('image')
  const [dragImg, setDragImg] = useState(false)
  const [dragGlb, setDragGlb] = useState(false)
  const GLB_PRESETS = [
    { name: '鸭子 Duck', url: 'https://raw.githubusercontent.com/KhronosGroup/glTF-Sample-Models/master/2.0/Duck/glTF-Binary/Duck.glb' },
    { name: '狐狸 Fox', url: 'https://raw.githubusercontent.com/KhronosGroup/glTF-Sample-Models/master/2.0/Fox/glTF-Binary/Fox.glb' },
    { name: '骨骼 RecursiveSkeletons', url: 'https://raw.githubusercontent.com/KhronosGroup/glTF-Sample-Models/main/2.0/RecursiveSkeletons/glTF-Binary/RecursiveSkeletons.glb' },
  ]
  const IMAGE_PRESETS = [
    { name: '预设1', url: '/presets/images/img-01.png' },
    { name: '预设2', url: '/presets/images/img-02.png' },
    { name: '预设3', url: '/presets/images/img-03.png' },
    { name: '预设4', url: '/presets/images/img-04.png' },
  ]
  const TEXT_PRESETS = ['美丽中国', '世界和平', '羊城广州', '开心', '快乐', '好好学习', '不想上班', '别催了', '牛马生活']
  const submitText = () => {
    const val = textInputRef.current?.value?.trim() || ''
    if (!val) return
    onTextSubmit && onTextSubmit(val)
  }

  function onPickImage(e: React.ChangeEvent<HTMLInputElement>) {
    const f = e.target.files?.[0]
    if (!f) return
    const url = URL.createObjectURL(f)
    onImageUrl(url)
  }

  function onPickGLB(e: React.ChangeEvent<HTMLInputElement>) {
    const f = e.target.files?.[0]
    if (!f) return
    const url = URL.createObjectURL(f)
    onGltfUrl(url)
  }

  function onDropGLB(e: React.DragEvent<HTMLDivElement>) {
    e.preventDefault()
    const f = e.dataTransfer.files?.[0]
    if (!f) return
    if (!f.name.toLowerCase().endsWith('.glb') && !f.name.toLowerCase().endsWith('.gltf')) return
    const url = URL.createObjectURL(f)
    onGltfUrl(url)
    setDragGlb(false)
  }

  function onDropImage(e: React.DragEvent<HTMLDivElement>) {
    e.preventDefault()
    const f = e.dataTransfer.files?.[0]
    if (!f) return
    if (!f.type.startsWith('image/')) return
    const url = URL.createObjectURL(f)
    onImageUrl(url)
    setDragImg(false)
  }

  return (
    <div className="upload-container">
      <div className="panel" style={{ flex: '1 1 0', width: '100%' }}>
        <div className="panel-header">
          <div className="card-title">操作栏</div>
          <button className="btn" onClick={() => setShowContent(v => !v)}>{showContent ? '收起' : '展开'}</button>
        </div>
        <div className="tabs" role="tablist" aria-label="底部操作切换">
          <button type="button" className={"tab" + (selectedTab==='image' ? ' active' : '')} onClick={() => setSelectedTab('image')} role="tab" aria-selected={selectedTab==='image'}>图片模式</button>
          <button type="button" className={"tab" + (selectedTab==='gltf' ? ' active' : '')} onClick={() => setSelectedTab('gltf')} role="tab" aria-selected={selectedTab==='gltf'}>GLB模式</button>
          <button type="button" className={"tab" + (selectedTab==='text' ? ' active' : '')} onClick={() => setSelectedTab('text')} role="tab" aria-selected={selectedTab==='text'}>文本模式</button>
        </div>
        {showContent && selectedTab==='image' && (
        <div className="sections-row">
          <div className="section">
            <div className="control-row">
              <div className={"dashed-drop" + (dragImg ? " drag-over" : "")} onDragOver={e => { e.preventDefault(); }} onDragEnter={() => setDragImg(true)} onDragLeave={() => setDragImg(false)} onDrop={onDropImage}>拖拽图片到此</div>
              <button className="btn" onClick={() => imgInputRef.current?.click()}>选择图片文件</button>
            </div>
            <input ref={imgInputRef} type="file" accept="image/*" style={{ display: 'none' }} onChange={onPickImage} />
            <div className="control-row" style={{ marginTop: 8 }}>
              <span className="section-title" style={{ marginBottom: 0 }}>适配模式：</span>
              <select className="input" value={imageFit} onChange={e => onImageFitChange?.(e.target.value as any)}>
                <option value="contain">保持比例居中</option>
                <option value="cover">铺满裁剪边缘</option>
              </select>
              <label className="chip" style={{ padding: '4px 8px' }}>
                <input type="checkbox" checked={imageColorFidelity} onChange={e => onImageColorFidelityChange?.(e.target.checked)} />
                <span style={{ marginLeft: 8 }}>颜色保真</span>
              </label>
              <label className="chip" style={{ padding: '4px 8px' }}>
                <input type="checkbox" checked={imageSkipWhites} onChange={e => onImageSkipWhitesChange?.(e.target.checked)} />
                <span style={{ marginLeft: 8 }}>去除白背景</span>
              </label>
            </div>
            <div className="three-col" style={{ marginTop: 8 }}>
              <div className="grid" style={{ width: '100%' }}>
                <span>采样阈值 {imageThresholdQuantile.toFixed(2)}</span>
                <input type="range" min={0} max={0.8} step={0.05} value={imageThresholdQuantile} onChange={e => onImageThresholdQuantileChange?.(parseFloat(e.target.value))} />
              </div>
              <div className="grid" style={{ width: '100%' }}>
                <span>亮度增强 {imageGamma.toFixed(2)}</span>
                <input type="range" min={0.6} max={1.2} step={0.05} value={imageGamma} onChange={e => onImageGammaChange?.(parseFloat(e.target.value))} />
              </div>
              <div className="grid" style={{ width: '100%' }}>
                <span>透明阈值 {imageAlphaMin}</span>
                <input type="range" min={0} max={80} step={1} value={imageAlphaMin} onChange={e => onImageAlphaMinChange?.(parseInt(e.target.value))} />
              </div>
              <div className="grid" style={{ width: '100%' }}>
                <span>饱和度保留阈值 {imageSaturationMin.toFixed(2)}</span>
                <input type="range" min={0} max={0.6} step={0.05} value={imageSaturationMin} onChange={e => onImageSaturationMinChange?.(parseFloat(e.target.value))} />
              </div>
              <div className="grid" style={{ width: '100%' }}>
                <span>白亮阈值 {imageWhiteBrightMin}</span>
                <input type="range" min={160} max={255} step={5} value={imageWhiteBrightMin} onChange={e => onImageWhiteBrightMinChange?.(parseInt(e.target.value))} />
              </div>
            </div>
            <div style={{ marginTop: 8 }}>
              <div className="section-title">预设图片</div>
              <div className="image-grid">
                {IMAGE_PRESETS.map(p => (
                  <button key={p.url} type="button" className="thumb-card" onClick={() => onImageUrl(p.url)} title={p.name}>
                    <img src={p.url} alt={p.name} />
                    <div className="thumb-caption">{p.name}</div>
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>
        )}
        {showContent && selectedTab==='gltf' && (
        <div className="sections-row">
          <div className="section">
            <div className="control-row">
              <div className={"dashed-drop" + (dragGlb ? " drag-over" : "")} onDragOver={e => { e.preventDefault(); }} onDragEnter={() => setDragGlb(true)} onDragLeave={() => setDragGlb(false)} onDrop={onDropGLB}>拖拽GLB到此</div>
              <button className="btn" onClick={() => glbInputRef.current?.click()}>选择GLB文件</button>
            </div>
            <input ref={glbInputRef} type="file" accept=".glb,.gltf" style={{ display: 'none' }} onChange={onPickGLB} />
            <div style={{ marginTop: 8 }}>
              <div className="section-title">预设模型</div>
              <div className="preset-list">
                {GLB_PRESETS.map(p => (
                  <button key={p.name} className="chip" onClick={() => onGltfUrl(p.url)}>{p.name}</button>
                ))}
              </div>
            </div>
          </div>
        </div>
        )}
        {showContent && selectedTab==='text' && (
        <div className="sections-row">
          <div className="section">
            <div className="control-row">
              <input className="input input-text" ref={textInputRef} type="text" placeholder="输入文字并应用" onKeyDown={e => { if (e.key === 'Enter') submitText() }} />
              <button className="btn" onClick={submitText}>应用文字</button>
            </div>
            <div style={{ marginTop: 8 }}>
              <div className="section-title">预设文字</div>
              <div className="preset-list">
                {TEXT_PRESETS.map(p => (
                  <button
                    key={p}
                    className="chip"
                    onClick={() => {
                      if (textInputRef.current) textInputRef.current.value = p
                      submitText()
                    }}
                  >
                    {p}
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>
        )}
      </div>
    </div>
  )
}
