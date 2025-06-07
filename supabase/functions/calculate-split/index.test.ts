import { assertEquals, assertThrows } from "https://deno.land/std@0.168.0/testing/asserts.ts"
import { 
  calculateSplit, 
  calculateDebts, 
  buildParticipantList,
  type Expense, 
  type Guest 
} from './calculations.ts'

// Real test data that matches the actual data structures
const testExpenses: Expense[] = [
  {
    id: 'expense-1',
    amount: 120.00,
    recorded_by: 'user-1',
    user_profiles: {
      id: 'user-1',
      display_name: 'Alice Johnson'
    }
  },
  {
    id: 'expense-2',
    amount: 80.00,
    recorded_by: 'user-2',
    user_profiles: {
      id: 'user-2',
      display_name: 'Bob Smith'
    }
  },
  {
    id: 'expense-3',
    amount: 40.00,
    recorded_by: 'user-3',
    user_profiles: {
      id: 'user-3',
      display_name: 'Charlie Brown'
    }
  }
]

const testGuests: Guest[] = [
  {
    user_profiles: {
      id: 'user-1',
      display_name: 'Alice Johnson'
    }
  },
  {
    user_profiles: {
      id: 'user-2',
      display_name: 'Bob Smith'
    }
  },
  {
    user_profiles: {
      id: 'user-3',
      display_name: 'Charlie Brown'
    }
  },
  {
    user_profiles: {
      id: 'user-4',
      display_name: 'David Wilson'
    }
  }
]

Deno.test("calculateSplit - full integration with real data", () => {
  const result = calculateSplit(testExpenses, testGuests)
  
  // Basic calculations
  assertEquals(result.totalExpenses, 240.00) // 120 + 80 + 40
  assertEquals(result.sharePerPerson, 60.00) // 240 / 4
  assertEquals(result.results.length, 4)
  
  // Check individual results
  const alice = result.results.find(r => r.user_name === 'Alice Johnson')!
  assertEquals(alice.total_spent, 120.00)
  assertEquals(alice.share_amount, 60.00)
  assertEquals(alice.balance, 60.00) // Overpaid by 60
  
  const david = result.results.find(r => r.user_name === 'David Wilson')!
  assertEquals(david.total_spent, 0.00)
  assertEquals(david.share_amount, 60.00)
  assertEquals(david.balance, -60.00) // Owes 60
  
  // Check debt assignments exist
  assertEquals(alice.owed !== undefined, true)
  assertEquals(david.owes !== undefined, true)
})

Deno.test("calculateSplit - handles single participant", () => {
  const singleExpense: Expense[] = [{
    id: 'expense-1',
    amount: 100.00,
    recorded_by: 'user-1',
    user_profiles: {
      id: 'user-1',
      display_name: 'Solo User'
    }
  }]
  
  const singleGuest: Guest[] = [{
    user_profiles: {
      id: 'user-1',
      display_name: 'Solo User'
    }
  }]
  
  const result = calculateSplit(singleExpense, singleGuest)
  
  assertEquals(result.results.length, 1)
  assertEquals(result.results[0].balance, 0) // Should owe themselves nothing
})

Deno.test("calculateSplit - throws error for no participants", () => {
  assertThrows(
    () => calculateSplit([], []),
    Error,
    'No participants found'
  )
})

Deno.test("calculateSplit - handles zero expenses", () => {
  const result = calculateSplit([], testGuests)
  
  assertEquals(result.totalExpenses, 0)
  assertEquals(result.sharePerPerson, 0)
  assertEquals(result.results.length, 4)
  
  // Everyone should have zero balance
  result.results.forEach(r => {
    assertEquals(r.total_spent, 0)
    assertEquals(r.share_amount, 0)
    assertEquals(r.balance, 0)
  })
})

Deno.test("calculateSplit - currency rounding precision", () => {
  const unevenExpenses: Expense[] = [{
    id: 'expense-1',
    amount: 100.01, // Will result in 33.34 per person (3 people)
    recorded_by: 'user-1',
    user_profiles: {
      id: 'user-1',
      display_name: 'Alice'
    }
  }]
  
  const threeGuests: Guest[] = [
    { user_profiles: { id: 'user-1', display_name: 'Alice' } },
    { user_profiles: { id: 'user-2', display_name: 'Bob' } },
    { user_profiles: { id: 'user-3', display_name: 'Charlie' } }
  ]
  
  const result = calculateSplit(unevenExpenses, threeGuests)
  
  // Check that rounding is handled properly
  assertEquals(result.sharePerPerson, 33.34) // 100.01 / 3 = 33.336... rounded to 33.34
  
  // Check that all amounts are properly rounded to 2 decimal places
  result.results.forEach(r => {
    assertEquals(r.total_spent % 0.01, 0)
    assertEquals(r.share_amount % 0.01, 0)
  })
}) 