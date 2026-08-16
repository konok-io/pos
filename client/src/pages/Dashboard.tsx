import { useEffect, useState } from 'react';
import { reportApi } from '../services/api';

interface DashboardProps {
  onNavigate: (page: 'pos' | 'dashboard') => void;
}

export default function Dashboard({ onNavigate }: DashboardProps) {
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadDashboard();
  }, []);

  async function loadDashboard() {
    try {
      const response = await reportApi.dashboard('demo-store');
      if (response.success) {
        setData(response.data);
      }
    } catch (error) {
      console.error('Dashboard error:', error);
    } finally {
      setLoading(false);
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-900 flex items-center justify-center">
        <div className="text-xl">লোড হচ্ছে...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-900">
      {/* Header */}
      <header className="bg-slate-800 border-b border-slate-700 p-4">
        <div className="flex items-center justify-between">
          <div className="text-2xl font-bold text-pink-500">📊 ড্যাশবোর্ড</div>
          <button
            onClick={() => onNavigate('pos')}
            className="bg-pink-500 hover:bg-pink-600 px-4 py-2 rounded-lg"
          >
            💼 POS-এ যান
          </button>
        </div>
      </header>

      <main className="p-6">
        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <div className="bg-slate-800 rounded-xl p-6">
            <div className="text-slate-400 text-sm mb-1">আজকের বিক্রয়</div>
            <div className="text-3xl font-bold text-green-400">
              ৳{data?.todaySales?.total || 0}
            </div>
            <div className="text-sm text-slate-400">
              {data?.todaySales?.count || 0}টি লেনদেন
            </div>
          </div>

          <div className="bg-slate-800 rounded-xl p-6">
            <div className="text-slate-400 text-sm mb-1">আজকের খরচ</div>
            <div className="text-3xl font-bold text-red-400">
              ৳{data?.todayExpenses || 0}
            </div>
          </div>

          <div className="bg-slate-800 rounded-xl p-6">
            <div className="text-slate-400 text-sm mb-1">মোট পণ্য</div>
            <div className="text-3xl font-bold text-blue-400">
              {data?.stats?.totalProducts || 0}
            </div>
          </div>

          <div className="bg-slate-800 rounded-xl p-6">
            <div className="text-slate-400 text-sm mb-1">কম স্টক</div>
            <div className="text-3xl font-bold text-yellow-400">
              {data?.lowStockCount || 0}
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Recent Sales */}
          <div className="bg-slate-800 rounded-xl p-6">
            <h3 className="font-bold text-lg mb-4">সাম্প্রতিক বিক্রয়</h3>
            <div className="space-y-3">
              {data?.recentSales?.slice(0, 5).map((sale: any) => (
                <div key={sale.id} className="flex justify-between items-center p-3 bg-slate-700 rounded-lg">
                  <div>
                    <div className="font-medium">{sale.invoiceNo}</div>
                    <div className="text-xs text-slate-400">
                      {new Date(sale.createdAt).toLocaleDateString('bn-BD')}
                    </div>
                  </div>
                  <div className="text-green-400 font-bold">৳{sale.total}</div>
                </div>
              )) || <p className="text-slate-400">কোনো বিক্রয় নেই</p>}
            </div>
          </div>

          {/* Top Products */}
          <div className="bg-slate-800 rounded-xl p-6">
            <h3 className="font-bold text-lg mb-4">টপ পণ্য</h3>
            <div className="space-y-3">
              {data?.topProducts?.map((product: any, i: number) => (
                <div key={i} className="flex justify-between items-center p-3 bg-slate-700 rounded-lg">
                  <div className="flex items-center gap-3">
                    <span className="w-6 h-6 bg-pink-500 rounded-full flex items-center justify-center text-sm">
                      {i + 1}
                    </span>
                    <span>{product.productName}</span>
                  </div>
                  <div className="text-right">
                    <div className="font-bold">{product._sum?.quantity || 0}টি</div>
                    <div className="text-xs text-slate-400">৳{product._sum?.total || 0}</div>
                  </div>
                </div>
              )) || <p className="text-slate-400">কোনো ডেটা নেই</p>}
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
