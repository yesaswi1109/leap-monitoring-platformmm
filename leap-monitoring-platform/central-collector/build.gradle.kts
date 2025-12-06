plugins {
    id("org.springframework.boot") version "3.2.0"
    // REMOVE: id("io.spring.dependency-management") version "1.1.4"
    kotlin("jvm") version "2.0.21"
    kotlin("plugin.spring") version "2.0.21"
    kotlin("plugin.jpa") version "2.0.21"
}

group = "com.leap"
version = "0.0.1-SNAPSHOT"

java {
    sourceCompatibility = JavaVersion.VERSION_17
}

repositories {
    mavenCentral()
}

dependencies {
    // Import Spring Boot BOM so that starter and Spring/Jackson dependencies get consistent versions
    implementation(platform("org.springframework.boot:spring-boot-dependencies:3.2.0"))

    implementation("org.springframework.boot:spring-boot-starter-web")
    implementation("org.springframework.boot:spring-boot-starter-data-mongodb")
    implementation("org.springframework.boot:spring-boot-starter-validation")
    implementation("org.springframework.boot:spring-boot-starter-actuator")

    implementation("com.fasterxml.jackson.module:jackson-module-kotlin")
    implementation("org.jetbrains.kotlin:kotlin-reflect")
    implementation("org.springframework:spring-tx")

    annotationProcessor(platform("org.springframework.boot:spring-boot-dependencies:3.2.0"))
    annotationProcessor("org.springframework.boot:spring-boot-configuration-processor")

    developmentOnly("org.springframework.boot:spring-boot-devtools:3.2.0")

    testImplementation("org.springframework.boot:spring-boot-starter-test")
}

kotlin {
    compilerOptions {
        // Ensure Kotlin bytecode target matches Java 17 to avoid JVM target mismatch errors
        jvmTarget.set(org.jetbrains.kotlin.gradle.dsl.JvmTarget.JVM_17)
        freeCompilerArgs.add("-Xjsr305=strict")
    }
}