# --- Build Stage ---
FROM node:22-alpine AS build

WORKDIR /app
# package files aus app/
COPY app/package*.json ./
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
