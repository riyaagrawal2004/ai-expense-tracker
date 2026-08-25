package com.riya.expensetracker.repository;

import com.riya.expensetracker.entity.Expense;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;

public interface ExpenseRepository extends JpaRepository<Expense, Long> {

    List<Expense> findByUserUsername(String username);

    Optional<Expense> findByIdAndUserUsername(Long id, String username);

}