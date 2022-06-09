FROM node:14-alpine
WORKDIR /app
COPY package.json .
COPY package-lock.json .
COPY fusei.wav .
COPY main.js .
RUN npm i
CMD ["node","main.js"]