package com.leap.monitoring.client

import org.slf4j.LoggerFactory
import org.springframework.stereotype.Service
import org.springframework.beans.factory.annotation.Value
import org.springframework.web.client.RestTemplate
import org.springframework.web.client.HttpServerErrorException

@Service
class LogSenderService(
    @Value("\${collector.url}") private val collectorUrl: String
) {
    private val log = LoggerFactory.getLogger(javaClass)
    private val restTemplate = RestTemplate()

    /** Sends the log data to the Collector's API (port 8080). */
    fun sendLog(logData: ApiLogData) {
        try {
            restTemplate.postForLocation(collectorUrl, logData)
            if (logData.isRateLimitHit) {
                log.info("Rate-Limit-Hit Log Sent Successfully: ${logData.endpoint}")
            }
        } catch (e: HttpServerErrorException) {
            log.error("Failed to send log to collector (HTTP Error ${e.statusCode})")
        } catch (e: Exception) {
            log.error("Failed to send log to collector: ${e.message}")
        }
    }
}