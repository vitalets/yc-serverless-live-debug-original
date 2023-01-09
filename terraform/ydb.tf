resource "yandex_ydb_database_serverless" "live_debug" {
  name = "live-debug-db"
  folder_id = yandex_resourcemanager_folder.live_debug.id
}
