# yc-serverless-live-debug
Live debugging of Yandex cloud functions with Node.js.

## How it works
Client connects to server via WebSocket API.
Then it can subscribe to one or several *topics*.
Another client can send message to the particular topic and all subscribed clients will receive that message instantly.

Inspired by SST (add link)

## Used components
* [API Gateway with WebSocket integration]()
* [Cloud function]()
* [Yandex Database]()

## Deploy
To deploy service you need [Yandex CLI]() and [Terraform]().
By default all components are deployed to separate folder `live-debug`.

```
npm run deploy
```

## Usage


## Protocol
```
```

## Development
