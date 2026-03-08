FROM node:22-alpine AS base
WORKDIR /app

COPY package.json package-lock.json* ./
RUN npm install

COPY . .
RUN npm run build

RUN chown -R node:node /app
USER node
EXPOSE 4000
CMD ["npm", "run", "start"]
