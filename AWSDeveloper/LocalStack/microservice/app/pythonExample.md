# requirements.txt
fastapi==0.104.1
uvicorn==0.24.0
boto3==1.29.0
python-multipart==0.0.6
psycopg2-binary==2.9.9
sqlalchemy==2.0.23
pydantic==2.5.0
pydantic-settings==2.1.0
python-jose[cryptography]==3.3.0
passlib[bcrypt]==1.7.4
python-dotenv==1.0.0

# main.py
from fastapi import FastAPI, File, UploadFile, Depends, HTTPException, Header
from fastapi.responses import StreamingResponse
from fastapi.middleware.cors import CORSMiddleware
from typing import List, Optional
import boto3
from botocore.client import Config
import os
import uuid
from datetime import datetime
import io
from sqlalchemy import create_engine, Column, Integer, String, DateTime, Table, ForeignKey
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.orm import sessionmaker, Session, relationship
from pydantic import BaseModel
from jose import jwt, JWTError
from enum import Enum

# Configuration
AWS_ENDPOINT = os.getenv('AWS_ENDPOINT', 'http://localstack:4566')
AWS_REGION = os.getenv('AWS_REGION', 'us-east-1')
AWS_ACCESS_KEY = os.getenv('AWS_ACCESS_KEY_ID', 'test')
AWS_SECRET_KEY = os.getenv('AWS_SECRET_ACCESS_KEY', 'test')
S3_BUCKET = os.getenv('S3_BUCKET_NAME', 'file-uploads')
DYNAMODB_TABLE = os.getenv('DYNAMODB_TABLE_NAME', 'file-metadata')

DATABASE_URL = f"postgresql://{os.getenv('DB_USER', 'admin')}:{os.getenv('DB_PASSWORD', 'admin123')}@{os.getenv('DB_HOST', 'postgres')}:{os.getenv('DB_PORT', '5432')}/{os.getenv('DB_NAME', 'fileservice')}"

# Database setup
engine = create_engine(DATABASE_URL)
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)
Base = declarative_base()

# User Roles association table
user_roles = Table('user_roles', Base.metadata,
    Column('user_id', Integer, ForeignKey('users.id')),
    Column('role_id', Integer, ForeignKey('roles.id'))
)

# Models
class User(Base):
    __tablename__ = 'users'
    id = Column(Integer, primary_key=True, index=True)
    cognito_sub = Column(String, unique=True, nullable=False)
    username = Column(String, nullable=False)
    email = Column(String, nullable=False)
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    roles = relationship("Role", secondary=user_roles, back_populates="users")

class Role(Base):
    __tablename__ = 'roles'
    id = Column(Integer, primary_key=True, index=True)
    role_name = Column(String, unique=True, nullable=False)
    description = Column(String)
    users = relationship("User", secondary=user_roles, back_populates="roles")

# Pydantic models
class FileMetadataSchema(BaseModel):
    fileId: str
    userId: str
    fileName: str
    contentType: str
    fileSize: int
    s3Key: str
    uploadedAt: str
    lastModified: Optional[str] = None

class RoleEnum(str, Enum):
    ADMIN = "admin"
    UPLOAD = "upload"
    DOWNLOAD = "download"
    VIEW = "view"
    GUEST = "guest"

# AWS Clients
s3_client = boto3.client(
    's3',
    endpoint_url=AWS_ENDPOINT,
    aws_access_key_id=AWS_ACCESS_KEY,
    aws_secret_access_key=AWS_SECRET_KEY,
    region_name=AWS_REGION,
    config=Config(signature_version='s3v4')
)

dynamodb = boto3.resource(
    'dynamodb',
    endpoint_url=AWS_ENDPOINT,
    aws_access_key_id=AWS_ACCESS_KEY,
    aws_secret_access_key=AWS_SECRET_KEY,
    region_name=AWS_REGION
)

dynamodb_table = dynamodb.Table(DYNAMODB_TABLE)

# FastAPI app
app = FastAPI(title="Python File Service")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Dependency
def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()

# JWT Authentication
def decode_token(authorization: str = Header(None)):
    if not authorization or not authorization.startswith("Bearer "):
        raise HTTPException(status_code=401, detail="Invalid authorization header")
    
    token = authorization.split(" ")[1]
    try:
        payload = jwt.decode(token, "your-secret-key", algorithms=["HS256"])
        return payload
    except JWTError:
        raise HTTPException(status_code=401, detail="Invalid token")

def check_roles(required_roles: List[str]):
    def role_checker(token_data: dict = Depends(decode_token), db: Session = Depends(get_db)):
        user_roles = token_data.get("roles", [])
        
        if not any(role in user_roles for role in required_roles):
            raise HTTPException(status_code=403, detail="Insufficient permissions")
        
        return token_data
    return role_checker

# Routes
@app.get("/")
def read_root():
    return {"service": "Python File Service", "status": "running"}

@app.post("/api/files/upload", response_model=FileMetadataSchema)
async def upload_file(
    file: UploadFile = File(...),
    token_data: dict = Depends(check_roles(["admin", "upload"]))
):
    try:
        user_id = token_data.get("sub")
        file_id = str(uuid.uuid4())
        s3_key = f"{user_id}/{file_id}/{file.filename}"
        
        # Read file content
        content = await file.read()
        
        # Upload to S3
        s3_client.put_object(
            Bucket=S3_BUCKET,
            Key=s3_key,
            Body=content,
            ContentType=file.content_type
        )
        
        # Save metadata to DynamoDB
        uploaded_at = datetime.utcnow().isoformat()
        metadata = {
            'fileId': file_id,
            'userId': user_id,
            'fileName': file.filename,
            'contentType': file.content_type,
            'fileSize': len(content),
            's3Key': s3_key,
            'uploadedAt': uploaded_at,
            'lastModified': uploaded_at
        }
        
        dynamodb_table.put_item(Item=metadata)
        
        return FileMetadataSchema(**metadata)
    
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/api/files/{file_id}", response_model=FileMetadataSchema)
async def get_file_metadata(
    file_id: str,
    token_data: dict = Depends(check_roles(["admin", "view", "download"]))
):
    try:
        response = dynamodb_table.get_item(Key={'fileId': file_id})
        
        if 'Item' not in response:
            raise HTTPException(status_code=404, detail="File not found")
        
        metadata = response['Item']
        
        # Check if user has view-only role (and not admin or download)
        user_roles = token_data.get("roles", [])
        if "view" in user_roles and "admin" not in user_roles and "download" not in user_roles:
            # Return metadata but signal view-only access
            raise HTTPException(
                status_code=403, 
                detail="View-only access: download not permitted",
                headers={"X-Error-Message": "View-only access: download not permitted"}
            )
        
        return FileMetadataSchema(**metadata)
    
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/api/files/{file_id}/download")
async def download_file(
    file_id: str,
    token_data: dict = Depends(check_roles(["admin", "download"]))
):
    try:
        # Get metadata
        response = dynamodb_table.get_item(Key={'fileId': file_id})
        
        if 'Item' not in response:
            raise HTTPException(status_code=404, detail="File not found")
        
        metadata = response['Item']
        
        # Download from S3
        s3_response = s3_client.get_object(Bucket=S3_BUCKET, Key=metadata['s3Key'])
        file_content = s3_response['Body'].read()
        
        return StreamingResponse(
            io.BytesIO(file_content),
            media_type=metadata['contentType'],
            headers={
                "Content-Disposition": f"attachment; filename={metadata['fileName']}"
            }
        )
    
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/api/files/list", response_model=List[FileMetadataSchema])
async def list_files(
    token_data: dict = Depends(check_roles(["admin", "view", "upload", "download", "guest"]))
):
    try:
        user_id = token_data.get("sub")
        
        # Query DynamoDB for user's files
        response = dynamodb_table.query(
            IndexName='UserIdIndex',
            KeyConditionExpression='userId = :userId',
            ExpressionAttributeValues={':userId': user_id}
        )
        
        files = [FileMetadataSchema(**item) for item in response['Items']]
        return files
    
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.delete("/api/files/{file_id}")
async def delete_file(
    file_id: str,
    token_data: dict = Depends(check_roles(["admin"]))
):
    try:
        # Get metadata
        response = dynamodb_table.get_item(Key={'fileId': file_id})
        
        if 'Item' not in response:
            raise HTTPException(status_code=404, detail="File not found")
        
        metadata = response['Item']
        
        # Delete from S3
        s3_client.delete_object(Bucket=S3_BUCKET, Key=metadata['s3Key'])
        
        # Delete from DynamoDB
        dynamodb_table.delete_item(Key={'fileId': file_id})
        
        return {"message": "File deleted successfully"}
    
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/health")
def health_check():
    return {"status": "healthy"}

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)

# Dockerfile
FROM python:3.11-slim

WORKDIR /app

COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

COPY . .

EXPOSE 8000

CMD ["uvicorn", "main:app", "--host", "0.0.0.0", "--port", "8000", "--reload"]