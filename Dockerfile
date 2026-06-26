FROM node:22-alpine

WORKDIR /app

# Install openssl and other prisma-needed dependencies on alpine
RUN apk add --no-cache openssl libc6-compat

# Copy package management files
COPY package*.json ./

# Install dependencies (including devDependencies so we can run build or db scripts if needed, but we omit husky/git hooks in docker)
RUN npm ci

# Copy the rest of the application files
COPY . .

# Generate Prisma client
RUN npx prisma generate

EXPOSE 5000

CMD ["npm", "start"]
