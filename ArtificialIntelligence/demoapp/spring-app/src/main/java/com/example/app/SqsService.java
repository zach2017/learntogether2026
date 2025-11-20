package com.example.app;

import com.fasterxml.jackson.databind.ObjectMapper;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import software.amazon.awssdk.services.sqs.SqsClient;
import software.amazon.awssdk.services.sqs.model.*;

import jakarta.annotation.PostConstruct;
import java.util.HashMap;
import java.util.Map;

@Service
public class SqsService {
    private final SqsClient sqsClient;
    private final ObjectMapper objectMapper;

    @Value("${sqs.queue.name:document-queue}")
    private String queueName;

    private String queueUrl;

    public SqsService(SqsClient sqsClient) {
        this.sqsClient = sqsClient;
        this.objectMapper = new ObjectMapper();
    }

    @PostConstruct
    public void initializeQueue() {
        try {
            GetQueueUrlRequest getQueueUrlRequest = GetQueueUrlRequest.builder()
                    .queueName(queueName)
                    .build();
            GetQueueUrlResponse getQueueUrlResponse = sqsClient.getQueueUrl(getQueueUrlRequest);
            queueUrl = getQueueUrlResponse.queueUrl();
            System.out.println("Queue URL: " + queueUrl);
        } catch (QueueDoesNotExistException e) {
            System.out.println("Creating queue: " + queueName);
            CreateQueueRequest createQueueRequest = CreateQueueRequest.builder()
                    .queueName(queueName)
                    .build();
            CreateQueueResponse createQueueResponse = sqsClient.createQueue(createQueueRequest);
            queueUrl = createQueueResponse.queueUrl();
        }
    }

    public void sendMessage(String documentId, String s3Key, String fileName) {
        Map<String, String> messageBody = new HashMap<>();
        messageBody.put("documentId", documentId);
        messageBody.put("s3Key", s3Key);
        messageBody.put("fileName", fileName);

        try {
            String jsonMessage = objectMapper.writeValueAsString(messageBody);
            SendMessageRequest sendMessageRequest = SendMessageRequest.builder()
                    .queueUrl(queueUrl)
                    .messageBody(jsonMessage)
                    .build();

            sqsClient.sendMessage(sendMessageRequest);
            System.out.println("Message sent to queue: " + documentId);
        } catch (Exception e) {
            System.err.println("Error sending message: " + e.getMessage());
        }
    }

    public String getQueueUrl() {
        return queueUrl;
    }
}
