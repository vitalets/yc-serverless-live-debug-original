output "STUB_URL" {
  value = "https://${yandex_api_gateway.stub.domain}"
}

output "CLIENT_WS_URL" {
  value = local.client_ws_url
}

output "STUB_ID" {
  value = yandex_function.stub.id
}
