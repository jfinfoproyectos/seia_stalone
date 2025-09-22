"use client";

import { useState, useEffect, useCallback, useRef } from 'react';
import { 
  getLiveEvaluations, 
  getLiveStudents, 
  getAllLiveStudents, 
  getLiveStats,
  LiveStudentData,
  LiveEvaluationSummary
} from '../actions';

interface LiveStats {
  activeEvaluations: number;
  activeStudents: number;
  submittedToday: number;
}

interface UseLiveDataOptions {
  refreshInterval?: number; // en milisegundos, por defecto 5000 (5 segundos)
  autoRefresh?: boolean; // por defecto true
}

export function useLiveEvaluations(options: UseLiveDataOptions = {}) {
  const { refreshInterval = 5000, autoRefresh = true } = options;
  const [evaluations, setEvaluations] = useState<LiveEvaluationSummary[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const intervalRef = useRef<NodeJS.Timeout | null>(null);

  const fetchEvaluations = useCallback(async () => {
    try {
      setError(null);
      const data = await getLiveEvaluations();
      setEvaluations(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error al cargar evaluaciones');
      console.error('Error fetching live evaluations:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  const startPolling = useCallback(() => {
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
    }
    
    if (autoRefresh) {
      intervalRef.current = setInterval(fetchEvaluations, refreshInterval);
    }
  }, [fetchEvaluations, refreshInterval, autoRefresh]);

  const stopPolling = useCallback(() => {
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }
  }, []);

  const refresh = useCallback(() => {
    fetchEvaluations();
  }, [fetchEvaluations]);

  useEffect(() => {
    fetchEvaluations();
    startPolling();

    return () => {
      stopPolling();
    };
  }, [fetchEvaluations, startPolling, stopPolling]);

  // Pausar polling cuando la pestaña no está visible
  useEffect(() => {
    const handleVisibilityChange = () => {
      if (document.hidden) {
        stopPolling();
      } else {
        startPolling();
        fetchEvaluations(); // Refrescar inmediatamente al volver
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);
    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, [startPolling, stopPolling, fetchEvaluations]);

  return {
    evaluations,
    loading,
    error,
    refresh,
    startPolling,
    stopPolling
  };
}

export function useLiveStudents(evaluationId?: number, options: UseLiveDataOptions = {}) {
  const { refreshInterval = 3000, autoRefresh = true } = options; // Más frecuente para estudiantes
  const [students, setStudents] = useState<LiveStudentData[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const intervalRef = useRef<NodeJS.Timeout | null>(null);

  const fetchStudents = useCallback(async () => {
    try {
      setError(null);
      const data = evaluationId 
        ? await getLiveStudents(evaluationId)
        : await getAllLiveStudents();
      setStudents(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error al cargar estudiantes');
      console.error('Error fetching live students:', err);
    } finally {
      setLoading(false);
    }
  }, [evaluationId]);

  const startPolling = useCallback(() => {
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
    }
    
    if (autoRefresh) {
      intervalRef.current = setInterval(fetchStudents, refreshInterval);
    }
  }, [fetchStudents, refreshInterval, autoRefresh]);

  const stopPolling = useCallback(() => {
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }
  }, []);

  const refresh = useCallback(() => {
    fetchStudents();
  }, [fetchStudents]);

  useEffect(() => {
    fetchStudents();
    startPolling();

    return () => {
      stopPolling();
    };
  }, [fetchStudents, startPolling, stopPolling]);

  // Pausar polling cuando la pestaña no está visible
  useEffect(() => {
    const handleVisibilityChange = () => {
      if (document.hidden) {
        stopPolling();
      } else {
        startPolling();
        fetchStudents();
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);
    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, [startPolling, stopPolling, fetchStudents]);

  return {
    students,
    loading,
    error,
    refresh,
    startPolling,
    stopPolling
  };
}

export function useLiveStats(options: UseLiveDataOptions = {}) {
  const { refreshInterval = 10000, autoRefresh = true } = options; // Menos frecuente para stats
  const [stats, setStats] = useState<LiveStats>({
    activeEvaluations: 0,
    activeStudents: 0,
    submittedToday: 0
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const intervalRef = useRef<NodeJS.Timeout | null>(null);

  const fetchStats = useCallback(async () => {
    try {
      setError(null);
      const data = await getLiveStats();
      setStats(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error al cargar estadísticas');
      console.error('Error fetching live stats:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  const startPolling = useCallback(() => {
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
    }
    
    if (autoRefresh) {
      intervalRef.current = setInterval(fetchStats, refreshInterval);
    }
  }, [fetchStats, refreshInterval, autoRefresh]);

  const stopPolling = useCallback(() => {
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }
  }, []);

  const refresh = useCallback(() => {
    fetchStats();
  }, [fetchStats]);

  useEffect(() => {
    fetchStats();
    startPolling();

    return () => {
      stopPolling();
    };
  }, [fetchStats, startPolling, stopPolling]);

  return {
    stats,
    loading,
    error,
    refresh,
    startPolling,
    stopPolling
  };
}

// Hook combinado para usar todos los datos en vivo
export function useAllLiveData(options: UseLiveDataOptions = {}) {
  const evaluationsData = useLiveEvaluations(options);
  const studentsData = useLiveStudents(undefined, options);
  const statsData = useLiveStats(options);

  const refreshAll = useCallback(() => {
    evaluationsData.refresh();
    studentsData.refresh();
    statsData.refresh();
  }, [evaluationsData, studentsData, statsData]);

  const startAllPolling = useCallback(() => {
    evaluationsData.startPolling();
    studentsData.startPolling();
    statsData.startPolling();
  }, [evaluationsData, studentsData, statsData]);

  const stopAllPolling = useCallback(() => {
    evaluationsData.stopPolling();
    studentsData.stopPolling();
    statsData.stopPolling();
  }, [evaluationsData, studentsData, statsData]);

  return {
    evaluations: evaluationsData.evaluations,
    students: studentsData.students,
    stats: statsData.stats,
    loading: evaluationsData.loading || studentsData.loading || statsData.loading,
    error: evaluationsData.error || studentsData.error || statsData.error,
    refreshAll,
    startAllPolling,
    stopAllPolling
  };
}