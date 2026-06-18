# FinanceOS Data Model

## Version

V1.3.0

## Main Object

```json
{
  "activePeriod": "2026-06",
  "periods": {
    "2026-06": {
      "baseIncome": {},
      "accounts": [],
      "transactions": [],
      "assets": [],
      "liabilities": [],
      "goals": []
    }
  }
}
```

## Entities

### Goal

```json
{
  "id": "string",
  "name": "Germany Migration",
  "category": "Emergency Fund | Germany Migration | Lumentra Fund | Vehicle | Investment | House | Custom",
  "target": 500000000,
  "current": 0,
  "monthlyContribution": 10000000,
  "priority": "High | Medium | Low",
  "status": "Active | Completed | Paused"
}
```

## Key Calculations

### Goal Progress

```text
Current Amount / Target Amount
```

### Goal ETA

```text
(Target Amount - Current Amount) / Monthly Contribution
```

### Emergency Fund Target

```text
6 × Essential Monthly Expenses
```

### Financial Health Score

```text
Debt Score + Emergency Score + Saving Score + Investment Score + Net Worth Score + Budget Discipline Score
```

### Net Worth

```text
Total Assets - Total Liabilities
```
