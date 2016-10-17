FROM daocloud.io/node:6
COPY . /app
WORKDIR /app
RUN npm install --registry=https://registry.npm.taobao.org
CMD ["npm", "run", "start"]
EXPOSE 80
