package com.leap.collector

import org.springframework.boot.autoconfigure.SpringBootApplication
import org.springframework.boot.runApplication

@SpringBootApplication
class CentralCollectorApplication

fun main(args: Array<String>) {
    runApplication<CentralCollectorApplication>(*args)
}