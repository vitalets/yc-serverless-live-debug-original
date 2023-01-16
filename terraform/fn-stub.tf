locals {
  dist_path = "${path.root}/../dist"
}

data "archive_file" "dist" {
  type        = "zip"
  source_dir  = local.dist_path
  output_path = "dist.zip"
}

resource "yandex_function" "stub" {
  name               = "live-debug-stub"
  user_hash          = data.archive_file.dist.output_sha
  description        = "Live debug stub function"
  runtime            = "nodejs16"
  entrypoint         = "stub.handler"
  memory             = 128
  execution_timeout  = 60
  content {
    zip_filename = data.archive_file.dist.output_path
  }
  service_account_id = local.sa_id
  folder_id = local.folder_id
  environment = {
    YDB_PATH = local.ydb_path
    STUB_WS_URL = local.stub_ws_url
  }
}
