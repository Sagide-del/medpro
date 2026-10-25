FROM node:20-alpine

RUN apk add --no-cache python3 py3-pip
COPY podcast-requirements.txt /tmp/podcast-requirements.txt
RUN python3 -m venv /opt/podcast-tts && /opt/podcast-tts/bin/pip install --no-cache-dir -r /tmp/podcast-requirements.txt

WORKDIR /app

COPY package*.json ./
RUN npm install --omit=dev

COPY . .

# Local disk storage for uploads — fine for a single-container deploy with a
# persistent volume mounted at /app/uploads, but wiped on redeploy on
# platforms without a persistent disk (see README "Deploying to production").
RUN mkdir -p uploads

ENV NODE_ENV=production
EXPOSE 5000

CMD ["node", "src/index.js"]
