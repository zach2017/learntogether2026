curl -X POST http://localhost:8080/login -H "Content-Type: application/json" -H "X-CSRF-TOKEN: assa" -d '{"username":"testuser","password":"password123"}'

curl -X POST http://localhost:8080/token -H "Content-Type: application/x-www-form-urlencoded" -d "grant_type=password" -d "username=testuser" -d "password=password123" -d "client_id=test-client" -d "client_secret=test-secret"