FROM node
WORKDIR /app
COPY package.json /app/
RUN npm install
COPY index.js /app/
EXPOSE 8080
CMD ["npm", "start"]