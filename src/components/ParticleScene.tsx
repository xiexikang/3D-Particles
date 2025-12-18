import React, { useEffect, useMemo, useRef } from 'react'
import { Canvas, useFrame } from '@react-three/fiber'
import * as THREE from 'three'
import { OrbitControls } from '@react-three/drei'
import { EffectComposer, Bloom } from '@react-three/postprocessing'
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js'

type Props = {
  mode: 'random'|'text'|'image'|'gltf'
  text: string
  imageUrl: string
  gltfUrl: string
  micOn: boolean
  antiCenterEnabled?: boolean
  antiCenterRadius?: number
  antiCenterStrength?: number
  pointSize?: number
  bloomThreshold?: number
  bloomIntensity?: number
  particleCount?: number
  onFps?: (v: number) => void
  onLoadingChange?: (v: boolean) => void
  voidMaskEnabled?: boolean
  voidRadius?: number
  voidSoftness?: number
  voidCenterX?: number
  voidCenterY?: number
  accentHueStart?: number
  accentHueEnd?: number
  motionSpeed?: number
  effect?: 'none'|'randomCloud'|'explode'|'vortex'|'shockwave'|'blackhole'|'waterfall'|'rainbow'|'wind'|'breathing'|'ripple'|'sphere'|'grid'
  imageFit?: 'contain'|'cover'
  imageColorFidelity?: boolean
  imageThresholdQuantile?: number
  imageGamma?: number
  imageAlphaMin?: number
  imageSaturationMin?: number
  imageSkipWhites?: boolean
  imageWhiteBrightMin?: number
  initialCamera?: { radius: number; theta: number; phi: number }
  resetViewTick?: number
}

const PARTICLE_COUNT = 30000

function Particles({ mode, text, imageUrl, gltfUrl, micOn, antiCenterEnabled = true, antiCenterRadius = 8, antiCenterStrength = 0.5, pointSize = 0.2, particleCount = PARTICLE_COUNT, onFps, onLoadingChange, voidMaskEnabled = false, voidRadius = 8, voidSoftness = 0.4, accentHueStart = 200, accentHueEnd = 260, motionSpeed = 1, effect = 'none', imageFit = 'contain', imageColorFidelity = true, imageThresholdQuantile = 0.4, imageGamma = 0.9, imageAlphaMin = 20, imageSaturationMin = 0.15, imageSkipWhites = true, imageWhiteBrightMin = 220 }: Props) {
  const geoRef = useRef<THREE.BufferGeometry>(null)
  const pointsRef = useRef<THREE.Points>(null)

  const positions = useMemo(() => new Float32Array(PARTICLE_COUNT * 3), [])
  const velocities = useMemo(() => new Float32Array(PARTICLE_COUNT * 3), [])
  const targets = useMemo(() => new Float32Array(PARTICLE_COUNT * 3), [])
  const colors = useMemo(() => new Float32Array(PARTICLE_COUNT * 3), [])

  const analyserRef = useRef<AnalyserNode | null>(null)
  const targetsReadyRef = useRef<boolean>(true)
  const fpsFramesRef = useRef(0)
  const fpsLastRef = useRef(performance.now())

  useEffect(() => {
    const area = 60
    for (let i = 0; i < PARTICLE_COUNT; i++) {
      const i3 = i * 3
      positions[i3] = (Math.random() - 0.5) * area
      positions[i3 + 1] = (Math.random() - 0.5) * area
      positions[i3 + 2] = (Math.random() - 0.5) * area
      velocities[i3] = (Math.random() - 0.5) * 0.1
      velocities[i3 + 1] = (Math.random() - 0.5) * 0.1
      velocities[i3 + 2] = (Math.random() - 0.5) * 0.1
      const hueRange = Math.max(0, accentHueEnd - accentHueStart)
      const hue = accentHueStart + Math.random() * (hueRange || 0)
      const col = new THREE.Color(`hsl(${hue}, 80%, ${50 + Math.random()*20}%)`)
      colors[i3] = col.r; colors[i3+1] = col.g; colors[i3+2] = col.b
    }
    if (geoRef.current) {
      geoRef.current.setAttribute('position', new THREE.BufferAttribute(positions, 3))
      geoRef.current.setAttribute('color', new THREE.BufferAttribute(colors, 3))
      geoRef.current.setDrawRange(0, Math.min(particleCount, PARTICLE_COUNT))
    }
    // 初始化目标为随机云海，避免首帧吸向中心形成高亮圆圈
    setRandomTargets()
  }, [])

  useEffect(() => {
    if (geoRef.current) geoRef.current.setDrawRange(0, Math.min(particleCount, PARTICLE_COUNT))
  }, [particleCount])

  useEffect(() => {
    if (!micOn) { analyserRef.current = null; return }
    (async () => {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true })
      const ctx = new AudioContext()
      const src = ctx.createMediaStreamSource(stream)
      const analyser = ctx.createAnalyser()
      analyser.fftSize = 1024
      src.connect(analyser)
      analyserRef.current = analyser
    })().catch(console.error)
  }, [micOn])

  async function setTargetsFromText(t: string) {
    const size = 512
    const cvs = document.createElement('canvas')
    cvs.width = size; cvs.height = size
    const ctx = cvs.getContext('2d')!
    ctx.fillStyle = '#000'; ctx.fillRect(0, 0, size, size)
    ctx.fillStyle = '#fff'
    ctx.textAlign = 'center'
    ctx.textBaseline = 'middle'
    const maxW = size * 0.88
    let fontPx = 360
    const setFont = (px: number) => { ctx.font = `bold ${px}px "Microsoft YaHei", "Noto Sans SC", sans-serif` }
    setFont(fontPx)
    let w = ctx.measureText(t).width
    while (w > maxW && fontPx > 48) { fontPx -= 10; setFont(fontPx); w = ctx.measureText(t).width }
    if (w < size * 0.60 && t.trim().length <= 2 && fontPx < 420) {
      while (w < size * 0.78 && fontPx < 420) { fontPx += 8; setFont(fontPx); w = ctx.measureText(t).width }
    }
    ctx.fillText(t, size/2, size/2)
    const img = ctx.getImageData(0, 0, size, size).data
    const pts: number[] = []
    const cols: number[] = []
    const step = 3
    for (let y = 0; y < size; y += step) {
      for (let x = 0; x < size; x += step) {
        const idx = (y * size + x) * 4
        const alpha = img[idx + 3]
        const val = img[idx]
        if (alpha > 200 && val > 200) {
          const nx = (x / size - 0.5) * 50
          const ny = (0.5 - y / size) * 50
          const nz = (Math.random() - 0.5) * 4
          pts.push(nx, ny, nz)
          const hueRange = Math.max(0, accentHueEnd - accentHueStart)
          const hue = accentHueStart + Math.random() * (hueRange || 0)
          const col = new THREE.Color(`hsl(${hue}, 80%, 65%)`)
          cols.push(col.r, col.g, col.b)
        }
      }
    }
    for (let i = 0; i < PARTICLE_COUNT; i++) {
      const i3 = i*3
      const j3 = (i % (pts.length/3)) * 3
      targets[i3] = pts[j3]
      targets[i3+1] = pts[j3+1]
      targets[i3+2] = pts[j3+2]
      colors[i3] = cols[j3] ?? colors[i3]
      colors[i3+1] = cols[j3+1] ?? colors[i3+1]
      colors[i3+2] = cols[j3+2] ?? colors[i3+2]
    }
    if (geoRef.current) {
      geoRef.current.attributes.position.needsUpdate = true
      geoRef.current.attributes.color.needsUpdate = true
    }
  }

  async function setTargetsFromImage(url: string) {
    const targetSamples = Math.min(particleCount ?? PARTICLE_COUNT, PARTICLE_COUNT)
    try {
      const worker = new Worker(new URL('../workers/imageSampler.ts', import.meta.url), { type: 'module' })
      const res: { pts: Float32Array; cols: Float32Array } = await new Promise((resolve, reject) => {
        worker.onmessage = (ev) => {
          const d = ev.data
          worker.terminate()
          if (d && !d.error) resolve(d)
          else reject(new Error('image worker error'))
        }
        worker.onerror = () => { worker.terminate(); reject(new Error('image worker error')) }
        worker.postMessage({ url, particleCount: targetSamples, imageFit, thresholdQuantile: imageThresholdQuantile, gamma: imageGamma, imageColorFidelity, alphaMin: imageAlphaMin, saturationMin: imageSaturationMin, skipWhites: imageSkipWhites, whiteBrightMin: imageWhiteBrightMin })
      })
      const pts = res.pts
      const cols = res.cols
      const batch = 6000
      for (let start = 0; start < PARTICLE_COUNT; start += batch) {
        const end = Math.min(PARTICLE_COUNT, start + batch)
        for (let i = start; i < end; i++) {
          const i3 = i*3
          const j3 = (i % (pts.length/3)) * 3
          targets[i3] = pts[j3]
          targets[i3+1] = pts[j3+1]
          targets[i3+2] = pts[j3+2]
          colors[i3] = cols[j3] ?? colors[i3]
          colors[i3+1] = cols[j3+1] ?? colors[i3+1]
          colors[i3+2] = cols[j3+2] ?? colors[i3+2]
        }
        if (geoRef.current) {
          geoRef.current.attributes.position.needsUpdate = true
          geoRef.current.attributes.color.needsUpdate = true
        }
        await new Promise(r => setTimeout(r, 0))
      }
      return
    } catch {}
    const size = 512
    let bitmap: ImageBitmap | null = null
    try {
      const res = await fetch(url)
      const blob = await res.blob()
      bitmap = await createImageBitmap(blob)
    } catch {
      const img = new Image()
      img.crossOrigin = 'anonymous'
      const loaded: HTMLImageElement = await new Promise((resolve, reject) => {
        img.onload = () => resolve(img)
        img.onerror = reject
        img.src = url
      })
      bitmap = await createImageBitmap(loaded)
    }
    const cvs = document.createElement('canvas')
    cvs.width = size; cvs.height = size
    const ctx = cvs.getContext('2d')!
    const bw = (bitmap as ImageBitmap).width
    const bh = (bitmap as ImageBitmap).height
    const s = imageFit === 'cover' ? Math.max(size / Math.max(1, bw), size / Math.max(1, bh)) : Math.min(size / Math.max(1, bw), size / Math.max(1, bh))
    const dw = Math.round(bw * s)
    const dh = Math.round(bh * s)
    const dx = Math.floor((size - dw) / 2)
    const dy = Math.floor((size - dh) / 2)
    ctx.drawImage(bitmap!, dx, dy, dw, dh)
    const data = ctx.getImageData(0, 0, size, size).data
    const freq = new Uint32Array(256)
    const alphaMin = Math.max(0, Math.min(255, imageAlphaMin ?? 20))
    const block = size * 4 * 32
    for (let i = 0; i < data.length; i += block) {
      const end = Math.min(i + block, data.length)
      for (let j = i; j < end; j += 4) {
        const r0 = data[j], g0 = data[j+1], b0 = data[j+2], a0 = data[j+3]
        if (a0 > alphaMin) {
          const rr0 = Math.pow(r0 / 255, imageGamma)
          const gg0 = Math.pow(g0 / 255, imageGamma)
          const bb0 = Math.pow(b0 / 255, imageGamma)
          const br = Math.min(255, Math.round(((rr0 + gg0 + bb0) / 3) * 255))
          freq[br] += 1
        }
      }
      await new Promise(r => setTimeout(r, 0))
    }
    const total = freq.reduce((a, b) => a + b, 0)
    const targetP = Math.max(0, Math.min(0.8, imageThresholdQuantile))
    let dynamicThreshold0 = 0
    if (targetP > 0) {
      const targetC = Math.floor(total * targetP)
      let acc = 0
      let th = 20
      for (let k = 0; k < 256; k++) { acc += freq[k]; if (acc >= targetC) { th = k; break } }
      dynamicThreshold0 = Math.max(0, Math.min(200, th))
    } else {
      dynamicThreshold0 = 0
    }
    const pts: number[] = []
    const cols: number[] = []
    const step = Math.max(1, Math.floor(Math.sqrt((size * size) / Math.max(1, targetSamples))))
    const spanX = 50 * (dw / size)
    const spanY = 50 * (dh / size)
    for (let y = 0; y < size; y += step) {
      for (let x = 0; x < size; x += step) {
        const idx = (y * size + x) * 4
        const r0 = data[idx], g0 = data[idx+1], b0 = data[idx+2], a0 = data[idx+3]
        const rrGamma = Math.pow(r0 / 255, imageGamma)
        const ggGamma = Math.pow(g0 / 255, imageGamma)
        const bbGamma = Math.pow(b0 / 255, imageGamma)
        const bright = ((rrGamma + ggGamma + bbGamma) / 3) * 255
        const rLin = r0 / 255, gLin = g0 / 255, bLin = b0 / 255
        const maxc = Math.max(rLin, gLin, bLin)
        const minc = Math.min(rLin, gLin, bLin)
        const sat = maxc > 0 ? (maxc - minc) / maxc : 0
        if (a0 > alphaMin && (bright > dynamicThreshold0 || sat >= imageSaturationMin)) {
          const nx = (((x - dx) / Math.max(1, dw)) - 0.5) * spanX
          const ny = (0.5 - ((y - dy) / Math.max(1, dh))) * spanY
          const nz = 0
          pts.push(nx, ny, nz)
          const rr = Math.min(1, imageColorFidelity ? (r0 / 255) : rrGamma)
          const gg = Math.min(1, imageColorFidelity ? (g0 / 255) : ggGamma)
          const bb = Math.min(1, imageColorFidelity ? (b0 / 255) : bbGamma)
          cols.push(rr, gg, bb)
        }
      }
      if ((y / step) % 32 === 0) await new Promise(r => setTimeout(r, 0))
    }
    if (pts.length < 1500) {
      const dynamicThreshold1 = Math.max(5, Math.floor(dynamicThreshold0 * 0.85))
      for (let y = 0; y < size; y += step) {
        for (let x = 0; x < size; x += step) {
          const idx = (y * size + x) * 4
          const r0 = data[idx], g0 = data[idx+1], b0 = data[idx+2], a0 = data[idx+3]
          const rrGamma = Math.pow(r0 / 255, imageGamma)
          const ggGamma = Math.pow(g0 / 255, imageGamma)
          const bbGamma = Math.pow(b0 / 255, imageGamma)
          const bright = ((rrGamma + ggGamma + bbGamma) / 3) * 255
          const rLin = r0 / 255, gLin = g0 / 255, bLin = b0 / 255
          const maxc = Math.max(rLin, gLin, bLin)
          const minc = Math.min(rLin, gLin, bLin)
          const sat = maxc > 0 ? (maxc - minc) / maxc : 0
          if (a0 > alphaMin && (bright > dynamicThreshold1 || sat >= imageSaturationMin)) {
            const nx = (((x - dx) / Math.max(1, dw)) - 0.5) * spanX
            const ny = (0.5 - ((y - dy) / Math.max(1, dh))) * spanY
            const nz = 0
            pts.push(nx, ny, nz)
            const rr = Math.min(1, imageColorFidelity ? (r0 / 255) : rrGamma)
            const gg = Math.min(1, imageColorFidelity ? (g0 / 255) : ggGamma)
            const bb = Math.min(1, imageColorFidelity ? (b0 / 255) : bbGamma)
            cols.push(rr, gg, bb)
          }
        }
        if ((y / step) % 32 === 0) await new Promise(r => setTimeout(r, 0))
      }
    }
    const ptsArr = pts
    const colsArr = cols
    const batch = 6000
    for (let start = 0; start < PARTICLE_COUNT; start += batch) {
      const end = Math.min(PARTICLE_COUNT, start + batch)
      for (let i = start; i < end; i++) {
        const i3 = i*3
        const denom = Math.max(1, (ptsArr.length/3))
        const j3 = (i % denom) * 3
        targets[i3] = ptsArr[j3]
        targets[i3+1] = ptsArr[j3+1]
        targets[i3+2] = ptsArr[j3+2]
        colors[i3] = colsArr[j3] ?? colors[i3]
        colors[i3+1] = colsArr[j3+1] ?? colors[i3+1]
        colors[i3+2] = colsArr[j3+2] ?? colors[i3+2]
      }
      if (geoRef.current) {
        geoRef.current.attributes.position.needsUpdate = true
        geoRef.current.attributes.color.needsUpdate = true
      }
      await new Promise(r => setTimeout(r, 0))
    }
  }

  async function setTargetsFromGLTF(url: string) {
    const loader = new GLTFLoader()
    const gltf = await loader.loadAsync(url)
    const pts: number[] = []
    gltf.scene.traverse(obj => {
      if ((obj as THREE.Mesh).isMesh) {
        const mesh = obj as THREE.Mesh
        const geom = mesh.geometry as THREE.BufferGeometry
        const pos = geom.getAttribute('position') as THREE.BufferAttribute
        const targetSamples = Math.min(particleCount ?? PARTICLE_COUNT, PARTICLE_COUNT)
        const sampleStep = Math.max(1, Math.floor(pos.count / Math.max(1, targetSamples)))
        for (let i = 0; i < pos.count; i += sampleStep) {
          const x = pos.getX(i), y = pos.getY(i), z = pos.getZ(i)
          // 归一化缩放
          pts.push(x * 0.2, y * 0.2, z * 0.2)
        }
      }
    })
    if (pts.length === 0) return
    const batch = 6000
    for (let start = 0; start < PARTICLE_COUNT; start += batch) {
      const end = Math.min(PARTICLE_COUNT, start + batch)
      for (let i = start; i < end; i++) {
        const i3 = i*3
        const j3 = (i % (pts.length/3)) * 3
        targets[i3] = pts[j3]
        targets[i3+1] = pts[j3+1]
        targets[i3+2] = pts[j3+2]
      }
      if (geoRef.current) geoRef.current.attributes.position.needsUpdate = true
      await new Promise(r => setTimeout(r, 0))
    }
  }

  function setRandomTargets() {
    for (let i = 0; i < PARTICLE_COUNT; i++) {
      const i3 = i*3
      targets[i3] = (Math.random() - 0.5) * 50
      targets[i3+1] = (Math.random() - 0.5) * 30
      targets[i3+2] = (Math.random() - 0.5) * 50
    }
  }

  useEffect(() => {
    (async () => {
      onLoadingChange?.(true)
      targetsReadyRef.current = false
      if (effect === 'randomCloud') {
        setRandomTargets()
      } else if (mode === 'text') await setTargetsFromText(text)
      else if (mode === 'image') await setTargetsFromImage(imageUrl)
      else if (mode === 'gltf') await setTargetsFromGLTF(gltfUrl)
      else setRandomTargets()
      targetsReadyRef.current = true
      onLoadingChange?.(false)
    })()
  }, [mode, text, imageUrl, gltfUrl, effect])

  function curlNoise(x: number, y: number, z: number) {
    const n1 = Math.sin(y * 0.13 + z * 0.17) * Math.cos(x * 0.11)
    const n2 = Math.sin(z * 0.07 + x * 0.19) * Math.cos(y * 0.09)
    const n3 = Math.sin(x * 0.05 + y * 0.21) * Math.cos(z * 0.15)
    return [n1, n2, n3]
  }

  const mouse = useRef(new THREE.Vector3())
  const mouseActiveRef = useRef(false)

  const shaderVertex = useMemo(() => `
    precision mediump float;
    varying vec3 vWorldPos;
    varying vec3 vColor;
    attribute vec3 color;
    uniform float uPointSize;
    uniform float uDevicePixelRatio;
    void main() {
      vec4 worldPos = modelMatrix * vec4(position, 1.0);
      vWorldPos = worldPos.xyz;
      vColor = color;
      gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
      gl_PointSize = uPointSize * uDevicePixelRatio;
    }
  `, [])

  const shaderFragment = useMemo(() => `
    precision mediump float;
    varying vec3 vWorldPos;
    varying vec3 vColor;
    uniform vec2 uVoidCenter;
    uniform float uVoidRadius;
    uniform float uVoidSoftness;
    uniform float uHueShift;
    vec3 rgb2hsv(vec3 c){
      vec4 K = vec4(0.0, -1.0/3.0, 2.0/3.0, -1.0);
      vec4 p = mix(vec4(c.bg, K.wz), vec4(c.gb, K.xy), step(c.b, c.g));
      vec4 q = mix(vec4(p.xyw, c.r), vec4(c.r, p.yzx), step(p.x, c.r));
      float d = q.x - min(q.w, q.y);
      float e = 1.0e-10;
      return vec3(abs(q.z + (q.w - q.y) / (6.0 * d + e)), d / (q.x + e), q.x);
    }
    vec3 hsv2rgb(vec3 c){
      vec3 rgb = clamp(abs(mod(c.x*6.0 + vec3(0.0,4.0,2.0), 6.0) - 3.0) - 1.0, 0.0, 1.0);
      rgb = rgb * rgb * (3.0 - 2.0 * rgb);
      return c.z * mix(vec3(1.0), rgb, c.y);
    }
    void main() {
      vec2 uv = gl_PointCoord.xy - 0.5;
      float circle = step(length(uv), 0.5);
      float d = distance(vWorldPos.xy, uVoidCenter);
      // Hard & soft masks
      float hardMask = step(uVoidRadius, d);
      float softMask = smoothstep(uVoidRadius - uVoidSoftness, uVoidRadius, d);
      float useSoft = step(0.001, uVoidSoftness);
      float finalMask = mix(hardMask, softMask, useSoft);
      // Discard inside the void to ensure a visible hole even with additive blending
      if (finalMask < 0.02) discard;
      float alpha = circle * finalMask;
      vec3 col = vColor;
      if (uHueShift != 0.0) {
        vec3 hsv = rgb2hsv(col);
        hsv.x = fract(hsv.x + uHueShift);
        col = hsv2rgb(hsv);
      }
      gl_FragColor = vec4(col, alpha);
    }
  `, [])

  const shaderMatRef = useRef<THREE.ShaderMaterial>(null)

  useEffect(() => {
    if (shaderMatRef.current) {
      shaderMatRef.current.uniforms.uPointSize.value = pointSize
      shaderMatRef.current.uniforms.uVoidCenter.value = new THREE.Vector2(0, 0)
      shaderMatRef.current.uniforms.uVoidRadius.value = voidRadius
      shaderMatRef.current.uniforms.uVoidSoftness.value = voidSoftness
      shaderMatRef.current.uniforms.uDevicePixelRatio.value = window.devicePixelRatio || 1.0
      if (shaderMatRef.current.uniforms.uHueShift) shaderMatRef.current.uniforms.uHueShift.value = 0
    }
  }, [pointSize, voidRadius, voidSoftness])

  useFrame(({ camera, raycaster }) => {
    const allowMotion = !(mode === 'image' && effect === 'none')
    // 音频幅值
    let amp = 0
    if (analyserRef.current) {
      const arr = new Uint8Array(analyserRef.current.frequencyBinCount)
      analyserRef.current.getByteFrequencyData(arr)
      amp = arr.reduce((a, b) => a + b, 0) / (arr.length * 255)
    }

    let mx = mouse.current.x, my = mouse.current.y, mz = mouse.current.z
    const hasMouse = mouseActiveRef.current

    const attractStrength = 0.06 + amp * 0.2
    const damping = 0.92
    const explodeForce = 0.35 + amp * 0.8
    const mouseRadius = hasMouse ? 8 : 0
    const originRadius = 8
    const originRepel = 0.5
    const step = 0.02 * Math.max(0.05, motionSpeed)
    const time = performance.now() * 0.001
    const vortexBase = 0.06
    const shockOmega = 2.2
    const shockK = 0.8
    const blackholeRadius = voidRadius
    const blackholeStrength = 0.08
    const gridN = Math.max(8, Math.round(Math.cbrt(Math.min(particleCount, PARTICLE_COUNT))))
    const gridSpan = 45
    const gridStep = gridSpan / Math.max(1, gridN-1)

    for (let i = 0; i < PARTICLE_COUNT; i++) {
      const i3 = i * 3
      const px = positions[i3], py = positions[i3+1], pz = positions[i3+2]
      if (allowMotion) {
        const [nx, ny, nz] = curlNoise(px*0.03, py*0.03, pz*0.03)
        velocities[i3] += nx * step; velocities[i3+1] += ny * step; velocities[i3+2] += nz * step
      }

      if (allowMotion && effect === 'waterfall') {
        velocities[i3+1] += (-0.12 + 0.06*Math.sin(time + px*0.1)) * motionSpeed * step;
      }

      if (allowMotion && effect === 'wind') {
        const cx = hasMouse ? mx : 0.0;
        const cy = hasMouse ? my : 0.0;
        const dxm = px - cx, dym = py - cy;
        const rm = Math.max(0.001, Math.hypot(dxm, dym));
        const txm = -dym / rm, tym = dxm / rm;
        const s = 0.08 * Math.min(1, rm / 14) * motionSpeed;
        velocities[i3] += txm * s * step;
        velocities[i3+1] += tym * s * step;
      }

      if (allowMotion && effect === 'breathing') {
        const r = Math.max(0.001, Math.hypot(px, py, pz));
        const a = Math.sin(time * 1.5);
        const rx = px / r, ry = py / r, rz = pz / r;
        velocities[i3] += rx * a * 0.10 * motionSpeed * step;
        velocities[i3+1] += ry * a * 0.10 * motionSpeed * step;
        velocities[i3+2] += rz * a * 0.10 * motionSpeed * step;
      }

      if (allowMotion && effect === 'ripple') {
        const r = Math.max(0.001, Math.hypot(px, py, pz));
        const phase = time * 2.4 - r * 0.9;
        const narrow = Math.exp(-Math.abs(Math.sin(phase)) * 3.0);
        const a = Math.sin(phase) * narrow;
        const rx = px / r, ry = py / r, rz = pz / r;
        velocities[i3] += rx * a * 0.18 * motionSpeed * step;
        velocities[i3+1] += ry * a * 0.18 * motionSpeed * step;
        velocities[i3+2] += rz * a * 0.18 * motionSpeed * step;
      }

      if (allowMotion && effect === 'sphere') {
        const r = Math.max(0.001, Math.hypot(px, py, pz));
        const R = 20.0;
        const diff = R - r;
        const rx = px / r, ry = py / r, rz = pz / r;
        const s = 0.06 * motionSpeed;
        velocities[i3] += rx * diff * s * step;
        velocities[i3+1] += ry * diff * s * step;
        velocities[i3+2] += rz * diff * s * step;
      }

      if (allowMotion && effect === 'grid') {
        const gx = (i % gridN);
        const gy = Math.floor(i / gridN) % gridN;
        const gz = Math.floor(i / (gridN*gridN)) % gridN;
        const tx = (gx / (gridN - 1) - 0.5) * gridSpan;
        const ty = (gy / (gridN - 1) - 0.5) * gridSpan;
        const tz = (gz / (gridN - 1) - 0.5) * gridSpan;
        velocities[i3] += (tx - px) * 0.08 * motionSpeed * step;
        velocities[i3+1] += (ty - py) * 0.08 * motionSpeed * step;
        velocities[i3+2] += (tz - pz) * 0.08 * motionSpeed * step;
      }

      if (allowMotion && effect === 'vortex') {
        const r = Math.max(0.001, Math.hypot(px, py))
        const tx = -py / r
        const ty = px / r
        const s = vortexBase * Math.min(1, r / 12) * motionSpeed
        velocities[i3] += tx * s * step
        velocities[i3+1] += ty * s * step
      }

      if (allowMotion && effect === 'shockwave') {
        const r = Math.max(0.001, Math.hypot(px, py, pz))
        const phase = time * shockOmega - r * shockK
        const amp = Math.sin(phase)
        const rx = px / r
        const ry = py / r
        const rz = pz / r
        velocities[i3] += rx * amp * 0.12 * motionSpeed * step
        velocities[i3+1] += ry * amp * 0.12 * motionSpeed * step
        velocities[i3+2] += rz * amp * 0.12 * motionSpeed * step
      }

      if (allowMotion && effect === 'blackhole') {
        const r = Math.max(0.001, Math.hypot(px, py, pz))
        if (r < blackholeRadius * 1.8) {
          const rx = -px / r
          const ry = -py / r
          const rz = -pz / r
          const s = blackholeStrength * (1 - Math.min(1, r / (blackholeRadius * 1.8))) * motionSpeed
          velocities[i3] += rx * s * step
          velocities[i3+1] += ry * s * step
          velocities[i3+2] += rz * s * step
        }
      }

      if (allowMotion && effect === 'explode') {
        const len = Math.max(0.001, Math.hypot(px, py, pz))
        velocities[i3] += (px/len) * explodeForce * step
        velocities[i3+1] += (py/len) * explodeForce * step
        velocities[i3+2] += (pz/len) * explodeForce * step
      } else {
        if (targetsReadyRef.current) {
          const tx = targets[i3], ty = targets[i3+1], tz = targets[i3+2]
          velocities[i3] += (tx - px) * attractStrength * step
          velocities[i3+1] += (ty - py) * attractStrength * step
          velocities[i3+2] += (tz - pz) * attractStrength * step
        }
      }

      const dx = px - mx, dy = py - my
      const dist = Math.hypot(dx, dy)
      if (hasMouse && dist < mouseRadius) {
        const f = (mouseRadius - dist) / mouseRadius
        velocities[i3] += (dx/dist) * f * (0.6 * motionSpeed)
        velocities[i3+1] += (dy/dist) * f * (0.6 * motionSpeed)
      }

      if (antiCenterEnabled) {
        const oLen = Math.hypot(px, py, pz)
        if (oLen < antiCenterRadius) {
          const ox = px / Math.max(0.001, oLen)
          const oy = py / Math.max(0.001, oLen)
          const oz = pz / Math.max(0.001, oLen)
          const f0 = (antiCenterRadius - oLen) / antiCenterRadius
          velocities[i3] += ox * antiCenterStrength * f0 * (0.04 * motionSpeed)
          velocities[i3+1] += oy * antiCenterStrength * f0 * (0.04 * motionSpeed)
          velocities[i3+2] += oz * antiCenterStrength * f0 * (0.04 * motionSpeed)
        }
      }

      velocities[i3] *= damping; velocities[i3+1] *= damping; velocities[i3+2] *= damping
      positions[i3] += velocities[i3]; positions[i3+1] += velocities[i3+1]; positions[i3+2] += velocities[i3+2]
    }
    if (geoRef.current) geoRef.current.attributes.position.needsUpdate = true
    if (shaderMatRef.current) {
      const base = effect === 'blackhole' ? voidRadius : 0
      const delta = effect === 'blackhole' ? 2 : 0
      const rAnim = base + Math.sin(time * 1.3) * delta
      shaderMatRef.current.uniforms.uVoidRadius.value = rAnim
      shaderMatRef.current.uniforms.uHueShift.value = effect === 'rainbow' ? (time * 0.03) : 0.0
      shaderMatRef.current.uniforms.uDevicePixelRatio.value = (window as any).devicePixelRatio || 1.0
    }
    fpsFramesRef.current += 1
    const now = performance.now()
    if (now - fpsLastRef.current >= 1000) {
      const fpsVal = Math.round((fpsFramesRef.current * 1000) / (now - fpsLastRef.current))
      if (onFps) onFps(fpsVal)
      fpsFramesRef.current = 0
      fpsLastRef.current = now
    }
  })

  return (
    <group>
      <points
        ref={pointsRef}
        onPointerMove={(e) => { mouseActiveRef.current = true; mouse.current.copy(e.point as any) }}
        onPointerLeave={() => { mouseActiveRef.current = false }}
      >
        <bufferGeometry ref={geoRef} />
        {voidMaskEnabled || effect === 'blackhole' || effect === 'rainbow' ? (
          <shaderMaterial
            ref={shaderMatRef as any}
            uniforms={{ uPointSize: { value: pointSize }, uDevicePixelRatio: { value: (window as any).devicePixelRatio || 1.0 }, uVoidCenter: { value: new THREE.Vector2(0, 0) }, uVoidRadius: { value: 0 }, uVoidSoftness: { value: 0 }, uHueShift: { value: 0 } }}
            vertexShader={shaderVertex}
            fragmentShader={shaderFragment}
            transparent
            blending={THREE.AdditiveBlending}
            depthWrite={false}
          />
        ) : (
          <pointsMaterial size={pointSize} vertexColors transparent opacity={imageColorFidelity && mode==='image' ? 1.0 : 0.95} blending={imageColorFidelity && mode==='image' ? THREE.NormalBlending : THREE.AdditiveBlending} depthWrite={false} />
        )}
      </points>
    </group>
  )
}

// 移除了镜头关键帧与热点卡片，保留核心场景与后期

export default function ParticleScene(props: Props) {
  const controlsRef = useRef<any>(null)
  useEffect(() => {
    if (controlsRef.current) {
      controlsRef.current.target.set(0, 0, 0)
      controlsRef.current.update()
    }
  }, [])
  useEffect(() => {
    if (!controlsRef.current) return
    const r = props.initialCamera?.radius ?? 80
    const td = props.initialCamera?.theta ?? 0
    const pd = props.initialCamera?.phi ?? 0
    const t = td * Math.PI / 180
    const p = pd * Math.PI / 180
    const x = r * Math.sin(p) * Math.cos(t)
    const y = r * Math.sin(p) * Math.sin(t)
    const z = r * Math.cos(p)
    controlsRef.current.object.position.set(x, y, z)
    controlsRef.current.target.set(0, 0, 0)
    controlsRef.current.update()
  }, [props.resetViewTick])
  return (
    <Canvas camera={{ position: (() => { const r = props.initialCamera?.radius ?? 80; const td = props.initialCamera?.theta ?? 0; const pd = props.initialCamera?.phi ?? 0; const t = td * Math.PI / 180; const p = pd * Math.PI / 180; const x = r * Math.sin(p) * Math.cos(t); const y = r * Math.sin(p) * Math.sin(t); const z = r * Math.cos(p); return [x, y, z] as [number, number, number]; })(), fov: 60 }} gl={{ preserveDrawingBuffer: true, outputColorSpace: THREE.SRGBColorSpace }}>
      <color attach="background" args={["#0b0b12"]} />
      <OrbitControls ref={controlsRef} enablePan={false} enableDamping />
      <Particles
        mode={props.mode}
        text={props.text}
        imageUrl={props.imageUrl}
        gltfUrl={props.gltfUrl}
        micOn={props.micOn}
        antiCenterEnabled={props.antiCenterEnabled ?? (props.mode === 'random')}
        antiCenterRadius={props.antiCenterRadius}
        antiCenterStrength={props.antiCenterStrength}
        pointSize={props.pointSize ?? ((props.mode === 'image' || props.mode === 'text') ? 0.5 : 0.2)}
        particleCount={props.particleCount}
        onFps={props.onFps}
        onLoadingChange={props.onLoadingChange}
        accentHueStart={props.accentHueStart}
        accentHueEnd={props.accentHueEnd}
        motionSpeed={props.motionSpeed}
        effect={props.effect}
        imageFit={props.imageFit}
        imageColorFidelity={props.imageColorFidelity}
        imageThresholdQuantile={props.imageThresholdQuantile}
        imageGamma={props.imageGamma}
      />
      <EffectComposer>
        <Bloom intensity={props.bloomIntensity ?? 0.6} luminanceThreshold={props.bloomThreshold ?? 0.4} luminanceSmoothing={0.9} />
      </EffectComposer>
    </Canvas>
  )
}
