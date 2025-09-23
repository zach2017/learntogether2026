# kali/Dockerfile
FROM kalilinux/kali-rolling:latest

ENV DEBIAN_FRONTEND=noninteractive
SHELL ["/bin/bash", "-o", "pipefail", "-c"]

# Install common pentest tools. Add/remove packages as needed.
RUN apt-get update && \
    apt-get -y full-upgrade && \
    apt-get install -y --no-install-recommends \
      nmap \
      metasploit-framework \
      hydra \
      hashcat \
      curl \
      wget \
      netcat-traditional \
      sqlmap \
      nikto \
      dirb \
      gobuster \
      iproute2 \
      iputils-ping \
      vim \
      less \
      ca-certificates && \
    apt-get clean && \
    rm -rf /var/lib/apt/lists/*

# create a results directory and wordlists (mounted at runtime if desired)
RUN mkdir -p /results /wordlists && chown -R root:root /results /wordlists

# Keep container interactive by default
CMD ["/bin/bash"]
