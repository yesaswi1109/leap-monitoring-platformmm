package com.leap.monitoring

import org.springframework.boot.autoconfigure.SpringBootApplication
import org.springframework.boot.runApplication
import org.springframework.web.bind.annotation.GetMapping
import org.springframework.web.bind.annotation.RestController
import org.springframework.web.bind.annotation.RequestMapping
import org.springframework.boot.context.properties.ConfigurationPropertiesScan
import kotlin.random.Random
import java.util.concurrent.TimeUnit

@SpringBootApplication
@ConfigurationPropertiesScan("com.leap.monitoring.client")
class TrackingClientDemoApplication

fun main(args: Array<String>) {
    runApplication<TrackingClientDemoApplication>(*args)
}

/**
 * Demo Controller with endpoints used for testing the Interceptor and Alert generation.
 * This service runs on Port 8081.
 */
@RestController
@RequestMapping("/orders")
class DemoController {

    /** Simulates a normal, fast request (Status 200). */
    @GetMapping("/create")
    fun createOrder(): String {
        // Simulate minor processing time
        TimeUnit.MILLISECONDS.sleep(Random.nextLong(10, 50))
        return "Order created successfully"
    }

    /** Simulates a slow request (Latency > 500ms for Alerting). */
    @GetMapping("/slow-status")
    fun getSlowStatus(): String {
        // Simulate long-running task to trigger SLOW alert in collector
        TimeUnit.MILLISECONDS.sleep(Random.nextLong(600, 1000))
        return "Order status is processing slowly. (Simulated Latency)"
    }

    /** Simulates a server failure (Status 500). */
    @GetMapping("/internal-error")
    fun internalError(): String {
        // This will trigger an HTTP 500 status code response
        throw RuntimeException("Simulated Database Connection Failure")
    }
}