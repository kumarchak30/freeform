import { useEffect, useRef } from 'react'
import useStore from '../../store/useStore'

export default function Visualizer({ analyserRef }) {
  const canvasRef = useRef(null)
  const rafRef = useRef(null)
  const isPlaying = useStore(s => s.isPlaying)

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext('2d')
    const W = canvas.width
    const H = canvas.height

    const draw = () => {
      rafRef.current = requestAnimationFrame(draw)
      ctx.clearRect(0, 0, W, H)

      const analyser = analyserRef.current
      if (!analyser || !isPlaying) {
        // idle bars
        const bars = 28
        const bw = 2, gap = 2
        for (let i = 0; i < bars; i++) {
          const h = 3 + Math.sin(Date.now() * 0.001 + i * 0.5) * 2
          const x = i * (bw + gap)
          ctx.fillStyle = 'rgba(124,111,255,0.25)'
          ctx.beginPath()
          ctx.roundRect(x, H / 2 - h / 2, bw, h, 1)
          ctx.fill()
        }
        return
      }

      const bufLen = analyser.frequencyBinCount
      const data = new Uint8Array(bufLen)
      analyser.getByteFrequencyData(data)

      const bars = 28
      const bw = 2, gap = 2
      const step = Math.floor(bufLen / bars)

      for (let i = 0; i < bars; i++) {
        const val = data[i * step] / 255
        const h = Math.max(3, val * H)
        const x = i * (bw + gap)
        const t = i / bars
        const r = Math.round(124 + t * (191 - 124))
        const g = Math.round(111 + t * (95 - 111))
        const b = Math.round(255)
        ctx.fillStyle = `rgba(${r},${g},${b},${0.5 + val * 0.5})`
        ctx.beginPath()
        ctx.roundRect(x, H / 2 - h / 2, bw, h, 1)
        ctx.fill()
      }
    }

    draw()
    return () => cancelAnimationFrame(rafRef.current)
  }, [isPlaying, analyserRef])

  return (
    <div className="visualizer-wrap">
      <canvas ref={canvasRef} className="visualizer" width={120} height={32} />
    </div>
  )
}
