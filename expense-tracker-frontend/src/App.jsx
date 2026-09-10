import { useEffect, useMemo, useState } from "react";

import Login from "./login";
import Register from "./Register";

const API_URL = "https://ai-expense-tracker-svv8.onrender.com/api/expenses";
const AI_ANALYSIS_URL =
  "https://ai-expense-tracker-svv8.onrender.com/api/expenses/ai-analysis";

const AI_CATEGORIZE_URL =
  "https://ai-expense-tracker-svv8.onrender.com/api/expenses/categorize";

const CATEGORY_OPTIONS = [
  "Food",
  "Transport",
  "Shopping",
  "Bills",
  "Entertainment",
  "Other",
];

const categoryIcons = {
  Food: "🍜",
  Transport: "🚗",
  Shopping: "🛍️",
  Bills: "💡",
  Entertainment: "🎮",
  Other: "✨",
};

function parseExpenseDate(dateValue) {
  if (!dateValue) return null;

  const parts = String(dateValue).split("-");

  if (parts.length === 3) {
    const year = Number(parts[0]);
    const month = Number(parts[1]);
    const day = Number(parts[2]);

    return new Date(year, month - 1, day);
  }

  const date = new Date(dateValue);

  return Number.isNaN(date.getTime()) ? null : date;
}

function App() {
  // ==============================
  // AUTHENTICATION
  // ==============================

  const [isLoggedIn, setIsLoggedIn] = useState(
    !!localStorage.getItem("token")
  );

  const [showRegister, setShowRegister] = useState(false);

  const handleLogin = () => {
    setIsLoggedIn(true);
    setShowRegister(false);
  };

  const handleLogout = () => {
  localStorage.removeItem("token");

  setIsLoggedIn(false);
  setExpenses([]);

  // Clear user-specific AI data
  setAiAnalysis("");
  setAiError("");
  setMessage("");
  setError("");
};

  // ==============================
  // FORM STATE
  // ==============================

  const [description, setDescription] = useState("");
  const [amount, setAmount] = useState("");
  const [category, setCategory] = useState("Food");
  const [expenseDate, setExpenseDate] = useState("");

  // ==============================
  // EXPENSE STATE
  // ==============================

  const [expenses, setExpenses] = useState([]);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  // ==============================
  // DELETE STATE
  // ==============================

  const [deleteId, setDeleteId] = useState(null);
  const [deleteLoading, setDeleteLoading] = useState(false);

  // ==============================
  // EDIT / UPDATE STATE
  // ==============================

  const [editingId, setEditingId] = useState(null);
  const [editLoading, setEditLoading] = useState(false);

  // ==============================
  // SEARCH / FILTER / SORT
  // ==============================

  const [searchTerm, setSearchTerm] = useState("");
  const [filterCategory, setFilterCategory] = useState("All");
  const [filterMonth, setFilterMonth] = useState("");
  const [sortBy, setSortBy] = useState("date-desc");

  // ==============================
  // AI STATE
  // ==============================

  const [aiAnalysis, setAiAnalysis] = useState("");
  const [aiLoading, setAiLoading] = useState(false);
  const [aiError, setAiError] = useState("");

  // ==============================
  // SAVINGS STATE
  // ==============================

  const [savingPercent, setSavingPercent] = useState(15);

  // ==============================
  // FETCH EXPENSES
  // ==============================

  const fetchExpenses = async () => {
    try {
      setError("");

      const token = localStorage.getItem("token");

      const response = await fetch(API_URL, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (!response.ok) {
        if (response.status === 401 || response.status === 403) {
          localStorage.removeItem("token");
          setIsLoggedIn(false);
          throw new Error("Session expired. Please login again.");
        }

        throw new Error("Failed to load expenses");
      }

      const data = await response.json();

      setExpenses(Array.isArray(data) ? data : []);
    } catch (err) {
      console.error(err);

      if (
        err.message ===
        "Session expired. Please login again."
      ) {
        setError(err.message);
      } else {
        setError(
          "Unable to connect to backend. Please make sure Spring Boot is running."
        );
      }
    }
  };

  useEffect(() => {
    if (isLoggedIn) {
      fetchExpenses();
    }
  }, [isLoggedIn]);

  // ==============================
  // ADD EXPENSE
  // ==============================

  const handleSubmit = async (e) => {
    e.preventDefault();

    setMessage("");
    setError("");

    if (!description.trim()) {
      setError("Please enter an expense description.");
      return;
    }

    if (!amount || Number(amount) <= 0) {
      setError("Please enter a valid amount greater than 0.");
      return;
    }

    if (!expenseDate) {
      setError("Please select an expense date.");
      return;
    }

    setLoading(true);

    try {
      const token = localStorage.getItem("token");

      // ==============================
      // STEP 1: AI CATEGORY
      // ==============================

      const categoryResponse = await fetch(
        AI_CATEGORIZE_URL,
        {
          method: "POST",
          headers: {
            "Content-Type": "text/plain",
            Authorization: `Bearer ${token}`,
          },
          body: description.trim(),
        }
      );

      if (!categoryResponse.ok) {
        throw new Error("AI categorization failed");
      }

      const aiCategory =
        (await categoryResponse.text()).trim();

      if (!aiCategory) {
        throw new Error("AI did not return a category");
      }

      console.log("AI Category:", aiCategory);

      // ==============================
      // STEP 2: SAVE EXPENSE
      // ==============================

      const newExpense = {
        description: description.trim(),
        amount: Number(amount),
        category: aiCategory,
        expenseDate,
      };

      const response = await fetch(API_URL, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(newExpense),
      });

      if (!response.ok) {
        throw new Error("Failed to save expense");
      }

      const savedExpense = await response.json();

      setExpenses((previous) => [
        ...previous,
        savedExpense,
      ]);

      setDescription("");
      setAmount("");
      setCategory("Food");
      setExpenseDate("");

      setMessage(
        `✓ Expense added successfully! AI categorized it as ${aiCategory}.`
      );
    } catch (err) {
      console.error(err);

      setError(
        "Unable to categorize or save expense. Please try again."
      );
    } finally {
      setLoading(false);
    }
  };

  // ==============================
  // DELETE EXPENSE
  // ==============================

  const handleDeleteExpense = async () => {
    if (!deleteId) return;

    setDeleteLoading(true);
    setError("");
    setMessage("");

    try {
      const token = localStorage.getItem("token");

      const response = await fetch(
        `${API_URL}/${deleteId}`,
        {
          method: "DELETE",
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      if (response.status === 404) {
        throw new Error("Expense not found");
      }

      if (!response.ok) {
        throw new Error("Failed to delete expense");
      }

      setExpenses((previous) =>
        previous.filter(
          (expense) => expense.id !== deleteId
        )
      );

      setDeleteId(null);
      setMessage("✓ Expense deleted successfully.");
    } catch (err) {
      console.error(err);

      setError(
        err.message === "Expense not found"
          ? "This expense no longer exists."
          : "Unable to delete expense."
      );
    } finally {
      setDeleteLoading(false);
    }
  };

  // ==============================
  // UPDATE EXPENSE
  // ==============================

  const handleUpdateExpense = async (e) => {
    e.preventDefault();

    setMessage("");
    setError("");

    if (!description.trim()) {
      setError("Please enter an expense description.");
      return;
    }

    if (!amount || Number(amount) <= 0) {
      setError("Please enter a valid amount greater than 0.");
      return;
    }

    if (!expenseDate) {
      setError("Please select an expense date.");
      return;
    }

    setEditLoading(true);

    try {
      const token = localStorage.getItem("token");

      // ==============================
      // AI CATEGORY FOR UPDATED EXPENSE
      // ==============================

      const categoryResponse = await fetch(
        AI_CATEGORIZE_URL,
        {
          method: "POST",
          headers: {
            "Content-Type": "text/plain",
            Authorization: `Bearer ${token}`,
          },
          body: description.trim(),
        }
      );

      if (!categoryResponse.ok) {
        throw new Error("AI categorization failed");
      }

      const aiCategory =
        (await categoryResponse.text()).trim();

      if (!aiCategory) {
        throw new Error("AI did not return a category");
      }

      const updatedExpense = {
        description: description.trim(),
        amount: Number(amount),
        category: aiCategory,
        expenseDate,
      };

      // ==============================
      // UPDATE BACKEND
      // ==============================

      const response = await fetch(
        `${API_URL}/${editingId}`,
        {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify(updatedExpense),
        }
      );

      if (!response.ok) {
        throw new Error("Failed to update expense");
      }

      const savedExpense = await response.json();

      setExpenses((previous) =>
        previous.map((expense) =>
          expense.id === editingId
            ? savedExpense
            : expense
        )
      );

      setEditingId(null);
      setDescription("");
      setAmount("");
      setCategory("Food");
      setExpenseDate("");

      setMessage("✓ Expense updated successfully.");
    } catch (err) {
      console.error(err);

      setError(
        "Unable to update expense. Please try again."
      );
    } finally {
      setEditLoading(false);
    }
  };

  // ==============================
  // FILTERED EXPENSES
  // ==============================

  const filteredExpenses = useMemo(() => {
    let result = [...expenses];

    const search = searchTerm.trim().toLowerCase();

    if (search) {
      result = result.filter((expense) => {
        const description = String(
          expense.description || ""
        ).toLowerCase();

        const expenseCategory = String(
          expense.category || ""
        ).toLowerCase();

        return (
          description.includes(search) ||
          expenseCategory.includes(search)
        );
      });
    }

    if (filterCategory !== "All") {
      result = result.filter(
        (expense) =>
          expense.category === filterCategory
      );
    }

    if (filterMonth) {
      result = result.filter((expense) =>
        String(
          expense.expenseDate || ""
        ).startsWith(filterMonth)
      );
    }

    result.sort((a, b) => {
      if (sortBy === "amount-desc") {
        return (
          Number(b.amount || 0) -
          Number(a.amount || 0)
        );
      }

      if (sortBy === "amount-asc") {
        return (
          Number(a.amount || 0) -
          Number(b.amount || 0)
        );
      }

      if (sortBy === "date-asc") {
        return (
          (parseExpenseDate(a.expenseDate)?.getTime() ||
            0) -
          (parseExpenseDate(b.expenseDate)?.getTime() ||
            0)
        );
      }

      return (
        (parseExpenseDate(b.expenseDate)?.getTime() ||
          0) -
        (parseExpenseDate(a.expenseDate)?.getTime() ||
          0)
      );
    });

    return result;
  }, [
    expenses,
    searchTerm,
    filterCategory,
    filterMonth,
    sortBy,
  ]);

  // ==============================
  // TOTAL SPENDING
  // ==============================

  const totalSpending = useMemo(() => {
    return expenses.reduce(
      (total, expense) =>
        total + Number(expense.amount || 0),
      0
    );
  }, [expenses]);

  // ==============================
  // CURRENT MONTH
  // ==============================

  const today = new Date();
  const currentMonth = today.getMonth();
  const currentYear = today.getFullYear();

  // ==============================
  // MONTHLY SPENDING
  // ==============================

  const monthlySpending = useMemo(() => {
    return expenses
      .filter((expense) => {
        const date = parseExpenseDate(
          expense.expenseDate
        );

        if (!date) return false;

        return (
          date.getMonth() === currentMonth &&
          date.getFullYear() === currentYear
        );
      })
      .reduce(
        (total, expense) =>
          total + Number(expense.amount || 0),
        0
      );
  }, [
    expenses,
    currentMonth,
    currentYear,
  ]);

  // ==============================
  // CATEGORY ANALYTICS
  // ==============================

  const categoryTotals = useMemo(() => {
    const totals = {};

    expenses.forEach((expense) => {
      const expenseCategory =
        expense.category || "Other";

      totals[expenseCategory] =
        (totals[expenseCategory] || 0) +
        Number(expense.amount || 0);
    });

    return Object.entries(totals)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 5);
  }, [expenses]);

  const maxCategoryAmount =
    categoryTotals.length > 0
      ? Math.max(
          ...categoryTotals.map(
            (item) => item[1]
          )
        )
      : 1;

  const highestCategory =
    categoryTotals.length > 0
      ? categoryTotals[0]
      : ["None", 0];

  const highestCategoryAmount =
    highestCategory[1];

  // ==============================
  // SPENDING PERSONALITY
  // ==============================

  const spendingPersonality = useMemo(() => {
    if (expenses.length === 0) {
      return {
        title: "Waiting for your data",
        icon: "🔮",
        description:
          "Add expenses and your spending personality will be detected.",
        color:
          "from-purple-500 to-cyan-400",
      };
    }

    const categories = {};

    expenses.forEach((expense) => {
      const expenseCategory =
        expense.category || "Other";

      categories[expenseCategory] =
        (categories[expenseCategory] || 0) +
        Number(expense.amount || 0);
    });

    const sorted =
      Object.entries(categories).sort(
        (a, b) => b[1] - a[1]
      );

    const topCategory =
      sorted[0]?.[0] || "Other";

    const topAmount =
      sorted[0]?.[1] || 0;

    const percentage =
      totalSpending > 0
        ? (topAmount / totalSpending) * 100
        : 0;

    if (
      topCategory === "Food" &&
      percentage >= 40
    ) {
      return {
        title: "The Foodie",
        icon: "🍜",
        description:
          "Food and dining dominate your spending. Small changes here could create noticeable savings.",
        color:
          "from-orange-500 to-pink-500",
      };
    }

    if (
      topCategory === "Transport" &&
      percentage >= 40
    ) {
      return {
        title: "The Commuter",
        icon: "🚗",
        description:
          "Transportation is your biggest spending zone. Smarter commuting could unlock extra savings.",
        color:
          "from-cyan-500 to-blue-500",
      };
    }

    if (
      topCategory === "Shopping" &&
      percentage >= 40
    ) {
      return {
        title: "The Explorer",
        icon: "🛍️",
        description:
          "Shopping takes the largest slice of your spending. Planning purchases could improve your budget.",
        color:
          "from-pink-500 to-purple-500",
      };
    }

    if (
      topCategory === "Entertainment" &&
      percentage >= 35
    ) {
      return {
        title: "The Experience Seeker",
        icon: "🎮",
        description:
          "You value experiences and entertainment. Balance enjoyment with your savings goals.",
        color:
          "from-violet-500 to-fuchsia-500",
      };
    }

    if (topCategory === "Bills") {
      return {
        title: "The Responsible Planner",
        icon: "📋",
        description:
          "Essential bills influence much of your spending. Keeping discretionary expenses controlled can help.",
        color:
          "from-blue-500 to-indigo-500",
      };
    }

    return {
      title: "The Balanced Spender",
      icon: "⚖️",
      description:
        "Your spending is distributed across categories without one category completely dominating your budget.",
      color:
        "from-purple-500 to-cyan-400",
    };
  }, [expenses, totalSpending]);

  // ==============================
  // FUTURE PROJECTION
  // ==============================

  const predictionBase =
    monthlySpending > 0
      ? monthlySpending
      : totalSpending;

  const yearlyPrediction =
    predictionBase * 12;

  // ==============================
  // SAVINGS SIMULATOR
  // ==============================

  const potentialMonthlySaving =
    predictionBase *
    (savingPercent / 100);

  const potentialYearlySaving =
    potentialMonthlySaving * 12;

  const projectedMonthlySpending =
    predictionBase -
    potentialMonthlySaving;

  // ==============================
  // UNUSUAL EXPENSES
  // ==============================

  const averageExpense =
    expenses.length > 0
      ? totalSpending / expenses.length
      : 0;

  const unusualExpenses =
    expenses.filter(
      (expense) =>
        Number(expense.amount || 0) >
        averageExpense * 2
    );

  // ==============================
  // FINANCIAL HEALTH SCORE
  // ==============================

  const financialHealthScore = useMemo(() => {
    if (expenses.length === 0) {
      return 0;
    }

    const categoryRatio =
      totalSpending > 0
        ? highestCategoryAmount /
          totalSpending
        : 0;

    const categoryScore =
      totalSpending === 0
        ? 25
        : categoryRatio > 0.6
        ? 10
        : categoryRatio > 0.45
        ? 16
        : categoryRatio > 0.35
        ? 21
        : 25;

    const frequencyScore =
      expenses.length > 30
        ? 10
        : expenses.length > 20
        ? 17
        : expenses.length > 10
        ? 22
        : 25;

    const savingsScore =
      predictionBase === 0
        ? 25
        : savingPercent >= 25
        ? 25
        : savingPercent >= 15
        ? 21
        : savingPercent >= 5
        ? 17
        : 12;

    const unusualScore =
      unusualExpenses.length === 0
        ? 25
        : unusualExpenses.length <= 2
        ? 20
        : unusualExpenses.length <= 4
        ? 15
        : 10;

    return (
      categoryScore +
      frequencyScore +
      savingsScore +
      unusualScore
    );
  }, [
    expenses.length,
    highestCategoryAmount,
    totalSpending,
    predictionBase,
    savingPercent,
    unusualExpenses.length,
  ]);

  const financialHealthLabel =
    financialHealthScore >= 80
      ? "Excellent"
      : financialHealthScore >= 60
      ? "Healthy"
      : financialHealthScore >= 40
      ? "Needs Attention"
      : "High Risk";

  // ==============================
  // HEALTH BREAKDOWN
  // ==============================

  const healthBreakdown = useMemo(() => {
    if (expenses.length === 0) {
      return [
        {
          name: "Category Balance",
          score: 0,
          description:
            "Add expenses to analyze category balance.",
        },
        {
          name: "Spending Frequency",
          score: 0,
          description:
            "Add transactions to analyze frequency.",
        },
        {
          name: "Savings Potential",
          score: 0,
          description:
            "Your savings potential will appear here.",
        },
        {
          name: "Unusual Spending",
          score: 0,
          description:
            "Unusual expense detection is ready.",
        },
      ];
    }

    const categoryRatio =
      totalSpending > 0
        ? highestCategoryAmount /
          totalSpending
        : 0;

    const categoryScore =
      totalSpending === 0
        ? 25
        : categoryRatio > 0.6
        ? 10
        : categoryRatio > 0.45
        ? 16
        : categoryRatio > 0.35
        ? 21
        : 25;

    const frequencyScore =
      expenses.length > 30
        ? 10
        : expenses.length > 20
        ? 17
        : expenses.length > 10
        ? 22
        : 25;

    const savingsScore =
      predictionBase === 0
        ? 25
        : savingPercent >= 25
        ? 25
        : savingPercent >= 15
        ? 21
        : savingPercent >= 5
        ? 17
        : 12;

    const unusualScore =
      unusualExpenses.length === 0
        ? 25
        : unusualExpenses.length <= 2
        ? 20
        : unusualExpenses.length <= 4
        ? 15
        : 10;

    return [
      {
        name: "Category Balance",
        score: categoryScore,
        description:
          categoryScore >= 21
            ? "Your spending is well distributed across categories."
            : "One category is taking a large share of your spending.",
      },
      {
        name: "Spending Frequency",
        score: frequencyScore,
        description:
          frequencyScore >= 22
            ? "Your transaction frequency looks manageable."
            : "You have a high number of recorded transactions.",
      },
      {
        name: "Savings Potential",
        score: savingsScore,
        description:
          savingsScore >= 21
            ? "You have a healthy opportunity to build savings."
            : "Reducing discretionary spending could improve savings.",
      },
      {
        name: "Unusual Spending",
        score: unusualScore,
        description:
          unusualScore >= 20
            ? "No major unusual spending patterns detected."
            : "Some purchases are significantly above your normal expense size.",
      },
    ];
  }, [
    expenses.length,
    highestCategoryAmount,
    totalSpending,
    predictionBase,
    savingPercent,
    unusualExpenses.length,
  ]);

  const healthColor =
    financialHealthScore >= 80
      ? "text-emerald-300"
      : financialHealthScore >= 60
      ? "text-cyan-300"
      : financialHealthScore >= 40
      ? "text-amber-300"
      : "text-red-300";

  // ==============================
  // AI ANALYSIS
  // ==============================

  const handleAIAnalysis = async () => {
    if (expenses.length === 0) {
      setAiError(
        "Please add at least one expense before running AI analysis."
      );
      return;
    }

    setAiLoading(true);
    setAiError("");
    setAiAnalysis("");

    try {
      const token = localStorage.getItem("token");

      const response = await fetch(
        AI_ANALYSIS_URL,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify(expenses),
        }
      );

      if (!response.ok) {
        throw new Error(
          "AI analysis request failed"
        );
      }

      const result =
        await response.text();

      setAiAnalysis(result);
    } catch (err) {
      console.error(err);

      setAiError(
        "Unable to generate AI analysis. Please make sure the backend and AI configuration are running."
      );
    } finally {
      setAiLoading(false);
    }
  };

  // ==============================
  // LOGIN / REGISTER SCREEN
  // ==============================

  if (!isLoggedIn) {
    if (showRegister) {
      return (
        <Register
          onRegister={() => {
            setShowRegister(false);
          }}
          onShowLogin={() => {
            setShowRegister(false);
          }}
        />
      );
    }

    return (
      <Login
        onLogin={handleLogin}
        onShowRegister={() => {
          setShowRegister(true);
        }}
      />
    );
  }

  // ==============================
  // UI
  // ==============================

  return (
    <div className="min-h-screen bg-[#05050c] text-white overflow-hidden">

      {/* BACKGROUND */}

      <div className="fixed inset-0 pointer-events-none overflow-hidden">

        <div className="absolute -top-48 -left-48 w-[500px] h-[500px] bg-purple-600/20 rounded-full blur-[120px]" />

        <div className="absolute top-[35%] -right-48 w-[500px] h-[500px] bg-cyan-500/10 rounded-full blur-[120px]" />

        <div className="absolute bottom-0 left-[30%] w-[500px] h-[400px] bg-blue-600/10 rounded-full blur-[120px]" />

        <div
          className="absolute inset-0 opacity-[0.035]"
          style={{
            backgroundImage:
              "linear-gradient(rgba(255,255,255,.3) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,.3) 1px, transparent 1px)",
            backgroundSize: "50px 50px",
          }}
        />

      </div>

      {/* HEADER */}

      <header className="sticky top-0 z-40 border-b border-white/10 bg-[#05050c]/80 backdrop-blur-2xl">

        <div className="max-w-7xl mx-auto px-6 py-5 flex items-center justify-between">

          <div className="flex items-center gap-3">

            <div className="relative">

              <div className="absolute inset-0 bg-purple-500 blur-xl opacity-50" />

              <div className="relative w-12 h-12 rounded-2xl bg-gradient-to-br from-purple-500 via-fuchsia-500 to-cyan-400 flex items-center justify-center text-2xl shadow-xl">
                🤖
              </div>

            </div>

            <div>

              <h1 className="text-xl md:text-2xl font-black tracking-tight">
                SpendWise AI
              </h1>

              <p className="text-xs text-gray-500">
                Your Personal AI Financial Coach
              </p>

            </div>

          </div>

          {/* NAVIGATION */}

          <div className="hidden lg:flex items-center gap-2">

            <a
              href="#overview"
              className="px-3 py-2 rounded-xl text-xs text-gray-400 hover:text-white hover:bg-white/5 transition"
            >
              Overview
            </a>

            <a
              href="#analytics"
              className="px-3 py-2 rounded-xl text-xs text-gray-400 hover:text-white hover:bg-white/5 transition"
            >
              Analytics
            </a>

            <a
              href="#add-expense"
              className="px-3 py-2 rounded-xl text-xs text-gray-400 hover:text-white hover:bg-white/5 transition"
            >
              Add Expense
            </a>

            <a
              href="#transactions"
              className="px-3 py-2 rounded-xl text-xs text-gray-400 hover:text-white hover:bg-white/5 transition"
            >
              Transactions
            </a>

          </div>

          <div className="flex items-center gap-3">

            <div className="hidden md:flex items-center gap-2 px-4 py-2 rounded-full bg-emerald-400/10 border border-emerald-400/20">

              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />

              <span className="text-sm text-emerald-300">
                Intelligence Online
              </span>

            </div>

            <button
              onClick={handleLogout}
              className="px-4 py-2 rounded-xl bg-red-500/10 border border-red-500/20 text-red-300 text-sm hover:bg-red-500/20 transition"
            >
              Logout
            </button>

          </div>

        </div>

      </header>

      <main className="relative max-w-7xl mx-auto px-4 md:px-6 py-6 md:py-8">

        {/* GLOBAL MESSAGES */}

        {error && (
          <div className="mb-6 rounded-2xl bg-red-500/10 border border-red-500/20 text-red-300 p-4">
            {error}
          </div>
        )}

        {message && (
          <div className="mb-6 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-300 p-4">
            {message}
          </div>
        )}

        {/* HERO */}

        <section
          id="overview"
          className="relative overflow-hidden rounded-[2rem] border border-purple-400/20 bg-gradient-to-br from-purple-950/50 via-[#101020] to-cyan-950/30 p-6 md:p-9 mb-6 shadow-2xl"
        >

          <div className="absolute right-[-100px] top-[-100px] w-80 h-80 rounded-full border border-purple-400/20 animate-[spin_20s_linear_infinite]" />

          <div className="absolute right-[-50px] top-[-50px] w-60 h-60 rounded-full border border-cyan-400/20" />

          <div className="absolute right-20 top-20 w-28 h-28 rounded-full bg-purple-500/10 blur-2xl" />

          <div className="relative max-w-3xl">

            <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-purple-500/10 border border-purple-400/20 text-purple-300 text-xs font-bold mb-5">
              ✦ AI-POWERED MONEY INTELLIGENCE
            </div>

            <h2 className="text-3xl md:text-5xl font-black leading-[1.05] tracking-tight">
              Your money has a
              <span className="block bg-gradient-to-r from-purple-400 via-fuchsia-400 to-cyan-300 bg-clip-text text-transparent">
                story. Let's decode it.
              </span>
            </h2>

            <p className="mt-5 text-gray-400 max-w-2xl text-base md:text-lg leading-7">
              Track expenses, understand your spending personality,
              detect unusual purchases, predict future spending and
              simulate how much you could save.
            </p>

            <div className="flex flex-wrap gap-3 mt-7">

              <div className="px-4 py-2 rounded-xl bg-white/5 border border-white/10 text-xs text-gray-300">
                🧠 Spending DNA
              </div>

              <div className="px-4 py-2 rounded-xl bg-white/5 border border-white/10 text-xs text-gray-300">
                🔮 Future Prediction
              </div>

              <div className="px-4 py-2 rounded-xl bg-white/5 border border-white/10 text-xs text-gray-300">
                🎯 Savings Simulator
              </div>

              <div className="px-4 py-2 rounded-xl bg-white/5 border border-white/10 text-xs text-gray-300">
                🚨 Smart Alerts
              </div>

            </div>

          </div>

        </section>

        {/* SUMMARY CARDS */}

        <section className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-5 mb-8">

          {/* TOTAL */}

          <div className="group relative overflow-hidden rounded-3xl border border-purple-400/20 bg-white/[0.04] backdrop-blur-xl p-6 hover:-translate-y-1 transition-all">

            <div className="absolute -right-10 -top-10 w-32 h-32 bg-purple-500/20 rounded-full blur-3xl" />

            <div className="relative">

              <div className="flex justify-between">

                <p className="text-gray-400 text-sm">
                  Total Spending
                </p>

                <span className="text-2xl">
                  💰
                </span>

              </div>

              <h3 className="text-4xl font-black mt-4">
                ₹{totalSpending.toFixed(2)}
              </h3>

              <p className="text-xs text-purple-300 mt-3">
                Lifetime tracked spending
              </p>

            </div>

          </div>

          {/* MONTH */}

          <div className="group relative overflow-hidden rounded-3xl border border-cyan-400/20 bg-white/[0.04] backdrop-blur-xl p-6 hover:-translate-y-1 transition-all">

            <div className="absolute -right-10 -top-10 w-32 h-32 bg-cyan-500/20 rounded-full blur-3xl" />

            <div className="relative">

              <div className="flex justify-between">

                <p className="text-gray-400 text-sm">
                  This Month
                </p>

                <span className="text-2xl">
                  📅
                </span>

              </div>

              <h3 className="text-4xl font-black mt-4">
                ₹{monthlySpending.toFixed(2)}
              </h3>

              <p className="text-xs text-cyan-300 mt-3">
                Current month spending
              </p>

            </div>

          </div>

          {/* TRANSACTIONS */}

          <div className="group relative overflow-hidden rounded-3xl border border-fuchsia-400/20 bg-white/[0.04] backdrop-blur-xl p-6 hover:-translate-y-1 transition-all">

            <div className="absolute -right-10 -top-10 w-32 h-32 bg-fuchsia-500/20 rounded-full blur-3xl" />

            <div className="relative">

              <div className="flex justify-between">

                <p className="text-gray-400 text-sm">
                  Transactions
                </p>

                <span className="text-2xl">
                  📊
                </span>

              </div>

              <h3 className="text-4xl font-black mt-4">
                {expenses.length}
              </h3>

              <p className="text-xs text-fuchsia-300 mt-3">
                Expenses recorded
              </p>

            </div>

          </div>

          {/* HEALTH */}

          <div className="group relative overflow-hidden rounded-3xl border border-emerald-400/20 bg-white/[0.04] backdrop-blur-xl p-6 hover:-translate-y-1 transition-all">

            <div className="absolute -right-10 -top-10 w-32 h-32 bg-emerald-500/20 rounded-full blur-3xl" />

            <div className="relative">

              <div className="flex justify-between">

                <p className="text-gray-400 text-sm">
                  Financial Health
                </p>

                <span className="text-2xl">
                  💚
                </span>

              </div>

              <h3
                className={`text-4xl font-black mt-4 ${healthColor}`}
              >
                {financialHealthScore}

                <span className="text-lg text-gray-600">
                  /100
                </span>

              </h3>

              <p className={`text-xs mt-3 ${healthColor}`}>
                {financialHealthLabel}
              </p>

            </div>

          </div>

        </section>

        {/* HEALTH BREAKDOWN */}

        <section className="rounded-3xl border border-emerald-400/10 bg-white/[0.03] p-6 mb-8">

          <div className="flex items-center justify-between mb-6">

            <div>

              <p className="text-xs text-emerald-300 font-bold tracking-widest">
                FINANCIAL HEALTH
              </p>

              <h2 className="text-xl font-bold mt-1">
                Health Breakdown
              </h2>

            </div>

            <span className={`text-2xl font-black ${healthColor}`}>
              {financialHealthScore}/100
            </span>

          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">

            {healthBreakdown.map((factor) => (

              <div
                key={factor.name}
                className="p-4 rounded-2xl bg-white/[0.03] border border-white/5"
              >

                <div className="flex items-center justify-between mb-2">

                  <span className="text-sm text-gray-400">
                    {factor.name}
                  </span>

                  <span className="text-sm font-bold text-emerald-300">
                    {factor.score}/25
                  </span>

                </div>

                <div className="h-2 bg-white/5 rounded-full overflow-hidden">

                  <div
                    className="h-full rounded-full bg-gradient-to-r from-emerald-500 to-cyan-400 transition-all duration-700"
                    style={{
                      width: `${(factor.score / 25) * 100}%`,
                    }}
                  />

                </div>

                <p className="text-xs text-gray-600 mt-3 leading-5">
                  {factor.description}
                </p>

              </div>

            ))}

          </div>

        </section>

        {/* INTELLIGENCE GRID */}

        <section className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">

          {/* PERSONALITY */}

          <div className="relative overflow-hidden rounded-3xl border border-purple-400/20 bg-gradient-to-br from-purple-950/40 to-[#10101d] p-6">

            <div className="absolute -right-16 -top-16 w-48 h-48 rounded-full bg-purple-500/10 blur-3xl" />

            <div className="relative">

              <div className="flex items-center justify-between mb-6">

                <div>

                  <p className="text-xs text-purple-300 font-bold tracking-widest">
                    SPENDING DNA
                  </p>

                  <h2 className="text-xl font-bold mt-1">
                    Your Personality
                  </h2>

                </div>

                <span className="text-3xl">
                  {spendingPersonality.icon}
                </span>

              </div>

              <div className="flex items-center gap-4">

                <div
                  className={`w-16 h-16 rounded-2xl bg-gradient-to-br ${spendingPersonality.color} flex items-center justify-center text-3xl shadow-lg`}
                >
                  {spendingPersonality.icon}
                </div>

                <div>

                  <h3 className="text-2xl font-black">
                    {spendingPersonality.title}
                  </h3>

                  <p className="text-xs text-gray-500 mt-1">
                    Based on your spending pattern
                  </p>

                </div>

              </div>

              <p className="text-sm text-gray-400 leading-6 mt-5">
                {spendingPersonality.description}
              </p>

            </div>

          </div>

          {/* FUTURE */}

          <div className="relative overflow-hidden rounded-3xl border border-cyan-400/20 bg-gradient-to-br from-cyan-950/30 to-[#10101d] p-6">

            <div className="relative">

              <p className="text-xs text-cyan-300 font-bold tracking-widest">
                FUTURE YOU
              </p>

              <h2 className="text-xl font-bold mt-1">
                Spending Projection
              </h2>

              <p className="text-gray-500 text-sm mt-1">
                If your current pattern continues
              </p>

              <div className="mt-7">

                <p className="text-xs text-gray-500">
                  Estimated yearly spending
                </p>

                <h3 className="text-3xl font-black mt-1 bg-gradient-to-r from-cyan-300 to-blue-400 bg-clip-text text-transparent">
                  ₹{yearlyPrediction.toFixed(0)}
                </h3>

              </div>

              <div className="mt-5 p-4 rounded-2xl bg-cyan-400/5 border border-cyan-400/10">

                <p className="text-sm text-cyan-200">
                  🔮 Prediction
                </p>

                <p className="text-xs text-gray-500 mt-1 leading-5">
                  Based on your current spending pattern,
                  you could spend approximately ₹
                  {yearlyPrediction.toFixed(0)} over 12 months.
                </p>

              </div>

            </div>

          </div>

          {/* UNUSUAL */}

          <div className="relative overflow-hidden rounded-3xl border border-amber-400/20 bg-gradient-to-br from-amber-950/20 to-[#10101d] p-6">

            <p className="text-xs text-amber-300 font-bold tracking-widest">
              SPENDING ALERT
            </p>

            <h2 className="text-xl font-bold mt-1">
              Unusual Expenses
            </h2>

            <p className="text-gray-500 text-sm mt-1">
              Purchases above your normal pattern
            </p>

            {unusualExpenses.length === 0 ? (

              <div className="mt-8">

                <div className="w-14 h-14 rounded-2xl bg-emerald-400/10 border border-emerald-400/20 flex items-center justify-center text-2xl">
                  ✓
                </div>

                <p className="font-bold mt-4">
                  No unusual spending
                </p>

                <p className="text-xs text-gray-500 mt-1">
                  Your current expenses look relatively normal.
                </p>

              </div>

            ) : (

              <div className="mt-5 space-y-3 max-h-36 overflow-auto">

                {unusualExpenses
                  .slice(0, 3)
                  .map((expense) => (

                    <div
                      key={expense.id}
                      className="flex items-center justify-between p-3 rounded-xl bg-amber-400/5 border border-amber-400/10"
                    >

                      <div className="flex items-center gap-3">

                        <span>
                          {categoryIcons[expense.category] || "✨"}
                        </span>

                        <div>

                          <p className="text-sm font-semibold">
                            {expense.description}
                          </p>

                          <p className="text-xs text-gray-600">
                            Above your normal spending
                          </p>

                        </div>

                      </div>

                      <span className="font-bold text-amber-300">
                        ₹{Number(expense.amount).toFixed(0)}
                      </span>

                    </div>

                  ))}

              </div>

            )}

          </div>

        </section>

        {/* SAVINGS SIMULATOR */}

        <section className="relative overflow-hidden rounded-[2rem] border border-emerald-400/20 bg-gradient-to-br from-emerald-950/30 via-[#0c1515] to-cyan-950/20 p-7 md:p-9 mb-8">

          <div className="relative">

            <div className="flex flex-col md:flex-row md:items-end md:justify-between gap-5 mb-8">

              <div>

                <span className="px-3 py-1 rounded-full bg-emerald-400/10 border border-emerald-400/20 text-emerald-300 text-xs font-bold">
                  ✦ INTERACTIVE SIMULATION
                </span>

                <h2 className="text-3xl md:text-4xl font-black mt-3">
                  What if you spent less?
                </h2>

                <p className="text-gray-500 mt-2">
                  Adjust the slider and instantly see your potential savings.
                </p>

              </div>

              <div className="text-right">

                <p className="text-xs text-gray-500">
                  Potential yearly saving
                </p>

                <p className="text-3xl font-black text-emerald-300">
                  ₹{potentialYearlySaving.toFixed(0)}
                </p>

              </div>

            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">

              <div className="p-6 rounded-3xl bg-black/20 border border-white/5">

                <div className="flex justify-between items-center">

                  <span className="text-sm text-gray-400">
                    Reduce spending by
                  </span>

                  <span className="text-2xl font-black text-emerald-300">
                    {savingPercent}%
                  </span>

                </div>

                <input
                  type="range"
                  min="0"
                  max="50"
                  step="5"
                  value={savingPercent}
                  onChange={(e) =>
                    setSavingPercent(
                      Number(e.target.value)
                    )
                  }
                  className="w-full mt-7 accent-emerald-400 cursor-pointer"
                />

                <div className="flex justify-between text-xs text-gray-600 mt-2">
                  <span>0%</span>
                  <span>25%</span>
                  <span>50%</span>
                </div>

                <div className="mt-7 grid grid-cols-2 gap-3">

                  <div className="p-4 rounded-2xl bg-white/[0.03] border border-white/5">

                    <p className="text-xs text-gray-600">
                      Current / month
                    </p>

                    <p className="text-xl font-bold mt-1">
                      ₹{predictionBase.toFixed(0)}
                    </p>

                  </div>

                  <div className="p-4 rounded-2xl bg-emerald-400/5 border border-emerald-400/10">

                    <p className="text-xs text-gray-600">
                      Projected / month
                    </p>

                    <p className="text-xl font-bold text-emerald-300 mt-1">
                      ₹{projectedMonthlySpending.toFixed(0)}
                    </p>

                  </div>

                </div>

              </div>

              <div className="relative p-6 rounded-3xl bg-gradient-to-br from-emerald-400/10 to-cyan-400/5 border border-emerald-400/10">

                <p className="text-sm text-emerald-300 font-semibold">
                  Your potential
                </p>

                <h3 className="text-4xl font-black mt-2">
                  ₹{potentialMonthlySaving.toFixed(0)}
                </h3>

                <p className="text-sm text-gray-500">
                  extra savings every month
                </p>

                <div className="h-px bg-white/10 my-6" />

                <div className="flex justify-between items-center">

                  <div>

                    <p className="text-xs text-gray-600">
                      Over 12 months
                    </p>

                    <p className="text-2xl font-black text-emerald-300 mt-1">
                      ₹{potentialYearlySaving.toFixed(0)}
                    </p>

                  </div>

                  <div className="text-5xl">
                    🚀
                  </div>

                </div>

                <p className="text-xs text-gray-500 leading-5 mt-5">
                  A {savingPercent}% reduction in your current
                  spending pattern could potentially free up ₹
                  {potentialYearlySaving.toFixed(0)} over a year.
                </p>

              </div>

            </div>

          </div>

        </section>

        {/* ANALYTICS */}

        <section
          id="analytics"
          className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8"
        >

          {/* CATEGORY ANALYTICS */}

          <div className="rounded-3xl border border-white/10 bg-white/[0.04] backdrop-blur-xl p-6">

            <div className="flex justify-between items-center mb-6">

              <div>

                <p className="text-xs text-purple-300 font-bold tracking-widest">
                  DATA VIEW
                </p>

                <h2 className="text-xl font-bold mt-1">
                  Spending Breakdown
                </h2>

                <p className="text-sm text-gray-500">
                  Where your money is going
                </p>

              </div>

              <span className="text-2xl">
                📈
              </span>

            </div>

            {categoryTotals.length === 0 ? (

              <div className="h-52 flex items-center justify-center text-gray-500">
                Add expenses to see analytics.
              </div>

            ) : (

              <div className="space-y-5">

                {categoryTotals.map(
                  ([name, value]) => {

                    const percentage =
                      totalSpending > 0
                        ? (value / totalSpending) * 100
                        : 0;

                    const width =
                      (value /
                        maxCategoryAmount) *
                      100;

                    return (

                      <div key={name}>

                        <div className="flex justify-between mb-2 text-sm">

                          <span>
                            {categoryIcons[name] || "✨"}{" "}
                            {name}
                          </span>

                          <span className="text-gray-400">
                            ₹{value.toFixed(0)} ·{" "}
                            {percentage.toFixed(1)}%
                          </span>

                        </div>

                        <div className="h-3 bg-white/5 rounded-full overflow-hidden">

                          <div
                            className="h-full rounded-full bg-gradient-to-r from-purple-500 to-cyan-400 transition-all duration-700"
                            style={{
                              width: `${width}%`,
                            }}
                          />

                        </div>

                      </div>

                    );
                  }
                )}

              </div>

            )}

          </div>

          {/* AI COACH */}

          <div className="relative overflow-hidden rounded-3xl border border-purple-400/20 bg-gradient-to-br from-purple-900/30 to-[#111126] p-6">

            <div className="relative flex flex-col items-center justify-center min-h-[300px] text-center">

              <div className="relative mb-5">

                <div className="absolute inset-0 rounded-full bg-purple-500/30 blur-2xl animate-pulse" />

                <div className="relative w-28 h-28 rounded-full bg-gradient-to-br from-purple-500 via-fuchsia-500 to-cyan-400 flex items-center justify-center text-5xl shadow-2xl">
                  🤖
                </div>

              </div>

              <p className="text-purple-300 text-xs font-bold tracking-[0.25em]">
                AI FINANCIAL INTELLIGENCE
              </p>

              <h2 className="text-2xl font-bold mt-2">
                Ask your money coach
              </h2>

              <p className="text-gray-400 text-sm max-w-sm mt-2">
                Let AI examine your actual expenses and generate personalized financial insights.
              </p>

              <button
                onClick={handleAIAnalysis}
                disabled={
                  aiLoading ||
                  expenses.length === 0
                }
                className="mt-6 px-7 py-3 rounded-2xl font-bold bg-gradient-to-r from-purple-600 to-cyan-500 hover:scale-105 disabled:opacity-40 disabled:hover:scale-100 transition-all shadow-lg"
              >

                {aiLoading ? (

                  <span className="flex items-center gap-2">

                    <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />

                    Analyzing...

                  </span>

                ) : (

                  "✨ Analyze My Expenses"

                )}

              </button>

            </div>

          </div>

        </section>

        {/* AI RESULT */}

        {(aiError || aiAnalysis) && (

          <section className="mb-8">

            {aiError && (

              <div className="rounded-2xl bg-red-500/10 border border-red-500/20 text-red-300 p-5">
                {aiError}
              </div>

            )}

            {aiAnalysis && (

              <div className="relative overflow-hidden rounded-3xl border border-purple-400/20 bg-gradient-to-br from-purple-900/20 to-white/[0.03] backdrop-blur-xl p-7">

                <div className="relative">

                  <div className="flex items-center gap-3 mb-5">

                    <div className="w-10 h-10 rounded-xl bg-purple-500/20 flex items-center justify-center">
                      🤖
                    </div>

                    <div>

                      <h2 className="text-xl font-bold">
                        AI Insights
                      </h2>

                      <p className="text-xs text-purple-300">
                        Personalized analysis
                      </p>

                    </div>

                  </div>

                  <div className="whitespace-pre-wrap text-gray-300 leading-8">
                    {aiAnalysis}
                  </div>

                </div>

              </div>

            )}

          </section>

        )}

        {/* ADD EXPENSE */}

        <section
          id="add-expense"
          className="rounded-3xl border border-white/10 bg-white/[0.04] backdrop-blur-xl p-6 md:p-8 mb-8"
        >

          <div className="flex items-center gap-3 mb-7">

            <div className="w-11 h-11 rounded-2xl bg-gradient-to-br from-blue-500 to-purple-500 flex items-center justify-center text-xl">
              +
            </div>

            <div>

              <h2 className="text-xl font-bold">
                {editingId
                  ? "Edit Expense"
                  : "Add New Expense"}
              </h2>

              <p className="text-sm text-gray-500">
                {editingId
                  ? "Update your expense details"
                  : "Record your spending"}
              </p>

            </div>

          </div>

          <form
            onSubmit={
              editingId
                ? handleUpdateExpense
                : handleSubmit
            }
            className="grid grid-cols-1 md:grid-cols-2 gap-5"
          >

            <div>

              <label className="block text-sm text-gray-400 mb-2">
                Description
              </label>

              <input
                type="text"
                value={description}
                onChange={(e) =>
                  setDescription(e.target.value)
                }
                placeholder="e.g. Dinner at restaurant"
                className="w-full bg-black/20 border border-white/10 rounded-xl px-4 py-3 text-white placeholder-gray-600 outline-none focus:border-purple-500/60 focus:ring-2 focus:ring-purple-500/10 transition"
                required
              />

            </div>

            <div>

              <label className="block text-sm text-gray-400 mb-2">
                Amount
              </label>

              <input
                type="number"
                min="0.01"
                step="0.01"
                value={amount}
                onChange={(e) =>
                  setAmount(e.target.value)
                }
                placeholder="450"
                className="w-full bg-black/20 border border-white/10 rounded-xl px-4 py-3 text-white placeholder-gray-600 outline-none focus:border-purple-500/60 focus:ring-2 focus:ring-purple-500/10 transition"
                required
              />

            </div>

            <div>

              <label className="block text-sm text-gray-400 mb-2">
                Category
              </label>

              <div className="w-full bg-[#11111f] border border-purple-500/20 rounded-xl px-4 py-3 text-gray-400">
                🤖 AI will automatically categorize this expense
              </div>

            </div>

            <div>

              <label className="block text-sm text-gray-400 mb-2">
                Date
              </label>

              <input
                type="date"
                value={expenseDate}
                onChange={(e) =>
                  setExpenseDate(e.target.value)
                }
                className="w-full bg-black/20 border border-white/10 rounded-xl px-4 py-3 text-white outline-none focus:border-purple-500/60"
                required
              />

            </div>

            <div className="md:col-span-2">

              <button
                type="submit"
                disabled={
                  editingId
                    ? editLoading
                    : loading
                }
                className="px-7 py-3 rounded-xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 hover:scale-[1.02] disabled:opacity-40 transition-all shadow-lg"
              >

                {editingId
                  ? editLoading
                    ? "Updating..."
                    : "✓ Update Expense"
                  : loading
                  ? "Saving..."
                  : "＋ Add Expense"}

              </button>

              {editingId && (

                <button
                  type="button"
                  onClick={() => {
                    setEditingId(null);
                    setDescription("");
                    setAmount("");
                    setCategory("Food");
                    setExpenseDate("");
                    setMessage("");
                    setError("");
                  }}
                  disabled={editLoading}
                  className="ml-3 px-6 py-3 rounded-xl font-bold bg-white/5 border border-white/10 text-gray-300 hover:bg-white/10 transition"
                >
                  Cancel
                </button>

              )}

            </div>

          </form>

        </section>

        {/* TRANSACTION LOG */}

        <section
          id="transactions"
          className="rounded-3xl border border-white/10 bg-white/[0.04] backdrop-blur-xl p-6 md:p-8"
        >

          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-6">

            <div>

              <p className="text-xs text-purple-300 font-bold tracking-widest">
                TRANSACTION LOG
              </p>

              <h2 className="text-xl font-bold mt-1">
                Recent Expenses
              </h2>

              <p className="text-sm text-gray-500 mt-1">
                Search, filter and manage your transactions
              </p>

            </div>

            <span className="px-3 py-1 rounded-full bg-purple-500/10 text-purple-300 text-xs">
              {filteredExpenses.length} of {expenses.length} records
            </span>

          </div>

          {/* SEARCH / FILTER */}

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3 mb-6">

            <input
              type="text"
              value={searchTerm}
              onChange={(e) =>
                setSearchTerm(e.target.value)
              }
              placeholder="🔍 Search expenses..."
              className="bg-black/20 border border-white/10 rounded-xl px-4 py-3 text-sm text-white placeholder-gray-600 outline-none focus:border-purple-500/50"
            />

            <select
              value={filterCategory}
              onChange={(e) =>
                setFilterCategory(e.target.value)
              }
              className="bg-[#11111f] border border-white/10 rounded-xl px-4 py-3 text-sm text-white outline-none focus:border-purple-500/50"
            >

              <option value="All">
                All Categories
              </option>

              {CATEGORY_OPTIONS.map(
                (item) => (

                  <option
                    key={item}
                    value={item}
                  >
                    {categoryIcons[item]} {item}
                  </option>

                )
              )}

            </select>

            <input
              type="month"
              value={filterMonth}
              onChange={(e) =>
                setFilterMonth(e.target.value)
              }
              className="bg-black/20 border border-white/10 rounded-xl px-4 py-3 text-sm text-white outline-none focus:border-purple-500/50"
            />

            <select
              value={sortBy}
              onChange={(e) =>
                setSortBy(e.target.value)
              }
              className="bg-[#11111f] border border-white/10 rounded-xl px-4 py-3 text-sm text-white outline-none focus:border-purple-500/50"
            >

              <option value="date-desc">
                Newest First
              </option>

              <option value="date-asc">
                Oldest First
              </option>

              <option value="amount-desc">
                Highest Amount
              </option>

              <option value="amount-asc">
                Lowest Amount
              </option>

            </select>

          </div>

          {(searchTerm ||
            filterCategory !== "All" ||
            filterMonth) && (

            <button
              onClick={() => {
                setSearchTerm("");
                setFilterCategory("All");
                setFilterMonth("");
              }}
              className="mb-5 px-4 py-2 rounded-xl text-xs font-semibold bg-white/5 border border-white/10 text-gray-400 hover:text-white hover:bg-white/10 transition"
            >
              ✕ Clear Filters
            </button>

          )}

          {/* EXPENSE LIST */}

          {expenses.length === 0 ? (

            <div className="py-16 text-center text-gray-500">

              <div className="text-4xl mb-3">
                🧾
              </div>

              <p>
                No expenses found.
              </p>

              <p className="text-xs mt-2">
                Add your first expense above.
              </p>

            </div>

          ) : filteredExpenses.length === 0 ? (

            <div className="py-16 text-center text-gray-500">

              <div className="text-4xl mb-3">
                🔎
              </div>

              <p>
                No expenses match your filters.
              </p>

              <button
                onClick={() => {
                  setSearchTerm("");
                  setFilterCategory("All");
                  setFilterMonth("");
                }}
                className="mt-4 px-5 py-2 rounded-xl bg-purple-500/10 border border-purple-500/20 text-purple-300 text-sm"
              >
                Clear Filters
              </button>

            </div>

          ) : (

            <div className="space-y-3">

              {filteredExpenses.map(
                (expense) => (

                  <div
                    key={expense.id}
                    className="group flex flex-col md:flex-row md:items-center justify-between gap-4 p-4 rounded-2xl bg-black/20 border border-white/5 hover:border-purple-400/20 hover:bg-white/[0.06] transition"
                  >

                    <div className="flex items-center gap-4">

                      <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-purple-500/20 to-cyan-500/10 flex items-center justify-center text-xl">
                        {categoryIcons[
                          expense.category
                        ] || "✨"}
                      </div>

                      <div>

                        <p className="font-semibold">
                          {expense.description}
                        </p>

                        <div className="flex items-center gap-2 mt-1 flex-wrap">

                          <span className="text-xs text-gray-500">
                            {expense.expenseDate}
                          </span>

                          <span className="text-gray-700">
                            •
                          </span>

                          <span className="text-xs text-purple-300">
                            {expense.category}
                          </span>

                        </div>

                      </div>

                    </div>

                    <div className="flex items-center justify-between md:justify-end gap-5">

                      <div className="text-left md:text-right">

                        <p className="text-lg font-bold">
                          ₹
                          {Number(
                            expense.amount
                          ).toFixed(2)}
                        </p>

                        <p className="text-xs text-gray-600">
                          Transaction #{expense.id}
                        </p>

                      </div>

                      <button
                        onClick={() => {
                          setEditingId(expense.id);

                          setDescription(
                            expense.description || ""
                          );

                          setAmount(
                            expense.amount !== undefined &&
                            expense.amount !== null
                              ? String(expense.amount)
                              : ""
                          );

                          setCategory(
                            expense.category || "Other"
                          );

                          setExpenseDate(
                            expense.expenseDate || ""
                          );

                          setMessage("");
                          setError("");

                          document
                            .getElementById("add-expense")
                            ?.scrollIntoView({
                              behavior: "smooth",
                            });
                        }}
                        className="px-3 py-2 rounded-xl bg-blue-500/10 border border-blue-500/20 text-blue-300 hover:bg-blue-500/20 transition text-sm"
                        title="Edit expense"
                      >
                        ✏️
                      </button>

                      <button
                        onClick={() =>
                          setDeleteId(
                            expense.id
                          )
                        }
                        className="px-3 py-2 rounded-xl bg-red-500/10 border border-red-500/20 text-red-300 hover:bg-red-500/20 transition text-sm"
                        title="Delete expense"
                      >
                        🗑️
                      </button>

                    </div>

                  </div>

                )
              )}

            </div>

          )}

        </section>

        {/* FOOTER */}

        <footer className="text-center py-10 text-xs text-gray-600">
          SpendWise AI · Track less. Understand more. ✦
        </footer>

      </main>

      {/* DELETE CONFIRMATION MODAL */}

      {deleteId && (

        <div className="fixed inset-0 z-50 flex items-center justify-center p-6 bg-black/70 backdrop-blur-sm">

          <div className="w-full max-w-md rounded-3xl border border-red-400/20 bg-[#11111c] shadow-2xl p-7">

            <div className="w-14 h-14 rounded-2xl bg-red-500/10 border border-red-500/20 flex items-center justify-center text-2xl mb-5">
              🗑️
            </div>

            <h2 className="text-2xl font-black">
              Delete Expense?
            </h2>

            <p className="text-gray-500 text-sm mt-2 leading-6">
              Are you sure you want to delete this expense?
              This action cannot be undone.
            </p>

            <div className="flex gap-3 mt-7">

              <button
                onClick={() =>
                  setDeleteId(null)
                }
                disabled={deleteLoading}
                className="flex-1 px-4 py-3 rounded-xl bg-white/5 border border-white/10 text-gray-300 hover:bg-white/10 transition"
              >
                Cancel
              </button>

              <button
                onClick={handleDeleteExpense}
                disabled={deleteLoading}
                className="flex-1 px-4 py-3 rounded-xl bg-red-600 hover:bg-red-500 disabled:opacity-40 font-bold transition"
              >
                {deleteLoading
                  ? "Deleting..."
                  : "Delete"}
              </button>

            </div>

          </div>

        </div>

      )}

    </div>
  );
}

export default App;