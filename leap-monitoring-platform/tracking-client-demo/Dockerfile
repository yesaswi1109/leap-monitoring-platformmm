FROM gradle:9.2-jdk21 AS builder
WORKDIR /build

# Copy root project files
COPY gradle.properties .
COPY build.gradle.kts .
COPY settings.gradle.kts .

# Copy all service directories
COPY central-collector ./central-collector
COPY tracking-client-demo ./tracking-client-demo
COPY nextjs-dashboard ./nextjs-dashboard

# Build tracking-client-demo JAR
RUN gradle :tracking-client-demo:bootJar -x test --no-daemon --quiet

FROM eclipse-temurin:21-jre
WORKDIR /app

COPY --from=builder /build/tracking-client-demo/build/libs/tracking-client-demo-*.jar /app/tracking-client.jar

EXPOSE 8081

ENV JAVA_OPTS="-Xms128m -Xmx512m"

HEALTHCHECK --interval=10s --timeout=5s --retries=5 \
  CMD curl -f http://localhost:8081/actuator/health || exit 1

ENTRYPOINT ["sh", "-c", "java $JAVA_OPTS -jar /app/tracking-client.jar"]
