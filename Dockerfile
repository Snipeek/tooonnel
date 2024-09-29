FROM node:20-alpine

COPY . .

CMD node ./server.js
