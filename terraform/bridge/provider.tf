# See: https://developer.hashicorp.com/terraform/language/modules/develop/providers#implicit-provider-inheritance
terraform {
  required_providers {
    yandex = {
      source = "yandex-cloud/yandex"
    }
  }
}
