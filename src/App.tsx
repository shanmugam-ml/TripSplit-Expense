import { useMemo, useState } from 'react';
import { Plus, Trash2, Users, Receipt, Scale, RotateCcw, ArrowRight, Wallet, HandCoins } from 'lucide-react';
import type { Friend, Expense } from '@/lib/types';
import { computeBalances, settle, formatMoney } from '@/lib/settlement';

const uid = () => Math.random().toString(36).slice(2, 10);

function App() {
  const [friends, setFriends] = useState<Friend[]>([
    { id: uid(), name: 'Alice' },
    { id: uid(), name: 'Bob' },
    { id: uid(), name: 'Carol' },
  ]);
  const [newFriend, setNewFriend] = useState('');
  const [expenses, setExpenses] = useState<Expense[]>([]);

  // expense form
  const [title, setTitle] = useState('');
  const [amount, setAmount] = useState('');
  const [paidBy, setPaidBy] = useState('');
  const [sharedAmong, setSharedAmong] = useState<string[]>([]);

  const balances = useMemo(() => computeBalances(friends, expenses), [friends, expenses]);
  const settlements = useMemo(() => settle(balances), [balances]);
  const totalSpent = useMemo(() => expenses.reduce((s, e) => s + e.amount, 0), [expenses]);

  function addFriend() {
    const name = newFriend.trim();
    if (!name) return;
    setFriends((f) => [...f, { id: uid(), name }]);
    setNewFriend('');
  }

  function removeFriend(id: string) {
    setFriends((f) => f.filter((x) => x.id !== id));
    setExpenses((e) => e.filter((x) => x.paidById !== id && !x.sharedAmong.includes(id)));
    setSharedAmong((s) => s.filter((x) => x !== id));
  }

  function toggleShared(id: string) {
    setSharedAmong((s) => (s.includes(id) ? s.filter((x) => x !== id) : [...s, id]));
  }

  function addExpense() {
    const amt = parseFloat(amount);
    if (!title.trim() || isNaN(amt) || amt <= 0 || !paidBy || sharedAmong.length === 0) return;
    setExpenses((e) => [
      { id: uid(), title: title.trim(), amount: amt, paidById: paidBy, sharedAmong, createdAt: Date.now() },
      ...e,
    ]);
    setTitle('');
    setAmount('');
    setPaidBy('');
    setSharedAmong([]);
  }

  function removeExpense(id: string) {
    setExpenses((e) => e.filter((x) => x.id !== id));
  }

  function resetAll() {
    setFriends([{ id: uid(), name: 'Alice' }, { id: uid(), name: 'Bob' }, { id: uid(), name: 'Carol' }]);
    setExpenses([]);
    setTitle(''); setAmount(''); setPaidBy(''); setSharedAmong([]);
  }

  return (
    <div className="min-h-screen bg-slate-50 text-slate-800">
      {/* Header */}
      <header className="bg-white border-b border-slate-200 sticky top-0 z-10">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 py-4 flex items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-emerald-500 to-teal-600 flex items-center justify-center shadow-sm">
              <Wallet className="w-5 h-5 text-white" />
            </div>
            <div>
              <h1 className="text-lg sm:text-xl font-bold text-slate-900 leading-tight">Trip Split</h1>
              <p className="text-xs text-slate-500 hidden sm:block">Shared expense settler</p>
            </div>
          </div>
          <button
            onClick={resetAll}
            className="inline-flex items-center gap-1.5 text-sm font-medium text-slate-600 hover:text-rose-600 bg-slate-100 hover:bg-rose-50 px-3 py-2 rounded-lg transition-colors"
          >
            <RotateCcw className="w-4 h-4" /> Reset All
          </button>
        </div>
      </header>

      <main className="max-w-6xl mx-auto px-4 sm:px-6 py-6 grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left column: inputs */}
        <div className="lg:col-span-2 space-y-6">
          {/* Friends */}
          <section className="bg-white rounded-2xl shadow-sm border border-slate-200 p-5">
            <div className="flex items-center gap-2 mb-4">
              <Users className="w-5 h-5 text-emerald-600" />
              <h2 className="font-semibold text-slate-900">Participants</h2>
            </div>
            <div className="flex gap-2 mb-4">
              <input
                value={newFriend}
                onChange={(e) => setNewFriend(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && addFriend()}
                placeholder="Add a friend's name"
                className="flex-1 px-3 py-2 rounded-lg border border-slate-300 focus:border-emerald-500 focus:ring-2 focus:ring-emerald-100 outline-none text-sm"
              />
              <button
                onClick={addFriend}
                className="inline-flex items-center gap-1 bg-emerald-600 hover:bg-emerald-700 text-white text-sm font-medium px-4 py-2 rounded-lg transition-colors"
              >
                <Plus className="w-4 h-4" /> Add
              </button>
            </div>
            {friends.length === 0 ? (
              <p className="text-sm text-slate-400 text-center py-6">No participants yet. Add a friend to begin.</p>
            ) : (
              <div className="flex flex-wrap gap-2">
                {friends.map((f) => (
                  <span key={f.id} className="inline-flex items-center gap-2 bg-emerald-50 text-emerald-800 text-sm font-medium pl-3 pr-1.5 py-1.5 rounded-full border border-emerald-200">
                    {f.name}
                    <button onClick={() => removeFriend(f.id)} className="w-5 h-5 rounded-full hover:bg-emerald-200 flex items-center justify-center text-emerald-700">
                      <Trash2 className="w-3 h-3" />
                    </button>
                  </span>
                ))}
              </div>
            )}
          </section>

          {/* Expense form */}
          <section className="bg-white rounded-2xl shadow-sm border border-slate-200 p-5">
            <div className="flex items-center gap-2 mb-4">
              <Receipt className="w-5 h-5 text-emerald-600" />
              <h2 className="font-semibold text-slate-900">Add Expense</h2>
            </div>
            {friends.length === 0 ? (
              <p className="text-sm text-slate-400 text-center py-6">Add at least one participant to create an expense.</p>
            ) : (
              <div className="space-y-4">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-medium text-slate-500 mb-1">Title</label>
                    <input
                      value={title}
                      onChange={(e) => setTitle(e.target.value)}
                      placeholder="e.g. Hotel, Dinner"
                      className="w-full px-3 py-2 rounded-lg border border-slate-300 focus:border-emerald-500 focus:ring-2 focus:ring-emerald-100 outline-none text-sm"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-slate-500 mb-1">Amount ($)</label>
                    <input
                      type="number"
                      min="0"
                      step="0.01"
                      value={amount}
                      onChange={(e) => setAmount(e.target.value)}
                      placeholder="0.00"
                      className="w-full px-3 py-2 rounded-lg border border-slate-300 focus:border-emerald-500 focus:ring-2 focus:ring-emerald-100 outline-none text-sm"
                    />
                  </div>
                </div>
                <div>
                  <label className="block text-xs font-medium text-slate-500 mb-1">Paid By</label>
                  <select
                    value={paidBy}
                    onChange={(e) => setPaidBy(e.target.value)}
                    className="w-full px-3 py-2 rounded-lg border border-slate-300 focus:border-emerald-500 focus:ring-2 focus:ring-emerald-100 outline-none text-sm bg-white"
                  >
                    <option value="">Select who paid</option>
                    {friends.map((f) => (
                      <option key={f.id} value={f.id}>{f.name}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-medium text-slate-500 mb-2">Shared Among</label>
                  <div className="flex flex-wrap gap-2">
                    {friends.map((f) => {
                      const active = sharedAmong.includes(f.id);
                      return (
                        <button
                          key={f.id}
                          type="button"
                          onClick={() => toggleShared(f.id)}
                          className={`text-sm font-medium px-3 py-1.5 rounded-full border transition-colors ${active ? 'bg-emerald-600 text-white border-emerald-600' : 'bg-white text-slate-600 border-slate-300 hover:border-emerald-400'}`}
                        >
                          {f.name}
                        </button>
                      );
                    })}
                  </div>
                </div>
                <button
                  onClick={addExpense}
                  disabled={!title.trim() || !amount || !paidBy || sharedAmong.length === 0}
                  className="w-full inline-flex items-center justify-center gap-1.5 bg-emerald-600 hover:bg-emerald-700 disabled:bg-slate-200 disabled:text-slate-400 text-white text-sm font-semibold py-2.5 rounded-lg transition-colors"
                >
                  <Plus className="w-4 h-4" /> Add Expense
                </button>
              </div>
            )}
          </section>

          {/* Expense list */}
          <section className="bg-white rounded-2xl shadow-sm border border-slate-200 p-5">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <Receipt className="w-5 h-5 text-emerald-600" />
                <h2 className="font-semibold text-slate-900">Transactions</h2>
              </div>
              <span className="text-sm text-slate-500">{expenses.length} item{expenses.length !== 1 ? 's' : ''}</span>
            </div>
            {expenses.length === 0 ? (
              <div className="text-center py-10">
                <div className="w-12 h-12 mx-auto rounded-full bg-slate-100 flex items-center justify-center mb-3">
                  <Receipt className="w-6 h-6 text-slate-400" />
                </div>
                <p className="text-sm text-slate-400">No expenses logged yet.</p>
              </div>
            ) : (
              <ul className="divide-y divide-slate-100">
                {expenses.map((e) => {
                  const payer = friends.find((f) => f.id === e.paidById)?.name ?? 'Unknown';
                  const names = e.sharedAmong.map((id) => friends.find((f) => f.id === id)?.name).filter(Boolean).join(', ');
                  return (
                    <li key={e.id} className="py-3 flex items-center justify-between gap-3">
                      <div className="min-w-0">
                        <p className="font-medium text-slate-900 truncate">{e.title}</p>
                        <p className="text-xs text-slate-500 truncate">
                          {payer} paid · split with {names}
                        </p>
                      </div>
                      <div className="flex items-center gap-3 shrink-0">
                        <span className="font-semibold text-slate-900">{formatMoney(e.amount)}</span>
                        <button onClick={() => removeExpense(e.id)} className="text-slate-400 hover:text-rose-600 transition-colors">
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </li>
                  );
                })}
              </ul>
            )}
          </section>
        </div>

        {/* Right column: settlement */}
        <div className="space-y-6">
          {/* Summary */}
          <section className="bg-gradient-to-br from-emerald-600 to-teal-700 rounded-2xl shadow-sm p-5 text-white">
            <p className="text-emerald-100 text-sm font-medium">Total Group Spending</p>
            <p className="text-3xl font-bold mt-1">{formatMoney(totalSpent)}</p>
            <div className="mt-4 pt-4 border-t border-white/20 grid grid-cols-2 gap-3">
              <div>
                <p className="text-emerald-100 text-xs">Participants</p>
                <p className="text-lg font-semibold">{friends.length}</p>
              </div>
              <div>
                <p className="text-emerald-100 text-xs">Expenses</p>
                <p className="text-lg font-semibold">{expenses.length}</p>
              </div>
            </div>
          </section>

          {/* Balances */}
          <section className="bg-white rounded-2xl shadow-sm border border-slate-200 p-5">
            <div className="flex items-center gap-2 mb-4">
              <Scale className="w-5 h-5 text-emerald-600" />
              <h2 className="font-semibold text-slate-900">Balances</h2>
            </div>
            {balances.length === 0 ? (
              <p className="text-sm text-slate-400 text-center py-6">Add participants to see balances.</p>
            ) : (
              <ul className="space-y-2">
                {balances.map((b) => {
                  const positive = b.net > 0.005;
                  const negative = b.net < -0.005;
                  return (
                    <li key={b.friendId} className="flex items-center justify-between gap-2">
                      <span className="text-sm font-medium text-slate-700">{b.name}</span>
                      <span className={`text-sm font-semibold ${positive ? 'text-emerald-600' : negative ? 'text-rose-500' : 'text-slate-500'}`}>
                        {positive ? `gets ${formatMoney(b.net)}` : negative ? `owes ${formatMoney(-b.net)}` : 'settled'}
                      </span>
                    </li>
                  );
                })}
              </ul>
            )}
          </section>

          {/* Settlements */}
          <section className="bg-white rounded-2xl shadow-sm border border-slate-200 p-5">
            <div className="flex items-center gap-2 mb-4">
              <HandCoins className="w-5 h-5 text-emerald-600" />
              <h2 className="font-semibold text-slate-900">Who Owes Whom</h2>
            </div>
            {settlements.length === 0 ? (
              <div className="text-center py-8">
                <div className="w-12 h-12 mx-auto rounded-full bg-slate-100 flex items-center justify-center mb-3">
                  <HandCoins className="w-6 h-6 text-slate-400" />
                </div>
                <p className="text-sm text-slate-400">
                  {expenses.length === 0 ? 'Add expenses to see settlements.' : 'Everyone is settled up!'}
                </p>
              </div>
            ) : (
              <ul className="space-y-2">
                {settlements.map((s, i) => (
                  <li key={i} className="flex items-center justify-between gap-2 bg-slate-50 rounded-lg px-3 py-2.5">
                    <span className="text-sm text-slate-700">
                      <span className="font-medium text-slate-900">{s.from}</span>
                      <ArrowRight className="w-3.5 h-3.5 inline mx-1.5 text-slate-400" />
                      <span className="font-medium text-slate-900">{s.to}</span>
                    </span>
                    <span className="text-sm font-semibold text-emerald-600">{formatMoney(s.amount)}</span>
                  </li>
                ))}
              </ul>
            )}
          </section>
        </div>
      </main>

      <footer className="max-w-6xl mx-auto px-4 sm:px-6 pb-8 text-center text-xs text-slate-400">
        Trip Split · balances settle automatically as you add expenses
      </footer>
    </div>
  );
}

export default App;
