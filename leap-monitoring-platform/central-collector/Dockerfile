FROM gradle:9.2-jdk21 AS builder
WORKDIR /build

# Copy root project files from context
COPY gradle.properties .
COPY build.gradle.kts .
COPY settings.gradle.kts .

# Copy all service directories
COPY central-collector ./central-collector
COPY tracking-client-demo ./tracking-client-demo
COPY nextjs-dashboard ./nextjs-dashboard

# Build central-collector JAR
RUN gradle :central-collector:bootJar -x test --no-daemon --quiet

FROM eclipse-temurin:21-jre
WORKDIR /app

COPY --from=builder /build/central-collector/build/libs/central-collector-*.jar /app/collector.jar

EXPOSE 8080

ENV JAVA_OPTS="-Xms256m -Xmx1024m"

HEALTHCHECK --interval=10s --timeout=5s --retries=5 \
  CMD curl -f http://localhost:8080/api/v1/health || exit 1

ENTRYPOINT ["sh", "-c", "java $JAVA_OPTS -jar /app/collector.jar"]
