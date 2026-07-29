import type { Friend, Expense, Balance, Settlement } from './types';

export function computeBalances(friends: Friend[], expenses: Expense[]): Balance[] {
  const paid = new Map<string, number>();
  const share = new Map<string, number>();

  for (const f of friends) {
    paid.set(f.id, 0);
    share.set(f.id, 0);
  }

  for (const e of expenses) {
    const splitCount = e.sharedAmong.length || 1;
    const perPerson = e.amount / splitCount;
    paid.set(e.paidById, (paid.get(e.paidById) ?? 0) + e.amount);
    for (const id of e.sharedAmong) {
      share.set(id, (share.get(id) ?? 0) + perPerson);
    }
  }

  return friends.map((f) => {
    const p = paid.get(f.id) ?? 0;
    const s = share.get(f.id) ?? 0;
    return { friendId: f.id, name: f.name, paid: p, share: s, net: p - s };
  });
}

// Greedy minimization of transactions from net balances.
export function settle(balances: Balance[]): Settlement[] {
  const creditors = balances
    .filter((b) => b.net > 0.005)
    .map((b) => ({ id: b.friendId, name: b.name, amount: b.net }))
    .sort((a, b) => b.amount - a.amount);
  const debtors = balances
    .filter((b) => b.net < -0.005)
    .map((b) => ({ id: b.friendId, name: b.name, amount: -b.net }))
    .sort((a, b) => b.amount - a.amount);

  const result: Settlement[] = [];
  let i = 0;
  let j = 0;
  while (i < debtors.length && j < creditors.length) {
    const pay = Math.min(debtors[i].amount, creditors[j].amount);
    result.push({
      from: debtors[i].name,
      to: creditors[j].name,
      amount: Math.round(pay * 100) / 100,
    });
    debtors[i].amount -= pay;
    creditors[j].amount -= pay;
    if (debtors[i].amount < 0.005) i++;
    if (creditors[j].amount < 0.005) j++;
  }
  return result;
}

export function formatMoney(n: number): string {
  return n.toLocaleString('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
}
