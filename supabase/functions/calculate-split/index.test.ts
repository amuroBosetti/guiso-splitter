import {
  assertEquals,
  assertThrows,
} from "https://deno.land/std@0.168.0/testing/asserts.ts";
import {
  buildParticipantList,
  calculateDebts,
  calculateSplit,
  type Expense,
  type Guest,
} from "./calculations.ts";

// Real test data that matches the actual data structures
const testExpenses: Expense[] = [
  {
    id: "expense-1",
    amount: 120.00,
    recorded_by: "user-1",
    user_profiles: {
      id: "user-1",
      display_name: "Alice Johnson",
    },
  },
  {
    id: "expense-2",
    amount: 80.00,
    recorded_by: "user-2",
    user_profiles: {
      id: "user-2",
      display_name: "Bob Smith",
    },
  },
  {
    id: "expense-3",
    amount: 40.00,
    recorded_by: "user-3",
    user_profiles: {
      id: "user-3",
      display_name: "Charlie Brown",
    },
  },
];

const testGuests: Guest[] = [
  {
    user_profiles: {
      id: "user-1",
      display_name: "Alice Johnson",
    },
  },
  {
    user_profiles: {
      id: "user-2",
      display_name: "Bob Smith",
    },
  },
  {
    user_profiles: {
      id: "user-3",
      display_name: "Charlie Brown",
    },
  },
  {
    user_profiles: {
      id: "user-4",
      display_name: "David Wilson",
    },
  },
];

Deno.test("calculateSplit - full integration with real data", () => {
  const result = calculateSplit(testExpenses, testGuests);

  // Basic calculations
  assertEquals(result.totalExpenses, 240.00); // 120 + 80 + 40
  assertEquals(result.sharePerPerson, 60.00); // 240 / 4
  assertEquals(result.results.length, 4);

  // Check individual results
  const alice = result.results.find((r) => r.user_name === "Alice Johnson")!;
  assertEquals(alice.total_spent, 120.00);
  assertEquals(alice.share_amount, 60.00);
  assertEquals(alice.balance, 60.00); // Overpaid by 60

  const david = result.results.find((r) => r.user_name === "David Wilson")!;
  assertEquals(david.total_spent, 0.00);
  assertEquals(david.share_amount, 60.00);
  assertEquals(david.balance, -60.00); // Owes 60

  // Check debt assignments exist
  assertEquals(alice.owed !== undefined, true);
  assertEquals(david.owes !== undefined, true);
});

Deno.test("calculateSplit - handles single participant", () => {
  const singleExpense: Expense[] = [{
    id: "expense-1",
    amount: 100.00,
    recorded_by: "user-1",
    user_profiles: {
      id: "user-1",
      display_name: "Solo User",
    },
  }];

  const singleGuest: Guest[] = [{
    user_profiles: {
      id: "user-1",
      display_name: "Solo User",
    },
  }];

  const result = calculateSplit(singleExpense, singleGuest);

  assertEquals(result.results.length, 1);
  assertEquals(result.results[0].balance, 0); // Should owe themselves nothing
});

Deno.test("calculateSplit - throws error for no participants", () => {
  assertThrows(
    () => calculateSplit([], []),
    Error,
    "No participants found",
  );
});

Deno.test("when no expense is created, then no one owes or is owed money", () => {
  const result = calculateSplit([], testGuests);

  assertEquals(result.totalExpenses, 0);
  assertEquals(result.sharePerPerson, 0);
  assertEquals(result.results.length, 4);

  // Everyone should have zero balance
  result.results.forEach((r) => {
    assertEquals(r.total_spent, 0);
    assertEquals(r.share_amount, 0);
    assertEquals(r.balance, 0);
  });
});

Deno.test("when there is only one expense, then the expense is split evenly between the participants", () => {
  const firstUserId = "user-1";
  const secondUserId = "user-2";
  const testExpenses: Expense[] = [
    {
      id: "expense-1",
      amount: 500.00,
      recorded_by: firstUserId,
      user_profiles: {
        id: firstUserId,
        display_name: "Den Grassforest",
      },
    },
  ];

  const testGuests: Guest[] = [
    {
      user_profiles: {
        id: firstUserId,
        display_name: "Den Grassforest",
      },
    },
    {
      user_profiles: {
        id: secondUserId,
        display_name: "Volmund Highchanter de Felhas",
      },
    },
  ];

  const result = calculateSplit(testExpenses, testGuests);

  assertEquals(result.totalExpenses, 500.00);
  assertEquals(result.sharePerPerson, 250.00);
  assertEquals(result.results.length, 2);

  const firstUserSplitResult = result.results.find((r) => r.user_name === "Den Grassforest")!;
  assertEquals(firstUserSplitResult.total_spent, 500.00);
  assertEquals(firstUserSplitResult.share_amount, 250.00);
  assertEquals(firstUserSplitResult.balance, 250.00);

  const secondUserSplitResult = result.results.find((r) => r.user_name === "Volmund Highchanter de Felhas")!;
  assertEquals(secondUserSplitResult.total_spent, 0);
  assertEquals(secondUserSplitResult.share_amount, 250.00);
  assertEquals(secondUserSplitResult.balance, -250.00);
});

Deno.test("when there are multiple expenses and multiple participants, then the expenses are split evenly between the participants", () => {
  const firstUserId = "user-1";
  const secondUserId = "user-2";
  const thirdUserId = "user-3";
  const testGuests: Guest[] = [
    {
      user_profiles: {
        id: firstUserId,
        display_name: "Den Grassforest",
      },
    },
    {
      user_profiles: {
        id: secondUserId,
        display_name: "Volmund Highchanter de Felhas",
      },
    },
    {
      user_profiles: {
        id: thirdUserId,
        display_name: "Alarak Greycastle",
      },
    },
  ];

  const testExpenses: Expense[] = [
    {
      id: "expense-1",
      amount: 500.00,
      recorded_by: firstUserId,
      user_profiles: {
        id: firstUserId,
        display_name: "Den Grassforest",
      },
    },
    {
      id: "expense-2",
      amount: 200.00,
      recorded_by: firstUserId,
      user_profiles: {
        id: firstUserId,
        display_name: "Den Grassforest",
      },
    },
    {
      id: "expense-3",
      amount: 300.00,
      recorded_by: secondUserId,
      user_profiles: {
        id: secondUserId,
        display_name: "Volmund Highchanter de Felhas",
      },
    },
  ];


  const result = calculateSplit(testExpenses, testGuests);

  const sharePerPerson = 333.33;
  assertEquals(result.totalExpenses, 1000.00);
  assertEquals(result.sharePerPerson, sharePerPerson);
  assertEquals(result.results.length, 3);

  const firstUserTotalSpent = 700.00;
  const firstUserSplitResult = result.results.find((r) => r.user_name === "Den Grassforest")!;
  assertEquals(firstUserSplitResult.total_spent, firstUserTotalSpent);
  assertEquals(firstUserSplitResult.share_amount, sharePerPerson);
  assertEquals(firstUserSplitResult.balance, firstUserTotalSpent - sharePerPerson);
  assertThatUserIsOwedForAmount(firstUserSplitResult, "Volmund Highchanter de Felhas", 33.33);
  assertThatUserIsOwedForAmount(firstUserSplitResult, "Alarak Greycastle", 333.33);

  const secondUserTotalSpent = 300.00;
  const secondUserSplitResult = result.results.find((r) => r.user_name === "Volmund Highchanter de Felhas")!;
  assertEquals(secondUserSplitResult.total_spent, secondUserTotalSpent);
  assertEquals(secondUserSplitResult.share_amount, sharePerPerson);
  assertEquals(secondUserSplitResult.balance, Number((secondUserTotalSpent - sharePerPerson).toFixed(2)));
  assertThatUserOwesForAmount(secondUserSplitResult, "Den Grassforest", 33.33);
  assertThatUserOwesForAmount(secondUserSplitResult, "Alarak Greycastle", undefined);

  const thirdUserTotalSpent = 0.00;
  const thirdUserSplitResult = result.results.find((r) => r.user_name === "Alarak Greycastle")!;
  assertEquals(thirdUserSplitResult.total_spent, thirdUserTotalSpent);
  assertEquals(thirdUserSplitResult.share_amount, sharePerPerson);
  assertEquals(thirdUserSplitResult.balance, thirdUserTotalSpent - sharePerPerson);
  assertThatUserOwesForAmount(thirdUserSplitResult, "Den Grassforest", 333.33);
  assertThatUserOwesForAmount(thirdUserSplitResult, "Volmund Highchanter de Felhas", undefined);

function assertThatUserOwesForAmount(userSplitResult: { owes?: { to_user: string, amount: number }[] }, to_user: string, amount: number | undefined) {
  const debt = userSplitResult.owes?.find((d) => d.to_user === to_user)!;
  assertEquals(debt?.amount, amount);
}

function assertThatUserIsOwedForAmount(userSplitResult: { owed?: { from_user: string, amount: number }[] }, fromUser: string, amount: number | undefined) {
  const credit = userSplitResult.owed?.find((d) => d.from_user === fromUser)!;
  assertEquals(credit?.amount, amount);
}
});