FROM eclipse-temurin:21-jre
WORKDIR /app

# Copy prebuilt jar (packaged by host using scripts/package_jars.sh)
COPY central-collector/build/libs/central-collector.jar /app/collector.jar

EXPOSE 8080

ENV JAVA_OPTS="-Xms256m -Xmx1024m"

HEALTHCHECK --interval=10s --timeout=5s --retries=5 \
  CMD curl -f http://localhost:8080/api/v1/health || exit 1

ENTRYPOINT ["sh", "-c", "java $JAVA_OPTS -jar /app/collector.jar"]
