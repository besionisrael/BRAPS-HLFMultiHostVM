FROM node:10.13-alpine
WORKDIR /usr/src/app
COPY . .
RUN npm install
EXPOSE 8082
CMD node apiService.js