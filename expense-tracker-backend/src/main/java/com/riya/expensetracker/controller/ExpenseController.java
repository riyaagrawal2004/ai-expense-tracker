
package com.riya.expensetracker.controller;

import com.riya.expensetracker.entity.Expense;
import com.riya.expensetracker.service.AiExpenseService;
import com.riya.expensetracker.service.ExpenseService;
import jakarta.validation.Valid;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/expenses")
public class ExpenseController {

    private final ExpenseService expenseService;
    private final AiExpenseService aiExpenseService;

    public ExpenseController(
            ExpenseService expenseService,
            AiExpenseService aiExpenseService
    ) {
        this.expenseService = expenseService;
        this.aiExpenseService = aiExpenseService;
    }

    // ==============================
    // CREATE EXPENSE
    // ==============================

    @PostMapping
    public ResponseEntity<Expense> createExpense(
            @Valid @RequestBody Expense expense
    ) {

        Expense savedExpense =
                expenseService.createExpense(expense);

        return new ResponseEntity<>(
                savedExpense,
                HttpStatus.CREATED
        );
    }

    // ==============================
    // GET ALL EXPENSES
    // ==============================

    @GetMapping
    public ResponseEntity<List<Expense>> getAllExpenses() {

        return ResponseEntity.ok(
                expenseService.getAllExpenses()
        );
    }

    // ==============================
    // GET EXPENSE BY ID
    // ==============================

    @GetMapping("/{id}")
    public ResponseEntity<Expense> getExpenseById(
            @PathVariable Long id
    ) {

        return expenseService.getExpenseById(id)
                .map(ResponseEntity::ok)
                .orElse(ResponseEntity.notFound().build());
    }

    // ==============================
    // UPDATE EXPENSE
    // ==============================

    @PutMapping("/{id}")
    public ResponseEntity<Expense> updateExpense(
            @PathVariable Long id,
            @Valid @RequestBody Expense expense
    ) {

        return expenseService.updateExpense(id, expense)
                .map(ResponseEntity::ok)
                .orElse(ResponseEntity.notFound().build());
    }

    // ==============================
    // DELETE EXPENSE
    // ==============================

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> deleteExpense(
            @PathVariable Long id
    ) {

        boolean deleted =
                expenseService.deleteExpense(id);

        if (!deleted) {
            return ResponseEntity.notFound().build();
        }

        return ResponseEntity.noContent().build();
    }

    // ==============================
    // AI EXPENSE ANALYSIS
    // ==============================

    @PostMapping("/ai-analysis")
    public ResponseEntity<String> analyzeExpenses(
            @RequestBody String expenseData
    ) {

        String result =
                aiExpenseService.analyzeExpenses(expenseData);

        return ResponseEntity.ok(result);
    }

    // ==============================
// AI EXPENSE CATEGORIZATION
// ==============================

@PostMapping("/categorize")
public ResponseEntity<String> categorizeExpense(
        @RequestBody String description
) {

    String category =
            aiExpenseService.categorizeExpense(description);

    return ResponseEntity.ok(category);
}
}

