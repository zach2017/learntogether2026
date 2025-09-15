# Simple Docker Localstack for AWS Development

## Quickstart commands

- docker compose -f docker-compose.yml up -d
- aws configure --profile localstack
- aws --profile localstack --endpoint-url http://localhost:4566 s3api create-bucket --bucket file-uploads
- aws --profile localstack --endpoint-url http://localhost:4566 s3 ls
- aws --profile localstack --endpoint-url http://localhost:4566 s3 ls s3://file-uploads/
- aws --profile localstack --endpoint-url http://localhost:4566 iam create-role --role-name lambda-s3-role --assume-role-policy-document file://trust-policy.json
- aws --profile localstack --endpoint-url http://localhost:4566 iam attach-role-policy --role-name lambda-s3-role --policy-arn arn:aws:iam::aws:policy/AmazonS3FullAccess

## Detaied Explaination

### 1. `aws configure --profile localstack`

#### Purpose:
This command is used to configure an AWS CLI profile named `localstack`. A profile in the AWS CLI is a set of configuration settings, including credentials (access key and secret key), region, and output format, that the CLI uses to authenticate and interact with AWS services or, in this case, a LocalStack instance emulating AWS services.

#### Breakdown:
- **`aws configure`**: This is the AWS CLI command to set up or modify configuration settings for interacting with AWS services. It prompts the user to input:
  - **AWS Access Key ID**: A key used for authentication.
  - **AWS Secret Access Key**: The secret key paired with the access key for authentication.
  - **Default region name**: The AWS region to use (e.g., `us-east-1`).
  - **Default output format**: The format for command output (e.g., `json`, `yaml`, `text`, or `table`).
- **`--profile localstack`**: Specifies the name of the profile to configure. Profiles allow you to store multiple sets of credentials and settings in the AWS CLI. Here, `localstack` is the profile name, which is typically used when working with LocalStack to distinguish it from real AWS profiles.

#### What It Does:
- When you run this command, the AWS CLI creates or updates a profile named `localstack` in the AWS CLI configuration files:
  - **Credentials file** (`~/.aws/credentials` on Linux/Mac or `%USERPROFILE%\.aws\credentials` on Windows): Stores the access key and secret key.
  - **Configuration file** (`~/.aws/config` on Linux/Mac or `%USERPROFILE%\.aws\config` on Windows): Stores the region and output format.
- For LocalStack, you typically provide dummy credentials (e.g., `test` for both access key and secret key) because LocalStack does not require real AWS credentials. A common configuration might look like:
  ```
  [localstack]
  aws_access_key_id = test
  aws_secret_access_key = test
  ```
  and
  ```
  [profile localstack]
  region = us-east-1
  output = json
  ```
- This profile allows subsequent AWS CLI commands to use the `localstack` configuration when interacting with a LocalStack instance running locally.

#### Context with LocalStack:
- LocalStack is a tool that emulates AWS services (like S3, DynamoDB, etc.) on your local machine, typically for development and testing. The `localstack` profile ensures that CLI commands target the LocalStack environment rather than the real AWS cloud.
- You might run this command once to set up the profile before using LocalStack.

#### Example Execution:
Running `aws configure --profile localstack` will prompt:
```
AWS Access Key ID [None]: test
AWS Secret Access Key [None]: test
Default region name [None]: us-east-1
Default output format [None]: json
```

#### Notes:
- If the profile already exists, this command overwrites its settings.
- The credentials for LocalStack are arbitrary since LocalStack does not perform real authentication, but they must be present to satisfy the AWS CLI’s requirements.
- Always ensure the profile name (`localstack`) is used consistently in subsequent commands.

---

### 2. `aws --profile localstack --endpoint-url http://localhost:4566 s3api create-bucket --bucket file-uploads`

#### Purpose:
This command creates an S3 bucket named `file-uploads` in the LocalStack environment, which emulates AWS S3 (Simple Storage Service).

#### Breakdown:
- **`aws`**: The base AWS CLI command.
- **`--profile localstack`**: Specifies that the command should use the `localstack` profile configured earlier, which points to the LocalStack environment.
- **`--endpoint-url http://localhost:4566`**: Overrides the default AWS endpoint (e.g., `s3.amazonaws.com`) to point to the LocalStack instance running locally. LocalStack typically runs on `http://localhost:4566` by default.
- **`s3api`**: Specifies the AWS S3 API subcommand, which provides low-level, API-specific operations for S3 (as opposed to the higher-level `s3` subcommand).
- **`create-bucket`**: The specific S3 API operation to create a new bucket.
- **`--bucket file-uploads`**: Specifies the name of the bucket to create (`file-uploads`).

#### What It Does:
- The command sends a request to the LocalStack S3 service (running at `http://localhost:4566`) to create a new bucket named `file-uploads`.
- In a real AWS environment, bucket names must be globally unique across all AWS accounts and follow specific naming rules (e.g., 3–63 characters, lowercase, no underscores). In LocalStack, these restrictions are typically relaxed, but it’s good practice to follow AWS naming conventions.
- If successful, the command returns a JSON response indicating the bucket was created, something like:
  ```json
  {
      "Location": "/file-uploads"
  }
  ```

#### Context with LocalStack:
- Since this command targets LocalStack, the bucket is created in the local emulated S3 service, not in the real AWS cloud.
- LocalStack’s S3 service mimics AWS S3, allowing you to test S3-related operations (e.g., creating buckets, uploading files) without incurring AWS costs or requiring an internet connection.
- The `--endpoint-url` flag is critical because it ensures the command targets LocalStack instead of AWS’s real S3 service.

#### Notes:
- If the bucket already exists in LocalStack, the command will fail with an error like `BucketAlreadyExists`.
- You can specify additional parameters, such as `--region` (e.g., `--region us-east-1`), but if not provided, the region from the `localstack` profile is used.
- Ensure LocalStack is running locally (e.g., via `docker run localstack/localstack` or a similar setup) and accessible at `http://localhost:4566` before running this command.

---

### 3. `aws --profile localstack --endpoint-url http://localhost:4566 s3 ls`

#### Purpose:
This command lists all S3 buckets in the LocalStack environment.

#### Breakdown:
- **`aws`**: The base AWS CLI command.
- **`--profile localstack`**: Uses the `localstack` profile to authenticate and configure the command for LocalStack.
- **`--endpoint-url http://localhost:4566`**: Directs the command to the LocalStack S3 service running locally.
- **`s3`**: The high-level S3 subcommand (as opposed to `s3api`), used for common S3 operations like listing buckets or objects.
- **`ls`**: The operation to list all buckets in the S3 service.

#### What It Does:
- The command queries the LocalStack S3 service to retrieve a list of all buckets created in the local environment.
- The output is a simple text list of bucket names with their creation dates, for example:
  ```
  2025-09-15 13:00:00 file-uploads
  ```
- If no buckets exist, the command returns an empty result.

#### Context with LocalStack:
- This command is useful for verifying that buckets (like `file-uploads` from the previous command) were created successfully in LocalStack.
- It mimics the AWS S3 `ListBuckets` API operation but targets the local emulator.

#### Notes:
- The `s3 ls` command does not accept a specific bucket name; it always lists all buckets.
- The output format (e.g., text, as shown above) depends on the `output` setting in the `localstack` profile (e.g., `json` or `text`).

---

### 4. `aws --profile localstack --endpoint-url http://localhost:4566 s3 ls s3://file-uploads/`

#### Purpose:
This command lists the objects (files) in the `file-uploads` bucket in the LocalStack S3 service.

#### Breakdown:
- **`aws`**: The base AWS CLI command.
- **`--profile localstack`**: Uses the `localstack` profile for configuration and credentials.
- **`--endpoint-url http://localhost:4566`**: Targets the LocalStack S3 service.
- **`s3`**: The high-level S3 subcommand for common operations.
- **`ls`**: The operation to list objects in a bucket.
- **`s3://file-uploads/`**: Specifies the S3 bucket (`file-uploads`) to list objects from. The `s3://` prefix is standard for S3 URIs, and the trailing `/` indicates the root of the bucket.

#### What It Does:
- The command queries the LocalStack S3 service to list all objects (files or folders) in the `file-uploads` bucket.
- If the bucket contains objects, the output lists them with their last modified date, size, and key (file name), for example:
  ```
  2025-09-15 13:05:00       1234 example.txt
  ```
- If the bucket is empty or does not exist, the command returns nothing or an error, respectively.

#### Context with LocalStack:
- This command is useful for checking the contents of a specific bucket in the LocalStack environment.
- It mimics the AWS S3 `ListObjectsV2` API operation but operates locally.
- The `s3://file-uploads/` syntax is standard for specifying S3 buckets and paths.

#### Notes:
- If the bucket does not exist, the command will fail with an error like `NoSuchBucket`.
- You can list objects in a specific prefix (subfolder) by appending a path, e.g., `s3://file-uploads/subfolder/`.
- The output format depends on the `output` setting in the `localstack` profile.

---

### Summary of Commands in Sequence:
1. **`aws configure --profile localstack`**: Sets up a profile named `localstack` with dummy credentials and configuration (e.g., region, output format) for use with LocalStack.
2. **`aws --profile localstack --endpoint-url http://localhost:4566 s3api create-bucket --bucket file-uploads`**: Creates a bucket named `file-uploads` in the LocalStack S3 service.
3. **`aws --profile localstack --endpoint-url http://localhost:4566 s3 ls`**: Lists all buckets in the LocalStack S3 service, which should include `file-uploads` if created successfully.
4. **`aws --profile localstack --endpoint-url http://localhost:4566 s3 ls s3://file-uploads/`**: Lists the objects in the `file-uploads` bucket, showing any files or folders stored within it.

#### Key Points:
- These commands are designed to work with LocalStack, a local emulator of AWS services, as indicated by the `--endpoint-url http://localhost:4566` flag.
- The `localstack` profile ensures that commands target the local environment instead of real AWS services.
- The commands collectively set up and verify an S3 bucket in a local development environment, useful for testing S3-related functionality without interacting with the actual AWS cloud.
- Ensure LocalStack is running locally and accessible at `http://localhost:4566` before executing these commands.
- The `s3api` subcommand (`create-bucket`) is low-level and API-specific, while the `s3` subcommand (`ls`) is high-level and user-friendly.

