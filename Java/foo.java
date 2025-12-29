@Component
@Order(Ordered.HIGHEST_PRECEDENCE) // Run this first
public class S3ConnectionValidator implements CommandLineRunner {
    
    @Value("${aws.s3.bucket-name}")
    private String bucketName;
    
    @Value("${aws.s3.region}")
    private String region;
    
    @Override
    public void run(String... args) throws Exception {
        System.out.println("Validating S3 bucket connection: " + bucketName);
        
        S3Client s3Client = S3Client.builder()
            .region(Region.of(region))
            .build();
        
        try {
            // Check if bucket exists and is accessible
            HeadBucketRequest headBucketRequest = HeadBucketRequest.builder()
                .bucket(bucketName)
                .build();
            
            s3Client.headBucket(headBucketRequest);
            
            System.out.println("✓ Successfully connected to S3 bucket: " + bucketName);
            
        } catch (NoSuchBucketException e) {
            throw new IllegalStateException(
                "S3 bucket does not exist: " + bucketName, e);
                
        } catch (S3Exception e) {
            if (e.statusCode() == 403) {
                throw new IllegalStateException(
                    "Access denied to S3 bucket: " + bucketName + 
                    ". Check IAM permissions.", e);
            } else if (e.statusCode() == 404) {
                throw new IllegalStateException(
                    "S3 bucket not found: " + bucketName, e);
            }
            throw new IllegalStateException(
                "Failed to access S3 bucket: " + bucketName + 
                ". Error: " + e.getMessage(), e);
                
        } catch (SdkClientException e) {
            throw new IllegalStateException(
                "AWS SDK client error. Check credentials and network: " + 
                e.getMessage(), e);
                
        } finally {
            s3Client.close();
        }
    }
}