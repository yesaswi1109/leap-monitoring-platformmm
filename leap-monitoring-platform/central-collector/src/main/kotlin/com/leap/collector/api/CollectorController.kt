package com.leap.collector.api

import com.leap.collector.data.Incident
import com.leap.collector.data.LogEntry
import com.leap.collector.service.CollectorService
import org.springframework.http.HttpStatus
import org.springframework.web.bind.annotation.*

@RestController
@RequestMapping("/api/v1")
class CollectorController(
    private val collectorService: CollectorService
) {
    
    @PostMapping("/logs")
    @ResponseStatus(HttpStatus.ACCEPTED)
    fun ingestLog(@RequestBody logEntry: LogEntry) {
        collectorService.processLogEntry(logEntry)
    }

    @GetMapping("/logs")
    fun getAllLogs(): List<LogEntry> {
        return collectorService.getAllLogs()
    }

    @GetMapping("/incidents/open")
    fun getOpenIncidents(): List<Incident> {
        return collectorService.getOpenIncidents()
    }

    @PostMapping("/incidents/{id}/resolve")
    fun resolveIncident(@PathVariable id: String, @RequestParam userId: String): Incident {
        return collectorService.resolveIncident(id, userId)
    }
}