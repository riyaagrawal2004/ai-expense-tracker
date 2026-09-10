package com.riya.expensetracker.controller;

import com.riya.expensetracker.entity.User;
import com.riya.expensetracker.service.UserService;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/auth")
@CrossOrigin(origins = {
        "http://localhost:5173",
        "http://localhost:5174",
        "https://ai-expense-tracker-nine-lime.vercel.app",
        "https://ai-expense-tracker-lxf5vo5x5-riyaagrawal2004.vercel.app"
})
public class AuthController {

    private final UserService userService;

    public AuthController(UserService userService) {
        this.userService = userService;
    }

    // =========================
    // REGISTER
    // =========================

    @PostMapping("/register")
    public ResponseEntity<User> register(
            @RequestParam String username,
            @RequestParam String password
    ) {

        User user = userService.registerUser(username, password);

        return new ResponseEntity<>(
                user,
                HttpStatus.CREATED
        );
    }

    // =========================
    // LOGIN
    // =========================

    @PostMapping("/login")
    public ResponseEntity<String> login(
            @RequestParam String username,
            @RequestParam String password
    ) {

        String token = userService.loginUser(username, password);

        return ResponseEntity.ok(token);
    }
}