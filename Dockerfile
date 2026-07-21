FROM node:22-alpine

WORKDIR /app

COPY package.json package-lock.json* ./
COPY server.js ./
COPY index.html faq.html gift-challenge.html dashboard-return.html ./
COPY proposal-template.md ./
COPY ["proposal template doc", "./"]
COPY data ./data
COPY pics ./pics
COPY assets ./assets

ENV NODE_ENV=production
ENV PORT=4173

EXPOSE 4173

CMD ["node", "server.js"]
