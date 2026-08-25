package com.riya.expensetracker.service;

import org.springframework.ai.chat.client.ChatClient;
import org.springframework.stereotype.Service;

@Service
public class AiExpenseService {

    private final ChatClient chatClient;

    public AiExpenseService(ChatClient.Builder chatClientBuilder) {
        this.chatClient = chatClientBuilder.build();
    }

    public String analyzeExpenses(String expenseData) {

        String prompt = """
                You are SpendWise AI, a helpful personal financial assistant.

                Analyze the user's expense data carefully.

                Provide the response in the following format:

                📊 SPENDING SUMMARY
                - Total spending
                - Number of transactions
                - Highest spending category

                🔎 KEY OBSERVATION
                - Give one clear observation about the user's spending behavior.

                ⚠️ SPENDING ALERTS
                - Mention any category or expense that looks unusually high.
                - If there is no major concern, clearly say so.

                💡 MONEY-SAVING SUGGESTIONS
                1. Give one practical suggestion.
                2. Give another practical suggestion.

                🎯 FINAL ADVICE
                - Give one short personalized recommendation.

                Important:
                - Base your analysis only on the provided expense data.
                - Do not invent transactions or amounts.
                - Keep the response concise and easy to understand.
                - Use Indian Rupee (₹) when referring to money.

                Expense data:
                %s
                """.formatted(expenseData);

        return chatClient
                .prompt()
                .user(prompt)
                .call()
                .content();
    }

   public String categorizeExpense(String description) {

    String prompt = """
            You are SpendWise AI, an expense categorization assistant.

            Categorize the following expense description into exactly ONE
            of these categories:

            Food
            Transport
            Shopping
            Entertainment
            Bills
            Other

            Expense description:
            %s

            Return ONLY the category name.
            Do not add any explanation.
            Do not use punctuation.
            """.formatted(description);

    String category = chatClient
            .prompt()
            .user(prompt)
            .call()
            .content();

    if (category == null || category.isBlank()) {
        return "Other";
    }

    category = category.trim();

    if (category.equalsIgnoreCase("Food")) {
        return "Food";
    }

    if (category.equalsIgnoreCase("Transport")) {
        return "Transport";
    }

    if (category.equalsIgnoreCase("Shopping")) {
        return "Shopping";
    }

    if (category.equalsIgnoreCase("Entertainment")) {
        return "Entertainment";
    }

    if (category.equalsIgnoreCase("Bills")) {
        return "Bills";
    }

    return "Other";
}
}