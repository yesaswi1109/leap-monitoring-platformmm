package com.leap.monitoring.client

import org.springframework.context.annotation.Configuration
import org.springframework.web.servlet.config.annotation.InterceptorRegistry
import org.springframework.web.servlet.config.annotation.WebMvcConfigurer

/** Registers the custom tracking interceptor with all Spring MVC paths. */
@Configuration
class ApiMonitorConfig(
    private val interceptor: ApiTrackingInterceptor
) : WebMvcConfigurer {

    override fun addInterceptors(registry: InterceptorRegistry) {
        registry.addInterceptor(interceptor).addPathPatterns("/**")
    }
}