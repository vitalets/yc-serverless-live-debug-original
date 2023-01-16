locals {
  stub_apigw_name = "apigw-stub"
}

resource "yandex_api_gateway" "stub" {
  name = local.stub_apigw_name
  description = "API gateway to call stub function"
  folder_id = local.folder_id
  spec = templatefile("${path.module}/apigw-stub.yaml", {
    apigw_name = local.stub_apigw_name
    stub_fn_id = yandex_function.stub.id
    sa_id = local.sa_id
  })
}
