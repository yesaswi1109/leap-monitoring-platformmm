FROM node:20-alpine

WORKDIR /app

COPY package.json ./
RUN npm install --production

COPY server.js ./

EXPOSE 8080

HEALTHCHECK --interval=5s --timeout=3s --retries=10 \
  CMD node -e "require('http').get('http://localhost:8080/api/v1/health', (r) => {if (r.statusCode !== 200) throw new Error(r.statusCode)})"

CMD ["node", "server.js"]
