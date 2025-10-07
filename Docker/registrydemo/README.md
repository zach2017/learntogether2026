```yaml
version: '3.8'

services:
  registry:
    image: registry:2
    ports:
      - 5000:5000
    volumes:
      - registry-data:/var/lib/registry

  spring-app:
    build:
      context: .
      dockerfile: Dockerfile
    image: localhost:5000/spring-app:latest
    ports:
      - 8080:8080
    depends_on:
      - registry

volumes:
  registry-data:
```

Build with `docker compose build`, push with `docker push localhost:5000/spring-app:latest`, then run `docker compose up`. Assume Dockerfile for Spring app in context.