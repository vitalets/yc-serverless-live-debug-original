locals {
  source_dir = "${path.root}/../dist"
}

data "archive_file" "zip" {
  type        = "zip"
  source_dir  = local.source_dir
  output_path = "dist.zip"
}

resource "yandex_function" "bridge" {
  name               = "live-debug-bridge"
  user_hash          = data.archive_file.zip.output_sha
  description        = "Live debug bridge function"
  runtime            = "nodejs16"
  entrypoint         = "bridge.handler"
  memory             = 128
  execution_timeout  = 10
  content {
    zip_filename = data.archive_file.zip.output_path
  }
  service_account_id = var.sa_id
  folder_id = var.folder_id
  environment = {
    YDB_PATH = yandex_ydb_database_serverless.live_debug.database_path
  }
}
