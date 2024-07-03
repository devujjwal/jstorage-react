# jStorageReact

**jStorageReact** is a cross-browser key-value store database to store data locally in the browser - jStorageReact supports all major browsers, both in **desktop** (yes - even Internet Explorer 6) and in **mobile**.

Additionally, jStorageReact is library agnostic, working well with any other JavaScript library on the same webpage. jStorageReact supports storing Strings, Numbers, JavaScript objects, Arrays, and even native XML nodes, making it a JSON storage. jStorageReact also supports setting TTL values for auto-expiring stored keys and - best of all - notifying other tabs/windows when a key has been changed, which makes jStorageReact also a local PubSub platform for web applications.

jStorageReact is inspired by the jStorage plugin originally built for jQuery.

## Installation

You can install jStorageReact via npm:
`npm install jstorage-react`

## Usage

Here's how you can use jStorageReact in your React application:

```javascript
import React, { useState, useEffect } from "react";
import jStorageReact from "jstorage-react";

const App: React.FC = () => {
  const [data, setData] = useState < string > "";

  useEffect(() => {
    const storedData = jStorageReact.get("myKey");
    if (storedData) {
      setData(storedData);
    }
  }, []);

  const handleSave = () => {
    jStorageReact.set("myKey", data);
  };

  const handleDelete = () => {
    jStorageReact.deleteKey("myKey");
    setData("");
  };

  return (
    <div>
      <input
        type="text"
        value={data}
        onChange={(e) => setData(e.target.value)}
      />
      <button onClick={handleSave}>Save</button>
      <button onClick={handleDelete}>Delete</button>
    </div>
  );
};

export default App;
```

# API

**set(key: string, value: any, options?: { TTL?: number }): void**

Sets a value in storage with an optional TTL (Time-To-Live).

```javascript
jStorageReact.set("myKey", { name: "John", age: 30 }, { TTL: 60000 });
```

**get(key: string): any**

Retrieves a value from storage.

```javascript
const userData = jStorageReact.get("myKey");
```

**deleteKey(key: string): boolean**

Deletes a key from storage.

```javascript
jStorageReact.deleteKey("myKey");
```

**setTTL(key: string, ttl: number): void**

Sets a TTL for a specific key.

```javascript
jStorageReact.setTTL("myKey", 60000); // expires in 60 seconds
```

**getTTL(key: string): number**

Gets the TTL for a specific key.

```javascript
const ttl = jStorageReact.getTTL("myKey");
```

**flush(): void**

Clears all storage.

```javascript
jStorageReact.flush();
```

**storageSize(): number**

Returns the size of the stored data in bytes.

```javascript
const size = jStorageReact.storageSize();
```

**storageAvailable(): boolean**

Returns true if storage is available.

```javascript
const isAvailable = jStorageReact.storageAvailable();
```

**listenKeyChange(key: string, callback: Function): void**

Listens for updates to a specific key.

```javascript
jStorageReact.listenKeyChange("myKey", (key, action) => {
  console.log(`Key ${key} has been ${action}`);
});
```

**stopListening(key: string, callback?: Function): void**

Stops listening for updates to a specific key.

```javascript
jStorageReact.stopListening("myKey");
```

**subscribe(channel: string, callback: Function): void**

Subscribes to a Publish/Subscribe channel.

```javascript
jStorageReact.subscribe("channelName", (channel, payload) => {
  console.log(`Received ${payload} from channel ${channel}`);
});
```

**publish(channel: string, payload: any): void**

Publishes payload to a Publish/Subscribe channel.

```javascript
jStorageReact.publish("channelName", "Hello world!");
```

**reInit(): void**

Reloads the data from browser storage.

```javascript
jStorageReact.reInit();
```

## Features

jStorage supports the following features:

- **Local Storage:** Store and retrieve data locally within the browser.
- **TypeScript Support:** Built with TypeScript, ensuring type safety and IDE support.
- **TTL Support:** Set Time-To-Live values for keys to automatically expire data.
- **Event Subscription:** Subscribe to key change events across tabs/windows (Publish/Subscribe).
- **Data Size Management:** Check the size of stored data to manage storage limits efficiently.

## Browser support

jStorageReact supports all modern browsers, including:

- Chrome 4+
- Firefox 2+
- Safari 4+
- Opera 10.50+
- Internet Explorer 6+
- If the browser does not support local storage, jStorageReact gracefully handles this without exceptions.

# Notes

This library is inspired by the jStorage plugin and aims to provide similar functionality in a TypeScript-friendly manner for React applications.
