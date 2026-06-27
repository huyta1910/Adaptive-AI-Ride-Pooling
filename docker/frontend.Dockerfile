FROM node:22-alpine AS dependencies
WORKDIR /app/frontend
COPY frontend/package*.json ./
RUN npm install

FROM node:22-alpine AS runner
WORKDIR /app/frontend
COPY --from=dependencies /app/frontend/node_modules ./node_modules
COPY frontend ./
EXPOSE 5173
CMD ["npm", "run", "dev", "--", "--host", "0.0.0.0"]
