locals {
  ws_apigw_name = "apigw-ws"
}

resource "yandex_api_gateway" "ws" {
  name = local.ws_apigw_name
  description = "API gateway to handle WS connections"
  folder_id = local.folder_id
  spec = templatefile("${path.module}/apigw-ws.yaml", {
    apigw_name = local.ws_apigw_name
    store_fn_id = yandex_function.store.id
    sa_id = local.sa_id
  })
}

locals {
  stub_ws_url = "wss://${yandex_api_gateway.ws.domain}/ws/stub"
  client_ws_url = "wss://${yandex_api_gateway.ws.domain}/ws/client"
}
