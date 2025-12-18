import React, { useEffect, useRef, useState } from 'react'
import ParticleScene from './components/ParticleScene'
import UploadPanel from './components/UploadPanel'
import TunePanel from './components/TunePanel'

export default function App() {
  const [mode, setMode] = useState<'random'|'text'|'image'|'gltf'>('random')
  const [effect, setEffect] = useState<'none'|'randomCloud'|'explode'|'vortex'|'shockwave'|'blackhole'|'waterfall'|'rainbow'|'wind'|'breathing'|'ripple'|'sphere'|'grid'>('none')
  const [text, setText] = useState('文化')
  const [imageUrl, setImageUrl] = useState('https://threejs.org/examples/textures/uv_grid_opengl.jpg')
  const [gltfUrl, setGltfUrl] = useState('https://raw.githubusercontent.com/KhronosGroup/glTF-Sample-Models/master/2.0/Duck/glTF-Binary/Duck.glb')
  const [micOn, setMicOn] = useState(false)
  const [antiCenterEnabled, setAntiCenterEnabled] = useState(false)
  const [antiCenterRadius, setAntiCenterRadius] = useState(8)
  const [antiCenterStrength, setAntiCenterStrength] = useState(0.5)
  const [bloomThreshold, setBloomThreshold] = useState(0.4)
  const [bloomIntensity, setBloomIntensity] = useState(0.6)
  const [pointSize, setPointSize] = useState(0.2)
  const [particleCount, setParticleCount] = useState(30000)
  const [fps, setFps] = useState(0)
  const [motionSpeed, setMotionSpeed] = useState(1.8)
  const [loading, setLoading] = useState(false)
  const [imageFit, setImageFit] = useState<'contain'|'cover'>('contain')
  const [imageColorFidelity, setImageColorFidelity] = useState<boolean>(true)
  const [imageThresholdQuantile, setImageThresholdQuantile] = useState(0.0)
  const [imageGamma, setImageGamma] = useState(1.0)
  const [imageAlphaMin, setImageAlphaMin] = useState(20)
  const [imageSaturationMin, setImageSaturationMin] = useState(0.15)
  const [imageSkipWhites, setImageSkipWhites] = useState(true)
  const [imageWhiteBrightMin, setImageWhiteBrightMin] = useState(220)
  const [resetViewTick, setResetViewTick] = useState(0)
  const [cameraTheta, setCameraTheta] = useState(0)
  const [cameraPhi, setCameraPhi] = useState(0)
  const initialCamera = { radius: 80, theta: cameraTheta, phi: cameraPhi }

  const [voidMaskEnabled, setVoidMaskEnabled] = useState(false)
  const [voidRadius, setVoidRadius] = useState(8)
  const [voidSoftness, setVoidSoftness] = useState(0.4)

  const prevImageUrlRef = useRef<string | null>(null)
  const prevGltfUrlRef = useRef<string | null>(null)

  useEffect(() => {
    const prev = prevImageUrlRef.current
    if (prev && prev.startsWith('blob:')) {
      try { URL.revokeObjectURL(prev) } catch {}
    }
    prevImageUrlRef.current = imageUrl
  }, [imageUrl])

  useEffect(() => {
    const prev = prevGltfUrlRef.current
    if (prev && prev.startsWith('blob:')) {
      try { URL.revokeObjectURL(prev) } catch {}
    }
    prevGltfUrlRef.current = gltfUrl
  }, [gltfUrl])

  function applyPreset(name: '沉浸柔光' | '爆火高亮' | '文物写实') {
    if (name === '沉浸柔光') {
      setAntiCenterEnabled(false)
      setAntiCenterRadius(12)
      setAntiCenterStrength(0.6)
      setBloomThreshold(0.5)
      setBloomIntensity(0.7)
      setPointSize(0.18)
      setVoidMaskEnabled(false)
      setVoidRadius(10)
      setVoidSoftness(0.4)
    } else if (name === '爆火高亮') {
      setAntiCenterEnabled(false)
      setAntiCenterRadius(10)
      setAntiCenterStrength(0.4)
      setBloomThreshold(0.25)
      setBloomIntensity(1.2)
      setPointSize(0.25)
      setVoidMaskEnabled(false)
      setVoidRadius(8)
      setVoidSoftness(0.2)
    } else {
      setAntiCenterEnabled(false)
      setAntiCenterRadius(6)
      setAntiCenterStrength(0.5)
      setBloomThreshold(0.6)
      setBloomIntensity(0.4)
      setPointSize(0.15)
      setVoidMaskEnabled(false)
      setVoidRadius(6)
      setVoidSoftness(0.6)
    }
  }

  

  function onScreenshot() {
    const cvs = document.querySelector('canvas') as HTMLCanvasElement
    if (!cvs) return
    requestAnimationFrame(() => {
      try {
        const url = cvs.toDataURL('image/png')
        const a = document.createElement('a')
        a.href = url
        a.download = 'screenshot.png'
        a.click()
      } catch {}
    })
  }
  

  return (
    <div className="app-root">
      <div className="app-bg" />
      <div className="toolbar">
        <h1 className="brand">粒子化展厅</h1>
        <button className={"btn" + (effect==='none' ? ' active' : '')} onClick={() => { setEffect('none') }}>默认效果</button>
        <button className={"btn" + (effect==='explode' ? ' active' : '')} onClick={() => setEffect(effect==='explode' ? 'none' : 'explode')}>爆裂回流</button>
        <button className={"btn" + (effect==='randomCloud' ? ' active' : '')} onClick={() => { setEffect('randomCloud') }}>随机云海</button>
        <button className={"btn" + (effect==='vortex' ? ' active' : '')} onClick={() => { setEffect('vortex') }}>星环漩涡</button>
        <button className={"btn" + (effect==='shockwave' ? ' active' : '')} onClick={() => { setEffect('shockwave') }}>光爆冲击波</button>
        <button className={"btn" + (effect==='blackhole' ? ' active' : '')} onClick={() => { setEffect('blackhole') }}>黑洞吞噬</button>
        <button className={"btn" + (effect==='waterfall' ? ' active' : '')} onClick={() => { setEffect('waterfall') }}>瀑布云幕</button>
        <button className={"btn" + (effect==='rainbow' ? ' active' : '')} onClick={() => { setEffect('rainbow') }}>彩虹换色</button>
        <button className={"btn" + (effect==='wind' ? ' active' : '')} onClick={() => { setEffect('wind') }}>风洞回旋</button>
        <button className={"btn" + (effect==='breathing' ? ' active' : '')} onClick={() => { setEffect('breathing') }}>星群聚散</button>
        <button className={"btn" + (effect==='ripple' ? ' active' : '')} onClick={() => { setEffect('ripple') }}>波纹干涉</button>
        <button className={"btn" + (effect==='sphere' ? ' active' : '')} onClick={() => { setEffect('sphere') }}>球壳成像</button>
        <button className={"btn" + (effect==='grid' ? ' active' : '')} onClick={() => { setEffect('grid') }}>网格阵列</button>
      </div>
      {false && loading && (
        <div style={{ position: 'fixed', left: 0, top: 0, right: 0, bottom: 0, background: 'rgba(0,0,0,0.25)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000, pointerEvents: 'none' }} />
      )}

      <UploadPanel onImageUrl={u => { setImageUrl(u); setMode('image'); setEffect('none'); setCameraPhi(0); setResetViewTick(v => v + 1) }} onGltfUrl={u => { setGltfUrl(u); setMode('gltf'); setEffect('none') }} onTextSubmit={t => { setText(t); setMode('text'); setEffect('none'); setCameraPhi(0); setResetViewTick(v => v + 1) }} imageFit={imageFit} onImageFitChange={setImageFit} imageColorFidelity={imageColorFidelity} onImageColorFidelityChange={setImageColorFidelity} imageThresholdQuantile={imageThresholdQuantile} onImageThresholdQuantileChange={setImageThresholdQuantile} imageGamma={imageGamma} onImageGammaChange={setImageGamma} imageAlphaMin={imageAlphaMin} onImageAlphaMinChange={setImageAlphaMin} imageSaturationMin={imageSaturationMin} onImageSaturationMinChange={setImageSaturationMin} imageSkipWhites={imageSkipWhites} onImageSkipWhitesChange={setImageSkipWhites} imageWhiteBrightMin={imageWhiteBrightMin} onImageWhiteBrightMinChange={setImageWhiteBrightMin} />
      <TunePanel
        antiCenterEnabled={antiCenterEnabled}
        setAntiCenterEnabled={setAntiCenterEnabled}
        antiCenterRadius={antiCenterRadius}
        setAntiCenterRadius={setAntiCenterRadius}
        antiCenterStrength={antiCenterStrength}
        setAntiCenterStrength={setAntiCenterStrength}
        bloomThreshold={bloomThreshold}
        setBloomThreshold={setBloomThreshold}
        bloomIntensity={bloomIntensity}
        setBloomIntensity={setBloomIntensity}
        pointSize={pointSize}
        setPointSize={setPointSize}
        onApplyPreset={applyPreset}
        voidMaskEnabled={voidMaskEnabled}
        setVoidMaskEnabled={setVoidMaskEnabled}
        voidRadius={voidRadius}
        setVoidRadius={setVoidRadius}
        voidSoftness={voidSoftness}
        setVoidSoftness={setVoidSoftness}
        fps={fps}
        particleCount={particleCount}
        setParticleCount={setParticleCount}
        onScreenshot={onScreenshot}
        onResetView={() => { setCameraTheta(0); setCameraPhi(0); setResetViewTick(v => v + 1) }}
        motionSpeed={motionSpeed}
        setMotionSpeed={setMotionSpeed}
        cameraTheta={cameraTheta}
        setCameraTheta={setCameraTheta}
        cameraPhi={cameraPhi}
        setCameraPhi={setCameraPhi}
      />
      <ParticleScene mode={mode} text={text} imageUrl={imageUrl} gltfUrl={gltfUrl} micOn={micOn}
        antiCenterEnabled={antiCenterEnabled}
        antiCenterRadius={antiCenterRadius}
        antiCenterStrength={antiCenterStrength}
        bloomThreshold={bloomThreshold}
        bloomIntensity={bloomIntensity}
        pointSize={pointSize}
        particleCount={particleCount}
        onFps={setFps}
        onLoadingChange={setLoading}
        voidMaskEnabled={voidMaskEnabled}
        voidRadius={voidRadius}
        voidSoftness={voidSoftness}
        motionSpeed={motionSpeed}
        effect={effect}
        imageFit={imageFit}
        imageColorFidelity={imageColorFidelity}
        imageThresholdQuantile={imageThresholdQuantile}
        imageGamma={imageGamma}
        imageAlphaMin={imageAlphaMin}
        imageSaturationMin={imageSaturationMin}
        imageSkipWhites={imageSkipWhites}
        imageWhiteBrightMin={imageWhiteBrightMin}
        initialCamera={initialCamera}
        resetViewTick={resetViewTick}
      />
    </div>
  )
}
