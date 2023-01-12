resource "yandex_ydb_database_serverless" "live_debug" {
  name = "live-debug-db"
  folder_id = local.folder_id
}
