import { useState } from 'react';
import { useLanguage, languages, Language } from '../i18n';
import { defaultTranslations } from '../i18n';

export default function TranslationSettings() {
  const { language, customTranslations, syncTranslations, saveTranslation } = useLanguage();
  const [selectedLang, setSelectedLang] = useState<Language>(language);
  const [searchQuery, setSearchQuery] = useState('');
  const [editingKey, setEditingKey] = useState<string | null>(null);
  const [editValue, setEditValue] = useState('');
  const [saving, setSaving] = useState(false);
  const [syncStatus, setSyncStatus] = useState<string>('');

  // Get all translation keys from default translations
  const allKeys = Object.keys(defaultTranslations.en);

  // Filter keys based on search
  const filteredKeys = allKeys.filter(key => {
    const defaultValue = defaultTranslations[selectedLang]?.[key] || '';
    const customValue = customTranslations[selectedLang]?.[key] || '';
    const query = searchQuery.toLowerCase();
    return (
      key.toLowerCase().includes(query) ||
      defaultValue.toLowerCase().includes(query) ||
      customValue.toLowerCase().includes(query)
    );
  });

  const handleEdit = (key: string) => {
    const currentValue = customTranslations[selectedLang]?.[key] || defaultTranslations[selectedLang]?.[key] || '';
    setEditingKey(key);
    setEditValue(currentValue);
  };

  const handleSave = async (key: string) => {
    setSaving(true);
    await saveTranslation(selectedLang, key, editValue);
    setSaving(false);
    setEditingKey(null);
  };

  const handleSync = async () => {
    setSyncStatus('syncing');
    await syncTranslations();
    setSyncStatus('Synced!');
    setTimeout(() => setSyncStatus(''), 2000);
  };

  // Get display value for a key
  const getDisplayValue = (key: string) => {
    return customTranslations[selectedLang]?.[key] || defaultTranslations[selectedLang]?.[key] || '';
  };

  // Check if a key has custom translation
  const hasCustomTranslation = (key: string) => {
    return customTranslations[selectedLang]?.[key] !== undefined;
  };

  return (
    <div style={{ padding: 20 }}>
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
        <h2 style={{ margin: 0 }}>🌐 Translation Settings</h2>
        <button
          onClick={handleSync}
          disabled={syncStatus === 'syncing'}
          style={{
            padding: '8px 16px',
            background: syncStatus ? '#22C55E' : '#0F766E',
            color: 'white',
            border: 'none',
            borderRadius: 8,
            cursor: syncStatus ? 'default' : 'pointer',
            fontWeight: 600,
          }}
        >
          {syncStatus === 'syncing' ? '⏳ Syncing...' : syncStatus || '🔄 Sync from Code'}
        </button>
      </div>

      {/* Language Tabs */}
      <div style={{ display: 'flex', gap: 8, marginBottom: 20, borderBottom: '1px solid #E5E7EB', paddingBottom: 12 }}>
        {languages.map(lang => (
          <button
            key={lang.code}
            onClick={() => setSelectedLang(lang.code)}
            style={{
              padding: '8px 16px',
              background: selectedLang === lang.code ? '#0F766E' : '#F3F4F6',
              color: selectedLang === lang.code ? 'white' : '#4B5563',
              border: 'none',
              borderRadius: 8,
              cursor: 'pointer',
              fontWeight: 600,
            }}
          >
            {lang.flag} {lang.nativeName}
          </button>
        ))}
      </div>

      {/* Search */}
      <div style={{ marginBottom: 16 }}>
        <input
          type="text"
          placeholder="Search translations..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          style={{
            width: '100%',
            padding: '10px 14px',
            border: '1px solid #E5E7EB',
            borderRadius: 8,
            fontSize: 14,
            boxSizing: 'border-box',
          }}
        />
      </div>

      {/* Translation List */}
      <div style={{ 
        background: 'white', 
        borderRadius: 12, 
        border: '1px solid #E5E7EB',
        maxHeight: 'calc(100vh - 300px)',
        overflow: 'auto',
      }}>
        <table style={{ width: '100%', borderCollapse: 'collapse' }}>
          <thead style={{ position: 'sticky', top: 0, background: '#F9FAFB' }}>
            <tr>
              <th style={{ padding: '12px 16px', textAlign: 'left', fontWeight: 600, color: '#4B5563', borderBottom: '1px solid #E5E7EB' }}>Key</th>
              <th style={{ padding: '12px 16px', textAlign: 'left', fontWeight: 600, color: '#4B5563', borderBottom: '1px solid #E5E7EB' }}>Translation</th>
              <th style={{ padding: '12px 16px', textAlign: 'left', fontWeight: 600, color: '#4B5563', borderBottom: '1px solid #E5E7EB' }}>Actions</th>
            </tr>
          </thead>
          <tbody>
            {filteredKeys.map(key => (
              <tr key={key} style={{ borderBottom: '1px solid #F3F4F6' }}>
                <td style={{ padding: '10px 16px', fontFamily: 'monospace', fontSize: 13, color: '#0F766E' }}>
                  {key}
                  {hasCustomTranslation(key) && (
                    <span style={{ 
                      marginLeft: 8, 
                      fontSize: 10, 
                      background: '#FEF3C7', 
                      color: '#D97706', 
                      padding: '2px 6px', 
                      borderRadius: 4 
                    }}>
                      Custom
                    </span>
                  )}
                </td>
                <td style={{ padding: '10px 16px', width: '60%' }}>
                  {editingKey === key ? (
                    <div style={{ display: 'flex', gap: 8 }}>
                      <input
                        type="text"
                        value={editValue}
                        onChange={(e) => setEditValue(e.target.value)}
                        style={{
                          flex: 1,
                          padding: '6px 10px',
                          border: '1px solid #0F766E',
                          borderRadius: 6,
                          fontSize: 14,
                        }}
                        autoFocus
                      />
                      <button
                        onClick={() => handleSave(key)}
                        disabled={saving}
                        style={{
                          padding: '6px 12px',
                          background: '#22C55E',
                          color: 'white',
                          border: 'none',
                          borderRadius: 6,
                          cursor: 'pointer',
                        }}
                      >
                        {saving ? '...' : 'Save'}
                      </button>
                      <button
                        onClick={() => setEditingKey(null)}
                        style={{
                          padding: '6px 12px',
                          background: '#F3F4F6',
                          color: '#4B5563',
                          border: 'none',
                          borderRadius: 6,
                          cursor: 'pointer',
                        }}
                      >
                        Cancel
                      </button>
                    </div>
                  ) : (
                    <span style={{ fontSize: 14 }}>{getDisplayValue(key)}</span>
                  )}
                </td>
                <td style={{ padding: '10px 16px' }}>
                  {editingKey !== key && (
                    <button
                      onClick={() => handleEdit(key)}
                      style={{
                        padding: '4px 10px',
                        background: '#F0FDFA',
                        color: '#0F766E',
                        border: '1px solid #0F766E',
                        borderRadius: 6,
                        cursor: 'pointer',
                        fontSize: 12,
                      }}
                    >
                      ✏️ Edit
                    </button>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>

        {filteredKeys.length === 0 && (
          <div style={{ padding: 40, textAlign: 'center', color: '#9CA3AF' }}>
            No translations found
          </div>
        )}
      </div>

      {/* Stats */}
      <div style={{ marginTop: 16, color: '#6B7280', fontSize: 13 }}>
        Showing {filteredKeys.length} of {allKeys.length} translations
      </div>
    </div>
  );
}
