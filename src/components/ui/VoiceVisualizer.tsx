'use client';

import { useEffect, useRef, useState } from 'react';

interface VoiceVisualizerProps {
    isActive: boolean;
    color?: string;
}

export default function VoiceVisualizer({ isActive, color = '#ff4d4d' }: VoiceVisualizerProps) {
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const audioContextRef = useRef<AudioContext | null>(null);
    const analyserRef = useRef<AnalyserNode | null>(null);
    const animationFrameRef = useRef<number | null>(null);
    const streamRef = useRef<MediaStream | null>(null);

    useEffect(() => {
        if (isActive) {
            startVisualizer();
        } else {
            stopVisualizer();
        }

        return () => stopVisualizer();
    }, [isActive]);

    const startVisualizer = async () => {
        try {
            const stream = await navigator.mediaDevices.getUserMedia({
                audio: {
                    echoCancellation: true,
                    noiseSuppression: true,
                    autoGainControl: true,
                },
            });
            streamRef.current = stream;

            const AudioContextClass = (window as any).AudioContext || (window as any).webkitAudioContext;
            const audioContext = new AudioContextClass();
            audioContextRef.current = audioContext;

            const analyser = audioContext.createAnalyser();
            analyser.fftSize = 256;
            analyserRef.current = analyser;

            const source = audioContext.createMediaStreamSource(stream);
            source.connect(analyser);

            draw();
        } catch (err) {
            console.error('Error accessing microphone for visualizer:', err);
        }
    };

    const stopVisualizer = () => {
        if (animationFrameRef.current) {
            cancelAnimationFrame(animationFrameRef.current);
        }
        if (streamRef.current) {
            streamRef.current.getTracks().forEach(track => track.stop());
        }
        if (audioContextRef.current) {
            audioContextRef.current.close();
        }
    };

    const draw = () => {
        if (!canvasRef.current || !analyserRef.current) return;

        const canvas = canvasRef.current;
        const ctx = canvas.getContext('2d');
        if (!ctx) return;

        const bufferLength = analyserRef.current.frequencyBinCount;
        const dataArray = new Uint8Array(bufferLength);

        const renderFrame = () => {
            animationFrameRef.current = requestAnimationFrame(renderFrame);
            analyserRef.current!.getByteFrequencyData(dataArray);

            ctx.clearRect(0, 0, canvas.width, canvas.height);

            const barWidth = (canvas.width / bufferLength) * 2.5;
            let barHeight;
            let x = 0;

            for (let i = 0; i < bufferLength; i++) {
                barHeight = (dataArray[i] / 255) * canvas.height;

                // Gradient for premium look
                const gradient = ctx.createLinearGradient(0, canvas.height, 0, 0);
                gradient.addColorStop(0, color);
                gradient.addColorStop(1, '#ffffff');

                ctx.fillStyle = gradient;

                // Rounded bars like WhatsApp
                const radius = barWidth / 2;
                const y = (canvas.height - barHeight) / 2;

                ctx.beginPath();
                ctx.roundRect(x, y, barWidth - 2, barHeight, radius);
                ctx.fill();

                x += barWidth;
            }
        };

        renderFrame();
    };

    return (
        <div className="w-full h-16 flex items-center justify-center overflow-hidden">
            <canvas
                ref={canvasRef}
                width={300}
                height={60}
                className="w-full max-w-xs h-full"
            />
        </div>
    );
}
