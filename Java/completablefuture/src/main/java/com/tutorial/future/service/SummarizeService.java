package com.tutorial.future.service;

import org.springframework.stereotype.Service;

import com.tutorial.future.service.OllamaClientService;
import lombok.extern.slf4j.Slf4j;
import java.util.concurrent.CompletableFuture;

@Service
@Slf4j
public class SummarizeService {

    private final OllamaClientService ollamaClient;

    public SummarizeService(OllamaClientService ollamaClient) {
        this.ollamaClient = ollamaClient;
    }

    /**
     * Asynchronously summarizes a long text by fetching data from an external API
     */
    public CompletableFuture<String> summarize(String text) {
        return CompletableFuture.supplyAsync(() -> {
            // Simulate fetching summary from an external service
            try {

                String prompt = "List 5 key research questions about ";
                String response = ollamaClient.sendPrompt(prompt);
                System.out.println("Ollama response: " + response);
                return "Summary: " + text.substring(0, Math.min(50, text.length())) + "...";
            } catch (Exception e) {
                Thread.currentThread().interrupt();
                throw new RuntimeException("Summarization interrupted", e);
            }
        });
    }

    /**
     * Chains multiple async operations: fetch text, then summarize it
     */
    public CompletableFuture<String> summarizeFromUrl(String url) {
        return CompletableFuture.supplyAsync(() -> {
            // Simulate fetching content from URL
            return "Long content from " + url;
        }).thenApplyAsync(content -> {
            // Then summarize the fetched content
            try {
                Thread.sleep(1000);
                return "Summary: " + content.substring(0, Math.min(40, content.length())) + "...";
            } catch (InterruptedException e) {
                Thread.currentThread().interrupt();
                throw new RuntimeException("Summarization failed", e);
            }
        });
    }

    /**
     * Combines multiple summarization tasks
     */
    public CompletableFuture<String> summarizeMultiple(String text1, String text2) {
        CompletableFuture<String> summary1 = summarize(text1);
        CompletableFuture<String> summary2 = summarize(text2);

        return summary1.thenCombine(summary2, (s1, s2) -> s1 + " | " + s2);
    }
}