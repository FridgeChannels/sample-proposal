FROM node:22-alpine AS build

WORKDIR /app

COPY package.json package-lock.json* ./
RUN npm ci

COPY vite.config.ts tsconfig.json tsconfig.app.json tsconfig.node.json ./
COPY pilot-ops-auth.js ./
COPY gift-challenge-react.html post-meeting.html qualified-meeting-doc.html fit-meeting-sample.html \
     pilot-plan.html pilot-plan-prep.html ./
COPY public ./public
COPY src ./src

# Vite inlines VITE_* at build time. Runtime .env on the container does not
# enable PostHog — pass these as build args (see docker-compose.yml).
ARG VITE_POSTHOG_PROJECT_TOKEN
ARG VITE_POSTHOG_HOST
ARG VITE_POSTHOG_SESSION_REPLAY
ARG VITE_LEGAL_DOCS_BASE_URL
ENV VITE_POSTHOG_PROJECT_TOKEN=$VITE_POSTHOG_PROJECT_TOKEN \
    VITE_POSTHOG_HOST=$VITE_POSTHOG_HOST \
    VITE_POSTHOG_SESSION_REPLAY=$VITE_POSTHOG_SESSION_REPLAY \
    VITE_LEGAL_DOCS_BASE_URL=$VITE_LEGAL_DOCS_BASE_URL

RUN npm run build

FROM node:22-alpine

WORKDIR /app

COPY package.json package-lock.json* ./
RUN npm ci --omit=dev

COPY server.js pilot-commerce.js pilot-session.js pilot-ops-auth.js ./
COPY public/pilot-plan-login.html ./public/pilot-plan-login.html
COPY sql ./sql
COPY proposal-template.md ./
COPY ["proposal template doc", "./"]
COPY pics ./pics
COPY assets ./assets
COPY --from=build /app/dist ./dist

ENV NODE_ENV=production
ENV PORT=4173

EXPOSE 4173

CMD ["node", "server.js"]
