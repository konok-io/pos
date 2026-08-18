import { useState, useEffect } from 'react';
import { useLanguage } from '../i18n';
import {
  initDatabase,
  connectToServer,
  disconnectFromServer,
  getConnectionStatus,
  exportAllData,
  importData,
  getDatabaseInfo,
  onSyncStatusChange
} from '../services/database';

type SyncStatus = 'syncing' | 'synced' | 'error' | 'offline';

export default function DatabaseSettings() {
  const { t } = useLanguage();
  const [serverUrl, setServerUrl] = useState('');
  const [connected, setConnected] = useState(false);
  const [connecting, setConnecting] = useState(false);
  const [syncStatus, setSyncStatus] = useState<SyncStatus>('offline');
  const [message, setMessage] = useState('');
  const [messageType, setMessageType] = useState<'success' | 'error' | 'info'>('info');
  const [dbInfo, setDbInfo] = useState<{ docCount: number; updateSeq: number | string } | null>(null);
  const [importFile, setImportFile] = useState<File | null>(null);
  const [importing, setImporting] = useState(false);
  const [importProgress, setImportProgress] = useState(0);

  useEffect(() => {
    loadStatus();
    
    // Subscribe to sync status changes
    const unsubscribe = onSyncStatusChange((status) => {
      setSyncStatus(status);
    });
    
    return () => unsubscribe();
  }, []);

  const loadStatus = async () => {
    const status = getConnectionStatus();
    setConnected(status.connected);
    if (status.url) {
      setServerUrl(status.url);
    }
    const info = await getDatabaseInfo();
    setDbInfo(info);
  };

  const handleConnect = async () => {
    if (!serverUrl.trim()) {
      setMessage(t('enterServerUrl'));
      setMessageType('error');
      return;
    }

    setConnecting(true);
    setMessage(t('connecting'));
    setMessageType('info');

    try {
      await initDatabase();
      const success = await connectToServer(serverUrl);
      
      if (success) {
        setConnected(true);
        setMessage(t('connectedSuccessfully') + ' - ' + t('syncStarted'));
        setMessageType('success');
        setSyncStatus('syncing');
      } else {
        setMessage(t('connectionFailed'));
        setMessageType('error');
        setSyncStatus('error');
      }
    } catch (error) {
      setMessage(`${t('connectionFailed')}: ${error}`);
      setMessageType('error');
      setSyncStatus('error');
    }

    setConnecting(false);
    loadStatus();
  };

  const handleDisconnect = async () => {
    disconnectFromServer();
    setConnected(false);
    setMessage(t('disconnected'));
    setMessageType('info');
    setSyncStatus('offline');
    loadStatus();
  };

  const handleExport = async () => {
    try {
      setMessage(t('exporting') || 'Exporting data...');
      setMessageType('info');
      
      const data = await exportAllData();
      const blob = new Blob([data], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `pos-backup-${new Date().toISOString().split('T')[0]}.json`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
      
      setMessage(t('exportSuccess'));
      setMessageType('success');
    } catch (error) {
      setMessage(`${t('exportFailed')}: ${error}`);
      setMessageType('error');
    }
  };

  const handleImport = async () => {
    if (!importFile) {
      setMessage(t('selectImportFile'));
      setMessageType('error');
      return;
    }

    setImporting(true);
    setImportProgress(0);
    setMessage(t('importing') || 'Importing data...');
    setMessageType('info');

    try {
      // Simulate progress
      const progressInterval = setInterval(() => {
        setImportProgress(prev => Math.min(prev + 10, 90));
      }, 100);

      const text = await importFile.text();
      const result = await importData(text);
      
      clearInterval(progressInterval);
      setImportProgress(100);
      
      if (result.success) {
        setMessage(result.message);
        setMessageType('success');
        setImportFile(null);
        loadStatus();
      } else {
        setMessage(result.message);
        setMessageType('error');
      }
    } catch (error) {
      setMessage(`${t('importFailed')}: ${error}`);
      setMessageType('error');
    }
    
    setImporting(false);
    setImportProgress(0);
  };

  const getSyncStatusDisplay = () => {
    switch (syncStatus) {
      case 'syncing':
        return { color: '#3B82F6', text: t('syncing') || 'Syncing...', icon: '🔄' };
      case 'synced':
        return { color: '#10B981', text: t('synced') || 'Synced', icon: '✅' };
      case 'error':
        return { color: '#EF4444', text: t('syncError') || 'Sync Error', icon: '❌' };
      default:
        return { color: '#6B7280', text: t('offline') || 'Offline', icon: '📴' };
    }
  };

  const syncDisplay = getSyncStatusDisplay();

  return (
    <div style={{ padding: 16, maxWidth: 600, margin: '0 auto' }}>
      {/* Header */}
      <h2 style={{ marginBottom: 24 }}>🗄️ {t('databaseSettings')}</h2>

      {/* Database Info */}
      <div className="card" style={{ marginBottom: 16 }}>
        <h3 style={{ marginBottom: 12 }}>📊 {t('databaseInfo')}</h3>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
          <div style={{ background: '#F0FDF4', padding: 12, borderRadius: 8, textAlign: 'center' }}>
            <div style={{ fontSize: 24, fontWeight: 700, color: '#166534' }}>
              {dbInfo?.docCount || 0}
            </div>
            <div style={{ fontSize: 12, color: '#6B7280' }}>{t('totalDocuments')}</div>
          </div>
          <div style={{ background: '#F0FDFA', padding: 12, borderRadius: 8, textAlign: 'center' }}>
            <div style={{ fontSize: 24, fontWeight: 700, color: '#115E59' }}>
              PouchDB
            </div>
            <div style={{ fontSize: 12, color: '#6B7280' }}>{t('localDatabase')}</div>
          </div>
        </div>
      </div>

      {/* Server Connection */}
      <div className="card" style={{ marginBottom: 16 }}>
        <h3 style={{ marginBottom: 12 }}>☁️ {t('serverConnection')}</h3>
        
        {/* Sync Status */}
        <div style={{ 
          display: 'flex', 
          alignItems: 'center', 
          gap: 8, 
          marginBottom: 16,
          padding: '10px 14px',
          background: `${syncDisplay.color}15`,
          borderRadius: 8,
          border: `1px solid ${syncDisplay.color}30`
        }}>
          <span style={{ fontSize: 18 }}>{syncDisplay.icon}</span>
          <span style={{ fontWeight: 600, color: syncDisplay.color }}>
            {syncDisplay.text}
          </span>
          {syncStatus === 'syncing' && (
            <div style={{
              marginLeft: 'auto',
              width: 16, height: 16,
              border: '2px solid #3B82F6',
              borderTopColor: 'transparent',
              borderRadius: '50%',
              animation: 'spin 1s linear infinite'
            }} />
          )}
        </div>

        <div style={{ display: 'flex', gap: 8, alignItems: 'flex-end' }}>
          <div style={{ flex: 1 }}>
            <label style={{ fontSize: 13, fontWeight: 600, color: '#374151', display: 'block', marginBottom: 6 }}>
              CouchDB URL
            </label>
            <input
              type="url"
              value={serverUrl}
              onChange={(e) => setServerUrl(e.target.value)}
              placeholder="https://your-couchdb-server.com/database"
              disabled={connected}
              style={{
                width: '100%',
                padding: '12px 14px',
                fontSize: 14,
                border: '2px solid #E5E7EB',
                borderRadius: 10,
                outline: 'none',
                boxSizing: 'border-box',
              }}
              onFocus={(e) => e.target.style.borderColor = '#115E59'}
              onBlur={(e) => e.target.style.borderColor = '#E5E7EB'}
            />
          </div>
          
          {connected ? (
            <button
              onClick={handleDisconnect}
              style={{
                padding: '12px 20px',
                background: '#EF4444',
                color: '#fff',
                border: 'none',
                borderRadius: 10,
                fontSize: 14,
                fontWeight: 600,
                cursor: 'pointer',
              }}
            >
              {t('disconnect')}
            </button>
          ) : (
            <button
              onClick={handleConnect}
              disabled={connecting}
              style={{
                padding: '12px 20px',
                background: connecting ? '#9CA3AF' : '#115E59',
                color: '#fff',
                border: 'none',
                borderRadius: 10,
                fontSize: 14,
                fontWeight: 600,
                cursor: connecting ? 'not-allowed' : 'pointer',
              }}
            >
              {connecting ? '...' : t('connect')}
            </button>
          )}
        </div>

        {message && (
          <div style={{
            marginTop: 12,
            padding: '10px 14px',
            borderRadius: 8,
            background: messageType === 'success' ? '#F0FDF4' : messageType === 'error' ? '#FEF2F2' : '#EFF6FF',
            color: messageType === 'success' ? '#166534' : messageType === 'error' ? '#DC2626' : '#1D4ED8',
            fontSize: 14,
          }}>
            {message}
          </div>
        )}
      </div>

      {/* Export / Import */}
      <div className="card" style={{ marginBottom: 16 }}>
        <h3 style={{ marginBottom: 12 }}>💾 {t('backupRestore')}</h3>
        
        {/* Export */}
        <div style={{ marginBottom: 16 }}>
          <p style={{ fontSize: 13, color: '#6B7280', marginBottom: 12 }}>
            {t('exportDescription')}
          </p>
          <button
            onClick={handleExport}
            style={{
              width: '100%',
              padding: '14px',
              background: '#115E59',
              color: '#fff',
              border: 'none',
              borderRadius: 10,
              fontSize: 15,
              fontWeight: 600,
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: 8,
            }}
          >
            📤 {t('exportData')}
          </button>
        </div>

        {/* Import */}
        <div>
          <p style={{ fontSize: 13, color: '#6B7280', marginBottom: 12 }}>
            {t('importDescription')}
          </p>
          
          {/* Progress Bar */}
          {importing && (
            <div style={{ marginBottom: 12 }}>
              <div style={{
                height: 6,
                background: '#E5E7EB',
                borderRadius: 3,
                overflow: 'hidden'
              }}>
                <div style={{
                  height: '100%',
                  width: `${importProgress}%`,
                  background: '#115E59',
                  transition: 'width 0.3s ease'
                }} />
              </div>
            </div>
          )}
          
          <div style={{ display: 'flex', gap: 8, alignItems: 'flex-end' }}>
            <div style={{ flex: 1 }}>
              <input
                type="file"
                accept=".json"
                onChange={(e) => setImportFile(e.target.files?.[0] || null)}
                style={{ display: 'none' }}
                id="import-file"
                disabled={importing}
              />
              <label
                htmlFor="import-file"
                style={{
                  display: 'block',
                  padding: '12px 14px',
                  background: importing ? '#F3F4F6' : '#F9FAFB',
                  border: `2px dashed ${importFile ? '#115E59' : '#D1D5DB'}`,
                  borderRadius: 10,
                  textAlign: 'center',
                  cursor: importing ? 'not-allowed' : 'pointer',
                  fontSize: 14,
                  color: importFile ? '#115E59' : '#6B7280',
                  fontWeight: importFile ? 600 : 400,
                }}
              >
                {importFile ? `📄 ${importFile.name}` : t('selectFile')}
              </label>
            </div>
            <button
              onClick={handleImport}
              disabled={!importFile || importing}
              style={{
                padding: '12px 20px',
                background: importFile && !importing ? '#0F3460' : '#9CA3AF',
                color: '#fff',
                border: 'none',
                borderRadius: 10,
                fontSize: 14,
                fontWeight: 600,
                cursor: importFile && !importing ? 'pointer' : 'not-allowed',
              }}
            >
              {importing ? '...' : t('importData')}
            </button>
          </div>
        </div>
      </div>

      {/* Info */}
      <div className="card" style={{ background: '#F0FDFA', border: '1px solid #99F6E4' }}>
        <h4 style={{ marginBottom: 8, color: '#115E59' }}>💡 {t('howItWorks')}</h4>
        <ul style={{ fontSize: 13, color: '#374151', margin: 0, paddingLeft: 20, lineHeight: 1.8 }}>
          <li>{t('info1')}</li>
          <li>{t('info2')}</li>
          <li>{t('info3')}</li>
          <li>{t('info4')}</li>
        </ul>
      </div>
      
      {/* Animation keyframes */}
      <style>{`
        @keyframes spin {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }
      `}</style>
    </div>
  );
}
