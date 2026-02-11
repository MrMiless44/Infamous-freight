FROM node:20
WORKDIR /app
COPY package*.json ./
RUN npm install
RUN npm install && npm run build
ENV NODE_ENV=production
EXPOSE 3000
CMD ["npm", "run", "start", "--", "-H", "0.0.0.0", "-p", "3000"]
