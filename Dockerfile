FROM node:alpine

COPY --chown=node:node . .

RUN npm install --quiet --production

CMD ["npm", "run", "start"]