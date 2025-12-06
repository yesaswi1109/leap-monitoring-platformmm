package com.leap.monitoring.client

import io.github.bucket4j.Bandwidth
import io.github.bucket4j.Bucket
import io.github.bucket4j.Bucket4j
import org.springframework.boot.context.properties.ConfigurationProperties
import org.springframework.context.annotation.Configuration
import org.springframework.stereotype.Component
import java.time.Duration
import java.util.concurrent.ConcurrentHashMap
import org.springframework.boot.context.properties.bind.ConstructorBinding

/** Manages the per-service rate limit buckets using Bucket4j. */
@Component
class RateLimiterRegistry(
    private val rateLimitProperties: RateLimitProperties
) {
    private val buckets: MutableMap<String, Bucket> = ConcurrentHashMap()
    private val defaultLimit: Long = rateLimitProperties.defaultLimitPerSecond.toLong()

    fun getBucket(serviceName: String): Bucket {
        return buckets.computeIfAbsent(serviceName) {
            val override = rateLimitProperties.overrides.find { it.service == serviceName }
            val limit = override?.limit?.toLong() ?: defaultLimit
            
            val limitBandwidth: Bandwidth = Bandwidth.simple(limit, Duration.ofSeconds(1))

            Bucket4j.builder().addLimit(limitBandwidth).build()
        }
    }
}

@Configuration
@ConfigurationProperties(prefix = "monitoring.ratelimit")
class RateLimitProperties {
    var defaultLimitPerSecond: Int = 100
    var overrides: MutableList<ServiceRateLimit> = mutableListOf()
}

data class ServiceRateLimit(
    var service: String = "",
    var limit: Int = 100
)