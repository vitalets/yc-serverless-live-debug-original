locals {
  apigw_name = "live-debug-stub"
}

resource "yandex_api_gateway" "stub" {
  name = local.apigw_name
  description = "API gateway to call stub function"
  folder_id = local.folder_id
  spec = templatefile("${path.module}/apigw.yaml", {
    apigw_name = local.apigw_name
    stub_fn_id = yandex_function.stub.id
    sa_id = local.sa_id
  })
}
