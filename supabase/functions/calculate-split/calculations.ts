// Pure calculation functions that can be tested independently

export interface Expense {
  id: string;
  amount: number;
  recorded_by: string;
  user_profiles: {
    id: string;
    display_name: string;
  };
}

export interface Guest {
  user_profiles: {
    id: string;
    display_name: string;
  };
}

export interface Participant {
  id: string;
  name: string;
  totalSpent: number;
}

export interface SplitResult {
  user_name: string;
  user_id: string;
  total_spent: number;
  share_amount: number;
  balance: number;
  owes?: Array<{
    to_user: string;
    amount: number;
  }>;
  owed?: Array<{
    from_user: string;
    amount: number;
  }>;
}

// Calculate who owes whom using a simplified debt resolution algorithm
export function calculateDebts(balances: { [userId: string]: { name: string; balance: number } }) {
  const debts: { [userId: string]: Array<{ to_user: string; amount: number }> } = {};
  const credits: { [userId: string]: Array<{ from_user: string; amount: number }> } = {};
  
  // Separate creditors (positive balance) and debtors (negative balance)
  const creditors = Object.entries(balances).filter(([_, data]) => data.balance > 0);
  const debtors = Object.entries(balances).filter(([_, data]) => data.balance < 0);
  
  // Sort by amount (largest first)
  creditors.sort((a, b) => b[1].balance - a[1].balance);
  debtors.sort((a, b) => a[1].balance - b[1].balance);
  
  let creditorIndex = 0;
  let debtorIndex = 0;
  
  while (creditorIndex < creditors.length && debtorIndex < debtors.length) {
    const [creditorId, creditorData] = creditors[creditorIndex];
    const [debtorId, debtorData] = debtors[debtorIndex];
    
    const creditAmount = creditorData.balance;
    const debtAmount = Math.abs(debtorData.balance);
    const transferAmount = Math.min(creditAmount, debtAmount);
    
    // Record the debt
    if (!debts[debtorId]) debts[debtorId] = [];
    if (!credits[creditorId]) credits[creditorId] = [];
    
    debts[debtorId].push({
      to_user: creditorData.name,
      amount: Math.round(transferAmount * 100) / 100
    });
    
    credits[creditorId].push({
      from_user: debtorData.name,
      amount: Math.round(transferAmount * 100) / 100
    });
    
    // Update balances
    creditorData.balance -= transferAmount;
    debtorData.balance += transferAmount;
    
    // Move to next creditor/debtor if current one is settled
    if (Math.abs(creditorData.balance) < 0.01) creditorIndex++;
    if (Math.abs(debtorData.balance) < 0.01) debtorIndex++;
  }
  
  return { debts, credits };
}

// Build participant list from guests and expense recorders
export function buildParticipantList(expenses: Expense[], guests: Guest[]): Participant[] {
  const participantMap = new Map<string, Participant>();
  
  // Add guests
  guests?.forEach(guest => {
    participantMap.set(guest.user_profiles.id, {
      id: guest.user_profiles.id,
      name: guest.user_profiles.display_name,
      totalSpent: 0
    });
  });
  
  // Add expense recorders and calculate their spending
  expenses?.forEach(expense => {
    const userId = expense.user_profiles.id;
    const userName = expense.user_profiles.display_name;
    
    if (participantMap.has(userId)) {
      participantMap.get(userId)!.totalSpent += expense.amount;
    } else {
      participantMap.set(userId, {
        id: userId,
        name: userName,
        totalSpent: expense.amount
      });
    }
  });

  return Array.from(participantMap.values());
}

// Calculate split results for all participants
export function calculateSplit(expenses: Expense[], guests: Guest[]): {
  participants: Participant[];
  totalExpenses: number;
  sharePerPerson: number;
  results: SplitResult[];
} {
  const participants = buildParticipantList(expenses, guests);
  const totalExpenses = expenses.reduce((sum, expense) => sum + expense.amount, 0);
  
  if (participants.length === 0) {
    throw new Error('No participants found');
  }
  
  const sharePerPerson = totalExpenses / participants.length;

  // Calculate balances for each participant
  const balances: { [userId: string]: { name: string; balance: number } } = {};
  
  participants.forEach(participant => {
    const balance = participant.totalSpent - sharePerPerson;
    balances[participant.id] = {
      name: participant.name,
      balance: Math.round(balance * 100) / 100
    };
  });

  // Calculate who owes whom
  const { debts, credits } = calculateDebts(balances);

  // Build the results
  const results: SplitResult[] = participants.map(participant => {
    const balance = balances[participant.id].balance;
    
    return {
      user_name: participant.name,
      user_id: participant.id,
      total_spent: Math.round(participant.totalSpent * 100) / 100,
      share_amount: Math.round(sharePerPerson * 100) / 100,
      balance: balance,
      owes: debts[participant.id] || undefined,
      owed: credits[participant.id] || undefined
    };
  });

  return {
    participants,
    totalExpenses: Math.round(totalExpenses * 100) / 100,
    sharePerPerson: Math.round(sharePerPerson * 100) / 100,
    results
  };
} 