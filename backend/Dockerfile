FROM node:22-alpine

WORKDIR /app

COPY package.json package-lock.json tsconfig.base.json ./
COPY packages/shared/package.json ./packages/shared/
COPY backend/package.json ./backend/

RUN npm ci

COPY packages/shared ./packages/shared
COPY backend ./backend

WORKDIR /app/backend

CMD ["npm", "run", "dev"]
