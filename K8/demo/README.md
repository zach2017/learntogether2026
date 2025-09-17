# Demo Test

- Start demo Docker

docker compose -f docker-compose.yml up -d

- Run the following command after 

```sh
ab -n 5333 -c 200 http://localhost:8080/
```