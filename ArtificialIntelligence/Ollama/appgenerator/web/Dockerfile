FROM nginx:alpine

# Serve our static site
COPY index.html /usr/share/nginx/html/index.html

# Simple secure default server
RUN rm -f /etc/nginx/conf.d/default.conf || true
COPY nginx.conf /etc/nginx/conf.d/default.conf
