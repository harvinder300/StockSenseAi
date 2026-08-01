import { useRef, useEffect } from 'react'
import { Howl } from 'howler'

const useAudio = () => {
    // Simple bleep sound (base64)
    const bleep = useRef(new Howl({
        src: ['data:audio/wav;base64,UklGRl9vT19XQVZFZm10IBAAAAABAAEAQB8AAEAfAAABAAgAZGF0YU'], // Placeholder silent/short
        // Realistically we need actual base64 or file paths. 
        // For this demo, let's use a very short generated beep or silence if we can't easily generate one.
        // I will use a simple noise burst if possible, but without files, I'll rely on visual feedback mostly 
        // and just setup the structure.
        html5: true
    }))

    // Actually, let's try to generate a real simple beep using Web Audio API directly if Howler is too complex without files
    // But since I installed Howler, let's use it for files if I had them.
    // For now I'll create a synth helper

    const playHover = () => {
        // Simple oscillator beep
        const ctx = new (window.AudioContext || window.webkitAudioContext)()
        const osc = ctx.createOscillator()
        const gain = ctx.createGain()
        osc.connect(gain)
        gain.connect(ctx.destination)
        osc.type = 'sine'
        osc.frequency.setValueAtTime(440, ctx.currentTime)
        gain.gain.setValueAtTime(0.1, ctx.currentTime)
        osc.start()
        osc.stop(ctx.currentTime + 0.05)
    }

    const playClick = () => {
        const ctx = new (window.AudioContext || window.webkitAudioContext)()
        const osc = ctx.createOscillator()
        const gain = ctx.createGain()
        osc.connect(gain)
        gain.connect(ctx.destination)
        osc.type = 'square'
        osc.frequency.setValueAtTime(880, ctx.currentTime)
        gain.gain.setValueAtTime(0.05, ctx.currentTime)
        osc.start()
        osc.stop(ctx.currentTime + 0.05)
    }

    return { playHover, playClick }
}

export default useAudio
