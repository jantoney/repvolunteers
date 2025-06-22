FROM denoland/deno:alpine-1.36.0
WORKDIR /app
COPY . .
RUN deno cache src/main.ts
CMD ["run", "-A", "src/main.ts"]
