"use client"

import { useEffect, useRef } from "react"
import { useTheme } from "next-themes"

interface GeometricBackgroundProps {
  variant?: "tesseract" | "mobius" | "torus" | "orb"
}

export default function GeometricBackground({ variant = "orb" }: GeometricBackgroundProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const { theme } = useTheme()

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return

    const ctx = canvas.getContext("2d")
    if (!ctx) return

    const resizeCanvas = () => {
      canvas.width = window.innerWidth
      canvas.height = window.innerHeight
    }
    resizeCanvas()
    window.addEventListener("resize", resizeCanvas)

    const isDark = theme === "dark"
    // Use primary blue from theme palette
    const primaryColor = isDark ? "59, 130, 246" : "0, 82, 204" // Primary blue (#0052CC)
    const secondaryColor = isDark ? "76, 154, 255" : "7, 71, 166" // Hover/Accent blue (#4C9AFF / #0747A6)
    const accentColor = isDark ? "96, 165, 250" : "0, 82, 204" // Keep primary blue theme

    if (variant === "tesseract") {
      // 4D Tesseract (Hypercube) animation
      let time = 0
      let posX = -200
      let posY = canvas.height / 2

      // Define the 16 vertices of a tesseract in 4D space
      const vertices4D: number[][] = []
      for (let i = 0; i < 16; i++) {
        vertices4D.push([
          (i & 1) ? 1 : -1,
          (i & 2) ? 1 : -1,
          (i & 4) ? 1 : -1,
          (i & 8) ? 1 : -1,
        ])
      }

      // Define the edges of the tesseract
      const edges: number[][] = []
      for (let i = 0; i < 16; i++) {
        for (let j = i + 1; j < 16; j++) {
          let diff = 0
          for (let k = 0; k < 4; k++) {
            if (vertices4D[i][k] !== vertices4D[j][k]) diff++
          }
          if (diff === 1) edges.push([i, j])
        }
      }

      function rotate4D(point: number[], angleXW: number, angleYW: number, angleZW: number): number[] {
        let [x, y, z, w] = point

        // Rotate in XW plane
        let x1 = x * Math.cos(angleXW) - w * Math.sin(angleXW)
        let w1 = x * Math.sin(angleXW) + w * Math.cos(angleXW)

        // Rotate in YW plane
        let y1 = y * Math.cos(angleYW) - w1 * Math.sin(angleYW)
        let w2 = y * Math.sin(angleYW) + w1 * Math.cos(angleYW)

        // Rotate in ZW plane
        let z1 = z * Math.cos(angleZW) - w2 * Math.sin(angleZW)
        let w3 = z * Math.sin(angleZW) + w2 * Math.cos(angleZW)

        return [x1, y1, z1, w3]
      }

      function project4Dto2D(point: number[], distance: number): { x: number; y: number; scale: number } {
        const [x, y, z, w] = point
        const scale = distance / (distance + w)
        const scale2 = distance / (distance + z * scale)

        return {
          x: x * scale * scale2,
          y: y * scale * scale2,
          scale: scale * scale2
        }
      }

      const animate = () => {
        ctx.clearRect(0, 0, canvas.width, canvas.height)

        time += 0.003 // Very slow rotation
        posX += 0.15 // Slow movement across screen

        // Reset position when it goes off screen
        if (posX > canvas.width + 300) {
          posX = -300
          posY = Math.random() * canvas.height
        }

        const scale = 80 // Increased from 50 to make it larger
        const distance = 4

        // Rotate and project vertices
        const projected: Array<{ x: number; y: number; scale: number }> = []
        for (let i = 0; i < vertices4D.length; i++) {
          const rotated = rotate4D(vertices4D[i], time, time * 0.7, time * 0.5)
          const proj = project4Dto2D(rotated, distance)
          projected.push({
            x: posX + proj.x * scale,
            y: posY + proj.y * scale,
            scale: proj.scale
          })
        }

        // Draw edges with gradient effect
        edges.forEach(([i, j]) => {
          const p1 = projected[i]
          const p2 = projected[j]
          const avgScale = (p1.scale + p2.scale) / 2

          const gradient = ctx.createLinearGradient(p1.x, p1.y, p2.x, p2.y)
          gradient.addColorStop(0, `rgba(${primaryColor}, ${avgScale * 0.5})`)
          gradient.addColorStop(0.5, `rgba(${secondaryColor}, ${avgScale * 0.6})`)
          gradient.addColorStop(1, `rgba(${accentColor}, ${avgScale * 0.4})`)

          ctx.strokeStyle = gradient
          ctx.lineWidth = 2
          ctx.globalAlpha = avgScale * 0.8
          ctx.beginPath()
          ctx.moveTo(p1.x, p1.y)
          ctx.lineTo(p2.x, p2.y)
          ctx.stroke()
        })

        // Draw vertices with glow effect
        projected.forEach((p) => {
          const size = 3 + p.scale * 4
          ctx.globalAlpha = p.scale * 0.9

          // Outer glow
          const gradient = ctx.createRadialGradient(p.x, p.y, 0, p.x, p.y, size * 2)
          gradient.addColorStop(0, `rgba(${accentColor}, 0.8)`)
          gradient.addColorStop(0.5, `rgba(${secondaryColor}, 0.4)`)
          gradient.addColorStop(1, `rgba(${primaryColor}, 0)`)
          ctx.fillStyle = gradient
          ctx.beginPath()
          ctx.arc(p.x, p.y, size * 2, 0, Math.PI * 2)
          ctx.fill()

          // Core vertex
          ctx.fillStyle = `rgba(${secondaryColor}, 1)`
          ctx.beginPath()
          ctx.arc(p.x, p.y, size, 0, Math.PI * 2)
          ctx.fill()
        })

        ctx.globalAlpha = 1
        animationId = requestAnimationFrame(animate)
      }

      let animationId = requestAnimationFrame(animate)

      return () => {
        window.removeEventListener("resize", resizeCanvas)
        cancelAnimationFrame(animationId)
      }
    } else if (variant === "mobius") {
      // Möbius Strip animation with light moving along the lines
      let time = 0
      let posX = -300
      let posY = canvas.height / 2
      let lightPosition = 0

      const animate = () => {
        ctx.clearRect(0, 0, canvas.width, canvas.height)

        time += 0.005
        posX += 0.2
        lightPosition += 0.02

        if (posX > canvas.width + 300) {
          posX = -300
          posY = Math.random() * canvas.height
        }

        if (lightPosition > Math.PI * 2) {
          lightPosition = 0
        }

        const segments = 80
        const width = 40

        // Draw Möbius strip
        for (let i = 0; i < segments; i++) {
          const t = (i / segments) * Math.PI * 2
          const nextT = ((i + 1) / segments) * Math.PI * 2

          // Parametric equations for Möbius strip
          const r = 100
          const x1 = posX + (r + width * Math.cos(t / 2) * Math.cos(t)) * Math.cos(time)
          const y1 = posY + (r + width * Math.cos(t / 2) * Math.cos(t)) * Math.sin(time)
          const z1 = width * Math.cos(t / 2) * Math.sin(t)

          const x2 = posX + (r + width * Math.cos(nextT / 2) * Math.cos(nextT)) * Math.cos(time)
          const y2 = posY + (r + width * Math.cos(nextT / 2) * Math.cos(nextT)) * Math.sin(time)
          const z2 = width * Math.cos(nextT / 2) * Math.sin(nextT)

          // Apply perspective
          const perspective = 500
          const scale1 = perspective / (perspective + z1)
          const scale2 = perspective / (perspective + z2)

          const screenX1 = x1 * scale1
          const screenY1 = y1 * scale1
          const screenX2 = x2 * scale2
          const screenY2 = y2 * scale2

          // Color based on depth
          const baseOpacity = (scale1 + scale2) / 2 * 0.4

          // Check if light is near this segment
          const distanceToLight = Math.abs(t - lightPosition)
          const isNearLight = distanceToLight < 0.3 || (Math.PI * 2 - distanceToLight) < 0.3
          const lightIntensity = isNearLight ? Math.max(0, 1 - distanceToLight / 0.3) : 0
          const opacity = baseOpacity + lightIntensity * 0.6

          // Create gradient for outer edge
          const gradient = ctx.createLinearGradient(screenX1, screenY1, screenX2, screenY2)
          gradient.addColorStop(0, `rgba(${primaryColor}, ${opacity})`)
          gradient.addColorStop(0.5, `rgba(${secondaryColor}, ${opacity * 1.2})`)
          gradient.addColorStop(1, `rgba(${primaryColor}, ${opacity})`)

          ctx.strokeStyle = gradient
          ctx.lineWidth = isNearLight ? 3 : 2
          ctx.beginPath()
          ctx.moveTo(screenX1, screenY1)
          ctx.lineTo(screenX2, screenY2)
          ctx.stroke()

          // Draw light glow at current position
          if (isNearLight) {
            const glowGradient = ctx.createRadialGradient(
              screenX1, screenY1, 0,
              screenX1, screenY1, 15
            )
            glowGradient.addColorStop(0, `rgba(${accentColor}, ${lightIntensity * 0.8})`)
            glowGradient.addColorStop(1, `rgba(${primaryColor}, 0)`)
            ctx.fillStyle = glowGradient
            ctx.beginPath()
            ctx.arc(screenX1, screenY1, 15, 0, Math.PI * 2)
            ctx.fill()
          }

          // Draw inner edge
          const innerX1 = posX + (r - width * Math.cos(t / 2) * Math.cos(t)) * Math.cos(time)
          const innerY1 = posY + (r - width * Math.cos(t / 2) * Math.cos(t)) * Math.sin(time)
          const innerX2 = posX + (r - width * Math.cos(nextT / 2) * Math.cos(nextT)) * Math.cos(time)
          const innerY2 = posY + (r - width * Math.cos(nextT / 2) * Math.cos(nextT)) * Math.sin(time)

          ctx.strokeStyle = `rgba(${secondaryColor}, ${opacity * 0.8})`
          ctx.lineWidth = isNearLight ? 2.5 : 1.5
          ctx.beginPath()
          ctx.moveTo(innerX1 * scale1, innerY1 * scale1)
          ctx.lineTo(innerX2 * scale2, innerY2 * scale2)
          ctx.stroke()
        }

        animationId = requestAnimationFrame(animate)
      }

      let animationId = requestAnimationFrame(animate)

      return () => {
        window.removeEventListener("resize", resizeCanvas)
        cancelAnimationFrame(animationId)
      }
    } else if (variant === "torus") {
      // Torus (donut) animation
      let time = 0
      let posX = -200
      let posY = canvas.height / 2

      const animate = () => {
        ctx.clearRect(0, 0, canvas.width, canvas.height)

        time += 0.008
        posX += 0.25

        if (posX > canvas.width + 200) {
          posX = -200
          posY = Math.random() * canvas.height
        }

        const R = 80 // Major radius
        const r = 30 // Minor radius
        const segments = 40
        const tubes = 20

        for (let i = 0; i < segments; i++) {
          for (let j = 0; j < tubes; j++) {
            const u = (i / segments) * Math.PI * 2
            const v = (j / tubes) * Math.PI * 2
            const nextU = ((i + 1) / segments) * Math.PI * 2
            const nextV = ((j + 1) / tubes) * Math.PI * 2

            // Torus parametric equations
            const x1 = (R + r * Math.cos(v)) * Math.cos(u)
            const y1 = (R + r * Math.cos(v)) * Math.sin(u)
            const z1 = r * Math.sin(v)

            // Rotate
            const rx1 = x1 * Math.cos(time) - z1 * Math.sin(time)
            const rz1 = x1 * Math.sin(time) + z1 * Math.cos(time)
            const ry1 = y1 * Math.cos(time * 0.7) - rz1 * Math.sin(time * 0.7)
            const rz2 = y1 * Math.sin(time * 0.7) + rz1 * Math.cos(time * 0.7)

            // Project to 2D
            const perspective = 400
            const scale = perspective / (perspective + rz2)
            const screenX = posX + rx1 * scale
            const screenY = posY + ry1 * scale

            const opacity = scale * 0.3
            ctx.fillStyle = `rgba(${primaryColor}, ${opacity})`
            ctx.beginPath()
            ctx.arc(screenX, screenY, 1.5, 0, Math.PI * 2)
            ctx.fill()
          }
        }

        animationId = requestAnimationFrame(animate)
      }

      let animationId = requestAnimationFrame(animate)

      return () => {
        window.removeEventListener("resize", resizeCanvas)
        cancelAnimationFrame(animationId)
      }
    } else if (variant === "orb") {
      // Slow, breathing orbs (Cinematic/High-End)
      let time = 0;

      const animate = () => {
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        time += 0.002; // Very slow time step

        // Orb 1: Blue (Primary) - Enlarged
        const x1 = canvas.width * 0.3 + Math.sin(time * 0.5) * 50;
        const y1 = canvas.height * 0.4 + Math.cos(time * 0.3) * 50;
        const size1 = Math.max(canvas.width, canvas.height) * 1.5; // Significantly larger

        const g1 = ctx.createRadialGradient(x1, y1, 0, x1, y1, size1);
        g1.addColorStop(0, `rgba(${primaryColor}, 0.15)`); 
        g1.addColorStop(0.5, `rgba(${primaryColor}, 0.05)`);
        g1.addColorStop(1, "rgba(0,0,0,0)");

        ctx.fillStyle = g1;
        ctx.beginPath();
        ctx.arc(x1, y1, size1, 0, Math.PI * 2);
        ctx.fill();

        // Orb 2: Purple (Secondary/Accent) - Enlarged
        const x2 = canvas.width * 0.7 + Math.cos(time * 0.4) * 60;
        const y2 = canvas.height * 0.6 + Math.sin(time * 0.6) * 60;
        const size2 = Math.max(canvas.width, canvas.height) * 1.2; // Significantly larger

        const g2 = ctx.createRadialGradient(x2, y2, 0, x2, y2, size2);
        // Use a purple override if needed, otherwise secondaryColor
        // Hardcoding a nice purple for the "Cool Animation" request if secondary is blue
        g2.addColorStop(0, `rgba(147, 51, 234, 0.12)`); // Purple-600 equivalent
        g2.addColorStop(0.5, `rgba(147, 51, 234, 0.04)`);
        g2.addColorStop(1, "rgba(0,0,0,0)");

        ctx.fillStyle = g2;
        ctx.beginPath();
        ctx.arc(x2, y2, size2, 0, Math.PI * 2);
        ctx.fill();

        animationId = requestAnimationFrame(animate);
      };

      let animationId = requestAnimationFrame(animate);

      return () => {
        window.removeEventListener("resize", resizeCanvas);
        cancelAnimationFrame(animationId);
      };
    }
  }, [variant, theme])

  return (
    <canvas
      ref={canvasRef}
      className="fixed inset-0 pointer-events-none z-0"
      style={{ opacity: 0.7 }}
    />
  )
}
