locals {
  source_dir = "${path.root}/../dist"
}

data "archive_file" "zip" {
  type        = "zip"
  source_dir  = local.source_dir
  output_path = "dist.zip"
}

resource "yandex_function" "stub" {
  name               = "live-debug-stub"
  user_hash          = data.archive_file.zip.output_sha
  description        = "Live debug stub function"
  runtime            = "nodejs16"
  entrypoint         = "stub.handler"
  memory             = 128
  execution_timeout  = 60
  content {
    zip_filename = data.archive_file.zip.output_path
  }
  service_account_id = local.sa_id
  folder_id = local.folder_id
  environment = {
    YDB_PATH = yandex_ydb_database_serverless.live_debug.database_path
    # Can't set here WS_URL from yandex_api_gateway as it leads to circullar dependency
  }
}
