self.onmessage = async (e: MessageEvent) => {
  const { url, particleCount, imageFit, thresholdQuantile, gamma, imageColorFidelity, alphaMin, saturationMin, skipWhites, whiteBrightMin } = e.data as { url: string; particleCount: number; imageFit?: 'contain'|'cover'; thresholdQuantile?: number; gamma?: number; imageColorFidelity?: boolean; alphaMin?: number; saturationMin?: number; skipWhites?: boolean; whiteBrightMin?: number }
  try {
    const size = 512
    let bitmap: ImageBitmap | null = null
    try {
      const res = await fetch(url)
      const blob = await res.blob()
      bitmap = await createImageBitmap(blob)
    } catch {
      bitmap = await createImageBitmap(url)
    }
    const canvas = new OffscreenCanvas(size, size)
    const ctx = canvas.getContext('2d')!
    const bw = (bitmap as ImageBitmap).width
    const bh = (bitmap as ImageBitmap).height
    const s = (imageFit === 'cover') ? Math.max(size / Math.max(1, bw), size / Math.max(1, bh)) : Math.min(size / Math.max(1, bw), size / Math.max(1, bh))
    const dw = Math.round(bw * s)
    const dh = Math.round(bh * s)
    const dx = Math.floor((size - dw) / 2)
    const dy = Math.floor((size - dh) / 2)
    ctx.drawImage(bitmap!, dx, dy, dw, dh)
    const img = ctx.getImageData(0, 0, size, size)
    const data = img.data
    const freq = new Uint32Array(256)
    const alphaMinVal = Math.max(0, Math.min(255, typeof alphaMin === 'number' ? alphaMin : 20))
    const gval = typeof gamma === 'number' ? gamma : 0.9
    for (let i = 0; i < data.length; i += 4) {
      const r0 = data[i], g0 = data[i+1], b0 = data[i+2], a0 = data[i+3]
      if (a0 > alphaMinVal) {
        const rr0 = Math.pow(r0 / 255, gval)
        const gg0 = Math.pow(g0 / 255, gval)
        const bb0 = Math.pow(b0 / 255, gval)
        const br = Math.min(255, Math.round(((rr0 + gg0 + bb0) / 3) * 255))
        freq[br] += 1
      }
    }
    const total = freq.reduce((a, b) => a + b, 0)
    const useP = (typeof thresholdQuantile === 'number' ? thresholdQuantile : 0.4)
    const targetP = Math.max(0, Math.min(0.8, useP))
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
    const targetSamples = Math.max(1, Math.min(particleCount, 30000))
    const step = Math.max(1, Math.floor(Math.sqrt((size * size) / Math.max(1, targetSamples))))
    const pts: number[] = []
    const cols: number[] = []
    const spanX = 50 * (dw / size)
    const spanY = 50 * (dh / size)
    const satMin = Math.max(0, Math.min(1, typeof saturationMin === 'number' ? saturationMin : 0.15))
    const whiteMin = Math.max(0, Math.min(255, typeof whiteBrightMin === 'number' ? whiteBrightMin : 220))
    for (let y = 0; y < size; y += step) {
      for (let x = 0; x < size; x += step) {
        const idx = (y * size + x) * 4
        const r0 = data[idx], g0 = data[idx+1], b0 = data[idx+2], a0 = data[idx+3]
        const rrGamma = Math.pow(r0 / 255, gval)
        const ggGamma = Math.pow(g0 / 255, gval)
        const bbGamma = Math.pow(b0 / 255, gval)
        const bright = ((rrGamma + ggGamma + bbGamma) / 3) * 255
        const rLin = r0 / 255, gLin = g0 / 255, bLin = b0 / 255
        const maxc = Math.max(rLin, gLin, bLin)
        const minc = Math.min(rLin, gLin, bLin)
        const sat = maxc > 0 ? (maxc - minc) / maxc : 0
        const isWhiteBg = !!skipWhites && sat < satMin && bright >= whiteMin
        if (a0 > alphaMinVal && !isWhiteBg && (bright > dynamicThreshold0 || sat >= satMin)) {
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
    }
    if (pts.length < 1500) {
      const dynamicThreshold1 = Math.max(5, Math.floor(dynamicThreshold0 * 0.85))
      for (let y = 0; y < size; y += step) {
        for (let x = 0; x < size; x += step) {
          const idx = (y * size + x) * 4
          const r0 = data[idx], g0 = data[idx+1], b0 = data[idx+2], a0 = data[idx+3]
          const rrGamma = Math.pow(r0 / 255, gval)
          const ggGamma = Math.pow(g0 / 255, gval)
          const bbGamma = Math.pow(b0 / 255, gval)
          const bright = ((rrGamma + ggGamma + bbGamma) / 3) * 255
          const rLin = r0 / 255, gLin = g0 / 255, bLin = b0 / 255
          const maxc = Math.max(rLin, gLin, bLin)
          const minc = Math.min(rLin, gLin, bLin)
          const sat = maxc > 0 ? (maxc - minc) / maxc : 0
          const isWhiteBg2 = !!skipWhites && sat < satMin && bright >= whiteMin
          if (a0 > alphaMinVal && !isWhiteBg2 && (bright > dynamicThreshold1 || sat >= satMin)) {
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
      }
    }
    const ptsArr = new Float32Array(pts)
    const colsArr = new Float32Array(cols)
    ;(self as any).postMessage({ pts: ptsArr, cols: colsArr }, [ptsArr.buffer, colsArr.buffer])
  } catch (err) {
    ;(self as any).postMessage({ error: true })
  }
}
