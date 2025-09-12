# backend/app.py - Python Flask Alternative
import os
import boto3
from datetime import datetime
from flask import Flask, request, jsonify, send_file
from flask_cors import CORS
from werkzeug.utils import secure_filename
from dotenv import load_dotenv
import io

# Load environment variables
load_dotenv()

app = Flask(__name__)
CORS(app)

# Configuration
BUCKET_NAME = os.getenv('S3_BUCKET_NAME', 'file-uploads')
AWS_ENDPOINT_URL = os.getenv('AWS_ENDPOINT_URL', 'http://localhost:4566')
AWS_ACCESS_KEY_ID = os.getenv('AWS_ACCESS_KEY_ID', 'test')
AWS_SECRET_ACCESS_KEY = os.getenv('AWS_SECRET_ACCESS_KEY', 'test')
AWS_DEFAULT_REGION = os.getenv('AWS_DEFAULT_REGION', 'us-east-1')

# Configure boto3 S3 client for LocalStack
s3_client = boto3.client(
    's3',
    endpoint_url=AWS_ENDPOINT_URL,
    aws_access_key_id=AWS_ACCESS_KEY_ID,
    aws_secret_access_key=AWS_SECRET_ACCESS_KEY,
    region_name=AWS_DEFAULT_REGION
)

# File upload configuration
MAX_FILE_SIZE = 10 * 1024 * 1024  # 10MB
ALLOWED_EXTENSIONS = {'txt', 'pdf', 'png', 'jpg', 'jpeg', 'gif', 'doc', 'docx'}

def allowed_file(filename):
    return '.' in filename and \
           filename.rsplit('.', 1)[1].lower() in ALLOWED_EXTENSIONS

@app.route('/health', methods=['GET'])
def health_check():
    """Health check endpoint"""
    return jsonify({
        'status': 'OK',
        'timestamp': datetime.now().isoformat()
    })

@app.route('/upload', methods=['POST'])
def upload_file():
    """Upload file to S3"""
    try:
        if 'file' not in request.files:
            return jsonify({'error': 'No file provided'}), 400
        
        file = request.files['file']
        
        if file.filename == '':
            return jsonify({'error': 'No file selected'}), 400
        
        if not file:
            return jsonify({'error': 'Invalid file'}), 400
        
        # Secure the filename
        filename = secure_filename(file.filename)
        file_key = f"uploads/{int(datetime.now().timestamp())}-{filename}"
        
        # Upload to S3
        s3_client.put_object(
            Bucket=BUCKET_NAME,
            Key=file_key,
            Body=file.read(),
            ContentType=file.content_type or 'application/octet-stream'
        )
        
        return jsonify({
            'message': 'File uploaded successfully',
            'key': file_key,
            'originalName': filename,
            'contentType': file.content_type
        })
        
    except Exception as e:
        return jsonify({
            'error': 'Failed to upload file',
            'details': str(e)
        }), 500

@app.route('/files', methods=['GET'])
def list_files():
    """List all uploaded files"""
    try:
        response = s3_client.list_objects_v2(
            Bucket=BUCKET_NAME,
            Prefix='uploads/'
        )
        
        files = []
        if 'Contents' in response:
            for obj in response['Contents']:
                files.append({
                    'Key': obj['Key'],
                    'Size': obj['Size'],
                    'LastModified': obj['LastModified'].isoformat(),
                    'ETag': obj['ETag']
                })
        
        return jsonify({'files': files})
        
    except Exception as e:
        return jsonify({
            'error': 'Failed to list files',
            'details': str(e)
        }), 500

@app.route('/download/<path:file_key>', methods=['GET'])
def download_file(file_key):
    """Download file from S3"""
    try:
        # Get object from S3
        response = s3_client.get_object(Bucket=BUCKET_NAME, Key=file_key)
        
        # Create a BytesIO object to serve the file
        file_data = io.BytesIO(response['Body'].read())
        file_data.seek(0)
        
        # Extract filename from key
        filename = file_key.split('/')[-1]
        
        return send_file(
            file_data,
            as_attachment=True,
            download_name=filename,
            mimetype=response.get('ContentType', 'application/octet-stream')
        )
        
    except s3_client.exceptions.NoSuchKey:
        return jsonify({'error': 'File not found'}), 404
    except Exception as e:
        return jsonify({
            'error': 'Failed to download file',
            'details': str(e)
        }), 500

@app.route('/delete/<path:file_key>', methods=['DELETE'])
def delete_file(file_key):
    """Delete file from S3"""
    try:
        s3_client.delete_object(Bucket=BUCKET_NAME, Key=file_key)
        
        return jsonify({
            'message': 'File deleted successfully',
            'key': file_key
        })
        
    except Exception as e:
        return jsonify({
            'error': 'Failed to delete file',
            'details': str(e)
        }), 500

@app.route('/generate-upload-url', methods=['POST'])
def generate_upload_url():
    """Generate presigned URL for direct S3 upload"""
    try:
        data = request.get_json()
        filename = data.get('fileName')
        file_type = data.get('fileType', 'application/octet-stream')
        
        if not filename:
            return jsonify({'error': 'fileName is required'}), 400
        
        file_key = f"uploads/{int(datetime.now().timestamp())}-{secure_filename(filename)}"
        
        # Generate presigned URL
        upload_url = s3_client.generate_presigned_url(
            'put_object',
            Params={
                'Bucket': BUCKET_NAME,
                'Key': file_key,
                'ContentType': file_type
            },
            ExpiresIn=3600  # 1 hour
        )
        
        return jsonify({
            'uploadUrl': upload_url,
            'key': file_key,
            'expiresIn': 3600
        })
        
    except Exception as e:
        return jsonify({
            'error': 'Failed to generate upload URL',
            'details': str(e)
        }), 500

if __name__ == '__main__':
    app.run(host='0.0.0.0', port=3001, debug=True)