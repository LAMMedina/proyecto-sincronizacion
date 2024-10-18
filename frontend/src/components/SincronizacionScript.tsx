import React, { useState, useCallback, useEffect } from 'react'
import axios from 'axios'

interface Config {
  mondayBoardId: string;
  mailchimpListId: string;
  syncInterval: number;
  autoSync: boolean;
}

interface SyncResult {
  email: string | null;
  mergeFields?: {
    NAME: string;
    PHONE: string;
    FDATE: string;
    STATUS: string;
  };
  status: 'success' | 'error' | 'skipped';
  error?: string;
  reason?: string;
}

export default function SincronizacionMondayMailchimp() {
  const [isRunning, setIsRunning] = useState(false)
  const [lastSync, setLastSync] = useState<string | null>(null)
  const [logs, setLogs] = useState<string[]>([])
  const [syncResults, setSyncResults] = useState<SyncResult[]>([])
  const [config, setConfig] = useState<Config>({
    mondayBoardId: '',
    mailchimpListId: '',
    syncInterval: 60,
    autoSync: false
  })
  const [isConfiguring, setIsConfiguring] = useState(false)

  const addLog = useCallback((message: string) => {
    setLogs(prev => [...prev, `${new Date().toLocaleTimeString()}: ${message}`])
  }, [])

  const startSync = useCallback(async () => {
    if (isRunning) return;
    if (!config.mondayBoardId || !config.mailchimpListId) {
      addLog("Error: Falta configuración. Por favor, configure los IDs de Monday y Mailchimp.")
      return
    }

    setIsRunning(true)
    addLog("Iniciando sincronización...")

    try {
      const response = await axios.post('http://localhost:3001/api/sync-monday-mailchimp', config)
      addLog(response.data.message)
      setSyncResults(response.data.syncResults)
    } catch (error: any) {
      addLog(`Error en la sincronización: ${error.response?.data?.message || error.message}`)
    }

    setIsRunning(false)
    setLastSync(new Date().toLocaleString())
    addLog("Sincronización completada")
  }, [config, addLog, isRunning])

  useEffect(() => {
    const savedConfig = localStorage.getItem('syncConfig')
    if (savedConfig) {
      setConfig(JSON.parse(savedConfig))
    }
  }, [])

  useEffect(() => {
    let interval: NodeJS.Timeout | null = null
    if (config.autoSync && !isRunning) {
      interval = setInterval(() => {
        startSync()
      }, config.syncInterval * 60 * 1000)
    }
    return () => {
      if (interval) clearInterval(interval)
    }
  }, [config.autoSync, config.syncInterval, startSync, isRunning])

  const handleConfigChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target
    setConfig(prev => ({ ...prev, [name]: name === 'syncInterval' ? parseInt(value) : value }))
  }

  const handleAutoSyncChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setConfig(prev => ({ ...prev, autoSync: e.target.checked }))
  }

  const saveConfig = () => {
    localStorage.setItem('syncConfig', JSON.stringify(config))
    setIsConfiguring(false)
    addLog("Configuración guardada")
  }

  return (
    <div className="container mx-auto p-4">
      <div className="w-full max-w-6xl mx-auto bg-white shadow-md rounded-lg overflow-hidden">
        <div className="px-6 py-4">
          <h1 className="text-2xl font-bold mb-4">Sincronización Monday.com - Mailchimp</h1>
          {isConfiguring ? (
            <div className="space-y-4 mb-4">
              <div>
                <label htmlFor="mondayBoardId" className="block text-sm font-medium text-gray-700">ID del Tablero de Monday</label>
                <input
                  type="text"
                  id="mondayBoardId"
                  name="mondayBoardId"
                  value={config.mondayBoardId}
                  onChange={handleConfigChange}
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-300 focus:ring focus:ring-indigo-200 focus:ring-opacity-50"
                />
              </div>
              <div>
                <label htmlFor="mailchimpListId" className="block text-sm font-medium text-gray-700">ID de la Lista de Mailchimp</label>
                <input
                  type="text"
                  id="mailchimpListId"
                  name="mailchimpListId"
                  value={config.mailchimpListId}
                  onChange={handleConfigChange}
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-300 focus:ring focus:ring-indigo-200 focus:ring-opacity-50"
                />
              </div>
              <div>
                <label htmlFor="syncInterval" className="block text-sm font-medium text-gray-700">Intervalo de sincronización (minutos)</label>
                <input
                  type="number"
                  id="syncInterval"
                  name="syncInterval"
                  value={config.syncInterval}
                  onChange={handleConfigChange}
                  min="1"
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-300 focus:ring focus:ring-indigo-200 focus:ring-opacity-50"
                />
              </div>
              <div className="flex items-center">
                <input
                  type="checkbox"
                  id="autoSync"
                  name="autoSync"
                  checked={config.autoSync}
                  onChange={handleAutoSyncChange}
                  className="h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-gray-300 rounded"
                />
                <label htmlFor="autoSync" className="ml-2 block text-sm text-gray-900">
                  Sincronización automática
                </label>
              </div>
              <button
                onClick={saveConfig}
                className="w-full py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
              >
                Guardar Configuración
              </button>
            </div>
          ) : (
            <button 
              onClick={() => setIsConfiguring(true)}
              className="mb-4 py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-indigo-600 bg-indigo-100 hover:bg-indigo-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
            >
              Configurar
            </button>
          )}
          <button 
            onClick={startSync} 
            disabled={isRunning || !config.mondayBoardId || !config.mailchimpListId}
            className={`w-full py-2 px-4 rounded-md text-white font-semibold ${
              isRunning || !config.mondayBoardId || !config.mailchimpListId
                ? 'bg-gray-400 cursor-not-allowed' 
                : 'bg-blue-500 hover:bg-blue-600'
            }`}
          >
            {isRunning ? 'Sincronizando...' : 'Iniciar Sincronización Manual'}
          </button>
        </div>
        <div className="px-6 py-4 bg-gray-50">
          <h2 className="text-xl font-semibold mb-2">Estado de la sincronización</h2>
          <p className="text-gray-600">
            {lastSync 
              ? `Última sincronización: ${lastSync}`
              : 'No se ha sincronizado aún'
            }
          </p>
          <p className="text-gray-600">
            Sincronización automática: {config.autoSync ? 'Activada' : 'Desactivada'}
          </p>
          {config.autoSync && (
            <p className="text-gray-600">
              Intervalo de sincronización: {config.syncInterval} minutos
            </p>
          )}
        </div>
        <div className="px-6 py-4">
          <h2 className="text-xl font-semibold mb-2">Resultados de Sincronización</h2>
          <div className="bg-gray-100 p-4 rounded-md max-h-96 overflow-y-auto">
            {syncResults.length > 0 ? (
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th scope="col" className="px-3 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Email</th>
                    <th scope="col" className="px-3 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Nombre</th>
                    <th scope="col" className="px-3 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Teléfono</th>
                    <th scope="col" className="px-3 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Fecha</th>
                    <th scope="col" className="px-3 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Estado Monday</th>
                    <th scope="col" className="px-3 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Estado Sync</th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {syncResults.map((result, index) => (
                    <tr key={index} className={
                      result.status === 'error' ? 'bg-red-50' : 
                      result.status === 'skipped' ? 'bg-yellow-50' : 
                      'bg-white'
                    }>
                      <td className="px-3 py-4 whitespace-nowrap text-sm text-gray-500">{result.email || 'N/A'}</td>
                      <td className="px-3 py-4 whitespace-nowrap text-sm text-gray-500">{result.mergeFields?.NAME || 'N/A'}</td>
                      <td className="px-3 py-4 whitespace-nowrap text-sm text-gray-500">{result.mergeFields?.PHONE || 'N/A'}</td>
                      <td className="px-3 py-4 whitespace-nowrap text-sm text-gray-500">{result.mergeFields?.FDATE || 'N/A'}</td>
                      <td className="px-3 py-4 whitespace-nowrap text-sm text-gray-500">{result.mergeFields?.STATUS || 'N/A'}</td>
                      <td className="px-3 py-4 whitespace-nowrap">
                        <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                          result.status === 'success' ? 'bg-green-100 text-green-800' :
                          result.status === 'error' ? 'bg-red-100 text-red-800' :
                          'bg-yellow-100 text-yellow-800'
                        }`}>
                          {result.status}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            ) : (
              <p className="text-gray-500">No hay resultados de sincronización disponibles.</p>
            )}
          </div>
        </div>
        <div className="px-6 py-4">
          <h2 className="text-xl font-semibold mb-2">Registros de Sincronización</h2>
          <div className="bg-gray-100 p-4 rounded-md h-40 overflow-y-auto">
            {logs.map((log, index) => (
              <p key={index} className="text-sm text-gray-600">{log}</p>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}