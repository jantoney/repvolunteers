FROM denoland/deno:alpine-2.9.8

# Install tzdata and set timezone
RUN apk upgrade --no-cache && apk add --no-cache tzdata && \
    cp /usr/share/zoneinfo/Australia/Adelaide /etc/localtime && \
    echo "Australia/Adelaide" > /etc/timezone

WORKDIR /app
COPY . .
RUN deno cache src/main.ts
CMD ["run", "-A", "src/main.ts"]
