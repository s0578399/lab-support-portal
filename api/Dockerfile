FROM node:18-alpine

WORKDIR /app

COPY package*.json ./

# --- Proxy-Variablen & NPM-Config ---                
ARG HTTP_PROXY                                     
ARG HTTPS_PROXY                                        
ARG NO_PROXY                                         
ENV HTTP_PROXY=${HTTP_PROXY}                         
ENV HTTPS_PROXY=${HTTPS_PROXY}                         
ENV NO_PROXY=${NO_PROXY}                              
RUN if [ -n "$HTTP_PROXY" ]; then npm config set proxy "$HTTP_PROXY"; fi        
RUN if [ -n "$HTTPS_PROXY" ]; then npm config set https-proxy "$HTTPS_PROXY"; fi 
RUN npm config set fetch-retry-maxtimeout 120000                                   
RUN npm config set fund false && npm config set audit false                       
RUN npm ci --omit=dev

COPY . .

CMD ["npm", "start"]
