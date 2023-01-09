locals {
  apigw_name = "live-debug-stub"
}

resource "yandex_api_gateway" "stub" {
  name = local.apigw_name
  description = "API gateway to call stub function"
  folder_id = yandex_resourcemanager_folder.live_debug.id
  spec = templatefile("${path.module}/apigw.yaml", {
    apigw_name = local.apigw_name
    stub_fn_id = yandex_function.stub.id
    sa_id = yandex_iam_service_account.live_debug.id
  })
}
