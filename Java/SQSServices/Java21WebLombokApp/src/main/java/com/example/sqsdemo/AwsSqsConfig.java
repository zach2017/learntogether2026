package  com.example.sqsdemo;

import jakarta.annotation.PostConstruct;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import software.amazon.awssdk.auth.credentials.AwsBasicCredentials;
import software.amazon.awssdk.auth.credentials.StaticCredentialsProvider;
import software.amazon.awssdk.regions.Region;
import software.amazon.awssdk.services.sqs.SqsClient;
import software.amazon.awssdk.services.sqs.model.CreateQueueRequest;
import software.amazon.awssdk.services.sqs.model.GetQueueUrlRequest;
import software.amazon.awssdk.services.sqs.model.QueueDoesNotExistException;

import java.net.URI;

@Slf4j
@Configuration
public class AwsSqsConfig {

    @Value("${aws.region}")
    private String region;

    @Value("${aws.endpoint}")
    private String endpoint;

    @Value("${aws.access-key-id}")
    private String accessKeyId;

    @Value("${aws.secret-access-key}")
    private String secretAccessKey;

    @Value("${sqs.queue-name}")
    private String queueName;

    @Bean
    public SqsClient sqsClient() {
        log.info("Initializing SQS Client with endpoint: {}", endpoint);
        
        return SqsClient.builder()
                .region(Region.of(region))
                .endpointOverride(URI.create(endpoint))
                .credentialsProvider(StaticCredentialsProvider.create(
                        AwsBasicCredentials.create(accessKeyId, secretAccessKey)))
                .build();
    }

    @PostConstruct
    public void initializeQueue() {
        try {
            SqsClient client = sqsClient();
            
            // Try to get the queue URL first
            try {
                String queueUrl = client.getQueueUrl(GetQueueUrlRequest.builder()
                        .queueName(queueName)
                        .build()).queueUrl();
                log.info("Queue already exists: {}", queueUrl);
            } catch (QueueDoesNotExistException e) {
                // Queue doesn't exist, create it
                log.info("Queue does not exist. Creating queue: {}", queueName);
                String queueUrl = client.createQueue(CreateQueueRequest.builder()
                        .queueName(queueName)
                        .build()).queueUrl();
                log.info("Queue created successfully: {}", queueUrl);
            }
        } catch (Exception e) {
            log.error("Error initializing queue", e);
        }
    }

    @Bean
    public String queueName() {
        return queueName;
    }
}
