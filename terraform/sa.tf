resource "yandex_iam_service_account" "live_debug" {
  name        = "live-debug-sa"
  description = "Service account to manage live debug"
  folder_id = local.folder_id
}

locals {
  sa_id = yandex_iam_service_account.live_debug.id
}

resource "yandex_resourcemanager_folder_iam_member" "roles" {
  for_each = toset([
    "serverless.functions.invoker",
    "ydb.editor",
    "api-gateway.websocketWriter",
  ])
  role      = each.key
  folder_id = local.folder_id
  member    = "serviceAccount:${local.sa_id}"
}
