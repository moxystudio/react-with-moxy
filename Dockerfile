FROM node:8-alpine

# Define static environment variables
ENV PORT 3000
ENV HOST_NAME 0.0.0.0

# Define customizable environment variables
ARG GA_TRACKING_CODE
ARG SITE_URL
ARG PUBLIC_URL
ENV SITE_URL=$SITE_URL
ENV PUBLIC_URL=$PUBLIC_URL
ENV REACT_APP_GA_TRACKING_CODE=$GA_TRACKING_CODE

# Create directory
WORKDIR /usr/src/app

# Install dependencies
COPY package*.json ./
RUN npm install

# Bundle source & build the project
COPY . .
RUN npm run build

# Get rid of devDependencies used for the build
RUN npm prune --production

EXPOSE $PORT
CMD ["npm", "start"]
