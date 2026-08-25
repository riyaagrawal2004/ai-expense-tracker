
package com.riya.expensetracker.service;

import com.riya.expensetracker.entity.User;
import com.riya.expensetracker.repository.UserRepository;
import com.riya.expensetracker.entity.Expense;
import com.riya.expensetracker.repository.ExpenseRepository;

import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;

import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;

import java.util.List;
import java.util.Optional;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class ExpenseServiceTest {

    @BeforeEach
    void setUpSecurityContext() {

        Authentication authentication =
                new UsernamePasswordAuthenticationToken(
                        "testuser",
                        null
                );

        SecurityContextHolder.getContext()
                .setAuthentication(authentication);
    }

    @Mock
    private ExpenseRepository expenseRepository;

    @Mock
    private UserRepository userRepository;

    @InjectMocks
    private ExpenseService expenseService;


    // ==============================
    // CREATE EXPENSE
    // ==============================

    @Test
    void createExpense_shouldSaveExpense() {

        Expense expense = new Expense();

        User user = new User(
                "testuser",
                "password"
        );

        when(userRepository.findByUsername("testuser"))
                .thenReturn(Optional.of(user));

        when(expenseRepository.save(expense))
                .thenReturn(expense);

        Expense result =
                expenseService.createExpense(expense);

        assertNotNull(result);
        assertEquals(expense, result);

        verify(userRepository)
                .findByUsername("testuser");

        verify(expenseRepository)
                .save(expense);
    }


    // ==============================
    // GET ALL EXPENSES
    // ==============================

    @Test
    void getAllExpenses_shouldReturnUserExpenses() {

        Expense expense1 = new Expense();
        Expense expense2 = new Expense();

        when(expenseRepository.findByUserUsername("testuser"))
                .thenReturn(List.of(
                        expense1,
                        expense2
                ));

        List<Expense> result =
                expenseService.getAllExpenses();

        assertEquals(2, result.size());

        assertEquals(
                expense1,
                result.get(0)
        );

        assertEquals(
                expense2,
                result.get(1)
        );

        verify(expenseRepository)
                .findByUserUsername("testuser");
    }


    // ==============================
    // GET EXPENSE BY ID
    // ==============================

    @Test
    void getExpenseById_shouldReturnExpenseWhenFound() {

        Long id = 1L;

        Expense expense = new Expense();

        when(
                expenseRepository
                        .findByIdAndUserUsername(
                                id,
                                "testuser"
                        )
        ).thenReturn(Optional.of(expense));

        Optional<Expense> result =
                expenseService.getExpenseById(id);

        assertTrue(result.isPresent());

        assertEquals(
                expense,
                result.get()
        );

        verify(expenseRepository)
                .findByIdAndUserUsername(
                        id,
                        "testuser"
                );
    }


    // ==============================
    // UPDATE EXPENSE
    // ==============================

    @Test
    void updateExpense_shouldUpdateExistingExpense() {

        Long id = 1L;

        Expense existingExpense =
                new Expense();

        Expense updatedExpense =
                new Expense();

        updatedExpense.setDescription(
                "Updated Expense"
        );

        updatedExpense.setAmount(
                500.0
        );

        updatedExpense.setCategory(
                "Food"
        );

        when(
                expenseRepository
                        .findByIdAndUserUsername(
                                id,
                                "testuser"
                        )
        ).thenReturn(
                Optional.of(existingExpense)
        );

        when(
                expenseRepository.save(
                        existingExpense
                )
        ).thenReturn(existingExpense);

        Optional<Expense> result =
                expenseService.updateExpense(
                        id,
                        updatedExpense
                );

        assertTrue(result.isPresent());

        assertEquals(
                "Updated Expense",
                result.get().getDescription()
        );

        assertEquals(
                500.0,
                result.get().getAmount()
        );

        assertEquals(
                "Food",
                result.get().getCategory()
        );

        verify(expenseRepository)
                .findByIdAndUserUsername(
                        id,
                        "testuser"
                );

        verify(expenseRepository)
                .save(existingExpense);
    }


    // ==============================
    // DELETE EXPENSE - EXISTS
    // ==============================

    @Test
    void deleteExpense_shouldDeleteWhenExpenseExists() {

        Long id = 1L;

        Expense expense =
                new Expense();

        when(
                expenseRepository
                        .findByIdAndUserUsername(
                                id,
                                "testuser"
                        )
        ).thenReturn(
                Optional.of(expense)
        );

        boolean result =
                expenseService.deleteExpense(id);

        assertTrue(result);

        verify(expenseRepository)
                .findByIdAndUserUsername(
                        id,
                        "testuser"
                );

        verify(expenseRepository)
                .delete(expense);
    }


    // ==============================
    // DELETE EXPENSE - NOT EXISTS
    // ==============================

    @Test
    void deleteExpense_shouldReturnFalseWhenExpenseDoesNotExist() {

        Long id = 99L;

        when(
                expenseRepository
                        .findByIdAndUserUsername(
                                id,
                                "testuser"
                        )
        ).thenReturn(
                Optional.empty()
        );

        boolean result =
                expenseService.deleteExpense(id);

        assertFalse(result);

        verify(expenseRepository)
                .findByIdAndUserUsername(
                        id,
                        "testuser"
                );

        verify(
                expenseRepository,
                never()
        ).delete(any(Expense.class));
    }
}

