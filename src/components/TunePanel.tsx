import React, { useState } from 'react'

type Props = {
  antiCenterEnabled: boolean
  setAntiCenterEnabled: (v: boolean) => void
  antiCenterRadius: number
  setAntiCenterRadius: (v: number) => void
  antiCenterStrength: number
  setAntiCenterStrength: (v: number) => void
  bloomThreshold: number
  setBloomThreshold: (v: number) => void
  bloomIntensity: number
  setBloomIntensity: (v: number) => void
  pointSize: number
  setPointSize: (v: number) => void
  onApplyPreset: (name: '沉浸柔光' | '爆火高亮' | '文物写实') => void
  voidMaskEnabled: boolean
  setVoidMaskEnabled: (v: boolean) => void
  voidRadius: number
  setVoidRadius: (v: number) => void
  voidSoftness: number
  setVoidSoftness: (v: number) => void
  fps: number
  particleCount: number
  setParticleCount: (v: number) => void
  onScreenshot: () => void
  onResetView?: () => void
  motionSpeed: number
  setMotionSpeed: (v: number) => void
  cameraTheta: number
  setCameraTheta: (v: number) => void
  cameraPhi: number
  setCameraPhi: (v: number) => void
}

export default function TunePanel(props: Props) {
  const { antiCenterEnabled, setAntiCenterEnabled, antiCenterRadius, setAntiCenterRadius, antiCenterStrength, setAntiCenterStrength, bloomThreshold, setBloomThreshold, bloomIntensity, setBloomIntensity, pointSize, setPointSize, onApplyPreset, voidMaskEnabled, setVoidMaskEnabled, voidRadius, setVoidRadius, voidSoftness, setVoidSoftness, fps, particleCount, setParticleCount, onScreenshot, onResetView, motionSpeed, setMotionSpeed, cameraTheta, setCameraTheta, cameraPhi, setCameraPhi } = props
  const [showContent, setShowContent] = useState(true)
  return (
    <div className={`tune-container panel ${showContent ? '' : 'collapsed'}`}>
      <div className="panel-header">
        {showContent ? <div className="card-title">参数调节</div> : null}
        <button className="btn" onClick={() => setShowContent(v => !v)}>{showContent ? '收起' : '展开'}</button>
      </div>
      {showContent && (
      <>
      <div className="control-row">
        <button className="btn" onClick={() => onApplyPreset('沉浸柔光')}>沉浸柔光</button>
        <button className="btn" onClick={() => onApplyPreset('爆火高亮')}>爆火高亮</button>
        <button className="btn" onClick={() => onApplyPreset('文物写实')}>文物写实</button>
      </div>
      <div className="control-row">
        <label className="control">
          <input type="checkbox" checked={antiCenterEnabled} onChange={e => setAntiCenterEnabled(e.target.checked)} />
          <span>反中心斥力</span>
        </label>
        <label className="control">
          <input type="checkbox" checked={voidMaskEnabled} onChange={e => setVoidMaskEnabled(e.target.checked)} />
          <span>遮罩空洞</span>
        </label>
      </div>
      <div className="grid">
        <span>中心圆圈半径 {antiCenterRadius.toFixed(1)}</span>
        <input type="range" min={0} max={40} step={0.5} value={antiCenterRadius} onChange={e => setAntiCenterRadius(parseFloat(e.target.value))} />
        <span>中心圆圈强度 {antiCenterStrength.toFixed(2)}</span>
        <input type="range" min={0} max={2} step={0.05} value={antiCenterStrength} onChange={e => setAntiCenterStrength(parseFloat(e.target.value))} />
      </div>
      <div className="grid">
        <span>遮罩半径 {voidRadius.toFixed(1)}</span>
        <input type="range" min={0} max={40} step={0.5} value={voidRadius} onChange={e => setVoidRadius(parseFloat(e.target.value))} />
        <span>边缘软硬 {voidSoftness.toFixed(2)}</span>
        <input type="range" min={0} max={1} step={0.05} value={voidSoftness} onChange={e => setVoidSoftness(parseFloat(e.target.value))} />
      </div>
      <div className="grid">
        <span>Bloom 阈值 {bloomThreshold.toFixed(2)}</span>
        <input type="range" min={0} max={1} step={0.02} value={bloomThreshold} onChange={e => setBloomThreshold(parseFloat(e.target.value))} />
        <span>Bloom 强度 {bloomIntensity.toFixed(2)}</span>
        <input type="range" min={0} max={2} step={0.05} value={bloomIntensity} onChange={e => setBloomIntensity(parseFloat(e.target.value))} />
      </div>
      <div className="grid">
        <span>粒子尺寸 {pointSize.toFixed(2)}</span>
        <input type="range" min={0.05} max={1} step={0.01} value={pointSize} onChange={e => setPointSize(parseFloat(e.target.value))} />
      </div>
      <div className="grid">
        <span>运动速度 {motionSpeed.toFixed(2)}</span>
        <input type="range" min={0.2} max={3} step={0.05} value={motionSpeed} onChange={e => setMotionSpeed(parseFloat(e.target.value))} />
      </div>
      <div className="grid">
        <span>水平角 θ {cameraTheta.toFixed(0)}°</span>
        <input type="range" min={-180} max={180} step={1} value={cameraTheta} onChange={e => setCameraTheta(parseFloat(e.target.value))} />
        <span>俯仰角 φ {cameraPhi.toFixed(0)}°</span>
        <input type="range" min={0} max={180} step={1} value={cameraPhi} onChange={e => setCameraPhi(parseFloat(e.target.value))} />
      </div>
      <div className="grid">
        <span>粒子数量 {particleCount}</span>
        <input type="range" min={10000} max={60000} step={1000} value={particleCount} onChange={e => setParticleCount(parseInt(e.target.value))} />
      </div>
      <div className="footer-row">
        <span className="badge">FPS: {fps}</span>
        <div className="control-row">
          <button className="btn" onClick={onScreenshot}>截图保存</button>
          <button className="btn" onClick={() => onResetView && onResetView()}>重置视角</button>
        </div>
      </div>
      </>
      )}
    </div>
  )
}
