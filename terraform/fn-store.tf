resource "yandex_function" "store" {
  name               = "live-debug-store"
  user_hash          = data.archive_file.dist.output_sha
  description        = "Live debug store function"
  runtime            = "nodejs16"
  entrypoint         = "store.handler"
  memory             = 128
  execution_timeout  = 5
  content {
    zip_filename = data.archive_file.dist.output_path
  }
  service_account_id = local.sa_id
  folder_id = local.folder_id
  environment = {
    YDB_PATH = local.ydb_path
  }
}
