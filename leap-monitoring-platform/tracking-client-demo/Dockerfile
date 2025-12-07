FROM eclipse-temurin:21-jre
WORKDIR /app

# Copy prebuilt jar (packaged by host using scripts/package_jars.sh)
COPY tracking-client-demo/build/libs/tracking-client-demo.jar /app/tracking-client.jar

EXPOSE 8081

ENV JAVA_OPTS="-Xms128m -Xmx512m"

HEALTHCHECK --interval=10s --timeout=5s --retries=5 \
  CMD curl -f http://localhost:8081/actuator/health || exit 1

ENTRYPOINT ["sh", "-c", "java $JAVA_OPTS -jar /app/tracking-client.jar"]
