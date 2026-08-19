import { useState } from 'react';
import { useLanguage } from '../i18n';

interface Customer {
  id: string;
  name: string;
  phone: string;
  address: string;
  balance: number;
}

interface CustomerManagementProps {
  customers: Customer[];
  setCustomers: React.Dispatch<React.SetStateAction<Customer[]>>;
  sales: any[];
}

type ViewType = 'dashboard' | 'general' | 'regular';
type TabType = 'all' | 'due' | 'deposit';

// Design Tokens
const T = {
  teal: '#0F766E',
  tealDark: '#115E59',
  tealLight: '#F0FDFA',
  tealMid: '#CCFBF1',
  red: '#DC2626',
  redLight: '#FEF2F2',
  gray50: '#F9FAFB',
  gray100: '#F3F4F6',
  gray200: '#E5E7EB',
  gray400: '#9CA3AF',
  gray600: '#4B5563',
  gray800: '#1F2937',
  white: '#FFFFFF',
};

export default function CustomerManagement({ customers, setCustomers, sales }: CustomerManagementProps) {
  const { t, isRTL } = useLanguage();
  const [view, setView] = useState<ViewType>('dashboard');
  const [selectedCustomer, setSelectedCustomer] = useState<Customer | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [activeTab, setActiveTab] = useState<TabType>('all');

  // Filter customers for dashboard
  const filteredCustomers = customers.filter(c => {
    if (c.id.startsWith('20')) return false; // Exclude general customer from regular list
    const query = searchQuery.toLowerCase();
    return (
      c.name.toLowerCase().includes(query) ||
      (c.phone && c.phone.includes(query))
    );
  });

  // General customer
  const generalCustomer = customers.find(c => c.id.startsWith('20'));

  // Get customer sales
  const getCustomerSales = (customer: Customer) => {
    return sales.filter(s => s.customerId === customer.id);
  };

  // Calculate customer total
  const getCustomerTotal = (customer: Customer) => {
    const customerSales = getCustomerSales(customer);
    return customerSales.reduce((sum, s) => sum + s.total, 0);
  };

  // Handle delete customer
  const handleDeleteCustomer = (customer: Customer) => {
    if (window.confirm(t('confirmDelete'))) {
      setCustomers(prev => prev.filter(c => c.id !== customer.id));
    }
  };

  // Handle CSV Export
  const handleCsvExport = () => {
    const regularCustomers = customers.filter(c => !c.id.startsWith('20'));
    const csvContent = [
      ['ID', 'Name', 'Phone', 'Address', 'Balance'].join(','),
      ...regularCustomers.map(c => [c.id, c.name, c.phone || '', c.address || '', c.balance.toString()].join(','))
    ].join('\n');
    
    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `customers_${new Date().toISOString().split('T')[0]}.csv`;
    link.click();
    URL.revokeObjectURL(url);
  };

  // Handle view history
  const handleViewHistory = (customer: Customer | null) => {
    setSelectedCustomer(customer);
    setView(customer === null ? 'general' : 'regular');
  };

  // Format currency
  const fmt = (n: number) => `$${(+n || 0).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;

  // Styles
  const containerStyle: React.CSSProperties = {
    padding: '20px',
    width: '100%',
  };

  const topBarStyle: React.CSSProperties = {
    display: 'flex',
    gap: '12px',
    marginBottom: '24px',
    flexWrap: 'wrap',
  };

  const searchInputStyle: React.CSSProperties = {
    flex: 1,
    minWidth: '250px',
    padding: '10px 16px',
    paddingLeft: '40px',
    border: `1px solid ${T.gray200}`,
    borderRadius: '10px',
    fontSize: '14px',
    outline: 'none',
    background: T.white,
    position: 'relative' as const,
  };

  const searchWrapperStyle: React.CSSProperties = {
    position: 'relative' as const,
    flex: 1,
    minWidth: '250px',
  };

  const buttonTealStyle: React.CSSProperties = {
    padding: '10px 20px',
    background: T.teal,
    color: T.white,
    border: 'none',
    borderRadius: '10px',
    fontSize: '14px',
    fontWeight: 700,
    cursor: 'pointer',
    display: 'flex',
    alignItems: 'center',
    gap: '6px',
  };

  const buttonGrayStyle: React.CSSProperties = {
    padding: '10px 20px',
    background: T.gray100,
    color: T.gray800,
    border: `1px solid ${T.gray200}`,
    borderRadius: '10px',
    fontSize: '14px',
    fontWeight: 600,
    cursor: 'pointer',
    display: 'flex',
    alignItems: 'center',
    gap: '6px',
  };

  const cardGridStyle: React.CSSProperties = {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))',
    gap: '16px',
  };

  // Dashboard View
  if (view === 'dashboard') {
    return (
      <div style={containerStyle}>
        {/* Top Bar */}
        <div style={topBarStyle}>
          <div style={searchWrapperStyle}>
            <span style={{
              position: 'absolute',
              left: isRTL ? 'auto' : '12px',
              right: isRTL ? '12px' : 'auto',
              top: '50%',
              transform: 'translateY(-50%)',
              fontSize: '16px',
              color: T.gray400,
            }}>🔍</span>
            <input
              type="text"
              placeholder={t('nameOrPhonePlaceholder')}
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              style={searchInputStyle}
            />
          </div>
          <button style={buttonTealStyle}>
            <span>+</span> {t('addCustomer')}
          </button>
          <button style={buttonGrayStyle} onClick={handleCsvExport}>
            <span>📤</span> {t('csvExport')}
          </button>
        </div>

        {/* Regular Customer Cards */}
        <div style={cardGridStyle}>
          {filteredCustomers.length === 0 ? (
            <div style={{
              ...cardGridStyle,
              gridColumn: '1 / -1',
              padding: '40px',
              textAlign: 'center',
              color: T.gray400,
            }}>
              {t('noCustomersFound')}
            </div>
          ) : (
            filteredCustomers.map((customer) => (
              <div key={customer.id} style={{
                background: T.white,
                borderRadius: '14px',
                padding: '16px',
                boxShadow: '0 1px 4px rgba(0,0,0,0.08)',
                border: `1px solid ${T.gray200}`,
                display: 'flex',
                flexDirection: 'column',
                gap: '12px',
              }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                  <div style={{
                    width: '48px',
                    height: '48px',
                    borderRadius: '50%',
                    background: T.gray100,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontSize: '24px',
                  }}>
                    {customer.name.charAt(0).toUpperCase()}
                  </div>
                  <div style={{ flex: 1 }}>
                    <div style={{ fontWeight: 700, color: T.gray800 }}>{customer.name}</div>
                    <div style={{ fontSize: '13px', color: T.gray400 }}>
                      {customer.phone || t('phoneNotFound')}
                    </div>
                  </div>
                </div>
                <div style={{ fontSize: '14px', color: T.gray600 }}>
                  {t('total')} {fmt(getCustomerTotal(customer))}
                </div>
                <div style={{ display: 'flex', gap: '8px' }}>
                  <button
                    onClick={() => handleViewHistory(customer)}
                    style={{
                      flex: 1,
                      padding: '8px 12px',
                      background: T.gray50,
                      color: T.teal,
                      border: `1px solid ${T.teal}`,
                      borderRadius: '8px',
                      fontSize: '13px',
                      fontWeight: 600,
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      gap: '6px',
                    }}
                  >
                    <span>📋</span> {t('history')}
                  </button>
                  <button
                    onClick={() => handleDeleteCustomer(customer)}
                    style={{
                      padding: '8px 12px',
                      background: T.redLight,
                      color: T.red,
                      border: 'none',
                      borderRadius: '8px',
                      fontSize: '13px',
                      fontWeight: 600,
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                    }}
                  >
                    🗑️
                  </button>
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    );
  }

  // General Customer Detail View
  if (view === 'general') {
    const generalCustomerData = generalCustomer || { id: '-', name: t('generalCustomer'), phone: '-', address: '-', balance: 0 };
    const generalSales = sales.filter(s => !s.customerId || s.customerId === generalCustomerData.id);
    const generalTotal = generalSales.reduce((sum, s) => sum + s.total, 0);

    return (
      <div style={containerStyle}>
        {/* Header */}
        <div style={{
          display: 'flex',
          alignItems: 'center',
          gap: '12px',
          marginBottom: '20px',
        }}>
          <button
            onClick={() => setView('dashboard')}
            style={{
              padding: '8px 16px',
              background: T.gray100,
              color: T.gray800,
              border: 'none',
              borderRadius: '8px',
              fontSize: '14px',
              fontWeight: 600,
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
            }}
          >
            {isRTL ? '→' : '←'} {t('back')}
          </button>
          <h2 style={{ margin: 0, fontSize: '18px', fontWeight: 700, color: T.gray800 }}>
            {t('generalCustomerSystem')}
          </h2>
        </div>

        {/* Summary Card */}
        <div style={{
          background: T.white,
          borderRadius: '14px',
          padding: '20px',
          boxShadow: '0 1px 4px rgba(0,0,0,0.08)',
          border: `1px solid ${T.gray200}`,
          marginBottom: '20px',
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))',
          gap: '16px',
        }}>
          <div>
            <div style={{ fontSize: '12px', color: T.gray400, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: '4px' }}>{t('id')}</div>
            <div style={{ fontSize: '14px', color: T.gray800, fontWeight: 600 }}>{generalCustomerData.id}</div>
          </div>
          <div>
            <div style={{ fontSize: '12px', color: T.gray400, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: '4px' }}>{t('name')}</div>
            <div style={{ fontSize: '14px', color: T.gray800, fontWeight: 600 }}>{t('generalCustomer')}</div>
          </div>
          <div>
            <div style={{ fontSize: '12px', color: T.gray400, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: '4px' }}>{t('phone')}</div>
            <div style={{ fontSize: '14px', color: T.gray800, fontWeight: 600 }}>-</div>
          </div>
          <div>
            <div style={{ fontSize: '12px', color: T.gray400, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: '4px' }}>{t('address')}</div>
            <div style={{ fontSize: '14px', color: T.gray800, fontWeight: 600 }}>-</div>
          </div>
          <div>
            <div style={{ fontSize: '12px', color: T.gray400, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: '4px' }}>{t('totalPurchases')}</div>
            <div style={{ fontSize: '14px', color: T.teal, fontWeight: 700 }}>{fmt(generalTotal)}</div>
          </div>
        </div>

        {/* Tabs */}
        <div style={{
          display: 'flex',
          gap: '8px',
          marginBottom: '16px',
          flexWrap: 'wrap',
        }}>
          <button
            style={{
              padding: '10px 16px',
              background: T.teal,
              color: T.white,
              border: 'none',
              borderRadius: '8px',
              fontSize: '14px',
              fontWeight: 600,
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
            }}
          >
            <span>📦</span> {t('allPurchases')} ({generalSales.length})
          </button>
        </div>

        {/* Table */}
        <div style={{
          background: T.white,
          borderRadius: '14px',
          boxShadow: '0 1px 4px rgba(0,0,0,0.08)',
          border: `1px solid ${T.gray200}`,
          overflow: 'hidden',
          marginBottom: '16px',
        }}>
          {generalSales.length === 0 ? (
            <div style={{
              padding: '60px 20px',
              textAlign: 'center',
              color: T.gray400,
            }}>
              <div style={{ fontSize: '48px', marginBottom: '12px' }}>🛒</div>
              <div style={{ fontSize: '16px', fontWeight: 600 }}>{t('noPurchasesFound')}</div>
            </div>
          ) : (
            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
              <thead>
                <tr style={{ background: T.gray50 }}>
                  <th style={{ padding: '12px 16px', textAlign: 'left', fontSize: '12px', fontWeight: 700, color: T.gray600, textTransform: 'uppercase' }}>{t('dateTime')}</th>
                  <th style={{ padding: '12px 16px', textAlign: 'left', fontSize: '12px', fontWeight: 700, color: T.gray600, textTransform: 'uppercase' }}>{t('invoiceId')}</th>
                  <th style={{ padding: '12px 16px', textAlign: 'left', fontSize: '12px', fontWeight: 700, color: T.gray600, textTransform: 'uppercase' }}>{t('type')}</th>
                  <th style={{ padding: '12px 16px', textAlign: 'left', fontSize: '12px', fontWeight: 700, color: T.gray600, textTransform: 'uppercase' }}>{t('user')}</th>
                  <th style={{ padding: '12px 16px', textAlign: 'right', fontSize: '12px', fontWeight: 700, color: T.gray600, textTransform: 'uppercase' }}>{t('total')}</th>
                </tr>
              </thead>
              <tbody>
                {generalSales.map((sale, i) => (
                  <tr key={sale.id} style={{ borderTop: i > 0 ? `1px solid ${T.gray100}` : 'none' }}>
                    <td style={{ padding: '12px 16px', fontSize: '14px', color: T.gray800 }}>{new Date(sale.date).toLocaleString()}</td>
                    <td style={{ padding: '12px 16px', fontSize: '14px', color: T.gray800 }}>{sale.invoiceNo}</td>
                    <td style={{ padding: '12px 16px', fontSize: '14px', color: T.gray800 }}>{sale.paymentMethod || 'Sale'}</td>
                    <td style={{ padding: '12px 16px', fontSize: '14px', color: T.gray800 }}>{sale.user || 'POS'}</td>
                    <td style={{ padding: '12px 16px', fontSize: '14px', color: T.gray800, textAlign: 'right', fontWeight: 600 }}>{fmt(sale.total)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>

        {/* Footer */}
        <div style={{
          background: T.tealLight,
          borderRadius: '10px',
          padding: '12px 16px',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
        }}>
          <span style={{ fontSize: '14px', fontWeight: 600, color: T.tealDark }}>
            {t('totalBills').replace('0', generalSales.length.toString())}
          </span>
          <span style={{ fontSize: '16px', fontWeight: 700, color: T.teal }}>
            {fmt(generalTotal)}
          </span>
        </div>
      </div>
    );
  }

  // Regular Customer Detail View
  if (view === 'regular' && selectedCustomer) {
    const customerSales = getCustomerSales(selectedCustomer);
    const customerTotal = customerSales.reduce((sum, s) => sum + s.total, 0);
    const customerDue = selectedCustomer.balance || 0;

    return (
      <div style={containerStyle}>
        {/* Header */}
        <div style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          marginBottom: '20px',
          flexWrap: 'wrap',
          gap: '12px',
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <button
              onClick={() => setView('dashboard')}
              style={{
                padding: '8px 16px',
                background: T.gray100,
                color: T.gray800,
                border: 'none',
                borderRadius: '8px',
                fontSize: '14px',
                fontWeight: 600,
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: '6px',
              }}
            >
              {isRTL ? '→' : '←'} {t('back')}
            </button>
            <h2 style={{ margin: 0, fontSize: '18px', fontWeight: 700, color: T.gray800 }}>
              {selectedCustomer.name}
            </h2>
          </div>
          <button
            style={{
              padding: '8px 16px',
              background: T.white,
              color: T.teal,
              border: `1px solid ${T.teal}`,
              borderRadius: '8px',
              fontSize: '14px',
              fontWeight: 600,
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
            }}
          >
            ✏️ {t('edit')}
          </button>
        </div>

        {/* Summary Card */}
        <div style={{
          background: T.white,
          borderRadius: '14px',
          padding: '20px',
          boxShadow: '0 1px 4px rgba(0,0,0,0.08)',
          border: `1px solid ${T.gray200}`,
          marginBottom: '20px',
        }}>
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))',
            gap: '16px',
            marginBottom: '16px',
          }}>
            <div>
              <div style={{ fontSize: '12px', color: T.gray400, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: '4px' }}>{t('id')}</div>
              <div style={{ fontSize: '14px', color: T.gray800, fontWeight: 600 }}>{selectedCustomer.id}</div>
            </div>
            <div>
              <div style={{ fontSize: '12px', color: T.gray400, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: '4px' }}>{t('name')}</div>
              <div style={{ fontSize: '14px', color: T.gray800, fontWeight: 600 }}>{selectedCustomer.name}</div>
            </div>
            <div>
              <div style={{ fontSize: '12px', color: T.gray400, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: '4px' }}>{t('phone')}</div>
              <div style={{ fontSize: '14px', color: T.gray800, fontWeight: 600 }}>{selectedCustomer.phone || '-'}</div>
            </div>
            <div>
              <div style={{ fontSize: '12px', color: T.gray400, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: '4px' }}>{t('address')}</div>
              <div style={{ fontSize: '14px', color: T.gray800, fontWeight: 600 }}>{selectedCustomer.address || '-'}</div>
            </div>
            <div>
              <div style={{ fontSize: '12px', color: T.gray400, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: '4px' }}>{t('totalPurchases')}</div>
              <div style={{ fontSize: '14px', color: T.teal, fontWeight: 700 }}>{fmt(customerTotal)}</div>
            </div>
            <div>
              <div style={{ fontSize: '12px', color: T.gray400, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: '4px' }}>{t('due')}</div>
              <div style={{ fontSize: '14px', color: T.red, fontWeight: 700 }}>{fmt(customerDue)}</div>
            </div>
          </div>
          <div style={{ display: 'flex', gap: '8px', justifyContent: 'flex-end' }}>
            <button
              style={{
                padding: '8px 16px',
                background: T.redLight,
                color: T.red,
                border: 'none',
                borderRadius: '8px',
                fontSize: '14px',
                fontWeight: 600,
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: '6px',
              }}
            >
              + {t('addDue')}
            </button>
            <button
              style={{
                padding: '8px 16px',
                background: T.teal,
                color: T.white,
                border: 'none',
                borderRadius: '8px',
                fontSize: '14px',
                fontWeight: 600,
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: '6px',
              }}
            >
              + {t('addDeposit')}
            </button>
          </div>
        </div>

        {/* Tabs */}
        <div style={{
          display: 'flex',
          gap: '8px',
          marginBottom: '16px',
          flexWrap: 'wrap',
        }}>
          <button
            onClick={() => setActiveTab('all')}
            style={{
              padding: '10px 16px',
              background: activeTab === 'all' ? T.teal : T.white,
              color: activeTab === 'all' ? T.white : T.gray600,
              border: activeTab === 'all' ? 'none' : `1px solid ${T.gray200}`,
              borderRadius: '8px',
              fontSize: '14px',
              fontWeight: 600,
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
            }}
          >
            <span>📦</span> {t('allPurchases')} ({customerSales.length})
          </button>
          <button
            onClick={() => setActiveTab('due')}
            style={{
              padding: '10px 16px',
              background: activeTab === 'due' ? T.teal : T.white,
              color: activeTab === 'due' ? T.white : T.gray600,
              border: activeTab === 'due' ? 'none' : `1px solid ${T.gray200}`,
              borderRadius: '8px',
              fontSize: '14px',
              fontWeight: 600,
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
            }}
          >
            <span>📋</span> {t('dueHistory')} (0)
          </button>
          <button
            onClick={() => setActiveTab('deposit')}
            style={{
              padding: '10px 16px',
              background: activeTab === 'deposit' ? T.teal : T.white,
              color: activeTab === 'deposit' ? T.white : T.gray600,
              border: activeTab === 'deposit' ? 'none' : `1px solid ${T.gray200}`,
              borderRadius: '8px',
              fontSize: '14px',
              fontWeight: 600,
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
            }}
          >
            <span>👜</span> {t('depositHistory')} (0)
          </button>
        </div>

        {/* Table */}
        <div style={{
          background: T.white,
          borderRadius: '14px',
          boxShadow: '0 1px 4px rgba(0,0,0,0.08)',
          border: `1px solid ${T.gray200}`,
          overflow: 'hidden',
          marginBottom: '16px',
        }}>
          {customerSales.length === 0 ? (
            <div style={{
              padding: '60px 20px',
              textAlign: 'center',
              color: T.gray400,
            }}>
              <div style={{ fontSize: '48px', marginBottom: '12px' }}>🛒</div>
              <div style={{ fontSize: '16px', fontWeight: 600 }}>{t('noPurchasesFound')}</div>
            </div>
          ) : (
            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
              <thead>
                <tr style={{ background: T.gray50 }}>
                  <th style={{ padding: '12px 16px', textAlign: 'left', fontSize: '12px', fontWeight: 700, color: T.gray600, textTransform: 'uppercase' }}>{t('dateTime')}</th>
                  <th style={{ padding: '12px 16px', textAlign: 'left', fontSize: '12px', fontWeight: 700, color: T.gray600, textTransform: 'uppercase' }}>{t('invoiceId')}</th>
                  <th style={{ padding: '12px 16px', textAlign: 'left', fontSize: '12px', fontWeight: 700, color: T.gray600, textTransform: 'uppercase' }}>{t('type')}</th>
                  <th style={{ padding: '12px 16px', textAlign: 'left', fontSize: '12px', fontWeight: 700, color: T.gray600, textTransform: 'uppercase' }}>{t('user')}</th>
                  <th style={{ padding: '12px 16px', textAlign: 'right', fontSize: '12px', fontWeight: 700, color: T.gray600, textTransform: 'uppercase' }}>{t('total')}</th>
                </tr>
              </thead>
              <tbody>
                {customerSales.map((sale, i) => (
                  <tr key={sale.id} style={{ borderTop: i > 0 ? `1px solid ${T.gray100}` : 'none' }}>
                    <td style={{ padding: '12px 16px', fontSize: '14px', color: T.gray800 }}>{new Date(sale.date).toLocaleString()}</td>
                    <td style={{ padding: '12px 16px', fontSize: '14px', color: T.gray800 }}>{sale.invoiceNo}</td>
                    <td style={{ padding: '12px 16px', fontSize: '14px', color: T.gray800 }}>{sale.paymentMethod || 'Sale'}</td>
                    <td style={{ padding: '12px 16px', fontSize: '14px', color: T.gray800 }}>{sale.user || 'POS'}</td>
                    <td style={{ padding: '12px 16px', fontSize: '14px', color: T.gray800, textAlign: 'right', fontWeight: 600 }}>{fmt(sale.total)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>

        {/* Footer */}
        <div style={{
          background: T.tealLight,
          borderRadius: '10px',
          padding: '12px 16px',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
        }}>
          <span style={{ fontSize: '14px', fontWeight: 600, color: T.tealDark }}>
            {t('totalBills').replace('0', customerSales.length.toString())}
          </span>
          <span style={{ fontSize: '16px', fontWeight: 700, color: T.teal }}>
            {fmt(customerTotal)}
          </span>
        </div>
      </div>
    );
  }

  // Fallback
  return (
    <div style={containerStyle}>
      <button
        onClick={() => setView('dashboard')}
        style={{
          padding: '8px 16px',
          background: T.gray100,
          color: T.gray800,
          border: 'none',
          borderRadius: '8px',
          fontSize: '14px',
          fontWeight: 600,
          cursor: 'pointer',
        }}
      >
        {t('back')}
      </button>
    </div>
  );
}
