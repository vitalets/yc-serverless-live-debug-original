output "ws_url" {
  value = "https://${yandex_api_gateway.bridge.domain}/ws"
}

output "ydb_path" {
  value = yandex_ydb_database_serverless.live_debug.database_path
}
