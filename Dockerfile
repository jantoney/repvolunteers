FROM denoland/deno:alpine-2.3.4
WORKDIR /app
COPY . .
RUN deno cache src/main.ts
CMD ["run", "-A", "src/main.ts"]
