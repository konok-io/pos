export default function Login() {
  return (
    <div className="min-h-screen bg-slate-900 flex items-center justify-center">
      <div className="bg-slate-800 p-8 rounded-xl w-full max-w-md">
        <div className="text-center mb-8">
          <div className="text-6xl mb-4">💼</div>
          <h1 className="text-2xl font-bold">POS Management</h1>
          <p className="text-slate-400">আপনার অ্যাকাউন্টে লগইন করুন</p>
        </div>

        <form onSubmit={(e) => e.preventDefault()} className="space-y-4">
          <div>
            <label className="block text-sm text-slate-400 mb-1">ইমেইল</label>
            <input
              type="email"
              defaultValue="admin@pos.test"
              className="w-full bg-slate-700 border border-slate-600 rounded-lg px-4 py-3 focus:outline-none focus:border-pink-500"
            />
          </div>

          <div>
            <label className="block text-sm text-slate-400 mb-1">পাসওয়ার্ড</label>
            <input
              type="password"
              defaultValue="admin123"
              className="w-full bg-slate-700 border border-slate-600 rounded-lg px-4 py-3 focus:outline-none focus:border-pink-500"
            />
          </div>

          <button
            type="submit"
            className="w-full py-3 bg-pink-500 hover:bg-pink-600 rounded-lg font-bold"
          >
            লগইন
          </button>
        </form>

        <p className="text-center text-slate-400 text-sm mt-6">
          ডেমো: admin@pos.test / admin123
        </p>
      </div>
    </div>
  );
}
