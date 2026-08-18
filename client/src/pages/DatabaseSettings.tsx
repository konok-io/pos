import { useState, useEffect } from 'react';
import { useLanguage } from '../i18n';
import { localDb, initDatabase } from '../services';

export default function DatabaseSettings() {
  const { t } = useLanguage();
  const [message, setMessage] = useState('');
  const [messageType, setMessageType] = useState<'success' | 'error' | 'info'>('info');
  const [docCount, setDocCount] = useState(0);
  const [importFile, setImportFile] = useState<File | null>(null);
  const [importing, setImporting] = useState(false);
  const [importProgress, setImportProgress] = useState(0);
  const [isOnline, setIsOnline] = useState(navigator.onLine);

  useEffect(() => {
    loadDbInfo();
    
    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);
    
    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);
    
    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  const loadDbInfo = async () => {
    try {
      await initDatabase();
      const products = await localDb.getProducts();
      const sales = await localDb.getSales();
      const customers = await localDb.getCustomers();
      const categories = await localDb.getCategories();
      setDocCount(products.length + sales.length + customers.length + categories.length);
    } catch (error) {
      console.error('Error loading DB info:', error);
    }
  };

  const handleExport = async () => {
    try {
      setMessage(t('exporting') || 'Exporting data...');
      setMessageType('info');
      
      const data = {
        exportedAt: new Date().toISOString(),
        version: '2.0',
        products: await localDb.getProducts(),
        sales: await localDb.getSales(),
        customers: await localDb.getCustomers(),
        categories: await localDb.getCategories(),
        currencies: await localDb.getCurrencies(),
      };
      
      const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `pos-backup-${new Date().toISOString().split('T')[0]}.json`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
      
      setMessage(t('exportSuccess') || 'Export successful!');
      setMessageType('success');
    } catch (error) {
      setMessage(`${t('exportFailed')}: ${error}`);
      setMessageType('error');
    }
  };

  const handleImport = async () => {
    if (!importFile) {
      setMessage(t('selectImportFile') || 'Please select a file');
      setMessageType('error');
      return;
    }

    setImporting(true);
    setImportProgress(0);
    setMessage(t('importing') || 'Importing data...');
    setMessageType('info');

    try {
      const progressInterval = setInterval(() => {
        setImportProgress(prev => Math.min(prev + 10, 90));
      }, 100);

      const text = await importFile.text();
      const data = JSON.parse(text);
      
      if (data.products) {
        for (const product of data.products) {
          await localDb.saveProduct(product);
        }
      }
      if (data.categories) {
        for (const category of data.categories) {
          await localDb.saveCategory(category);
        }
      }
      if (data.customers) {
        for (const customer of data.customers) {
          await localDb.saveCustomer(customer);
        }
      }
      
      clearInterval(progressInterval);
      setImportProgress(100);
      
      setMessage('Import successful!');
      setMessageType('success');
      setImportFile(null);
      loadDbInfo();
    } catch (error) {
      setMessage(`${t('importFailed')}: ${error}`);
      setMessageType('error');
    }
    
    setImporting(false);
    setImportProgress(0);
  };

  return (
    <div style={{ padding: 16, maxWidth: 600, margin: '0 auto' }}>
      <h2 style={{ marginBottom: 24 }}>🗄️ {t('databaseSettings')}</h2>

      {/* Database Info */}
      <div className="card" style={{ marginBottom: 16 }}>
        <h3 style={{ marginBottom: 12 }}>📊 {t('databaseInfo')}</h3>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
          <div style={{ background: '#F0FDF4', padding: 12, borderRadius: 8, textAlign: 'center' }}>
            <div style={{ fontSize: 24, fontWeight: 700, color: '#166534' }}>
              {docCount}
            </div>
            <div style={{ fontSize: 12, color: '#6B7280' }}>{t('totalDocuments')}</div>
          </div>
          <div style={{ background: '#F0FDFA', padding: 12, borderRadius: 8, textAlign: 'center' }}>
            <div style={{ fontSize: 24, fontWeight: 700, color: '#115E59' }}>
              IndexedDB
            </div>
            <div style={{ fontSize: 12, color: '#6B7280' }}>{t('localDatabase')}</div>
          </div>
        </div>
      </div>

      {/* Connection Status */}
      <div className="card" style={{ marginBottom: 16 }}>
        <h3 style={{ marginBottom: 12 }}>🌐 {t('serverConnection')}</h3>
        <div style={{ 
          display: 'flex', 
          alignItems: 'center', 
          gap: 8, 
          padding: '10px 14px',
          background: isOnline ? '#F0FDF4' : '#FEF2F2',
          borderRadius: 8,
        }}>
          <span style={{ fontSize: 18 }}>{isOnline ? '🟢' : '🔴'}</span>
          <span style={{ fontWeight: 600, color: isOnline ? '#166534' : '#DC2626' }}>
            {isOnline ? t('online') || 'Online' : t('offline') || 'Offline'}
          </span>
        </div>
        <p style={{ fontSize: 13, color: '#6B7280', marginTop: 12 }}>
          {isOnline 
            ? 'সার্ভারে সংযুক্ত। Sales automatically sync হবে।'
            : 'অফলাইনে কাজ করছেন। সব data আপনার ডিভাইসে সংরক্ষিত।'}
        </p>
      </div>

      {/* Export / Import */}
      <div className="card" style={{ marginBottom: 16 }}>
        <h3 style={{ marginBottom: 12 }}>💾 {t('backupRestore')}</h3>
        
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
            }}
          >
            📤 {t('exportData') || 'Export Data'}
          </button>
        </div>

        <div>
          <p style={{ fontSize: 13, color: '#6B7280', marginBottom: 12 }}>
            {t('importDescription')}
          </p>
          
          {importing && (
            <div style={{ marginBottom: 12 }}>
              <div style={{ height: 6, background: '#E5E7EB', borderRadius: 3, overflow: 'hidden' }}>
                <div style={{ height: '100%', width: `${importProgress}%`, background: '#115E59', transition: 'width 0.3s ease' }} />
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
                  background: '#F9FAFB',
                  border: `2px dashed ${importFile ? '#115E59' : '#D1D5DB'}`,
                  borderRadius: 10,
                  textAlign: 'center',
                  cursor: 'pointer',
                  fontSize: 14,
                  color: importFile ? '#115E59' : '#6B7280',
                }}
              >
                {importFile ? `📄 ${importFile.name}` : t('selectFile') || 'Select File'}
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
              {importing ? '...' : t('importData') || 'Import'}
            </button>
          </div>
        </div>
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

      {/* Info */}
      <div className="card" style={{ background: '#F0FDFA', border: '1px solid #99F6E4' }}>
        <h4 style={{ marginBottom: 8, color: '#115E59' }}>💡 {t('howItWorks')}</h4>
        <ul style={{ fontSize: 13, color: '#374151', margin: 0, paddingLeft: 20, lineHeight: 1.8 }}>
          <li>ডাটা IndexedDB-তে লোকালি সেভ থাকে</li>
          <li>অফলাইনেও সব কাজ করা যায়</li>
          <li>Online হলে automatic sync হয়</li>
          <li>Backup/Restore করা যায়</li>
        </ul>
      </div>
    </div>
  );
}
