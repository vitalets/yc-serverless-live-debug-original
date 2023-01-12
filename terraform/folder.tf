resource "yandex_resourcemanager_folder" "live_debug" {
  name = "live-debug"
}

locals {
  folder_id = yandex_resourcemanager_folder.live_debug.id
}
