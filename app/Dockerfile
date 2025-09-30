# --- Build Stage ---
FROM node:22-alpine AS build

WORKDIR /app
# package files aus app/
COPY app/package*.json ./
# --- Proxy ins Image holen (wird über build args gesetzt) ---
ARG HTTP_PROXY
ARG HTTPS_PROXY
ARG NO_PROXY
ENV HTTP_PROXY=${HTTP_PROXY}
ENV HTTPS_PROXY=${HTTPS_PROXY}         
ENV NO_PROXY=${NO_PROXY}                        

# NPM so konfigurieren, dass es den Proxy nutzt             
RUN if [ -n "$HTTP_PROXY" ]; then npm config set proxy "$HTTP_PROXY"; fi     
RUN if [ -n "$HTTPS_PROXY" ]; then npm config set https-proxy "$HTTPS_PROXY"; fi 
RUN npm config set fetch-retry-maxtimeout 120000                                   
RUN npm config set fund false && npm config set audit false                       
RUN npm ci

# ganzen app-Code + Vite-Config rein
COPY app/ ./

# zusätzlich die Schema-Datei aus dem Projektroot in den erwarteten Pfad /app/config/
# (TicketForm.tsx importiert ../../config/form.schema.json relativ zu app/src)
COPY config/form.schema.json /app/config/form.schema.json

# schnelles Build ohne TS-Typecheck (siehe package.json Script)
RUN npm run build:docker

# --- Serve Stage ---
FROM nginx:alpine
COPY --from=build /app/dist /usr/share/nginx/html
COPY app/nginx.conf /etc/nginx/conf.d/default.conf
