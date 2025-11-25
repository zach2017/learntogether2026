package com.example.sqsdemo;

import com.example.sqsdemo.MessageDTO;
import com.fasterxml.jackson.core.JsonProcessingException;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.fasterxml.jackson.datatype.jsr310.JavaTimeModule;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import software.amazon.awssdk.services.sqs.SqsClient;
import software.amazon.awssdk.services.sqs.model.*;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;
import java.util.UUID;

@Slf4j
@Service
@RequiredArgsConstructor
public class SqsService {

    private final SqsClient sqsClient;
    private final String queueName;
    private final ObjectMapper objectMapper = new ObjectMapper().registerModule(new JavaTimeModule());

    @Value("${sqs.max-messages:1}")
    private Integer maxMessages;

    @Value("${sqs.wait-time-seconds:5}")
    private Integer waitTimeSeconds;

    @Value("${sqs.visibility-timeout:30}")
    private Integer visibilityTimeout;

    /**
     * Publishes a message to the SQS queue
     *
     * @param messageDTO the message to publish
     * @return the message ID from SQS
     */
    public String publishMessage(MessageDTO messageDTO) {
        try {
            // Set timestamp if not provided
            if (messageDTO.getTimestamp() == null) {
                messageDTO.setTimestamp(LocalDateTime.now());
            }

            // Set ID if not provided
            if (messageDTO.getId() == null) {
                messageDTO.setId(UUID.randomUUID().toString());
            }

            // Convert DTO to JSON
            String messageBody = objectMapper.writeValueAsString(messageDTO);

            // Get queue URL
            String queueUrl = getQueueUrl();

            // Send message
            SendMessageRequest sendMessageRequest = SendMessageRequest.builder()
                    .queueUrl(queueUrl)
                    .messageBody(messageBody)
                    .build();

            SendMessageResponse response = sqsClient.sendMessage(sendMessageRequest);
            
            log.info("Message published successfully. MessageId: {}, MD5: {}", 
                    response.messageId(), response.md5OfMessageBody());
            
            return response.messageId();

        } catch (JsonProcessingException e) {
            log.error("Error serializing message to JSON", e);
            throw new RuntimeException("Failed to serialize message", e);
        } catch (SqsException e) {
            log.error("Error publishing message to SQS", e);
            throw new RuntimeException("Failed to publish message to SQS", e);
        }
    }

    /**
     * Reads the next message from the SQS queue
     *
     * @return Optional containing the message DTO if available, empty otherwise
     */
    public Optional<MessageDTO> readMessage() {
        try {
            // Get queue URL
            String queueUrl = getQueueUrl();

            // Receive message
            ReceiveMessageRequest receiveRequest = ReceiveMessageRequest.builder()
                    .queueUrl(queueUrl)
                    .maxNumberOfMessages(maxMessages)
                    .waitTimeSeconds(waitTimeSeconds)
                    .visibilityTimeout(visibilityTimeout)
                    .build();

            ReceiveMessageResponse response = sqsClient.receiveMessage(receiveRequest);
            List<Message> messages = response.messages();

            if (messages.isEmpty()) {
                log.debug("No messages available in the queue");
                return Optional.empty();
            }

            // Get the first message
            Message message = messages.get(0);
            log.info("Received message. MessageId: {}", message.messageId());

            // Parse message body to DTO
            MessageDTO messageDTO = objectMapper.readValue(message.body(), MessageDTO.class);

            // Delete the message from the queue after successful processing
            deleteMessage(queueUrl, message.receiptHandle());

            return Optional.of(messageDTO);

        } catch (JsonProcessingException e) {
            log.error("Error deserializing message from JSON", e);
            throw new RuntimeException("Failed to deserialize message", e);
        } catch (SqsException e) {
            log.error("Error reading message from SQS", e);
            throw new RuntimeException("Failed to read message from SQS", e);
        }
    }

    /**
     * Deletes a message from the queue
     *
     * @param queueUrl the queue URL
     * @param receiptHandle the receipt handle of the message to delete
     */
    private void deleteMessage(String queueUrl, String receiptHandle) {
        try {
            DeleteMessageRequest deleteRequest = DeleteMessageRequest.builder()
                    .queueUrl(queueUrl)
                    .receiptHandle(receiptHandle)
                    .build();

            sqsClient.deleteMessage(deleteRequest);
            log.info("Message deleted successfully from queue");

        } catch (SqsException e) {
            log.error("Error deleting message from SQS", e);
            throw new RuntimeException("Failed to delete message from SQS", e);
        }
    }

    /**
     * Gets the queue URL from the queue name
     *
     * @return the queue URL
     */
    private String getQueueUrl() {
        GetQueueUrlRequest getQueueUrlRequest = GetQueueUrlRequest.builder()
                .queueName(queueName)
                .build();

        return sqsClient.getQueueUrl(getQueueUrlRequest).queueUrl();
    }

    /**
     * Gets approximate number of messages in the queue
     *
     * @return the approximate message count
     */
    public int getApproximateMessageCount() {
        try {
            String queueUrl = getQueueUrl();
            
            GetQueueAttributesRequest attributesRequest = GetQueueAttributesRequest.builder()
                    .queueUrl(queueUrl)
                    .attributeNames(QueueAttributeName.APPROXIMATE_NUMBER_OF_MESSAGES)
                    .build();

            GetQueueAttributesResponse response = sqsClient.getQueueAttributes(attributesRequest);
            String count = response.attributes().get(QueueAttributeName.APPROXIMATE_NUMBER_OF_MESSAGES);
            
            return Integer.parseInt(count);

        } catch (Exception e) {
            log.error("Error getting message count", e);
            return 0;
        }
    }
}
