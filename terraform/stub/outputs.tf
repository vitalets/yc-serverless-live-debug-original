output "stub_fn_id" {
  value = yandex_function.stub.id
}

output "stub_url" {
  value = "https://${yandex_api_gateway.stub.domain}"
}
