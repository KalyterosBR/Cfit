FROM node:22-alpine

WORKDIR /frontend

COPY frontend/package*.json ./

RUN npm install

COPY frontend .

EXPOSE 5173

CMD ["npm", "run", "dev", "--", "--host"]