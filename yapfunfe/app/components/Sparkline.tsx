"use client"

import { useEffect, useRef } from "react"

interface SparklineProps {
  data: number[]
  color: string
  height?: number
}

export default function Sparkline({ data, color, height = 50 }: SparklineProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null)

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return

    const ctx = canvas.getContext("2d")
    if (!ctx) return

    const dpr = window.devicePixelRatio || 1
    const rect = canvas.getBoundingClientRect()

    canvas.width = rect.width * dpr
    canvas.height = rect.height * dpr
    ctx.scale(dpr, dpr)

    const drawSparkline = () => {
      const width = rect.width
      const chartHeight = height
      const max = Math.max(...data)
      const min = Math.min(...data)
      const range = max - min
      const step = width / (data.length - 1)

      ctx.clearRect(0, 0, width, chartHeight)
      ctx.strokeStyle = color
      ctx.lineWidth = 1.5
      ctx.beginPath()

      data.forEach((value, i) => {
        const x = i * step
        const y = chartHeight - ((value - min) / range) * chartHeight
        if (i === 0) {
          ctx.moveTo(x, y)
        } else {
          ctx.lineTo(x, y)
        }
      })

      ctx.stroke()
    }

    drawSparkline()
  }, [data, color, height])

  return <canvas ref={canvasRef} style={{ width: "100%", height: `${height}px` }} className="opacity-75" />
}

