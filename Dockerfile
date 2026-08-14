FROM node:22-alpine AS build

WORKDIR /app

COPY package.json package-lock.json* ./
RUN npm ci

COPY vite.config.ts tsconfig.json tsconfig.app.json tsconfig.node.json ./
COPY gift-challenge-react.html post-meeting.html qualified-meeting-doc.html fit-meeting-sample.html \
     pilot-plan.html pilot-plan-prep.html ./
COPY public ./public
COPY src ./src

RUN npm run build

FROM node:22-alpine

WORKDIR /app

COPY package.json package-lock.json* ./
RUN npm ci --omit=dev

COPY server.js pilot-commerce.js pilot-session.js ./
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
