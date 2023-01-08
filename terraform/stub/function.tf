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
  service_account_id = var.sa_id
  folder_id = var.folder_id
  environment = {
    WS_URL = var.bridge_ws_url
  }
}
