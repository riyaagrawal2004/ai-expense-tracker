
package com.riya.expensetracker.service;

import com.riya.expensetracker.entity.Expense;
import com.riya.expensetracker.repository.ExpenseRepository;
import org.springframework.stereotype.Service;

import com.riya.expensetracker.entity.User;
import com.riya.expensetracker.repository.UserRepository;
import org.springframework.security.core.context.SecurityContextHolder;

import java.util.List;
import java.util.Optional;

@Service
public class ExpenseService {

    private final ExpenseRepository expenseRepository;

    private final UserRepository userRepository;

    public ExpenseService(
        ExpenseRepository expenseRepository,
        UserRepository userRepository
) {
    this.expenseRepository = expenseRepository;
    this.userRepository = userRepository;
}


    public Expense createExpense(Expense expense) {

    String username = SecurityContextHolder
            .getContext()
            .getAuthentication()
            .getName();

    User user = userRepository.findByUsername(username)
            .orElseThrow(() ->
                    new RuntimeException("User not found")
            );

    expense.setUser(user);

    return expenseRepository.save(expense);
}

    public List<Expense> getAllExpenses() {

    String username = SecurityContextHolder
            .getContext()
            .getAuthentication()
            .getName();

    return expenseRepository.findByUserUsername(username);
}


public Optional<Expense> getExpenseById(Long id) {

    String username = SecurityContextHolder
            .getContext()
            .getAuthentication()
            .getName();

    return expenseRepository.findByIdAndUserUsername(id, username);
}


public Optional<Expense> updateExpense(
        Long id,
        Expense updatedExpense
) {

    String username = SecurityContextHolder
            .getContext()
            .getAuthentication()
            .getName();

    return expenseRepository
            .findByIdAndUserUsername(id, username)
            .map(existingExpense -> {

                existingExpense.setDescription(
                        updatedExpense.getDescription()
                );

                existingExpense.setAmount(
                        updatedExpense.getAmount()
                );

                existingExpense.setCategory(
                        updatedExpense.getCategory()
                );

                existingExpense.setExpenseDate(
                        updatedExpense.getExpenseDate()
                );

                return expenseRepository.save(existingExpense);
            });
}


public boolean deleteExpense(Long id) {

    String username = SecurityContextHolder
            .getContext()
            .getAuthentication()
            .getName();

    Optional<Expense> expense =
            expenseRepository.findByIdAndUserUsername(id, username);

    if (expense.isEmpty()) {
        return false;
    }

    expenseRepository.delete(expense.get());

    return true;
}
}
