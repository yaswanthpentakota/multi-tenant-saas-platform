FROM node:18-alpine

WORKDIR /app

# Copy package files
COPY package*.json ./

# Install dependencies
RUN npm install

# Copy application code
COPY . .

# Create startup script for migrations and server
RUN echo '#!/bin/sh\n\
echo "Waiting for database..."\n\
sleep 10\n\
echo "Running migrations..."\n\
node database/migrations/runMigrations.js\n\
echo "Starting server..."\n\
npm start' > /app/start.sh && chmod +x /app/start.sh

# Expose port
EXPOSE 5000

# Run migrations and start server
CMD ["/app/start.sh"]
