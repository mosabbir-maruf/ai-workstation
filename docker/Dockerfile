FROM node:22-bookworm-slim

ENV DEBIAN_FRONTEND=noninteractive
ENV HOME=/home/sandbox
ENV NPM_CONFIG_PREFIX=/home/sandbox/.npm-global
ENV PATH=/home/sandbox/.npm-global/bin:/usr/local/bin:/usr/bin:/bin

RUN apt-get update \
    && apt-get install -y --no-install-recommends \
        ca-certificates \
        curl \
        git \
        openssh-client \
        ripgrep \
        fd-find \
        procps \
        tini \
    && rm -rf /var/lib/apt/lists/*

RUN useradd \
    --create-home \
    --shell /bin/bash \
    --uid 1001 \
    sandbox

RUN mkdir -p \
        /home/sandbox/.npm-global \
        /home/sandbox/.dsh \
        /workspace \
    && chown -R sandbox:sandbox \
        /home/sandbox \
        /workspace

WORKDIR /workspace

USER sandbox

CMD ["sleep", "infinity"]
