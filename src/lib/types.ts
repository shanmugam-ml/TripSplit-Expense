export interface Friend {
  id: string;
  name: string;
}

export interface Expense {
  id: string;
  title: string;
  amount: number;
  paidById: string;
  sharedAmong: string[];
  createdAt: number;
}

export interface Balance {
  friendId: string;
  name: string;
  paid: number;
  share: number;
  net: number; // positive => owed money, negative => owes
}

export interface Settlement {
  from: string;
  to: string;
  amount: number;
}
