package com.leap.collector.config

import org.springframework.context.annotation.Configuration
import org.springframework.data.mongodb.config.EnableMongoAuditing
import org.springframework.data.mongodb.repository.config.EnableMongoRepositories

// Simple unified MongoDB configuration
@Configuration
@EnableMongoAuditing
@EnableMongoRepositories(basePackages = ["com.leap.collector.repo"])
class MongoConfig