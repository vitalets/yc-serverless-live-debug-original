terraform {
  required_providers {
    yandex = {
      source = "yandex-cloud/yandex"
    }
  }
}

resource "yandex_resourcemanager_folder" "live_debug" {
  name = "live-debug"
}

module "bridge" {
  source = "./bridge"
  folder_id = yandex_resourcemanager_folder.live_debug.id
  sa_id = yandex_iam_service_account.live_debug.id
}

module "stub" {
  source = "./stub"
  folder_id = yandex_resourcemanager_folder.live_debug.id
  sa_id = yandex_iam_service_account.live_debug.id
  bridge_ws_url = module.bridge.ws_url
}

output "brigde_ws_url" {
  value = module.bridge.ws_url
}

output "stub_fn_id" {
  value = module.stub.stub_fn_id
}
