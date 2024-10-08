package dev.krud.boost.daemon.configuration.instance.property.ro

data class InstancePropertyRO(
    val contexts: Map<String, Map<String, Any>>,
    val redactionLevel: RedactionLevel
) {
    enum class RedactionLevel {
        NONE,
        PARTIAL,
        FULL
    }
}