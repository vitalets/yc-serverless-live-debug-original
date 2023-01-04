locals {
  apigw_name = "live-debug-bridge"
}

resource "yandex_api_gateway" "bridge" {
  name = local.apigw_name
  description = "WebSocket API gateway for live debug"
  folder_id = var.folder_id
  spec = templatefile("${path.module}/apigw.yaml", {
    apigw_name = local.apigw_name
    bridge_fn_id = yandex_function.bridge.id
    sa_id = var.sa_id
  })
}
