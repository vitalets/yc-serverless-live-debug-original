output "ws_url" {
  value = "wss://${yandex_api_gateway.bridge.domain}/ws"
}

output "status_url" {
  value = "https://${yandex_api_gateway.bridge.domain}"
}

output "ydb_path" {
  value = yandex_ydb_database_serverless.live_debug.database_path
}
