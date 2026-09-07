FROM node:22-bookworm-slim

ENV DEBIAN_FRONTEND=noninteractive
ENV HOME=/home/sandbox
ENV NPM_CONFIG_PREFIX=/home/sandbox/.npm-global
ENV PATH=/home/sandbox/.npm-global/bin:/usr/local/bin:/usr/local/sbin:/usr/sbin:/sbin:/usr/bin:/bin

RUN apt-get update \
    && apt-get install -y --no-install-recommends \
        ca-certificates \
        passwd \
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


COPY --chown=sandbox:sandbox docker/entrypoint.sh /usr/local/bin/entrypoint.sh

COPY --chown=sandbox:sandbox docker/github-app-credential-helper /usr/local/bin/github-app-credential-helper

RUN chmod +x /usr/local/bin/github-app-credential-helper

USER sandbox

ENTRYPOINT ["/usr/bin/tini", "--", "/usr/local/bin/entrypoint.sh"]

CMD ["sleep", "infinity"]
