package dev.ostara.agent.model

data class AgentInfoDTO(
  val version: String,
  val serviceDiscoveryStrategies: List<ServiceDiscoveryStrategyDTO>
)

