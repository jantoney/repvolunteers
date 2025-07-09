FROM denoland/deno:alpine-2.3.4

# Install tzdata and set timezone
RUN apk add --no-cache tzdata && \
    cp /usr/share/zoneinfo/Australia/Adelaide /etc/localtime && \
    echo "Australia/Adelaide" > /etc/timezone

WORKDIR /app
COPY . .
RUN deno cache src/main.ts
CMD ["run", "-A", "src/main.ts"]
