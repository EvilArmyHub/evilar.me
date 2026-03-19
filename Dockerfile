FROM node:25-slim

WORKDIR /workspace

ENV PNPM_HOME="/pnpm"
ENV PATH="$PNPM_HOME:$PATH"

RUN npm install -g pnpm @kilocode/cli

CMD ["/bin/sh"]
