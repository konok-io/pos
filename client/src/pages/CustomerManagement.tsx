import { useState, useRef, useEffect } from 'react';
import { useLanguage } from '../i18n';

interface Customer {
  id: string;
  name: string;
  phone: string;
  address: string;
  balance: number;
  deposit: number;
  avatar?: string;
}

interface CustomerManagementProps {
  customers: Customer[];
  setCustomers: React.Dispatch<React.SetStateAction<Customer[]>>;
  sales: any[];
  onDeleteCustomer?: (customer: Customer) => void;
}

type ViewType = 'dashboard' | 'general' | 'regular';
type TabType = 'all' | 'due' | 'deposit';

// Design Tokens
const T = {
  teal: '#0F766E',
  tealDark: '#115E59',
  tealLight: '#F0FDFA',
  tealMid: '#CCFBF1',
  tealDark2: '#00796B',
  red: '#DC2626',
  redLight: '#FFEBEE',
  redSolid: '#D32F2F',
  green: '#2E7D32',
  greenLight: '#E8F5E9',
  gray50: '#F9FAFB',
  gray100: '#F3F4F6',
  gray200: '#E5E7EB',
  gray400: '#9CA3AF',
  gray600: '#4B5563',
  gray800: '#1F2937',
  white: '#FFFFFF',
};

// Generate 13-digit ID (YYMMDD + 7 random digits)
const generateCustomerId = (): string => {
  const now = new Date();
  const yy = now.getFullYear().toString().slice(-2);
  const mm = String(now.getMonth() + 1).padStart(2, '0');
  const dd = String(now.getDate()).padStart(2, '0');
  const random7 = Math.floor(1000000 + Math.random() * 9000000).toString();
  return `${yy}${mm}${dd}${random7}`;
};

// Unified Customer Modal Component (Add/Edit)
interface CustomerModalProps {
  isOpen: boolean;
  mode: 'add' | 'edit';
  customer?: Customer | null;
  onClose: () => void;
  onSave: (customer: Customer) => void;
}

function CustomerModal({ isOpen, mode, customer, onClose, onSave }: CustomerModalProps) {
  const { t } = useLanguage();
  const [customerId, setCustomerId] = useState('');
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [address, setAddress] = useState('');
  const [avatar, setAvatar] = useState<string | null>(null);
  const [nameError, setNameError] = useState('');
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isCameraOpen, setIsCameraOpen] = useState(false);
  const streamRef = useRef<MediaStream | null>(null);

  const isEditMode = mode === 'edit';

  // Reset form when modal opens
  useEffect(() => {
    if (isOpen) {
      if (isEditMode && customer) {
        setCustomerId(customer.id);
        setName(customer.name);
        setPhone(customer.phone || '');
        setAddress(customer.address || '');
        setAvatar(customer.avatar || null);
      } else {
        setCustomerId('');
        setName('');
        setPhone('');
        setAddress('');
        setAvatar(null);
      }
      setNameError('');
      setIsCameraOpen(false);
      stopCamera();
    }
  }, [isOpen, isEditMode, customer]);

  // Cleanup camera on unmount
  useEffect(() => {
    return () => stopCamera();
  }, []);

  const stopCamera = () => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => track.stop());
      streamRef.current = null;
    }
  };

  const startCamera = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ video: true });
      streamRef.current = stream;
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
      }
      setIsCameraOpen(true);
    } catch (err) {
      alert('Camera access denied or not available');
    }
  };

  const capturePhoto = () => {
    if (videoRef.current && canvasRef.current) {
      const video = videoRef.current;
      const canvas = canvasRef.current;
      canvas.width = video.videoWidth;
      canvas.height = video.videoHeight;
      const ctx = canvas.getContext('2d');
      if (ctx) {
        ctx.drawImage(video, 0, 0);
        const imageData = canvas.toDataURL('image/jpeg', 0.8);
        setAvatar(imageData);
        stopCamera();
        setIsCameraOpen(false);
      }
    }
  };

  const handleBrowse = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (event) => {
        setAvatar(event.target?.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleRemovePhoto = () => {
    setAvatar(null);
  };

  const handleSave = () => {
    // Validate name
    if (!name.trim()) {
      setNameError(t('customerNameRequired'));
      return;
    }

    // Generate ID if empty (only in add mode)
    const finalId = isEditMode ? customerId : (customerId.trim() || generateCustomerId());

    // Create/update customer
    const savedCustomer: Customer = {
      id: finalId,
      name: name.trim(),
      phone: phone.trim(),
      address: address.trim(),
      balance: isEditMode && customer ? customer.balance : 0,
      deposit: isEditMode && customer ? customer.deposit : 0,
      avatar: avatar || undefined,
    };

    onSave(savedCustomer);
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div style={{
      position: 'fixed',
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      background: 'rgba(0,0,0,0.5)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      zIndex: 1000,
    }}>
      <div style={{
        background: T.white,
        borderRadius: '12px',
        width: '90%',
        maxWidth: '400px',
        maxHeight: '90vh',
        overflow: 'auto',
        boxShadow: '0 20px 60px rgba(0,0,0,0.2)',
      }}>
        {/* Header */}
        <div style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          padding: '12px 16px',
          borderBottom: `1px solid ${T.gray200}`,
        }}>
          <h2 style={{ margin: 0, fontSize: '16px', fontWeight: 700, color: T.gray800 }}>
            {isEditMode ? t('customerEdit') : t('newCustomer')}
          </h2>
          <button
            onClick={onClose}
            style={{
              background: 'none',
              border: 'none',
              fontSize: '22px',
              cursor: 'pointer',
              color: T.gray400,
              padding: '2px',
              lineHeight: 1,
            }}
          >
            ×
          </button>
        </div>

        {/* Body - Compact */}
        <div style={{ padding: '12px 16px' }}>
          {/* Profile Image Section - Compact */}
          <div style={{
            display: 'flex',
            alignItems: 'center',
            gap: '12px',
            marginBottom: '12px',
          }}>
            {/* Avatar Preview - Smaller */}
            <div style={{
              width: '60px',
              height: '60px',
              borderRadius: '50%',
              background: T.gray100,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              overflow: 'hidden',
              border: `2px dashed ${T.gray200}`,
              flexShrink: 0,
            }}>
              {avatar ? (
                <img src={avatar} alt="Avatar" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
              ) : (
                <span style={{ fontSize: '24px' }}>👤</span>
              )}
            </div>

            {/* Action Buttons - Horizontal */}
            <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap' }}>
              {isCameraOpen ? (
                <>
                  <button
                    onClick={capturePhoto}
                    style={{
                      padding: '6px 10px',
                      background: T.teal,
                      color: T.white,
                      border: 'none',
                      borderRadius: '6px',
                      fontSize: '12px',
                      fontWeight: 600,
                      cursor: 'pointer',
                    }}
                  >
                    📷 Capture
                  </button>
                  <button
                    onClick={() => { stopCamera(); setIsCameraOpen(false); }}
                    style={{
                      padding: '6px 10px',
                      background: T.gray100,
                      color: T.gray600,
                      border: 'none',
                      borderRadius: '6px',
                      fontSize: '12px',
                      fontWeight: 600,
                      cursor: 'pointer',
                    }}
                  >
                    ✕
                  </button>
                </>
              ) : (
                <>
                  <button
                    onClick={startCamera}
                    style={{
                      padding: '6px 10px',
                      background: T.teal,
                      color: T.white,
                      border: 'none',
                      borderRadius: '6px',
                      fontSize: '12px',
                      fontWeight: 600,
                      cursor: 'pointer',
                    }}
                  >
                    📷 {t('camera')}
                  </button>
                  <button
                    onClick={() => fileInputRef.current?.click()}
                    style={{
                      padding: '6px 10px',
                      background: T.gray100,
                      color: T.gray800,
                      border: `1px solid ${T.gray200}`,
                      borderRadius: '6px',
                      fontSize: '12px',
                      fontWeight: 600,
                      cursor: 'pointer',
                    }}
                  >
                    📁 {t('browse')}
                  </button>
                  {avatar && (
                    <button
                      onClick={handleRemovePhoto}
                      style={{
                        padding: '6px 10px',
                        background: T.redLight,
                        color: T.red,
                        border: 'none',
                        borderRadius: '6px',
                        fontSize: '12px',
                        fontWeight: 600,
                        cursor: 'pointer',
                      }}
                    >
                      ❌ {t('remove')}
                    </button>
                  )}
                </>
              )}
            </div>
          </div>

          {/* Hidden video and canvas for camera */}
          <div style={{ display: 'none' }}>
            <video ref={videoRef} autoPlay playsInline />
            <canvas ref={canvasRef} />
          </div>

          {/* Hidden file input */}
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            onChange={handleBrowse}
            style={{ display: 'none' }}
          />

          {/* Form Fields - Compact */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
            {/* ID Field */}
            <div>
              <label style={{
                display: 'block',
                fontSize: '11px',
                fontWeight: 600,
                color: T.gray600,
                marginBottom: '4px',
                textTransform: 'uppercase',
              }}>
                {t('customerIdOptional')}
              </label>
              <input
                type="text"
                value={customerId}
                onChange={(e) => setCustomerId(e.target.value)}
                disabled={isEditMode}
                placeholder={isEditMode ? '' : 'Auto-generated if empty'}
                readOnly={isEditMode}
                style={{
                  width: '100%',
                  padding: '8px 12px',
                  border: `1px solid ${T.gray200}`,
                  borderRadius: '6px',
                  fontSize: '13px',
                  outline: 'none',
                  boxSizing: 'border-box',
                  background: isEditMode ? T.gray100 : T.white,
                  color: isEditMode ? T.gray400 : T.gray800,
                  cursor: isEditMode ? 'not-allowed' : 'text',
                }}
              />
            </div>

            {/* Name Field */}
            <div>
              <label style={{
                display: 'block',
                fontSize: '11px',
                fontWeight: 600,
                color: T.gray600,
                marginBottom: '4px',
                textTransform: 'uppercase',
              }}>
                {t('customerNameLabel')}
              </label>
              <input
                type="text"
                value={name}
                onChange={(e) => { setName(e.target.value); setNameError(''); }}
                placeholder={t('enterCustomerName')}
                style={{
                  width: '100%',
                  padding: '8px 12px',
                  border: `1px solid ${nameError ? T.red : T.gray200}`,
                  borderRadius: '6px',
                  fontSize: '13px',
                  outline: 'none',
                  boxSizing: 'border-box',
                }}
              />
              {nameError && (
                <span style={{ fontSize: '11px', color: T.red, marginTop: '2px', display: 'block' }}>
                  {nameError}
                </span>
              )}
            </div>

            {/* Phone Field */}
            <div>
              <label style={{
                display: 'block',
                fontSize: '11px',
                fontWeight: 600,
                color: T.gray600,
                marginBottom: '4px',
                textTransform: 'uppercase',
              }}>
                {t('phoneNumber')}
              </label>
              <input
                type="text"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                placeholder={t('phoneNumber')}
                style={{
                  width: '100%',
                  padding: '8px 12px',
                  border: `1px solid ${T.gray200}`,
                  borderRadius: '6px',
                  fontSize: '13px',
                  outline: 'none',
                  boxSizing: 'border-box',
                }}
              />
            </div>

            {/* Address Field */}
            <div>
              <label style={{
                display: 'block',
                fontSize: '11px',
                fontWeight: 600,
                color: T.gray600,
                marginBottom: '4px',
                textTransform: 'uppercase',
              }}>
                {t('customerAddress')}
              </label>
              <input
                type="text"
                value={address}
                onChange={(e) => setAddress(e.target.value)}
                placeholder={t('customerAddress')}
                style={{
                  width: '100%',
                  padding: '8px 12px',
                  border: `1px solid ${T.gray200}`,
                  borderRadius: '6px',
                  fontSize: '13px',
                  outline: 'none',
                  boxSizing: 'border-box',
                }}
              />
            </div>
          </div>
        </div>

        {/* Footer - Compact */}
        <div style={{
          display: 'flex',
          gap: '8px',
          padding: '12px 16px',
          borderTop: `1px solid ${T.gray200}`,
        }}>
          <button
            onClick={onClose}
            style={{
              flex: 1,
              padding: '10px',
              background: T.gray100,
              color: T.gray800,
              border: 'none',
              borderRadius: '8px',
              fontSize: '13px',
              fontWeight: 600,
              cursor: 'pointer',
            }}
          >
            {t('cancel')}
          </button>
          <button
            onClick={handleSave}
            style={{
              flex: 1,
              padding: '10px',
              background: T.teal,
              color: T.white,
              border: 'none',
              borderRadius: '8px',
              fontSize: '13px',
              fontWeight: 600,
              cursor: 'pointer',
            }}
          >
            💾 {t('save')}
          </button>
        </div>
      </div>
    </div>
  );
}

export default function CustomerManagement({ customers, setCustomers, sales, onDeleteCustomer }: CustomerManagementProps) {
  const { t, isRTL } = useLanguage();
  const [view, setView] = useState<ViewType>('dashboard');
  const [isAddCustomerModalOpen, setIsAddCustomerModalOpen] = useState(false);
  const [isEditCustomerModalOpen, setIsEditCustomerModalOpen] = useState(false);
  const [editingCustomer, setEditingCustomer] = useState<Customer | null>(null);
  const [selectedCustomer, setSelectedCustomer] = useState<Customer | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [activeTab, setActiveTab] = useState<TabType>('all');
  
  // Add Due/Deposit Modal states
  const [isAddDueModalOpen, setIsAddDueModalOpen] = useState(false);
  const [isAddDepositModalOpen, setIsAddDepositModalOpen] = useState(false);
  
  // Modal form states (hooks must be at top level)
  const [depositAmount, setDepositAmount] = useState('');
  const [selectedPayment, setSelectedPayment] = useState('cash');
  const [depositComment, setDepositComment] = useState('');
  const [dueAmount, setDueAmount] = useState('');
  const [dueComment, setDueComment] = useState('');
  const modalFmt = (n: number) => `$${(+n || 0).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;

  // Add Deposit Modal - Render early to prevent issues
  if (isAddDepositModalOpen && selectedCustomer) {
    const handleAddDeposit = () => {
      const amount = parseFloat(depositAmount) || 0;
      if (amount <= 0) return;
      
      setCustomers(prev => prev.map(c => 
        c.id === selectedCustomer.id 
          ? { ...c, deposit: c.deposit + amount, balance: c.balance - amount } 
          : c
      ));
      // Update selectedCustomer to reflect changes
      setSelectedCustomer(prev => prev ? { 
        ...prev, 
        deposit: prev.deposit + amount, 
        balance: prev.balance - amount 
      } : null);
      setDepositAmount('');
      setDepositComment('');
      setSelectedPayment('cash');
      setIsAddDepositModalOpen(false);
    };

    return (
      <div style={{
        position: 'fixed',
        top: 0, left: 0, right: 0, bottom: 0,
        background: 'rgba(0,0,0,0.5)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 1000,
      }}>
        <div style={{
          background: T.white,
          borderRadius: '16px',
          width: '90%',
          maxWidth: '420px',
          maxHeight: '90vh',
          overflow: 'auto',
          boxShadow: '0 20px 60px rgba(0,0,0,0.2)',
        }}>
          {/* Header */}
          <div style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            padding: '16px 20px',
            borderBottom: `1px solid ${T.gray200}`,
          }}>
            <h2 style={{ margin: 0, fontSize: '16px', fontWeight: 700, color: T.gray800 }}>
              {selectedCustomer.name} – {t('addDeposit')}
            </h2>
            <button
              onClick={() => setIsAddDepositModalOpen(false)}
              style={{
                background: 'none',
                border: 'none',
                fontSize: '24px',
                cursor: 'pointer',
                color: T.gray400,
                padding: '4px',
                lineHeight: 1,
              }}
            >
              ×
            </button>
          </div>

          {/* Notice Banner */}
          <div style={{
            margin: '16px 20px',
            padding: '12px 16px',
            background: T.greenLight,
            borderRadius: '8px',
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
          }}>
            <span style={{ fontSize: '20px' }}>💰</span>
            <span style={{ fontSize: '14px', fontWeight: 600, color: T.green }}>{t('addDepositAmount')}</span>
          </div>

          {/* Summary Bar */}
          <div style={{
            margin: '0 20px 16px',
            padding: '12px 16px',
            background: T.gray50,
            borderRadius: '8px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '16px',
          }}>
            <div>
              <span style={{ fontSize: '12px', color: T.gray600, marginRight: '8px' }}>{t('currentDue')}: </span>
              <span style={{ fontSize: '14px', fontWeight: 700, color: T.red }}>{modalFmt(selectedCustomer.balance)}</span>
            </div>
            <span style={{ color: T.gray400 }}>|</span>
            <div>
              <span style={{ fontSize: '12px', color: T.gray600, marginRight: '8px' }}>{t('currentDeposit')}: </span>
              <span style={{ fontSize: '14px', fontWeight: 700, color: T.green }}>{modalFmt(selectedCustomer.deposit)}</span>
            </div>
          </div>

          {/* Amount Input */}
          <div style={{ padding: '0 20px 16px' }}>
            <label style={{ display: 'block', fontSize: '12px', fontWeight: 600, color: T.gray600, marginBottom: '6px', textTransform: 'uppercase' }}>
              {t('depositAmount')}
            </label>
            <input
              type="number"
              value={depositAmount}
              onChange={(e) => setDepositAmount(e.target.value)}
              placeholder="0.00"
              style={{
                width: '100%',
                padding: '12px 14px',
                border: `1px solid ${T.gray200}`,
                borderRadius: '8px',
                fontSize: '16px',
                fontWeight: 600,
                boxSizing: 'border-box',
              }}
            />
          </div>

          {/* Payment Method */}
          <div style={{ padding: '0 20px 16px' }}>
            <label style={{ display: 'block', fontSize: '12px', fontWeight: 600, color: T.gray600, marginBottom: '8px', textTransform: 'uppercase' }}>
              {t('paymentMethod')}
            </label>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '8px' }}>
              {['cash', 'card', 'bank', 'mobile'].map((method) => (
                <button
                  key={method}
                  onClick={() => setSelectedPayment(method)}
                  style={{
                    padding: '10px 8px',
                    background: selectedPayment === method ? T.greenLight : T.white,
                    color: selectedPayment === method ? T.green : T.gray800,
                    border: selectedPayment === method ? `2px solid ${T.green}` : `1px solid ${T.gray200}`,
                    borderRadius: '8px',
                    fontSize: '12px',
                    fontWeight: 600,
                    cursor: 'pointer',
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    gap: '4px',
                  }}
                >
                  <span style={{ fontSize: '18px' }}>
                    {method === 'cash' ? '💵' : method === 'card' ? '💳' : method === 'bank' ? '🏦' : '📱'}
                  </span>
                  <span>{t(method)}</span>
                </button>
              ))}
            </div>
          </div>

          {/* Comment */}
          <div style={{ padding: '0 20px 16px' }}>
            <label style={{ display: 'block', fontSize: '12px', fontWeight: 600, color: T.gray600, marginBottom: '6px', textTransform: 'uppercase' }}>
              {t('comment')}
            </label>
            <textarea
              value={depositComment}
              onChange={(e) => setDepositComment(e.target.value)}
              placeholder={t('reasonForDeposit')}
              rows={2}
              style={{
                width: '100%',
                padding: '10px 14px',
                border: `1px solid ${T.gray200}`,
                borderRadius: '8px',
                fontSize: '14px',
                resize: 'none',
                boxSizing: 'border-box',
              }}
            />
          </div>

          {/* Footer Buttons */}
          <div style={{
            display: 'flex',
            gap: '12px',
            padding: '16px 20px',
            borderTop: `1px solid ${T.gray200}`,
          }}>
            <button
              onClick={() => setIsAddDepositModalOpen(false)}
              style={{
                flex: 1,
                padding: '12px',
                background: T.gray100,
                color: T.gray800,
                border: 'none',
                borderRadius: '8px',
                fontSize: '14px',
                fontWeight: 600,
                cursor: 'pointer',
              }}
            >
              {t('cancel')}
            </button>
            <button
              onClick={handleAddDeposit}
              style={{
                flex: 1,
                padding: '12px',
                background: T.green,
                color: T.white,
                border: 'none',
                borderRadius: '8px',
                fontSize: '14px',
                fontWeight: 700,
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '6px',
              }}
            >
              ✓ {t('addDeposit')}
            </button>
          </div>
        </div>
      </div>
    );
  }

  // Add Due Modal - Render early to prevent issues
  if (isAddDueModalOpen && selectedCustomer) {
    const handleAddDue = () => {
      const amount = parseFloat(dueAmount) || 0;
      if (amount <= 0) return;
      
      setCustomers(prev => prev.map(c => 
        c.id === selectedCustomer.id 
          ? { ...c, balance: c.balance + amount } 
          : c
      ));
      // Update selectedCustomer to reflect changes
      setSelectedCustomer(prev => prev ? { ...prev, balance: prev.balance + amount } : null);
      setDueAmount('');
      setDueComment('');
      setIsAddDueModalOpen(false);
    };

    return (
      <div style={{
        position: 'fixed',
        top: 0, left: 0, right: 0, bottom: 0,
        background: 'rgba(0,0,0,0.5)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 1000,
      }}>
        <div style={{
          background: T.white,
          borderRadius: '16px',
          width: '90%',
          maxWidth: '420px',
          maxHeight: '90vh',
          overflow: 'auto',
          boxShadow: '0 20px 60px rgba(0,0,0,0.2)',
        }}>
          {/* Header */}
          <div style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            padding: '16px 20px',
            borderBottom: `1px solid ${T.gray200}`,
          }}>
            <h2 style={{ margin: 0, fontSize: '16px', fontWeight: 700, color: T.gray800 }}>
              {selectedCustomer.name} – {t('addDue')}
            </h2>
            <button
              onClick={() => setIsAddDueModalOpen(false)}
              style={{
                background: 'none',
                border: 'none',
                fontSize: '24px',
                cursor: 'pointer',
                color: T.gray400,
                padding: '4px',
                lineHeight: 1,
              }}
            >
              ×
            </button>
          </div>

          {/* Notice Banner */}
          <div style={{
            margin: '16px 20px',
            padding: '12px 16px',
            background: T.redLight,
            borderRadius: '8px',
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
          }}>
            <span style={{ fontSize: '20px' }}>📋</span>
            <span style={{ fontSize: '14px', fontWeight: 600, color: T.redSolid }}>{t('addDueAmount')}</span>
          </div>

          {/* Summary Bar */}
          <div style={{
            margin: '0 20px 16px',
            padding: '12px 16px',
            background: T.gray50,
            borderRadius: '8px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
          }}>
            <span style={{ fontSize: '12px', color: T.gray600, marginRight: '8px' }}>{t('currentDue')}: </span>
            <span style={{ fontSize: '14px', fontWeight: 700, color: T.redSolid }}>{modalFmt(selectedCustomer.balance)}</span>
          </div>

          {/* Amount Input */}
          <div style={{ padding: '0 20px 16px' }}>
            <label style={{ display: 'block', fontSize: '12px', fontWeight: 600, color: T.gray600, marginBottom: '6px', textTransform: 'uppercase' }}>
              {t('dueAmount')}
            </label>
            <input
              type="number"
              value={dueAmount}
              onChange={(e) => setDueAmount(e.target.value)}
              placeholder="0.00"
              style={{
                width: '100%',
                padding: '12px 14px',
                border: `1px solid ${T.gray200}`,
                borderRadius: '8px',
                fontSize: '16px',
                fontWeight: 600,
                boxSizing: 'border-box',
              }}
            />
          </div>

          {/* Comment */}
          <div style={{ padding: '0 20px 16px' }}>
            <label style={{ display: 'block', fontSize: '12px', fontWeight: 600, color: T.gray600, marginBottom: '6px', textTransform: 'uppercase' }}>
              {t('comment')}
            </label>
            <textarea
              value={dueComment}
              onChange={(e) => setDueComment(e.target.value)}
              placeholder={t('reasonForDue')}
              rows={2}
              style={{
                width: '100%',
                padding: '10px 14px',
                border: `1px solid ${T.gray200}`,
                borderRadius: '8px',
                fontSize: '14px',
                resize: 'none',
                boxSizing: 'border-box',
              }}
            />
          </div>

          {/* Footer Buttons */}
          <div style={{
            display: 'flex',
            gap: '12px',
            padding: '16px 20px',
            borderTop: `1px solid ${T.gray200}`,
          }}>
            <button
              onClick={() => setIsAddDueModalOpen(false)}
              style={{
                flex: 1,
                padding: '12px',
                background: T.gray100,
                color: T.gray800,
                border: 'none',
                borderRadius: '8px',
                fontSize: '14px',
                fontWeight: 600,
                cursor: 'pointer',
              }}
            >
              {t('cancel')}
            </button>
            <button
              onClick={handleAddDue}
              style={{
                flex: 1,
                padding: '12px',
                background: T.redSolid,
                color: T.white,
                border: 'none',
                borderRadius: '8px',
                fontSize: '14px',
                fontWeight: 700,
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '6px',
              }}
            >
              ✓ {t('addDue')}
            </button>
          </div>
        </div>
      </div>
    );
  }

  // Handle add customer
  const handleAddCustomer = (customer: Customer) => {
    setCustomers(prev => [...prev, customer]);
  };

  // Handle edit customer
  const handleEditCustomer = (customer: Customer) => {
    setCustomers(prev => prev.map(c => c.id === customer.id ? customer : c));
    // Update selectedCustomer to reflect changes
    setSelectedCustomer(prev => prev && prev.id === customer.id ? customer : prev);
  };

  // Open edit modal
  const openEditModal = (customer: Customer) => {
    setEditingCustomer(customer);
    setIsEditCustomerModalOpen(true);
  };

  // Handle delete customer (with IndexedDB cleanup)
  const handleDeleteCustomer = (customer: Customer) => {
    if (window.confirm(t('confirmDelete'))) {
      setCustomers(prev => prev.filter(c => c.id !== customer.id));
      if (onDeleteCustomer) {
        onDeleteCustomer(customer);
      }
    }
  };

  // Check if customer is General Customer by name
  const isGeneralCustomer = (c: Customer) => 
    c.name.toLowerCase() === 'general customer';

  // Filter customers for dashboard
  const filteredCustomers = customers.filter(c => {
    if (isGeneralCustomer(c)) return false; // Exclude general customer
    const query = searchQuery.toLowerCase();
    return (
      c.name.toLowerCase().includes(query) ||
      (c.phone && c.phone.includes(query))
    );
  });

  // General customer
  const generalCustomer = customers.find(c => isGeneralCustomer(c));

  // Get customer sales
  const getCustomerSales = (customer: Customer) => {
    return sales.filter(s => s.customerId === customer.id);
  };

  // Calculate customer total
  const getCustomerTotal = (customer: Customer) => {
    const customerSales = getCustomerSales(customer);
    return customerSales.reduce((sum, s) => sum + s.total, 0);
  };

  // Handle CSV Export
  const handleCsvExport = () => {
    const regularCustomers = customers.filter(c => !isGeneralCustomer(c));
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
          <button style={buttonTealStyle} onClick={() => setIsAddCustomerModalOpen(true)}>
            <span>+</span> {t('addCustomer')}
          </button>
          <button style={buttonGrayStyle} onClick={handleCsvExport}>
            <span>📤</span> {t('csvExport')}
          </button>
        </div>

        {/* Customer Cards Grid */}
        <div style={{ ...cardGridStyle, marginTop: '16px' }}>
          {/* General Customer Card - First */}
          {generalCustomer && (
            <div style={{
              background: T.white,
              borderRadius: '14px',
              padding: '16px',
              boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
              border: `2px solid ${T.tealDark}`,
              display: 'flex',
              flexDirection: 'column',
              gap: '12px',
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                <div style={{
                  width: '52px',
                  height: '52px',
                  borderRadius: '50%',
                  background: T.tealDark,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontSize: '22px',
                  color: T.white,
                  fontWeight: 700,
                }}>
                  👤
                </div>
                <div style={{ flex: 1 }}>
                  <div style={{ fontWeight: 700, color: T.tealDark, fontSize: '15px' }}>{t('generalCustomer')}</div>
                  <div style={{ fontSize: '12px', color: T.gray600 }}>{t('generalCustomerDefault')}</div>
                </div>
                <div style={{ textAlign: 'right' }}>
                  <div style={{ fontSize: '10px', fontWeight: 600, color: T.gray400, textTransform: 'uppercase' }}>{t('total')}</div>
                  <div style={{ fontSize: '14px', fontWeight: 700, color: T.tealDark }}>{fmt(generalCustomer.balance || 0)}</div>
                </div>
              </div>
              <div style={{ display: 'flex', gap: '8px' }}>
                <button onClick={() => handleViewHistory(generalCustomer)} style={{
                  flex: 1, padding: '12px', background: T.teal, color: T.white, border: 'none',
                  borderRadius: '10px', fontSize: '14px', fontWeight: 700, cursor: 'pointer',
                  display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px',
                }}>
                  <span>📋</span> {t('viewHistory')}
                </button>
                <div style={{ padding: '12px 16px', background: T.gray100, color: T.gray400, borderRadius: '10px', fontSize: '14px', cursor: 'not-allowed', display: 'flex', alignItems: 'center', justifyContent: 'center', opacity: 0.5 }}>
                  🗑️
                </div>
              </div>
            </div>
          )}
          
          {/* Regular Customers */}
          {filteredCustomers.length === 0 && !generalCustomer ? (
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
            filteredCustomers.map((customer) => {
              const customerDue = customer.balance < 0 ? Math.abs(customer.balance) : 0;
              return (
                <div key={customer.id} style={{
                  background: T.white,
                  borderRadius: '14px',
                  padding: '16px',
                  boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
                  border: `1px solid ${T.gray200}`,
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '12px',
                }}>
                  {/* Header Row: Avatar + Info + Total */}
                  <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                    <div style={{
                      width: '52px',
                      height: '52px',
                      borderRadius: '50%',
                      background: T.teal,
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      fontSize: '22px',
                      color: T.white,
                      fontWeight: 700,
                      overflow: 'hidden',
                    }}>
                      {customer.avatar ? (
                        <img 
                          src={customer.avatar} 
                          alt={customer.name} 
                          style={{ width: '100%', height: '100%', objectFit: 'cover' }} 
                        />
                      ) : (
                        customer.name.charAt(0).toUpperCase()
                      )}
                    </div>
                    <div style={{ flex: 1 }}>
                      <div style={{ fontWeight: 700, color: T.gray800, fontSize: '15px' }}>{customer.name}</div>
                      <div style={{ fontSize: '12px', color: T.gray400 }}>
                        {customer.phone || t('phoneNotFound')}
                      </div>
                    </div>
                    <div style={{ textAlign: 'right' }}>
                      <div style={{ fontSize: '10px', fontWeight: 600, color: T.gray400, textTransform: 'uppercase' }}>{t('total')}</div>
                      <div style={{ fontSize: '14px', fontWeight: 700, color: T.teal }}>{fmt(getCustomerTotal(customer))}</div>
                    </div>
                  </div>

                  {/* Action Buttons */}
                  <div style={{ display: 'flex', gap: '8px' }}>
                    {/* Due Alert / History Button */}
                    <button
                      onClick={() => handleViewHistory(customer)}
                      style={{
                        flex: 1,
                        padding: '10px 12px',
                        background: (customerDue > 0 && !(customer.name.toLowerCase().includes('general') && customer.name.toLowerCase().includes('customer'))) ? '#D32F2F' : T.gray50,
                        color: (customerDue > 0 && !(customer.name.toLowerCase().includes('general') && customer.name.toLowerCase().includes('customer'))) ? T.white : T.teal,
                        border: (customerDue > 0 && !(customer.name.toLowerCase().includes('general') && customer.name.toLowerCase().includes('customer'))) ? 'none' : `1px solid ${T.teal}`,
                        borderRadius: '8px',
                        fontSize: '13px',
                        fontWeight: 700,
                        cursor: 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        gap: '6px',
                      }}
                    >
                      {customerDue > 0 && !(customer.name.toLowerCase().includes('general') && customer.name.toLowerCase().includes('customer')) ? (
                        <>
                          <span>⚠️</span> Due: {fmt(customerDue)}
                        </>
                      ) : (
                        <>
                          <span>📋</span> {(customer.name.toLowerCase().includes('general') && customer.name.toLowerCase().includes('customer')) ? t('viewHistory') : t('history')}
                        </>
                      )}
                    </button>
                    {/* Delete Button */}
                    <button
                      onClick={() => {
                        const nameLower = customer.name.toLowerCase();
                        const isGeneral = nameLower.includes('general') && nameLower.includes('customer');
                        if (isGeneral || customer.id.startsWith('20')) return;
                        handleDeleteCustomer(customer);
                      }}
                      disabled={(customer.name.toLowerCase().includes('general') && customer.name.toLowerCase().includes('customer')) || customer.id.startsWith('20')}
                      style={{
                        padding: '10px 14px',
                        background: ((customer.name.toLowerCase().includes('general') && customer.name.toLowerCase().includes('customer')) || customer.id.startsWith('20')) ? T.gray100 : '#EF9A9A',
                        color: ((customer.name.toLowerCase().includes('general') && customer.name.toLowerCase().includes('customer')) || customer.id.startsWith('20')) ? T.gray400 : '#B71C1C',
                        border: 'none',
                        borderRadius: '8px',
                        fontSize: '14px',
                        cursor: ((customer.name.toLowerCase().includes('general') && customer.name.toLowerCase().includes('customer')) || customer.id.startsWith('20')) ? 'not-allowed' : 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        opacity: ((customer.name.toLowerCase().includes('general') && customer.name.toLowerCase().includes('customer')) || customer.id.startsWith('20')) ? 0.5 : 1,
                      }}
                    >
                      🗑️
                    </button>
                  </div>
                </div>
              );
            })
          )}
        </div>

        {/* Add Customer Modal */}
        <CustomerModal
          isOpen={isAddCustomerModalOpen}
          mode="add"
          onClose={() => setIsAddCustomerModalOpen(false)}
          onSave={handleAddCustomer}
        />

        {/* Edit Customer Modal */}
        <CustomerModal
          isOpen={isEditCustomerModalOpen}
          mode="edit"
          customer={editingCustomer}
          onClose={() => { setIsEditCustomerModalOpen(false); setEditingCustomer(null); }}
          onSave={handleEditCustomer}
        />
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
          display: 'flex',
          gap: '20px',
          alignItems: 'flex-start',
        }}>
          {/* Avatar on the left */}
          <div style={{
            width: '80px',
            height: '80px',
            borderRadius: '50%',
            background: T.tealDark,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontSize: '36px',
            flexShrink: 0,
          }}>
            👤
          </div>

          {/* Info Grid */}
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))',
            gap: '16px',
            flex: 1,
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
    const customerDue = selectedCustomer.balance > 0 ? selectedCustomer.balance : 0;
    const customerDeposit = selectedCustomer.deposit || 0;

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
            onClick={() => openEditModal(selectedCustomer)}
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

        {/* Summary Card - Single Line Layout */}
        <div style={{
          background: T.white,
          borderRadius: '14px',
          padding: '14px 16px',
          boxShadow: '0 1px 4px rgba(0,0,0,0.08)',
          border: `1px solid ${T.gray200}`,
          marginBottom: '20px',
          display: 'flex',
          alignItems: 'center',
          gap: '14px',
        }}>
          {/* Avatar on the left */}
          <div style={{
            width: '55px',
            height: '55px',
            borderRadius: '50%',
            background: T.teal,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontSize: '22px',
            color: T.white,
            fontWeight: 700,
            flexShrink: 0,
            overflow: 'hidden',
          }}>
            {selectedCustomer.avatar ? (
              <img 
                src={selectedCustomer.avatar} 
                alt={selectedCustomer.name} 
                style={{ width: '100%', height: '100%', objectFit: 'cover' }} 
              />
            ) : (
              selectedCustomer.name.charAt(0).toUpperCase()
            )}
          </div>

          {/* All Info in Single Line */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '20px', flex: 1, overflow: 'hidden' }}>
            {/* ID */}
            <div style={{ flexShrink: 0 }}>
              <div style={{ fontSize: '10px', color: T.gray400, fontWeight: 600 }}>{t('id')}</div>
              <div style={{ fontSize: '14px', color: T.gray800, fontWeight: 600 }}>{selectedCustomer.id}</div>
            </div>
            
            {/* Name */}
            <div style={{ flexShrink: 0 }}>
              <div style={{ fontSize: '10px', color: T.gray400, fontWeight: 600 }}>{t('name')}</div>
              <div style={{ fontSize: '14px', color: T.gray800, fontWeight: 600 }}>{selectedCustomer.name}</div>
            </div>
            
            {/* Phone */}
            <div style={{ flexShrink: 0 }}>
              <div style={{ fontSize: '10px', color: T.gray400, fontWeight: 600 }}>{t('phone')}</div>
              <div style={{ fontSize: '14px', color: T.gray800, fontWeight: 600 }}>{selectedCustomer.phone || '-'}</div>
            </div>
            
            {/* Address */}
            <div style={{ flexShrink: 0, maxWidth: '120px' }}>
              <div style={{ fontSize: '10px', color: T.gray400, fontWeight: 600 }}>{t('address')}</div>
              <div style={{ fontSize: '14px', color: T.gray800, fontWeight: 600, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{selectedCustomer.address || '-'}</div>
            </div>
            
            {/* Divider */}
            <div style={{ width: '1px', height: '35px', background: T.gray200, flexShrink: 0 }} />
            
            {/* Total Purchases - BIG */}
            <div style={{ flexShrink: 0 }}>
              <div style={{ fontSize: '10px', color: T.gray400, fontWeight: 600 }}>{t('totalPurchases')}</div>
              <div style={{ fontSize: '22px', color: T.teal, fontWeight: 700 }}>{fmt(customerTotal)}</div>
            </div>
            
            {/* Due - BIG */}
            <div style={{ flexShrink: 0 }}>
              <div style={{ fontSize: '10px', color: T.gray400, fontWeight: 600 }}>{t('due')}</div>
              <div style={{ fontSize: '22px', color: T.red, fontWeight: 700 }}>{fmt(customerDue)}</div>
            </div>
            
            {/* Deposit - BIG */}
            <div style={{ flexShrink: 0 }}>
              <div style={{ fontSize: '10px', color: T.gray400, fontWeight: 600 }}>{t('deposit')}</div>
              <div style={{ fontSize: '22px', color: T.green, fontWeight: 700 }}>{fmt(customerDeposit)}</div>
            </div>
          </div>

          {/* Buttons on the right */}
          <div style={{ display: 'flex', gap: '8px', flexShrink: 0 }}>
            <button
              onClick={() => setIsAddDueModalOpen(true)}
              style={{
                padding: '10px 16px',
                background: T.redSolid,
                color: T.white,
                border: 'none',
                borderRadius: '8px',
                fontSize: '13px',
                fontWeight: 700,
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: '6px',
              }}
            >
              📋 {t('addDue')}
            </button>
            <button
              onClick={() => setIsAddDepositModalOpen(true)}
              style={{
                padding: '10px 16px',
                background: T.tealDark2,
                color: T.white,
                border: 'none',
                borderRadius: '8px',
                fontSize: '13px',
                fontWeight: 700,
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: '6px',
              }}
            >
              💰 {t('addDeposit')}
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

        {/* Edit Customer Modal - accessible from regular customer view */}
        <CustomerModal
          isOpen={isEditCustomerModalOpen}
          mode="edit"
          customer={editingCustomer}
          onClose={() => { setIsEditCustomerModalOpen(false); setEditingCustomer(null); }}
          onSave={handleEditCustomer}
        />
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
