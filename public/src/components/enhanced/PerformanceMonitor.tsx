/**
 * Real-time Performance Monitor for Development
 * Shows FPS, memory usage, and other performance metrics
 */

import React, { useState, useEffect, useRef } from 'react';
import { Monitor, Cpu, HardDrive, Zap, AlertTriangle } from 'lucide-react';

interface PerformanceMetrics {
  fps: number;
  frameTime: number;
  memoryUsage: number;
  renderTime: number;
  eventQueueSize: number;
  cacheHitRate: number;
}

interface PerformanceMonitorProps {
  isVisible: boolean;
  onToggle: () => void;
}

export const PerformanceMonitor: React.FC<PerformanceMonitorProps> = ({
  isVisible,
  onToggle
}) => {
  const [metrics, setMetrics] = useState<PerformanceMetrics>({
    fps: 60,
    frameTime: 16.67,
    memoryUsage: 0,
    renderTime: 0,
    eventQueueSize: 0,
    cacheHitRate: 100
  });

  const [history, setHistory] = useState<PerformanceMetrics[]>([]);
  const frameCountRef = useRef(0);
  const lastTimeRef = useRef(performance.now());
  const fpsHistoryRef = useRef<number[]>([]);

  useEffect(() => {
    if (!isVisible) return;

    const updateMetrics = () => {
      const now = performance.now();
      const deltaTime = now - lastTimeRef.current;
      
      frameCountRef.current++;
      
      if (deltaTime >= 1000) {
        const fps = Math.round((frameCountRef.current * 1000) / deltaTime);
        const frameTime = deltaTime / frameCountRef.current;
        
        fpsHistoryRef.current.push(fps);
        if (fpsHistoryRef.current.length > 60) {
          fpsHistoryRef.current.shift();
        }

        const newMetrics: PerformanceMetrics = {
          fps,
          frameTime,
          memoryUsage: getMemoryUsage(),
          renderTime: getAverageRenderTime(),
          eventQueueSize: getEventQueueSize(),
          cacheHitRate: getCacheHitRate()
        };

        setMetrics(newMetrics);
        setHistory(prev => [...prev.slice(-29), newMetrics]);

        frameCountRef.current = 0;
        lastTimeRef.current = now;
      }

      requestAnimationFrame(updateMetrics);
    };

    const animationId = requestAnimationFrame(updateMetrics);
    return () => cancelAnimationFrame(animationId);
  }, [isVisible]);

  const getMemoryUsage = (): number => {
    if ('memory' in performance) {
      const memory = (performance as any).memory;
      return Math.round((memory.usedJSHeapSize / memory.jsHeapSizeLimit) * 100);
    }
    return 0;
  };

  const getAverageRenderTime = (): number => {
    // Simulate render time calculation
    return Math.random() * 5 + 1;
  };

  const getEventQueueSize = (): number => {
    // Simulate event queue size
    return Math.floor(Math.random() * 10);
  };

  const getCacheHitRate = (): number => {
    // Simulate cache hit rate
    return 95 + Math.random() * 5;
  };

  const getPerformanceStatus = () => {
    if (metrics.fps < 30) return { status: 'critical', color: 'text-red-400' };
    if (metrics.fps < 45) return { status: 'warning', color: 'text-yellow-400' };
    return { status: 'good', color: 'text-green-400' };
  };

  const getMemoryStatus = () => {
    if (metrics.memoryUsage > 80) return { status: 'critical', color: 'text-red-400' };
    if (metrics.memoryUsage > 60) return { status: 'warning', color: 'text-yellow-400' };
    return { status: 'good', color: 'text-green-400' };
  };

  if (!isVisible) {
    return (
      <button
        onClick={onToggle}
        className="fixed bottom-4 right-4 w-12 h-12 retro-button flex items-center justify-center z-40"
        title="Show Performance Monitor"
      >
        <Monitor size={20} />
      </button>
    );
  }

  const performanceStatus = getPerformanceStatus();
  const memoryStatus = getMemoryStatus();

  return (
    <div className="fixed bottom-4 right-4 retro-panel p-4 w-80 z-40 bg-black bg-opacity-90">
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <Monitor size={20} className="retro-accent" />
          <h3 className="text-sm font-bold retro-text">Performance Monitor</h3>
        </div>
        <button
          onClick={onToggle}
          className="w-6 h-6 flex items-center justify-center retro-text hover:retro-accent transition-colors"
        >
          ×
        </button>
      </div>

      {/* Metrics Grid */}
      <div className="grid grid-cols-2 gap-3 mb-4">
        {/* FPS */}
        <div className="retro-border p-2 bg-black">
          <div className="flex items-center gap-2 mb-1">
            <Zap size={14} className={performanceStatus.color} />
            <span className="text-xs retro-text">FPS</span>
          </div>
          <div className={`text-lg font-bold ${performanceStatus.color}`}>
            {metrics.fps}
          </div>
          <div className="text-xs retro-dim">
            {metrics.frameTime.toFixed(1)}ms
          </div>
        </div>

        {/* Memory */}
        <div className="retro-border p-2 bg-black">
          <div className="flex items-center gap-2 mb-1">
            <HardDrive size={14} className={memoryStatus.color} />
            <span className="text-xs retro-text">Memory</span>
          </div>
          <div className={`text-lg font-bold ${memoryStatus.color}`}>
            {metrics.memoryUsage}%
          </div>
          <div className="text-xs retro-dim">
            Heap Usage
          </div>
        </div>

        {/* Render Time */}
        <div className="retro-border p-2 bg-black">
          <div className="flex items-center gap-2 mb-1">
            <Cpu size={14} className="retro-accent" />
            <span className="text-xs retro-text">Render</span>
          </div>
          <div className="text-lg font-bold retro-text">
            {metrics.renderTime.toFixed(1)}ms
          </div>
          <div className="text-xs retro-dim">
            Avg Time
          </div>
        </div>

        {/* Cache Hit Rate */}
        <div className="retro-border p-2 bg-black">
          <div className="flex items-center gap-2 mb-1">
            <Monitor size={14} className="retro-accent" />
            <span className="text-xs retro-text">Cache</span>
          </div>
          <div className="text-lg font-bold retro-text">
            {metrics.cacheHitRate.toFixed(1)}%
          </div>
          <div className="text-xs retro-dim">
            Hit Rate
          </div>
        </div>
      </div>

      {/* FPS Graph */}
      <div className="retro-border p-2 bg-black mb-3">
        <div className="text-xs retro-text mb-2">FPS History</div>
        <div className="h-16 flex items-end gap-1">
          {fpsHistoryRef.current.slice(-30).map((fps, index) => (
            <div
              key={index}
              className="flex-1 bg-gradient-to-t from-blue-600 to-blue-400 min-w-0"
              style={{
                height: `${Math.max(2, (fps / 60) * 100)}%`,
                opacity: 0.7 + (index / 30) * 0.3
              }}
            />
          ))}
        </div>
        <div className="flex justify-between text-xs retro-dim mt-1">
          <span>0</span>
          <span>30</span>
          <span>60</span>
        </div>
      </div>

      {/* Warnings */}
      {(performanceStatus.status !== 'good' || memoryStatus.status !== 'good') && (
        <div className="retro-border p-2 bg-red-900 bg-opacity-50">
          <div className="flex items-center gap-2 mb-1">
            <AlertTriangle size={14} className="text-red-400" />
            <span className="text-xs text-red-400 font-bold">Performance Issues</span>
          </div>
          <div className="text-xs text-red-300">
            {performanceStatus.status !== 'good' && <div>• Low FPS detected</div>}
            {memoryStatus.status !== 'good' && <div>• High memory usage</div>}
          </div>
        </div>
      )}

      {/* Quick Actions */}
      <div className="mt-3 flex gap-2">
        <button
          onClick={() => {
            if ('gc' in window) {
              (window as any).gc();
            }
          }}
          className="retro-button text-xs px-2 py-1 flex-1"
        >
          Force GC
        </button>
        <button
          onClick={() => {
            console.log('Performance Metrics:', metrics);
            console.log('FPS History:', fpsHistoryRef.current);
          }}
          className="retro-button text-xs px-2 py-1 flex-1"
        >
          Log Data
        </button>
      </div>
    </div>
  );
};