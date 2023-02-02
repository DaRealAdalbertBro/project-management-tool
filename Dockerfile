FROM node:16.14.0
WORKDIR /
COPY . .
RUN npm install -g pm2
RUN cd client && npm install
RUN cd server && npm install
CMD ["pm2-runtime", "start", "ecosystem.json"]
EXPOSE 9000
EXPOSE 9001